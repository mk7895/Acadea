import type { MouseEvent } from "react";
import { Link } from "wouter";
import logo from "@/assets/logo-white.png";
import { Facebook, Instagram, Linkedin, Mail, Phone, Heart } from "lucide-react";
import { useCookieConsent } from "@/components/CookieConsent";

const serviceLinks = [
  { label: "Doradztwo Uczelni", href: "/jak-to-dziala#profilowanie-i-wybor-uczelni" },
  { label: "Egzaminy i Certyfikaty", href: "/jak-to-dziala#egzaminy-i-certyfikaty" },
  { label: "Przygotowanie Dokumentów", href: "/jak-to-dziala#przygotowanie-dokumentow" },
  { label: "Eseje i Motywacje", href: "/jak-to-dziala#eseje-i-personal-statement" },
  { label: "Tłumaczenia i Legalizacja", href: "/jak-to-dziala#aplikacja-i-formalnosci" },
  { label: "Wizy i Zakwaterowanie", href: "/jak-to-dziala#po-przyjeciu" },
];

export function Footer() {
  const { openPreferences } = useCookieConsent();
  const handleServiceClick = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    const [path, hash] = href.split("#");
    if (window.location.pathname !== path || !hash) return;

    event.preventDefault();
    const target = document.getElementById(hash);
    if (!target) return;

    window.history.replaceState(null, "", href);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <footer className="bg-primary text-white pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="space-y-6">
            <Link href="/">
              <img src={logo} alt="ACADEA Logo" className="h-20 md:h-24 w-auto shrink-0 mb-2" />
            </Link>
            <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
              Aplikacja na studia za granicą — z nami to proste. Pomagamy uczniom dostać się na wymarzone uczelnie w ponad 25 krajach.
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
            <h4 className="text-lg font-semibold mb-6">Nawigacja</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                  Strona Główna
                </Link>
              </li>
              <li>
                <Link href="/jak-to-dziala" className="text-gray-300 hover:text-white transition-colors">
                  Jak pomagamy
                </Link>
              </li>
              <li>
                <Link href="/kraje" className="text-gray-300 hover:text-white transition-colors">
                  Kraje i Uczelnie
                </Link>
              </li>
              <li>
                <Link href="/baza-wiedzy" className="text-gray-300 hover:text-white transition-colors">
                  Baza Wiedzy
                </Link>
              </li>
              <li>
                <Link href="/stypendium" className="inline-flex items-center gap-1.5 text-accent hover:text-white transition-colors font-medium">
                  <Heart size={14} className="fill-accent" /> Program Stypendialny
                </Link>
              </li>
              <li>
                <Link href="/o-nas" className="text-gray-300 hover:text-white transition-colors">
                  Poznajmy się
                </Link>
              </li>
              <li>
                <Link href="/kontakt" className="text-gray-300 hover:text-white transition-colors">
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">Usługi</h4>
            <ul className="space-y-4">
              {serviceLinks.map((svc) => (
                <li key={svc.href}>
                  <a
                    href={svc.href}
                    onClick={(event) => handleServiceClick(event, svc.href)}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {svc.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">Kontakt</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-300">
                <Mail size={20} className="text-accent shrink-0 mt-0.5" />
                <a href="mailto:kontakt@acadea.org" className="hover:text-white transition-colors">
                  kontakt@acadea.org
                </a>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <Phone size={20} className="text-accent shrink-0 mt-0.5" />
                <a href="tel:+48728492936" className="hover:text-white transition-colors">
                  +48 728 492 936
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} ACADEA. Wszelkie prawa zastrzeżone.</p>
          <div className="flex items-center gap-6">
            <Link href="/polityka-prywatnosci" className="hover:text-white transition-colors">Polityka Prywatności</Link>
            <Link href="/regulamin" className="hover:text-white transition-colors">Regulamin</Link>
            <button onClick={openPreferences} className="hover:text-white transition-colors">
              Ustawienia cookies
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
