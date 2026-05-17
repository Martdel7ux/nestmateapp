import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { useExpiringDocuments } from "@/hooks/use-documents";

export function ExpiringSoonStrip() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const { data: docs = [] } = useExpiringDocuments(user?.id, 30);

  if (docs.length === 0) return null;

  const nearest   = docs[0];
  const days       = Math.ceil(
    (new Date(nearest.expires_at!).getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000
  );
  const expired    = days < 0;
  const label      = expired ? `"${nearest.title}" has expired`
    : days === 0 ? `"${nearest.title}" expires today`
    : `"${nearest.title}" expires in ${days} day${days !== 1 ? "s" : ""}`;

  return (
    <motion.button
      type="button"
      onClick={() => navigate("/documents/expiring")}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.3 }}
      className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left active:scale-[0.98] transition-transform bg-amber-50 dark:bg-amber-900/20"
    >
      <AlertTriangle size={16} className="text-amber-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400 truncate block">
          {label}
        </span>
        {docs.length > 1 && (
          <span className="text-xs text-muted-foreground">
            +{docs.length - 1} more document{docs.length > 2 ? "s" : ""} expiring soon
          </span>
        )}
      </div>
      <span className="text-xs font-semibold text-primary shrink-0">View →</span>
    </motion.button>
  );
}
