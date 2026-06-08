import {
  Wallet, HandCoins, Users, Calendar, FileUp, FileText, AlertCircle,
  BookOpen, PenLine, Library, GraduationCap, Users2, Compass, Heart,
  Home, Calculator, Bus, Trash2, Zap, MessageCircle, Sparkles, User,
  MapPin, HelpCircle, Mail, FileSignature,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { FeatureEntry } from "@/features/search/data/feature-index";
import type { ContentResult } from "@/features/search/hooks/use-universal-search";

const ICON_MAP: Record<string, LucideIcon> = {
  Wallet, HandCoins, Users, Calendar, FileUp, FileText, AlertCircle,
  BookOpen, PenLine, Library, GraduationCap, Users2, Compass, Heart,
  Home, Calculator, Bus, Trash2, Zap, MessageCircle, Sparkles, User,
  MapPin, HelpCircle, Mail, FileSignature,
};

interface FeatureRowProps { entry: FeatureEntry; onNavigate: (href: string) => void; }
export function FeatureResultRow({ entry, onNavigate }: FeatureRowProps) {
  const Icon = ICON_MAP[entry.icon] ?? Home;
  return (
    <button
      type="button"
      onClick={() => onNavigate(entry.href)}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left transition hover:bg-muted/60 active:scale-[0.98]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Icon size={16} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{entry.title}</p>
        <p className="truncate text-xs text-muted-foreground">{entry.subtitle}</p>
      </div>
      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Feature</span>
    </button>
  );
}

interface ContentRowProps { result: ContentResult; onNavigate: (href: string) => void; }
export function ContentResultRow({ result, onNavigate }: ContentRowProps) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(result.href)}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left transition hover:bg-muted/60 active:scale-[0.98]"
    >
      {result.thumbnail_url ? (
        <img src={result.thumbnail_url} alt="" loading="lazy" decoding="async" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
          <FileText size={15} className="text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{result.title}</p>
        {result.subtitle && <p className="truncate text-xs text-muted-foreground">{result.subtitle}</p>}
      </div>
      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold capitalize text-muted-foreground">
        {result.badge}
      </span>
    </button>
  );
}
