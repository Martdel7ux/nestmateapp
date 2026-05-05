import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="space-y-4 text-center">
        <p className="font-display text-4xl">404</p>
        <p className="text-muted-foreground">This NestMate page has moved or never existed.</p>
        <Link to="/">
          <Button>Back home</Button>
        </Link>
      </Card>
    </div>
  );
}
