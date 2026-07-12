import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getApiBase } from "@/lib/api-base";
import { TurnstileWidget, isTurnstileEnabled } from "@/components/TurnstileWidget";
import { useLanguage } from "@/lib/i18n";

const API_BASE = getApiBase();

const contactSchema = z.object({
  name: z.string().min(2, "Imię jest wymagane"),
  email: z.string().email("Niepoprawny adres email"),
  phone: z.string().optional(),
  message: z.string().min(10, "Wiadomość musi mieć minimum 10 znaków"),
  consent: z.boolean().refine((value) => value, {
    message: "Zgoda na politykę prywatności jest wymagana",
  }),
});

type ContactFormValues = z.infer<typeof contactSchema>;

type ArticleInlineContactFormProps = {
  articleTitle?: string;
};

export function ArticleInlineContactForm({ articleTitle }: ArticleInlineContactFormProps) {
  const { language, localizePath, t } = useLanguage();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: articleTitle
        ? `Cześć, chcę porozmawiać o temacie: ${articleTitle}.`
        : "",
      consent: false,
    },
  });

  async function onSubmit(values: ContactFormValues) {
    if (isTurnstileEnabled() && !turnstileToken) {
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
      phone: values.phone?.trim() || undefined,
          message:
            language === "en"
              ? `${values.message}\n\nSource: article form${articleTitle ? ` (${articleTitle})` : ""}\nPrivacy policy consent: yes`
              : `${values.message}\n\nŹródło: formularz w artykule${articleTitle ? ` (${articleTitle})` : ""}\nZgoda na politykę prywatności: tak`,
          type: "consultation",
          language,
          turnstileToken,
        }),
      });

      if (!response.ok) {
        throw new Error("Contact submission failed");
      }

      setStatus("success");
      form.reset({
        name: "",
        email: "",
        phone: "",
        message: "",
        consent: false,
      });
      setTurnstileToken("");
      setTurnstileResetKey((value) => value + 1);
    } catch {
      setStatus("error");
      setTurnstileToken("");
      setTurnstileResetKey((value) => value + 1);
    }
  }

  return (
    <section className="rounded-[28px] border border-[#e6dfd3] bg-[#fbfaf7] p-6 md:p-8 shadow-sm">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          <Mail size={12} />
          {t("Kontakt", "Contact")}
        </div>
        <h3 className="mt-4 text-2xl font-bold text-primary">{t("Porozmawiajmy o Twojej aplikacji", "Let’s talk about your application")}</h3>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600">
          {t(
            "Jeśli po lekturze chcesz przełożyć teorię na konkretny plan działania, zostaw wiadomość. Wrócimy z odpowiedzią i zaproponujemy dalszy krok.",
            "If you want to turn what you have read into a concrete action plan, leave us a message. We will reply and suggest the next step.",
          )}
        </p>
      </div>

      {status === "success" ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800">
          {t("Formularz został wysłany. Odezwiemy się możliwie szybko.", "The form has been sent. We will get back to you as soon as possible.")}
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Imię i nazwisko", "Full name")}</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white" placeholder="Jan Kowalski" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Adres email", "Email address")}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" className="bg-white" placeholder="jan@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Numer telefonu", "Phone number")}</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-white" placeholder="+48 000 000 000" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Wiadomość", "Message")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-32 bg-white"
                      placeholder={t(
                        "Napisz, na jakim etapie aplikacji jesteś i w czym potrzebujesz wsparcia.",
                        "Tell us where you are in the application process and what kind of support you need.",
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="consent"
              render={({ field }) => (
                <FormItem>
                  <label className="flex items-start gap-3 text-sm leading-relaxed text-gray-600">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      {t("Akceptuję", "I accept")}{" "}
                      <Link href={localizePath("/polityka-prywatnosci")} className="font-semibold text-primary underline-offset-2 hover:underline">
                        {t("politykę prywatności", "the privacy policy")}
                      </Link>
                      .
                    </span>
                  </label>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <TurnstileWidget onTokenChange={setTurnstileToken} resetKey={turnstileResetKey} />
              <Button
                type="submit"
                disabled={status === "loading"}
                className="rounded-full bg-primary px-7 py-6 text-white hover:bg-primary/90"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("Wysyłanie…", "Sending...")}
                  </>
                ) : (
                  t("Wyślij wiadomość", "Send message")
                )}
              </Button>
            </div>

            {status === "error" ? (
              <p className="text-sm text-red-600">
                {isTurnstileEnabled() && !turnstileToken
                  ? t(
                      "Potwierdź zabezpieczenie formularza i spróbuj ponownie.",
                      "Complete the form security check and try again.",
                    )
                  : t(
                      "Nie udało się wysłać formularza. Spróbuj ponownie za chwilę.",
                      "We could not send the form. Try again in a moment.",
                    )}
              </p>
            ) : null}
          </form>
        </Form>
      )}
    </section>
  );
}
