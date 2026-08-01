import type { SVGProps } from "react";

// Stroke icons lifted from the NestMate v2 prototype so the redesign matches
// exactly. All inherit `currentColor` and share the same stroke treatment.
function Base({ size = 23, children, ...rest }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: { size?: number }) => (
  <Base size={p.size}>
    <path d="M3 11.2 12 4l9 7.2" />
    <path d="M5.4 12.6V19a1.4 1.4 0 0 0 1.4 1.4h10.4A1.4 1.4 0 0 0 18.6 19v-6.4" />
  </Base>
);

export const IconExplore = (p: { size?: number }) => (
  <Base size={p.size}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M15.2 8.8 13.4 13.4l-4.6 1.8L10.6 10.6z" />
  </Base>
);

export const IconMessages = (p: { size?: number }) => (
  <Base size={p.size}>
    <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.3A8 8 0 1 1 20 12z" />
  </Base>
);

export const IconCommunity = (p: { size?: number }) => (
  <Base size={p.size}>
    <circle cx="9" cy="8.6" r="3.2" />
    <path d="M3.4 19.4a5.8 5.8 0 0 1 11.2 0" />
    <path d="M16.2 6.2a3 3 0 0 1 0 5.6" />
    <path d="M17.6 14.4a5.6 5.6 0 0 1 3 5" />
  </Base>
);

export const IconProfile = (p: { size?: number }) => (
  <Base size={p.size}>
    <circle cx="12" cy="8.4" r="3.4" />
    <path d="M5.2 20a6.8 6.8 0 0 1 13.6 0" />
  </Base>
);

export const IconBell = (p: { size?: number }) => (
  <Base size={p.size ?? 18}>
    <path d="M18 8.6a6 6 0 1 0-12 0c0 5-2 6.4-2 6.4h16s-2-1.4-2-6.4" />
    <path d="M13.7 19a2 2 0 0 1-3.4 0" />
  </Base>
);

export const IconChevron = (p: { size?: number }) => (
  <Base size={p.size ?? 15} strokeWidth={1.9}>
    <path d="M9.5 5.5 16 12l-6.5 6.5" />
  </Base>
);

export const IconKey = (p: { size?: number }) => (
  <Base size={p.size ?? 19} strokeWidth={1.6}>
    <circle cx="8" cy="15" r="4" />
    <path d="M10.8 12.2 20 3" />
    <path d="M17 6l2.5 2.5" />
  </Base>
);

export const IconDoc = (p: { size?: number }) => (
  <Base size={p.size ?? 19} strokeWidth={1.6}>
    <path d="M7 3h7l4 4v14H7z" />
    <path d="M14 3v4h4" />
    <path d="M9.5 13h6" />
  </Base>
);

export const IconArrowLeft = (p: { size?: number }) => (
  <Base size={p.size ?? 20} strokeWidth={1.8}>
    <path d="M14.5 5.5 8 12l6.5 6.5" />
  </Base>
);

export const IconSend = (p: { size?: number }) => (
  <Base size={p.size ?? 18} strokeWidth={1.9}>
    <path d="M4.5 12h13M12 5.5 18.5 12 12 18.5" />
  </Base>
);

export const IconShield = (p: { size?: number }) => (
  <Base size={p.size ?? 19}>
    <path d="M12 3.2 20 6.4v5.2c0 5-3.4 8.2-8 9.2-4.6-1-8-4.2-8-9.2V6.4z" />
    <path d="M8.6 12.2 11 14.6l4.6-4.8" />
  </Base>
);

export const IconGear = (p: { size?: number }) => (
  <Base size={p.size ?? 18}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
  </Base>
);

export type ModuleIconName =
  | "events" | "community" | "market" | "discover" | "matches"
  | "ai" | "deals" | "jobs" | "campus" | "bills" | "move";

const MODULE_PATHS: Record<ModuleIconName, JSX.Element> = {
  events: <><rect x="4" y="6.5" width="16" height="13" rx="2.2" /><path d="M4 10.5h16" /><path d="M8.5 4.5v3M15.5 4.5v3" /></>,
  community: <><circle cx="9" cy="8" r="3.1" /><path d="M3.6 19a5.4 5.4 0 0 1 10.8 0" /><path d="M16 6a3 3 0 0 1 0 5.6" /><path d="M17.4 14.2a5.2 5.2 0 0 1 2.9 4.6" /></>,
  market: <><circle cx="9" cy="20" r="1.3" /><circle cx="17" cy="20" r="1.3" /><path d="M3 4h2l2.2 11h10l1.6-7.5H6" /></>,
  discover: <><path d="M3 11 12 4l9 7" /><path d="M5.6 12.6V19a1 1 0 0 0 1 1h10.8a1 1 0 0 0 1-1v-6.4" /></>,
  matches: <><circle cx="9" cy="8" r="3.1" /><path d="M3.6 19a5.4 5.4 0 0 1 10.8 0" /><path d="M16 6a3 3 0 0 1 0 5.6" /></>,
  ai: <><path d="M12 4l1.5 4.2L18 10l-4.5 1.8L12 16l-1.5-4.2L6 10l4.5-1.8z" /><path d="M18.2 15l.7 2 2 .8-2 .7-.7 2-.8-2-2-.7 2-.8z" /></>,
  deals: <><path d="M4.5 4.5h6.4l8.6 8.6-6.4 6.4-8.6-8.6z" /><circle cx="8.5" cy="8.5" r="1.3" /></>,
  jobs: <><rect x="4" y="7.5" width="16" height="11.5" rx="2" /><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" /><path d="M4 12.5h16" /></>,
  campus: <><rect x="5" y="4.5" width="14" height="15.5" rx="1.4" /><path d="M9.5 8.5h.01M12 8.5h.01M14.5 8.5h.01M9.5 12h.01M12 12h.01M14.5 12h.01" /><path d="M10 20v-3.5h4V20" /></>,
  bills: <><rect x="3.5" y="6.5" width="17" height="11" rx="2.5" /><path d="M15.5 12h2.5" /><path d="M3.5 10h12.5" /></>,
  move: <><path d="M11 12.5 4 11l.6-1.8 6 .3 4.8-4.6 1.9.6-2.7 5.7 4.7 1.9-.7 1.9-4.6-1 -3 3.4-1.5-.5z" /></>,
};

export function ModuleIcon({ name, size = 20 }: { name: ModuleIconName; size?: number }) {
  return (
    <Base size={size} strokeWidth={1.6}>
      {MODULE_PATHS[name]}
    </Base>
  );
}
