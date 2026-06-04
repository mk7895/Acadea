import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, MapPin, Phone, Loader2 } from "lucide-react";
import { useSubmitContact } from "@workspace/api-client-react";

const contactSchema = z.object({
  name: z.string().min(2, "Imię jest wymagane"),
  email: z.string().email("Niepoprawny adres email"),
  phone: z.string().min(9, "Numer telefonu jest za krótki").optional().or(z.literal("")),
  message: z.string().min(10, "Wiadomość musi mieć minimum 10 znaków"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function Contact() {
  const { toast } = useToast();
  const { mutate: submitContact, isPending } = useSubmitContact();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  function onSubmit(data: ContactFormValues) {
    submitContact(
      {
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || undefined,
          message: data.message,
          type: "consultation",
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Wiadomość wysłana!",
            description:
              "Dziękujemy za kontakt. Odezwiemy się najszybciej jak to możliwe.",
          });
          form.reset();
        },
        onError: () => {
          toast({
            title: "Błąd wysyłania",
            description:
              "Nie udało się wysłać wiadomości. Spróbuj ponownie lub napisz bezpośrednio na kontakt@acadea.pl.",
            variant: "destructive",
          });
        },
      }
    );
  }

  return (
    <div className="w-full pt-28 pb-20 bg-gray-50 min-h-screen">
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
                        href="mailto:kontakt@acadea.pl"
                        className="text-gray-300 hover:text-white transition-colors"
                      >
                        kontakt@acadea.pl
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Phone className="text-accent shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold mb-1">Telefon</p>
                      <a
                        href="tel:+48123456789"
                        className="text-gray-300 hover:text-white transition-colors"
                      >
                        +48 123 456 789
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <MapPin className="text-accent shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold mb-1">Biuro</p>
                      <p className="text-gray-300">
                        Warszawa, Polska
                        <br />
                        (Działamy online na terenie całego kraju)
                      </p>
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
