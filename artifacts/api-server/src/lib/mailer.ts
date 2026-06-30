import { logger } from "./logger";
import {
  getGoogleAccountEmail,
  getGoogleGmailAccessToken,
  getGoogleGmailSendAs,
  getGoogleWorkspacePrimaryEmail,
  hasGoogleGmailCredentials,
} from "./google";

type MailRecipient = {
  email: string;
  name?: string;
};

const BRAND_LOGO_URL = "https://acadea.org/images/logo-dark.png";
const BRAND_PRIMARY = "#166534";
const BRAND_ACCENT = "#FCBC1E";

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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function nl2br(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function renderEmailShell({
  title,
  intro,
  summaryRows,
  bodyHtml,
  closing,
}: {
  title: string;
  intro: string;
  summaryRows?: Array<{ label: string; value: string | null | undefined }>;
  bodyHtml?: string;
  closing?: string;
}) {
  const summaryHtml = (summaryRows ?? [])
    .filter((row) => row.value)
    .map(
      (row) => `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 150px; vertical-align: top;">${escapeHtml(row.label)}</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${escapeHtml(row.value ?? "")}</td>
        </tr>`,
    )
    .join("");

  return `
    <div style="margin:0; padding:32px 16px; background:#f4f7f3; font-family:Arial,Helvetica,sans-serif; color:#111827;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:24px; overflow:hidden;">
        <tr>
          <td style="padding:28px 32px 20px; background:linear-gradient(135deg, #ffffff 0%, #f5fbf7 100%); border-bottom:1px solid #e5efe9;">
            <img src="${BRAND_LOGO_URL}" alt="ACADEA" style="display:block; width:180px; max-width:100%; height:auto; margin-bottom:22px;" />
            <div style="display:inline-block; padding:6px 12px; border-radius:999px; background:rgba(252,188,30,0.16); color:${BRAND_PRIMARY}; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:16px;">
              EDUKACJA BEZ GRANIC
            </div>
            <h1 style="margin:0 0 10px; font-size:28px; line-height:1.2; color:${BRAND_PRIMARY};">${escapeHtml(title)}</h1>
            <p style="margin:0; font-size:16px; line-height:1.6; color:#4b5563;">${escapeHtml(intro)}</p>
          </td>
        </tr>
        ${
          summaryHtml
            ? `<tr><td style="padding:24px 32px 8px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${summaryHtml}</table></td></tr>`
            : ""
        }
        ${
          bodyHtml
            ? `<tr><td style="padding:16px 32px 8px;"><div style="background:#f8faf8; border:1px solid #e5efe9; border-radius:18px; padding:18px 20px; font-size:14px; line-height:1.7; color:#374151;">${bodyHtml}</div></td></tr>`
            : ""
        }
        <tr>
          <td style="padding:24px 32px 30px;">
            <p style="margin:0; font-size:14px; line-height:1.7; color:#4b5563;">${escapeHtml(closing ?? "Pozdrawiamy,")}<br /><strong style="color:${BRAND_PRIMARY};">Zespół ACADEA</strong></p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px; background:${BRAND_PRIMARY}; color:#ffffff; font-size:12px; line-height:1.6;">
            ACADEA • wsparcie w aplikacji na studia za granicą
          </td>
        </tr>
      </table>
    </div>`;
}

async function sendGmailMessage({
  from,
  to,
  subject,
  text,
  html,
  replyTo,
}: {
  from: string;
  to: MailRecipient;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}) {
  if (!(await hasGoogleGmailCredentials())) {
    return false;
  }

  const lines = html
    ? (() => {
        const boundary = `acadea_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        return [
          `From: ACADEA <${from}>`,
          `To: ${to.name ? `${encodeHeader(to.name)} <${to.email}>` : to.email}`,
          `Subject: ${encodeHeader(subject)}`,
          "MIME-Version: 1.0",
          `Content-Type: multipart/alternative; boundary="${boundary}"`,
          ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
          "",
          `--${boundary}`,
          'Content-Type: text/plain; charset="UTF-8"',
          "Content-Transfer-Encoding: base64",
          "",
          toBase64Lines(text),
          "",
          `--${boundary}`,
          'Content-Type: text/html; charset="UTF-8"',
          "Content-Transfer-Encoding: base64",
          "",
          toBase64Lines(html),
          "",
          `--${boundary}--`,
        ];
      })()
    : [
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
      `Gmail send failed with status ${res.status}: ${body.slice(0, 300)}. Check whether the stored Google refresh token includes gmail.send scope and matches the configured OAuth client credentials.`,
    );
  }

  return true;
}

async function resolveOrganizationMailbox() {
  const workspacePrimaryEmail = getGoogleWorkspacePrimaryEmail();
  const connectedGoogleAccountEmail = await getGoogleAccountEmail();
  const legacySendAsEmail = getGoogleGmailSendAs();

  const senderEmail =
    workspacePrimaryEmail ??
    connectedGoogleAccountEmail ??
    legacySendAsEmail ??
    null;

  const notifyEmail =
    workspacePrimaryEmail ??
    connectedGoogleAccountEmail ??
    process.env.CONTACT_NOTIFY_EMAIL ??
    senderEmail;

  return {
    senderEmail,
    notifyEmail,
  };
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
  const { senderEmail, notifyEmail } = await resolveOrganizationMailbox();

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

  const organizerHtml = renderEmailShell({
    title: "Nowa rezerwacja konsultacji",
    intro: "Na stronie ACADEA pojawiła się nowa rezerwacja konsultacji.",
    summaryRows: [
      { label: "Imię i nazwisko", value: input.name },
      { label: "E-mail", value: input.email },
      { label: "Telefon", value: input.phone ?? null },
      { label: "Temat", value: input.topic },
      { label: "Termin", value: `${startLabel} - ${endLabel} (czas polski)` },
      { label: "Zoom", value: input.zoomLink },
    ],
  });

  const guestHtml = renderEmailShell({
    title: "Potwierdzenie rezerwacji konsultacji",
    intro: `Cześć ${input.name}, potwierdzamy rezerwację konsultacji ACADEA.`,
    summaryRows: [
      { label: "Termin", value: `${startLabel} - ${endLabel} (czas polski)` },
      { label: "Temat", value: input.topic },
      { label: "Link do spotkania", value: input.zoomLink },
    ],
    bodyHtml:
      "<p style=\"margin:0;\">Dodatkowo Google Calendar powinien wysłać Ci zaproszenie kalendarzowe.</p>",
  });

  let organizerSent = false;
  let guestSent = false;

  try {
    organizerSent = await sendGmailMessage({
      from: senderEmail,
      to: { email: notifyEmail, name: "ACADEA" },
      subject: `Nowa rezerwacja konsultacji: ${input.name}`,
      text: organizerBody,
      html: organizerHtml,
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
      html: guestHtml,
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
  const { senderEmail, notifyEmail } = await resolveOrganizationMailbox();
  const normalizedGreeting =
    input.type === "newsletter" ? "Cześć," : `Cześć ${input.name},`;

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
        : input.type === "newsletter"
          ? "zapis do newslettera"
        : input.type === "booking"
          ? "rezerwacja konsultacji"
          : "wiadomość kontaktowa";

  const organizerSubject =
    input.type === "mentor_application" || input.type === "mentor"
      ? `Nowa aplikacja mentorska ACADEA: ${input.name}`
      : input.type === "scholarship"
        ? `Nowe zgłoszenie do programu stypendialnego ACADEA: ${input.name}`
        : input.type === "newsletter"
          ? `Nowy zapis do newslettera ACADEA: ${input.email}`
        : `Nowe zgłoszenie kontaktowe: ${input.name}`;

  const autoresponseSubject =
    input.type === "mentor_application" || input.type === "mentor"
      ? "ACADEA: dziękujemy za zgłoszenie mentorskie"
      : input.type === "scholarship"
        ? "ACADEA: dziękujemy za zgłoszenie do programu stypendialnego"
        : input.type === "newsletter"
          ? "ACADEA: potwierdzenie zapisu do newslettera"
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
        : input.type === "newsletter"
          ? "dziękujemy za zapis do newslettera ACADEA."
        : "dziękujemy za wiadomość do ACADEA.";

  const autoresponseNextStep =
    input.type === "mentor_application" || input.type === "mentor"
      ? "Zapoznaliśmy się z Twoją aplikacją i wrócimy do Ciebie, gdy przejdziemy przez zgłoszenia."
      : input.type === "scholarship"
        ? "Otrzymaliśmy Twoje zgłoszenie i wrócimy do Ciebie po zakończeniu analizy aplikacji."
        : input.type === "newsletter"
          ? "Będziemy wysyłać Ci nowe poradniki, aktualności o studiach za granicą i informacje o stypendiach."
        : "Otrzymaliśmy Twoje zgłoszenie i wrócimy do Ciebie tak szybko, jak to możliwe.";

  const autoresponseBody = [
    normalizedGreeting,
    "",
    autoresponseIntro,
    autoresponseNextStep,
    "",
    input.type === "newsletter"
      ? null
      : "Treść Twojego zgłoszenia:",
    "",
    input.type === "newsletter" ? null : input.message,
    "",
    "Pozdrawiamy,",
    "Zespół ACADEA",
  ].filter(Boolean).join("\n");

  const organizerHtml = renderEmailShell({
    title:
      input.type === "mentor_application" || input.type === "mentor"
        ? "Nowa aplikacja mentorska"
        : input.type === "scholarship"
          ? "Nowe zgłoszenie stypendialne"
          : input.type === "newsletter"
            ? "Nowy zapis do newslettera"
            : "Nowa wiadomość kontaktowa",
    intro: `Na stronie ACADEA pojawiło się nowe zgłoszenie: ${submissionKind}.`,
    summaryRows: [
      { label: "Typ", value: input.type },
      { label: "Imię i nazwisko", value: input.name },
      { label: "E-mail", value: input.email },
      { label: "Telefon", value: input.phone ?? null },
    ],
    bodyHtml: `<strong>Treść zgłoszenia:</strong><br /><br />${nl2br(input.message)}`,
  });

  const autoresponseHtml = renderEmailShell({
    title:
      input.type === "mentor_application" || input.type === "mentor"
        ? "Dziękujemy za zgłoszenie mentorskie"
        : input.type === "scholarship"
          ? "Dziękujemy za zgłoszenie do programu stypendialnego"
          : input.type === "newsletter"
            ? "Potwierdzenie zapisu do newslettera"
            : "Potwierdzenie otrzymania wiadomości",
    intro:
      input.type === "newsletter"
        ? `Cześć, ${autoresponseIntro} ${autoresponseNextStep}`
        : `Cześć ${input.name}, ${autoresponseIntro} ${autoresponseNextStep}`,
    bodyHtml:
      input.type === "newsletter"
        ? "<p style=\"margin:0;\">Jeśli chcesz kiedyś zrezygnować, po prostu odpisz na wiadomość lub napisz do nas na kontakt@acadea.org.</p>"
        : `<strong>Treść Twojego zgłoszenia:</strong><br /><br />${nl2br(input.message)}`,
  });

  let organizerSent = false;
  let autoresponseSent = false;

  try {
    organizerSent = await sendGmailMessage({
      from: senderEmail,
      to: { email: notifyEmail, name: "ACADEA" },
      subject: organizerSubject,
      text: organizerBody,
      html: organizerHtml,
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
      html: autoresponseHtml,
    });
  } catch (err) {
    logger.warn({ err }, "contact autoresponse email failed");
  }

  return { organizerSent, autoresponseSent };
}

export async function sendPlatformPasswordResetEmail(input: {
  email: string;
  fullName: string;
  resetUrl: string;
}) {
  const { senderEmail } = await resolveOrganizationMailbox();

  if (!senderEmail || !(await hasGoogleGmailCredentials())) {
    logger.warn("Unable to send platform password reset email because Gmail credentials are incomplete");
    return { sent: false };
  }

  const subject = "ACADEA Platform: zmiana hasła";
  const text = [
    `Cześć ${input.fullName},`,
    "",
    "otrzymaliśmy prośbę o ustawienie nowego hasła do platformy ACADEA.",
    "Kliknij w poniższy link, aby ustawić nowe hasło:",
    input.resetUrl,
    "",
    "Link wygaśnie za 30 minut.",
    "",
    "Jeśli to nie Ty wysłałeś prośbę, zignoruj tę wiadomość.",
    "",
    "Pozdrawiamy,",
    "Zespół ACADEA",
  ].join("\n");

  const html = renderEmailShell({
    title: "Zmiana hasła do platformy",
    intro: `Cześć ${input.fullName}, otrzymaliśmy prośbę o ustawienie nowego hasła do platformy ACADEA.`,
    bodyHtml: `<p style="margin:0 0 14px;">Kliknij w poniższy link, aby ustawić nowe hasło:</p><p style="margin:0;"><a href="${escapeHtml(input.resetUrl)}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:${BRAND_PRIMARY};color:#ffffff;text-decoration:none;font-weight:700;">Ustaw nowe hasło</a></p><p style="margin:16px 0 0;">Jeśli przycisk nie działa, skopiuj ten adres do przeglądarki:<br /><span style="word-break:break-all;">${escapeHtml(input.resetUrl)}</span></p><p style="margin:16px 0 0;">Link wygaśnie za 30 minut. Jeśli to nie Ty wysłałeś prośbę, po prostu zignoruj tę wiadomość.</p>`,
  });

  try {
    const sent = await sendGmailMessage({
      from: senderEmail,
      to: { email: input.email, name: input.fullName },
      subject,
      text,
      html,
    });
    return { sent };
  } catch (err) {
    logger.warn({ err }, "platform password reset email failed");
    return { sent: false };
  }
}
