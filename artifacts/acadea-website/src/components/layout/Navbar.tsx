import { Link, useLocation } from "wouter";
import logo from "@assets/Acadea_Logo_-_Horizontal_Style-2_1780602818262.png";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { href: "/", label: "Strona Główna" },
  { href: "/jak-to-dziala", label: "Jak to działa" },
  { href: "/kraje", label: "Kraje i Uczelnie" },
  { href: "/baza-wiedzy", label: "Baza Wiedzy" },
  { href: "/stypendium", label: "Stypendia", highlight: true },
  { href: "/o-nas", label: "O nas" },
];

export function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200/50 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 z-50 relative">
          <img src={logo} alt="ACADEA Logo" className="h-8 md:h-10 w-auto" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            link.highlight ? (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold transition-colors px-3 py-1 rounded-full border ${
                  location === link.href
                    ? "bg-accent text-primary border-accent"
                    : "text-accent border-accent/40 hover:bg-accent hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-accent ${
                  location === link.href ? "text-primary" : "text-gray-600"
                }`}
              >
                {link.label}
              </Link>
            )
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/kontakt">
            <Button className="rounded-full px-6 bg-primary text-white hover:bg-primary/90 transition-all font-semibold">
              Bezpłatna Konsultacja
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden z-50 relative p-2 text-primary"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
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
                    href={link.href}
                    className={`text-2xl font-semibold transition-colors ${
                      link.highlight
                        ? "text-accent"
                        : location === link.href
                        ? "text-primary"
                        : "text-gray-600"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="mt-8 border-t border-gray-100 pt-8">
                  <Link href="/kontakt">
                    <Button className="w-full rounded-full h-14 text-lg bg-primary text-white">
                      Bezpłatna Konsultacja
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
