import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useSeo } from "@/lib/seo";
import { useLanguage } from "@/lib/i18n";

export default function NotFound() {
  const { isEnglish, t } = useLanguage();

  useSeo({
    title: isEnglish ? "404 | Page not found | ACADEA" : "404 | Strona nie została znaleziona | ACADEA",
    description: t("Strona, której szukasz, nie istnieje lub została przeniesiona.", "The page you are looking for does not exist or has been moved."),
    path: "/404",
    noindex: true,
  });

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">{t("404 | Strona nie została znaleziona", "404 Page Not Found")}</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            {t("Strona, której szukasz, nie istnieje lub została przeniesiona.", "The page you are looking for does not exist or has been moved.")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
