import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { getApiBase } from "@/lib/api-base";
import { TurnstileWidget, isTurnstileEnabled } from "@/components/TurnstileWidget";

const CONTACT_EMAIL = "kontakt@acadea.org";
const CONTACT_PHONE = "+48 728 492 936";
const CONTACT_PHONE_HREF = "+48728492936";
const API_BASE = getApiBase();

const contactSchema = z.object({
  name: z.string().min(2, "Imię jest wymagane"),
  email: z.string().email("Niepoprawny adres email"),
  phone: z.string().min(9, "Numer telefonu jest za krótki").optional().or(z.literal("")),
  message: z.string().min(10, "Wiadomość musi mieć minimum 10 znaków"),
  consent: z.boolean().refine((value) => value, {
    message: "Zgoda na politykę prywatności jest wymagana",
  }),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function Contact() {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
      consent: false,
    },
  });

  async function onSubmit(data: ContactFormValues) {
    if (isTurnstileEnabled() && !turnstileToken) {
      toast({
        title: "Potwierdź zabezpieczenie",
        description: "Zaznacz weryfikację antybotową przed wysłaniem formularza.",
        variant: "destructive",
      });
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone || undefined,
          message: `${data.message}\n\nZgoda na politykę prywatności: tak`,
          type: "consultation",
          turnstileToken,
        }),
      });

      if (!response.ok) {
        throw new Error("Contact submission failed");
      }

      toast({
        title: "Wiadomość wysłana!",
        description:
          "Dziękujemy za kontakt. Odezwiemy się najszybciej jak to możliwe.",
      });
      form.reset();
      setTurnstileToken("");
      setTurnstileResetKey((value) => value + 1);
    } catch {
      toast({
        title: "Błąd wysyłania",
        description:
          `Nie udało się wysłać wiadomości. Spróbuj ponownie lub napisz bezpośrednio na ${CONTACT_EMAIL}.`,
        variant: "destructive",
      });
      setTurnstileToken("");
      setTurnstileResetKey((value) => value + 1);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="w-full pt-28 md:pt-32 pb-20 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-primary mb-4"
            >
              Zróbmy pierwszy krok
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-gray-600 max-w-2xl mx-auto"
            >
              Wypełnij formularz, aby umówić się na bezpłatną, niezobowiązującą
              konsultację, podczas której ocenimy Twoje szanse i przedstawimy plan
              działania.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Contact Info Sidebar */}
            <div className="bg-primary text-white p-10 lg:col-span-1 flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-6">Dane kontaktowe</h3>
                <p className="text-gray-300 mb-10 leading-relaxed">
                  Odpowiadamy zazwyczaj w ciągu 24 godzin roboczych.
                </p>

                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <Mail className="text-accent shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold mb-1">Email</p>
                      <a
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="text-gray-300 hover:text-white transition-colors"
                      >
                        {CONTACT_EMAIL}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Phone className="text-accent shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold mb-1">Telefon</p>
                      <a
                        href={`tel:${CONTACT_PHONE_HREF}`}
                        className="text-gray-300 hover:text-white transition-colors"
                      >
                        {CONTACT_PHONE}
                      </a>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-10 lg:col-span-2">
              <h3 className="text-2xl font-bold text-primary mb-6">Napisz do nas</h3>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Imię i nazwisko
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Jan Kowalski"
                              className="bg-gray-50 border-gray-200"
                              {...field}
                            />
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
                          <FormLabel className="text-gray-700">
                            Adres email
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="jan@example.com"
                              type="email"
                              className="bg-gray-50 border-gray-200"
                              {...field}
                            />
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
                        <FormLabel className="text-gray-700">
                          Numer telefonu{" "}
                          <span className="text-gray-400 font-normal">(opcjonalnie)</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="+48 123 456 789"
                            type="tel"
                            className="bg-gray-50 border-gray-200"
                            {...field}
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
                        <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </FormControl>
                          <div className="text-sm text-gray-600 leading-relaxed">
                            Wyrażam zgodę na przetwarzanie moich danych osobowych zgodnie z{" "}
                            <Link href="/polityka-prywatnosci" className="font-semibold text-primary hover:underline">
                              polityką prywatności
                            </Link>
                            .
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          Wiadomość / Jakie kraje Cię interesują?
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Cześć! Myślę o studiowaniu medycyny w Wielkiej Brytanii lub Irlandii..."
                            className="bg-gray-50 border-gray-200 min-h-[150px] resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <TurnstileWidget
                      onTokenChange={setTurnstileToken}
                      resetKey={turnstileResetKey}
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isPending}
                    className="w-full md:w-auto px-8 rounded-full"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Wysyłanie…
                      </>
                    ) : (
                      "Wyślij wiadomość"
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
