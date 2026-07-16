import { Link, useLocation } from "wouter";
import logoGreen from "@/assets/logo-green.webp";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n";

const links = [
  { href: "/", label: "Strona Główna", labelEn: "Home" },
  { href: "/jak-to-dziala", label: "Jak pomagamy", labelEn: "How we help" },
  { href: "/kraje", label: "Kraje i Uczelnie", labelEn: "Countries and universities" },
  { href: "/baza-wiedzy", label: "Baza Wiedzy", labelEn: "Knowledge base" },
  { href: "/stypendium", label: "Stypendia", labelEn: "Scholarships", highlight: true },
  { href: "/o-nas", label: "Poznajmy się", labelEn: "About us" },
];

export function Navbar() {
  const [location] = useLocation();
  const { isEnglish, localizePath, switchLanguagePath, setPreferredLanguage, t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const resetBookingIfCurrentPage = () => {
    if (location === "/umow-spotkanie" || location === "/en/book-consultation") {
      window.dispatchEvent(new Event("acadea:booking-reset"));
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200/50 py-2.5"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href={localizePath("/")} className="flex cursor-pointer items-center gap-2 z-50 relative">
          <img
            src={isScrolled ? logoGreen : logoGreen}
            alt="ACADEA Logo"
            width={900}
            height={500}
            className="h-20 w-36 shrink-0 md:h-[5.5rem] md:w-[9.9rem]"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 md:translate-y-[0.65rem]">
          {links.map((link) => (
            link.highlight ? (
              <Link
                key={link.href}
                href={localizePath(link.href)}
                className={`cursor-pointer text-sm font-semibold transition-colors px-3 py-1 rounded-full border ${
                  location === localizePath(link.href)
                    ? "bg-accent text-primary border-accent"
                    : "text-accent border-accent/40 hover:bg-accent hover:text-primary"
                }`}
              >
                {isEnglish ? link.labelEn : link.label}
              </Link>
            ) : (
              <Link
                key={link.href}
                href={localizePath(link.href)}
                className={`cursor-pointer text-sm font-medium transition-colors hover:text-accent ${
                  location === localizePath(link.href) ? "text-primary" : "text-gray-600"
                }`}
              >
                {isEnglish ? link.labelEn : link.label}
              </Link>
            )
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4 md:translate-y-[0.65rem]">
          <div className="flex items-center rounded-full border border-primary/15 bg-white/80 p-1">
            <Link
              href={switchLanguagePath("pl")}
              onClick={() => setPreferredLanguage("pl")}
              className={`rounded-full px-2.5 py-1 text-sm ${!isEnglish ? "bg-primary text-white" : "text-primary"}`}
              aria-label="Przełącz na język polski"
            >
              🇵🇱
            </Link>
            <Link
              href={switchLanguagePath("en")}
              onClick={() => setPreferredLanguage("en")}
              className={`rounded-full px-2.5 py-1 text-sm ${isEnglish ? "bg-primary text-white" : "text-primary"}`}
              aria-label="Switch to English"
            >
              🇬🇧
            </Link>
          </div>
          <Link href={localizePath("/umow-spotkanie")} onClick={resetBookingIfCurrentPage}>
            <Button className="rounded-full px-6 bg-primary text-white hover:bg-primary/90 transition-all font-semibold">
              {t("Bezpłatna konsultacja", "Free consultation")}
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden z-50 relative cursor-pointer p-2 text-primary"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={t("Otwórz menu", "Open menu")}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 top-0 pt-24 px-6 pb-8 bg-white shadow-xl h-screen flex flex-col md:hidden"
            >
              <nav className="flex flex-col gap-6 text-center mt-8">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={localizePath(link.href)}
                    className={`cursor-pointer text-2xl font-semibold transition-colors ${
                      link.highlight
                        ? "text-accent"
                        : location === localizePath(link.href)
                        ? "text-primary"
                        : "text-gray-600"
                    }`}
                  >
                    {isEnglish ? link.labelEn : link.label}
                  </Link>
                ))}
                <div className="flex justify-center gap-3">
                  <Link
                    href={switchLanguagePath("pl")}
                    onClick={() => setPreferredLanguage("pl")}
                    className={`rounded-full border px-4 py-2 text-lg ${!isEnglish ? "border-primary bg-primary text-white" : "border-primary/15 text-primary"}`}
                  >
                    🇵🇱 Polski
                  </Link>
                  <Link
                    href={switchLanguagePath("en")}
                    onClick={() => setPreferredLanguage("en")}
                    className={`rounded-full border px-4 py-2 text-lg ${isEnglish ? "border-primary bg-primary text-white" : "border-primary/15 text-primary"}`}
                  >
                    🇬🇧 English
                  </Link>
                </div>
                <div className="mt-8 border-t border-gray-100 pt-8">
                  <Link href={localizePath("/umow-spotkanie")} onClick={resetBookingIfCurrentPage}>
                    <Button className="w-full rounded-full h-14 text-lg bg-primary text-white">
                      {t("Bezpłatna konsultacja", "Free consultation")}
                    </Button>
                  </Link>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
