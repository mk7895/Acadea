import { CheckCircle2, MessageCircle } from "lucide-react";
import { ResponsiveQrCode } from "@/components/ResponsiveQrCode";

const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/Cg8sKNNvAFIKBfDjBLqWKl";

const WHATSAPP_GROUP_BENEFITS = [
  "Terminy aplikacji i ważne daty rekrutacyjne",
  "Aktualności o stypendiach i programach",
  "Porady od absolwentów zagranicznych uczelni",
  "Odpowiedzi na pytania od ekspertów ACADEA",
];

export function ArticleWhatsAppGroupBlock() {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[#e6dfd3] bg-white shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_320px]">
        <div className="bg-[#fff7ec] p-6 md:p-8">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MessageCircle size={24} />
          </div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#b6893f]">
            Społeczność WhatsApp
          </div>
          <h3 className="text-2xl font-bold leading-tight text-primary md:text-3xl">
            Dołącz do grupy ACADEA i miej terminy oraz aktualności pod ręką
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-600 md:text-base">
            To dobre miejsce, jeśli chcesz regularnie widzieć przypomnienia o terminach, stypendiach
            i najważniejszych momentach w procesie aplikacji na studia za granicą.
          </p>

          <ul className="mt-6 space-y-3">
            {WHATSAPP_GROUP_BENEFITS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-gray-700 md:text-base">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <a
            href={WHATSAPP_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex items-center gap-3 rounded-full bg-primary px-7 py-4 text-sm font-bold text-white transition-colors hover:bg-primary/90 md:text-base"
          >
            <MessageCircle size={18} />
            Dołącz do społeczności
          </a>
        </div>

        <div className="flex flex-col items-center justify-center bg-primary px-6 py-8 text-center md:px-8">
          <div className="rounded-[24px] bg-white p-5 shadow-lg">
            <ResponsiveQrCode
              value={WHATSAPP_GROUP_URL}
              size={176}
              title="Kod QR do grupy WhatsApp ACADEA"
              className="h-auto w-full max-w-[176px]"
            />
          </div>
          <p className="mt-5 text-base font-bold text-white">Zeskanuj kod QR</p>
          <p className="mt-2 max-w-[220px] text-sm leading-relaxed text-white/75">
            Otwórz aparat i dołącz do społeczności ACADEA na WhatsApp.
          </p>
        </div>
      </div>
    </section>
  );
}
