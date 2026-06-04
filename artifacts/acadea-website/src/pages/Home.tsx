import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Globe, GraduationCap, Heart, MapPin, MessageCircle, Users } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden bg-primary">
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src="/images/hero-students.jpg"
            alt="Students on campus"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium mb-8">
                <Globe size={16} className="text-accent" />
                <span>Twój przewodnik po światowej edukacji</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6 font-sans">
                Aplikacja na studia za granicą <br />
                <span className="text-accent">— z nami to proste.</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl leading-relaxed">
                Pomagamy polskim uczniom dostać się na wymarzone uczelnie w ponad 15 krajach. Kompleksowe wsparcie na każdym etapie aplikacji.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/kontakt">
                  <Button size="lg" className="h-14 px-8 text-base bg-accent text-primary hover:bg-white transition-colors border-none rounded-full w-full sm:w-auto font-bold">
                    Bezpłatna Konsultacja
                  </Button>
                </Link>
                <Link href="/jak-to-dziala">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base text-white border-white/30 hover:bg-white/10 hover:text-white rounded-full w-full sm:w-auto backdrop-blur-sm">
                    Jak to działa?
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="bg-white border-b border-gray-100 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center px-4 py-4 md:py-0"
            >
              <MapPin className="text-accent w-8 h-8 mb-3" />
              <h3 className="text-4xl font-bold text-primary mb-2">15+</h3>
              <p className="text-gray-500 font-medium">Krajów w ofercie</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center text-center px-4 py-4 md:py-0"
            >
              <CheckCircle2 className="text-accent w-8 h-8 mb-3" />
              <h3 className="text-4xl font-bold text-primary mb-2">95%+</h3>
              <p className="text-gray-500 font-medium">Skuteczność kandydatów</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center text-center px-4 py-4 md:py-0"
            >
              <Users className="text-accent w-8 h-8 mb-3" />
              <h3 className="text-4xl font-bold text-primary mb-2">Setki</h3>
              <p className="text-gray-500 font-medium">Studentów za granicą</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-primary mb-6">W czym Ci pomożemy?</h2>
            <p className="text-lg text-gray-600">
              Aplikacja na studia to proces, który wymaga strategii. Przeprowadzimy Cię przez niego krok po kroku.
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              {
                title: "Doradztwo uczelni",
                desc: "Pomożemy wybrać uczelnię dopasowaną do Twoich celów, predyspozycji i budżetu.",
                icon: <GraduationCap size={24} className="text-primary" />
              },
              {
                title: "Przygotowanie dokumentów",
                desc: "Wspieramy przy każdym etapie aplikacji — od transkryptów po referencje.",
                icon: <CheckCircle2 size={24} className="text-primary" />
              },
              {
                title: "Eseje i motywacje",
                desc: "Piszemy razem, żeby wyróżnić Cię spośród tysięcy kandydatów. Twoja historia jest najważniejsza.",
                icon: <Users size={24} className="text-primary" />
              },
              {
                title: "Tłumaczenia i legalizacja",
                desc: "Zajmujemy się żmudnymi formalnościami, żebyś Ty mógł skupić się na nauce.",
                icon: <Globe size={24} className="text-primary" />
              },
              {
                title: "Wizy i zakwaterowanie",
                desc: "Nie zostawiamy Cię samego po przyjęciu. Pomożemy odnaleźć się w nowym kraju.",
                icon: <MapPin size={24} className="text-primary" />
              }
            ].map((service, i) => (
              <motion.div key={i} variants={itemVariants} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent/10 transition-colors">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">{service.title}</h3>
                <p className="text-gray-600 leading-relaxed">{service.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Scholarship Impact Section */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-semibold mb-8">
                <Heart size={16} className="fill-accent" />
                <span>Program Stypendialny ACADEA</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-6">
                Korzystasz z naszych usług.<br />
                <span className="text-accent">Wspierasz czyjś sen.</span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Wierzymy, że wykształcenie nie powinno być przywilejem. Dlatego każda osoba, która wybiera ACADEA, automatycznie przyczynia się do naszego funduszu stypendialnego.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-10">
                Część każdej opłaty trafia do uczniów o wybitnym potencjale, których nie stać na studia za granicą. Twój wybór otwiera im drzwi do świata.
              </p>
              <Link href="/stypendium">
                <Button
                  size="lg"
                  data-testid="button-scholarship-home"
                  className="h-13 px-8 text-base rounded-full bg-accent text-primary hover:bg-primary hover:text-white transition-all font-bold border-none"
                >
                  Dowiedz się więcej <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
              className="relative rounded-3xl overflow-hidden bg-primary min-h-[380px] flex flex-col justify-end p-10"
            >
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-accent blur-[80px]" />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white blur-[60px]" />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-accent/20 rounded-2xl flex items-center justify-center mb-6">
                  <Heart size={28} className="text-accent" />
                </div>
                <p className="text-white/70 text-sm uppercase tracking-widest font-semibold mb-3">Nasza misja</p>
                <p className="text-white text-2xl font-bold leading-snug">
                  Każda opłata za usługi ACADEA tworzy fundusz, który zmienia czyjeś życie.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* WhatsApp Community Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-2"
          >
            {/* Green WhatsApp panel */}
            <div className="bg-[#075E54] p-10 md:p-14 flex flex-col justify-center">
              <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mb-7">
                <MessageCircle size={30} className="text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-5">
                Darmowa grupa WhatsApp — aktualności o studiach za granicą
              </h2>
              <p className="text-white/80 text-lg leading-relaxed mb-8">
                Dołącz do naszej społeczności i otrzymuj bezpłatne porady, aktualności o rekrutacjach, terminy aplikacji i ciekawostki o uczelniach — prosto na telefon.
              </p>
              <ul className="space-y-3 mb-10">
                {[
                  "Terminy aplikacji i ważne daty rekrutacyjne",
                  "Aktualności o stypendiach i programach",
                  "Porady od absolwentów zagranicznych uczelni",
                  "Odpowiedzi na pytania od ekspertów ACADEA",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/90 text-sm">
                    <CheckCircle2 size={18} className="text-[#25D366] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href="https://chat.whatsapp.com"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="button-whatsapp-join"
                className="inline-flex items-center gap-3 self-start bg-[#25D366] text-white font-bold px-8 py-4 rounded-full hover:bg-white hover:text-[#075E54] transition-all text-base"
              >
                <MessageCircle size={20} />
                Dołącz do grupy — to bezpłatne
              </a>
            </div>
            {/* Right panel */}
            <div className="bg-primary p-10 md:p-14 flex flex-col justify-center">
              <div className="space-y-5">
                {[
                  { num: "01", text: "Kliknij przycisk i wejdź do grupy" },
                  { num: "02", text: "Zaakceptuj zaproszenie w WhatsApp" },
                  { num: "03", text: "Otrzymuj aktualizacje — kiedy chcesz, możesz wyjść" },
                ].map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-center gap-5"
                  >
                    <span className="text-4xl font-bold text-white/20 w-10 shrink-0">{step.num}</span>
                    <p className="text-white/90 text-lg font-medium">{step.text}</p>
                  </motion.div>
                ))}
                <p className="text-white/50 text-sm pt-4 border-t border-white/10 mt-6">
                  Aktualnie ponad 200 uczniów i rodziców w grupie.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Join as Mentor Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/20 text-primary text-sm font-semibold mb-8">
                <Users size={16} />
                <span>Dołącz do zespołu</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-6">
                Zostań mentorem ACADEA
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-5">
                Studiujesz lub skończyłeś studia za granicą? Wiesz, jak wygląda aplikacja od środka? Pomóż kolejnym rocznikom zdolnych polskich uczniów przejść tę drogę pewniej.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-10">
                Mentorzy ACADEA doradzają uczniom, recenzują eseje i dzielą się swoim doświadczeniem — w elastycznym modelu, dopasowanym do Twojego harmonogramu.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                {[
                  { title: "Elastyczny czas", desc: "Pracujesz kiedy chcesz — bez sztywnych godzin" },
                  { title: "Realne wynagrodzenie", desc: "Płacimy za każdą przeprowadzoną sesję" },
                  { title: "Misja z sensem", desc: "Twoja wiedza zmienia czyjąś przyszłość" },
                ].map((b, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <h4 className="font-bold text-primary text-sm mb-1">{b.title}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
                  </div>
                ))}
              </div>
              <Link href="/kontakt">
                <Button
                  size="lg"
                  data-testid="button-become-mentor"
                  className="h-14 px-8 rounded-full bg-primary text-white hover:bg-primary/90 font-bold text-base"
                >
                  Aplikuj jako mentor <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-4"
            >
              {[
                {
                  country: "Wielka Brytania",
                  school: "University of Edinburgh",
                  field: "Computer Science",
                  quote: "Mentoruję w ACADEA, bo pamiętam jak bardzo brakowało mi kogoś, kto powiedział po prostu — dasz radę.",
                },
                {
                  country: "Holandia",
                  school: "TU Delft",
                  field: "Inżynieria Lądowa",
                  quote: "Praca z uczniami ACADEA to najlepsza rzecz, jaką mogę zrobić z moją wiedzą o procesie aplikacji.",
                },
                {
                  country: "Niemcy",
                  school: "TU Munich",
                  field: "Mechatronika",
                  quote: "Każda sesja mentoringowa to dla mnie przypomnienie, dlaczego sam podjąłem tę decyzję.",
                },
              ].map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 * i }}
                  data-testid={`mentor-card-${i}`}
                  className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex gap-5"
                >
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {m.country[0]}
                  </div>
                  <div>
                    <p className="text-gray-700 text-sm leading-relaxed italic mb-3">"{m.quote}"</p>
                    <p className="text-primary font-semibold text-sm">{m.school}</p>
                    <p className="text-gray-400 text-xs">{m.field} · {m.country}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden bg-primary text-white">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-accent rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-white/10 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Zacznijmy Twoją drogę.</h2>
            <p className="text-xl text-gray-300 mb-10">
              Umów się na bezpłatną konsultację. Opowiesz nam o swoich celach, a my powiemy Ci, jak je osiągnąć.
            </p>
            <Link href="/kontakt">
              <Button size="lg" className="h-14 px-10 text-lg bg-accent text-primary hover:bg-white transition-colors border-none rounded-full font-bold shadow-lg shadow-accent/20">
                Zarezerwuj spotkanie <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
