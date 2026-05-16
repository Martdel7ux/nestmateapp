import { useState } from "react";
import { Bell, BellOff, Building2, Heart, MessageCircle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/app-header";
import { useData } from "@/contexts/data-context";
import { useI18n } from "@/contexts/i18n-context";
import { ProfileDetailSheetPortal } from "@/components/features/flatmates/profile-detail-sheet";
import type { FlatmateListing, NotificationItem } from "@/types/supabase";

function NotifIcon({ type }: { type: NotificationItem["type"] }) {
  if (type === "match") return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-500/10">
      <Heart size={18} className="fill-rose-500 text-rose-500" />
    </div>
  );
  if (type === "message") return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
      <MessageCircle size={18} className="text-primary" />
    </div>
  );
  if (type === "verification") return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-500/10">
      <ShieldCheck size={18} className="text-sky-500" />
    </div>
  );
  if (type === "property_approved") return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10">
      <Building2 size={18} className="text-emerald-500" />
    </div>
  );
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
      <Bell size={18} className="text-muted-foreground" />
    </div>
  );
}

export function NotificationsPage() {
  const { snapshot, markNotificationsRead, swipeFlatmate } = useData();
  const { t } = useI18n();
  const navigate = useNavigate();
  const unread = snapshot.notifications.filter((n) => !n.is_read).length;

  // Profile sheet state — shown when tapping a "Someone likes you!" notification
  const [likerProfile, setLikerProfile] = useState<FlatmateListing | null>(null);

  // Returns true if the current user has already swiped on this sender
  function alreadySwiped(senderId: string) {
    return snapshot.swipes.some((s) => s.swiped_id === senderId);
  }

  // For a mutual match notification → navigate to chat (passing origin for back nav)
  // For a one-way like notification → show profile sheet
  function handleNotifTap(notif: NotificationItem) {
    if (notif.type !== "match" || !notif.sender_id) return;

    const existingMatch = snapshot.matches.find(
      (m) => m.user_a === notif.sender_id || m.user_b === notif.sender_id
    );

    if (existingMatch) {
      navigate(`/messages/${existingMatch.id}`, { state: { from: "/notifications" } });
    } else {
      const liker = snapshot.flatmates.find((f) => f.user_id === notif.sender_id);
      if (liker) setLikerProfile(liker);
    }
  }

  function isClickable(notif: NotificationItem) {
    if (notif.type !== "match" || !notif.sender_id) return false;
    const hasMatch = snapshot.matches.some(
      (m) => m.user_a === notif.sender_id || m.user_b === notif.sender_id
    );
    const hasListing = snapshot.flatmates.some((f) => f.user_id === notif.sender_id);
    return hasMatch || hasListing;
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("notificationsJustNow");
    if (mins < 60) return t("notificationsMAgo", { n: mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t("notificationsHAgo", { n: hrs });
    const days = Math.floor(hrs / 24);
    if (days === 1) return t("notificationsYesterday");
    return t("notificationsDAgo", { n: days });
  }

  return (
    <>
      {/* Profile detail sheet — slides up when tapping a like notification */}
      <ProfileDetailSheetPortal
        flatmate={likerProfile}
        onClose={() => setLikerProfile(null)}
        onSwipe={
          likerProfile && !alreadySwiped(likerProfile.user_id)
            ? (dir) => {
                swipeFlatmate(likerProfile.id, dir);
                setLikerProfile(null);
              }
            : undefined
        }
      />

      <AppHeader
        title={t("notificationsTitle")}
        subtitle={unread > 0 ? t("notificationsUnread", { n: unread }) : undefined}
        right={
          unread > 0
            ? {
                type: "custom",
                element: (
                  <button
                    onClick={() => markNotificationsRead()}
                    className="rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
                  >
                    {t("notificationsMarkRead")}
                  </button>
                ),
              }
            : { type: "none" }
        }
      />
      <div className="space-y-5 px-5 pt-4">

        {/* Notification list */}
        {snapshot.notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <BellOff size={28} className="text-muted-foreground" />
            </div>
            <p className="font-semibold">{t("notificationsEmpty")}</p>
            <p className="text-sm text-muted-foreground">{t("notificationsEmptyDesc")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {snapshot.notifications.map((notif, i) => {
              const clickable = isClickable(notif);
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  onClick={() => clickable && handleNotifTap(notif)}
                  className={`flex items-start gap-4 rounded-[1.5rem] p-4 transition ${
                    notif.is_read
                      ? "bg-card/60 shadow-sm"
                      : "border border-primary/20 bg-primary/5 shadow-sm"
                  } ${clickable ? "cursor-pointer hover:bg-primary/10 active:scale-[0.98]" : ""}`}
                >
                  <NotifIcon type={notif.type} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-tight ${notif.is_read ? "font-medium" : "font-bold"}`}>
                        {notif.title}
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {timeAgo(notif.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground leading-snug">{notif.body}</p>
                    {/* Hint for like notifications */}
                    {notif.title === "Someone likes you!" && clickable && notif.sender_id && (
                      <p className="mt-1.5 text-[11px] font-semibold text-primary">
                        {alreadySwiped(notif.sender_id)
                          ? "Tap to view their profile"
                          : "Tap to view their profile and respond →"}
                      </p>
                    )}
                  </div>

                  {!notif.is_read && (
                    <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
