import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/contexts/i18n-context";

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="space-y-4 text-center">
        <p className="font-display text-4xl">404</p>
        <p className="text-muted-foreground">{t("notFoundMessage")}</p>
        <Link to="/">
          <Button>{t("notFoundBack")}</Button>
        </Link>
      </Card>
    </div>
  );
}
