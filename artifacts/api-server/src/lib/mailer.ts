import { logger } from "./logger";
import {
  getGoogleAccountEmail,
  getGoogleGmailAccessToken,
  getGoogleGmailSendAs,
  hasGoogleGmailCredentials,
} from "./google";

type MailRecipient = {
  email: string;
  name?: string;
};

function encodeHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function toBase64Url(input: string) {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function toBase64Lines(input: string) {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .match(/.{1,76}/g)
    ?.join("\r\n") ?? "";
}

async function sendGmailMessage({
  from,
  to,
  subject,
  text,
  replyTo,
}: {
  from: string;
  to: MailRecipient;
  subject: string;
  text: string;
  replyTo?: string;
}) {
  if (!(await hasGoogleGmailCredentials())) {
    return false;
  }

  const lines = [
    `From: ACADEA <${from}>`,
    `To: ${to.name ? `${encodeHeader(to.name)} <${to.email}>` : to.email}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
    "",
    toBase64Lines(text),
  ];

  const raw = toBase64Url(lines.join("\r\n"));
  const accessToken = await getGoogleGmailAccessToken();
  const res = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Gmail send failed with status ${res.status}: ${body.slice(0, 300)}. Check whether GOOGLE_GMAIL_REFRESH_TOKEN includes gmail.send scope and matches GOOGLE_GMAIL_CLIENT_ID/GOOGLE_GMAIL_CLIENT_SECRET.`,
    );
  }

  return true;
}

export async function sendBookingEmails(input: {
  email: string;
  end: string;
  name: string;
  phone?: string | null;
  start: string;
  topic: string;
  zoomLink: string;
}) {
  const senderEmail = getGoogleGmailSendAs() ?? (await getGoogleAccountEmail());
  const notifyEmail = process.env.CONTACT_NOTIFY_EMAIL ?? senderEmail ?? null;

  if (!notifyEmail || !senderEmail || !(await hasGoogleGmailCredentials())) {
    logger.warn(
      "Unable to send booking confirmation emails because Gmail credentials are incomplete",
    );
    return { organizerSent: false, guestSent: false };
  }

  const startLabel = new Date(input.start).toLocaleString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  });
  const endLabel = new Date(input.end).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  });

  const organizerBody = [
    "Nowa rezerwacja konsultacji ACADEA",
    "",
    `Imię i nazwisko: ${input.name}`,
    `Email: ${input.email}`,
    input.phone ? `Telefon: ${input.phone}` : null,
    `Temat: ${input.topic}`,
    `Termin: ${startLabel} - ${endLabel} (czas polski)`,
    `Zoom: ${input.zoomLink}`,
  ]
    .filter(Boolean)
    .join("\n");

  const guestBody = [
    `Cześć ${input.name},`,
    "",
    "potwierdzamy rezerwację konsultacji ACADEA.",
    "",
    `Termin: ${startLabel} - ${endLabel} (czas polski)`,
    `Temat: ${input.topic}`,
    `Link do spotkania: ${input.zoomLink}`,
    "",
    "Dodatkowo Google Calendar powinien wysłać Ci zaproszenie kalendarzowe.",
    "",
    "Pozdrawiamy,",
    "Zespół ACADEA",
  ].join("\n");

  let organizerSent = false;
  let guestSent = false;

  try {
    organizerSent = await sendGmailMessage({
      from: senderEmail,
      to: { email: notifyEmail, name: "ACADEA" },
      subject: `Nowa rezerwacja konsultacji: ${input.name}`,
      text: organizerBody,
      replyTo: input.email,
    });
  } catch (err) {
    logger.warn({ err }, "booking organizer email failed");
  }

  try {
    guestSent = await sendGmailMessage({
      from: senderEmail,
      to: { email: input.email, name: input.name },
      subject: "ACADEA: potwierdzenie rezerwacji konsultacji",
      text: guestBody,
    });
  } catch (err) {
    logger.warn({ err }, "booking guest confirmation email failed");
  }

  return { organizerSent, guestSent };
}

export async function sendContactEmails(input: {
  email: string;
  message: string;
  name: string;
  phone?: string | null;
  type: string;
}) {
  const senderEmail = getGoogleGmailSendAs() ?? (await getGoogleAccountEmail());
  const notifyEmail = process.env.CONTACT_NOTIFY_EMAIL ?? senderEmail ?? null;

  if (!notifyEmail || !senderEmail || !(await hasGoogleGmailCredentials())) {
    logger.warn(
      "Unable to send contact email notifications because Gmail credentials are incomplete",
    );
    return { organizerSent: false, autoresponseSent: false };
  }

  const submissionKind =
    input.type === "mentor_application" || input.type === "mentor"
      ? "aplikacja mentorska"
      : input.type === "scholarship"
        ? "zgłoszenie stypendialne"
        : input.type === "booking"
          ? "rezerwacja konsultacji"
          : "wiadomość kontaktowa";

  const organizerSubject =
    input.type === "mentor_application" || input.type === "mentor"
      ? `Nowa aplikacja mentorska ACADEA: ${input.name}`
      : input.type === "scholarship"
        ? `Nowe zgłoszenie do programu stypendialnego ACADEA: ${input.name}`
        : `Nowe zgłoszenie kontaktowe: ${input.name}`;

  const autoresponseSubject =
    input.type === "mentor_application" || input.type === "mentor"
      ? "ACADEA: dziękujemy za zgłoszenie mentorskie"
      : input.type === "scholarship"
        ? "ACADEA: dziękujemy za zgłoszenie do programu stypendialnego"
        : "ACADEA: potwierdzenie otrzymania wiadomości";

  const organizerBody = [
    `Nowe zgłoszenie ACADEA: ${submissionKind}`,
    "",
    `Typ: ${input.type}`,
    `Imię i nazwisko: ${input.name}`,
    `Email: ${input.email}`,
    input.phone ? `Telefon: ${input.phone}` : null,
    "",
    "Treść zgłoszenia:",
    input.message,
  ].filter(Boolean).join("\n");

  const autoresponseIntro =
    input.type === "mentor_application" || input.type === "mentor"
      ? "dziękujemy za przesłanie aplikacji mentorskiej do ACADEA."
      : input.type === "scholarship"
        ? "dziękujemy za przesłanie zgłoszenia do programu stypendialnego ACADEA."
        : "dziękujemy za wiadomość do ACADEA.";

  const autoresponseNextStep =
    input.type === "mentor_application" || input.type === "mentor"
      ? "Zapoznaliśmy się z Twoją aplikacją i wrócimy do Ciebie, gdy przejdziemy przez zgłoszenia."
      : input.type === "scholarship"
        ? "Otrzymaliśmy Twoje zgłoszenie i wrócimy do Ciebie po zakończeniu analizy aplikacji."
        : "Otrzymaliśmy Twoje zgłoszenie i wrócimy do Ciebie tak szybko, jak to możliwe.";

  const autoresponseBody = [
    `Cześć ${input.name},`,
    "",
    autoresponseIntro,
    autoresponseNextStep,
    "",
    "Dla porządku zapisujemy poniżej treść Twojego zgłoszenia:",
    "",
    input.message,
    "",
    "Pozdrawiamy,",
    "Zespół ACADEA",
  ].join("\n");

  let organizerSent = false;
  let autoresponseSent = false;

  try {
    organizerSent = await sendGmailMessage({
      from: senderEmail,
      to: { email: notifyEmail, name: "ACADEA" },
      subject: organizerSubject,
      text: organizerBody,
      replyTo: input.email,
    });
  } catch (err) {
    logger.warn({ err }, "contact organizer email failed");
  }

  try {
    autoresponseSent = await sendGmailMessage({
      from: senderEmail,
      to: { email: input.email, name: input.name },
      subject: autoresponseSubject,
      text: autoresponseBody,
    });
  } catch (err) {
    logger.warn({ err }, "contact autoresponse email failed");
  }

  return { organizerSent, autoresponseSent };
}
