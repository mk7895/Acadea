import { Link } from "wouter";
import logo from "@assets/Acadea_Logo_-_Horizontal_Style-2_1780602818262.png";
import { Facebook, Instagram, Mail, MapPin, Phone, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-white pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="space-y-6">
            <Link href="/">
              <div className="bg-white inline-block p-3 rounded-xl mb-2">
                <img src={logo} alt="ACADEA Logo" className="h-8 w-auto" />
              </div>
            </Link>
            <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
              Aplikacja na studia za granicą — z nami to proste. Pomagamy polskim uczniom dostać się na wymarzone uczelnie w ponad 15 krajach.
            </p>
            <div className="flex items-center gap-4 text-white">
              <a href="#" className="hover:text-accent transition-colors bg-white/10 p-2 rounded-full">
                <Facebook size={20} />
              </a>
              <a href="#" className="hover:text-accent transition-colors bg-white/10 p-2 rounded-full">
                <Instagram size={20} />
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
                  Jak to działa
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
                  O nas
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
              <li className="text-gray-300">Doradztwo Uczelni</li>
              <li className="text-gray-300">Przygotowanie Dokumentów</li>
              <li className="text-gray-300">Eseje i Motywacje</li>
              <li className="text-gray-300">Tłumaczenia i Legalizacja</li>
              <li className="text-gray-300">Wizy i Zakwaterowanie</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">Kontakt</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-300">
                <Mail size={20} className="text-accent shrink-0 mt-0.5" />
                <a href="mailto:kontakt@acadea.pl" className="hover:text-white transition-colors">
                  kontakt@acadea.pl
                </a>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <Phone size={20} className="text-accent shrink-0 mt-0.5" />
                <a href="tel:+48123456789" className="hover:text-white transition-colors">
                  +48 123 456 789
                </a>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <MapPin size={20} className="text-accent shrink-0 mt-0.5" />
                <span>
                  Warszawa, Polska<br />
                  (Konsultacje online na całą Polskę)
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} ACADEA. Wszelkie prawa zastrzeżone.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Polityka Prywatności</a>
            <a href="#" className="hover:text-white transition-colors">Regulamin</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
