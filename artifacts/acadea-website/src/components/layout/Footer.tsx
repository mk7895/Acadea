import type { MouseEvent } from "react";
import { Link } from "wouter";
import logo from "@/assets/logo-white.webp";
import { Facebook, Instagram, Linkedin, Mail, Phone, Heart, MessageCircle } from "lucide-react";
import { useCookieConsent } from "@/components/CookieConsent";
import { useLanguage } from "@/lib/i18n";

const serviceLinks = [
  { label: "Doradztwo w Wyborze Uczelni", labelEn: "University selection advising", href: "/jak-to-dziala#wybor-uczelni" },
  { label: "Egzaminy i Certyfikaty", labelEn: "Exams and certificates", href: "/jak-to-dziala#egzaminy-i-certyfikaty" },
  { label: "Przygotowanie Dokumentów", labelEn: "Document preparation", href: "/jak-to-dziala#przygotowanie-dokumentow" },
  { label: "Eseje, CV i Listy Motywacyjne", labelEn: "Essays, CVs and motivation letters", href: "/jak-to-dziala#eseje-cv-i-listy-motywacyjne" },
  { label: "Aplikacja i Stypendia", labelEn: "Applications and scholarships", href: "/jak-to-dziala#aplikacja-i-stypendia" },
  { label: "Przygotowanie do Rozmów Wstępnych", labelEn: "Interview preparation", href: "/jak-to-dziala#oczekiwanie" },
  { label: "Formalności po Przyjęciu i Zakwaterowanie", labelEn: "Post-offer formalities and accommodation", href: "/jak-to-dziala#po-przyjeciu" },
];

export function Footer() {
  const { openPreferences } = useCookieConsent();
  const { isEnglish, localizePath, t } = useLanguage();
  const handleServiceClick = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    const [path, hash] = href.split("#");
    if (window.location.pathname !== localizePath(path).split("#")[0] || !hash) return;

    event.preventDefault();
    const target = document.getElementById(hash);
    if (!target) return;

    window.history.replaceState(null, "", href);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <footer className="bg-primary text-white pt-16 pb-8">
      <div className="sr-only" aria-hidden="true">
        {t(
          "Fundacja Acadea, Jedności Narodowej 55-57 / 15, 50-262 Wrocław, Polska. Kontakt: contact@acadea.org, telefon +48 728 492 936.",
          "Fundacja Acadea, Jedności Narodowej 55-57 / 15, 50-262 Wroclaw, Poland. Contact: contact@acadea.org, phone +48 728 492 936.",
        )}
      </div>
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="space-y-6">
            <Link href={localizePath("/")}>
              <img src={logo} alt="ACADEA Logo" className="h-20 md:h-24 w-auto shrink-0 mb-2" />
            </Link>
            <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
              {t(
                "Aplikacja na studia za granicą — z nami to proste. Pomagamy uczniom dostać się na wymarzone uczelnie w ponad 25 krajach.",
                "Applying to university abroad, made simpler. We help students get into dream universities in more than 25 countries.",
              )}
            </p>
            <div className="flex items-center gap-4 text-white">
              <a
                href="https://www.facebook.com/acadeaorg/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="hover:text-accent transition-colors bg-white/10 p-2 rounded-full"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://www.instagram.com/acadeaorg?igsh=NmFwcHUwZXI1M2Y5&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:text-accent transition-colors bg-white/10 p-2 rounded-full"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://www.linkedin.com/company/acadeaorg"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="hover:text-accent transition-colors bg-white/10 p-2 rounded-full"
              >
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">{t("Nawigacja", "Navigation")}</h4>
            <ul className="space-y-4">
              <li>
                <Link href={localizePath("/")} className="text-gray-300 hover:text-white transition-colors">
                  {t("Strona Główna", "Home")}
                </Link>
              </li>
              <li>
                <Link href={localizePath("/jak-to-dziala")} className="text-gray-300 hover:text-white transition-colors">
                  {t("Jak pomagamy", "How we help")}
                </Link>
              </li>
              <li>
                <Link href={localizePath("/kraje")} className="text-gray-300 hover:text-white transition-colors">
                  {t("Kraje i Uczelnie", "Countries and universities")}
                </Link>
              </li>
              <li>
                <Link href={localizePath("/baza-wiedzy")} className="text-gray-300 hover:text-white transition-colors">
                  {t("Baza Wiedzy", "Knowledge base")}
                </Link>
              </li>
              <li>
                <Link href={localizePath("/stypendium")} className="inline-flex items-center gap-1.5 text-accent hover:text-white transition-colors font-medium">
                  <Heart size={14} className="fill-accent" /> {t("Program Stypendialny", "Scholarship programme")}
                </Link>
              </li>
              <li>
                <Link href={localizePath("/o-nas")} className="text-gray-300 hover:text-white transition-colors">
                  {t("Poznajmy się", "About us")}
                </Link>
              </li>
              <li>
                <Link href={localizePath("/kontakt")} className="text-gray-300 hover:text-white transition-colors">
                  {t("Kontakt", "Contact")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">{t("Usługi", "Services")}</h4>
            <ul className="space-y-4">
              {serviceLinks.map((svc) => (
                <li key={svc.href}>
                  <a
                    href={localizePath(svc.href)}
                    onClick={(event) => handleServiceClick(event, svc.href)}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {isEnglish ? svc.labelEn : svc.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">{t("Kontakt", "Contact")}</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-300">
                <Mail size={20} className="text-accent shrink-0 mt-0.5" />
                <a href="mailto:contact@acadea.org" className="hover:text-white transition-colors">
                  contact@acadea.org
                </a>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <Phone size={20} className="text-accent shrink-0 mt-0.5" />
                <a href="tel:+48728492936" className="hover:text-white transition-colors">
                  +48 728 492 936
                </a>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <MessageCircle size={20} className="text-accent shrink-0 mt-0.5" />
                <a
                  href="https://wa.me/48799831204"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  WhatsApp: +48 799 831 204
                </a>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <MessageCircle size={20} className="text-accent shrink-0 mt-0.5" />
                <a
                  href="https://chat.whatsapp.com/Cg8sKNNvAFIKBfDjBLqWKl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {t("Grupa na WhatsApp", "WhatsApp group")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} ACADEA. {t("Wszelkie prawa zastrzeżone.", "All rights reserved.")}</p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <Link href={localizePath("/polityka-prywatnosci")} className="hover:text-white transition-colors">{t("Polityka Prywatności", "Privacy Policy")}</Link>
            <Link href={localizePath("/regulamin")} className="hover:text-white transition-colors">{t("Regulamin", "Terms")}</Link>
            <Link href={localizePath("/stypendium/regulamin")} className="hover:text-white transition-colors">{t("Regulamin Stypendium", "Scholarship Terms")}</Link>
            <Link href={localizePath("/regulamin-platformy")} className="hover:text-white transition-colors">{t("Regulamin Platformy", "Platform Terms")}</Link>
            <button onClick={openPreferences} className="hover:text-white transition-colors">
              {t("Ustawienia cookies", "Cookie settings")}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
