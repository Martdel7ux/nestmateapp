import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  to: string;
  icon: LucideIcon;
  label: string;
  sublabel?: string;
  color: string;       // gradient or solid CSS color string
  iconColor?: string;  // icon className override
  urgent?: boolean;
}

export function ToolTile({ to, icon: Icon, label, sublabel, color, urgent }: Props) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      whileTap={reduced ? undefined : { scale: 0.96 }}
      transition={{ duration: 0.1 }}
      className="flex-shrink-0"
    >
      <Link
        to={to}
        className={cn(
          "flex flex-col justify-between rounded-[20px] p-3.5 focus-visible:outline-2 focus-visible:outline-primary hover:brightness-105 transition-[filter] duration-150",
          urgent && "ring-2 ring-white/40"
        )}
        style={{ width: 108, height: 108, background: color }}
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: "rgba(255,255,255,0.25)" }}
        >
          <Icon size={18} strokeWidth={1.8} className="text-white" />
        </div>
        <div>
          <p className="text-[12px] font-semibold leading-tight text-white/95 line-clamp-1">{label}</p>
          {sublabel && (
            <p className="text-[10px] text-white/70 leading-tight mt-0.5 line-clamp-1">{sublabel}</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
