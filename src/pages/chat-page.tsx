import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft, BedDouble, File, Home, Image, MapPin, Mic, MicOff,
  MoreVertical, Paperclip, Send, Search, ShieldCheck, Square, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";
import { usePresence } from "@/hooks/use-presence";
import { supabase } from "@/lib/supabase";
import type { FlatmateListing, Profile } from "@/types/supabase";

// ── Profile bottom sheet ──────────────────────────────────────────────────────
function ProfileSheet({ profile, listing, onClose }: {
  profile: Profile;
  listing: FlatmateListing | null;
  onClose: () => void;
}) {
  const hasFlat = listing?.housing_status === "has_flat";
  const tags = listing
    ? [
        listing.country_of_origin,
        listing.language,
        listing.student_type === "erasmus" ? "Erasmus" : "Full-time",
        listing.pet_preference === "love" ? "Loves pets 🐾"
          : listing.pet_preference === "no" ? "No pets" : "Okay with pets",
      ].filter(Boolean)
    : [];

  return (
    <>
      <motion.div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} />
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-[2rem] bg-background pb-10 shadow-card"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>
        <button type="button" onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-muted">
          <X size={15} />
        </button>
        <div className="relative mx-5 mt-3 h-56 overflow-hidden rounded-3xl">
          <img
            src={listing?.profile_image_url ?? listing?.apartment_images?.[0] ??
              `https://api.dicebear.com/9.x/adventurer/svg?seed=${profile.full_name}`}
            alt={profile.full_name} className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          {listing && (
            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm">
              {hasFlat ? <Home size={12} className="text-sky-400" /> : <Search size={12} className="text-amber-400" />}
              <span className="text-xs font-semibold text-white">{hasFlat ? "Has a flat" : "Seeking a flat"}</span>
            </div>
          )}
          <div className="absolute bottom-0 inset-x-0 p-4">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl font-bold text-white">{profile.full_name}</h2>
              {profile.is_verified_landlord && <ShieldCheck size={18} className="text-sky-400" />}
            </div>
            {profile.city && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={12} className="text-white/70" />
                <span className="text-xs text-white/70">{profile.city}, Cyprus</span>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-4 px-5 pt-4">
          {profile.university && <p className="text-sm text-muted-foreground">{profile.university}</p>}
          {listing?.bio && <p className="text-sm leading-relaxed text-foreground">{listing.bio}</p>}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag as string} className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ── Attachment display ────────────────────────────────────────────────────────
function AttachmentBubble({ url, type, isMine }: {
  url: string;
  type: "image" | "video" | "file" | "audio" | null | undefined;
  isMine: boolean;
}) {
  if (type === "image") return <img src={url} alt="attachment" className="max-w-[220px] rounded-2xl object-cover shadow-sm" />;
  if (type === "video") return <video controls src={url} className="max-w-[220px] rounded-2xl shadow-sm" />;
  if (type === "audio") return <audio controls src={url} className="max-w-[220px]" />;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium underline ${isMine ? "text-primary-foreground/80" : "text-primary"}`}>
      <File size={16} /> Download file
    </a>
  );
}

// ── Chat page ─────────────────────────────────────────────────────────────────
export function ChatPage() {
  const { matchId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = (location.state as { from?: string } | null)?.from ?? "/messages";
  const { snapshot, sendMessage, markMessagesRead, blockUser, unblockUser, blockedUserIds } = useData();
  const { user } = useAuth();
  const onlineUserIds = usePresence(user?.id);

  const [draft, setDraft] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [blockConfirm, setBlockConfirm] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const match = snapshot.matches.find((m) => m.id === matchId);
  const otherId = match?.user_a === snapshot.profile.id ? match.user_b : match?.user_a;
  const otherListing = snapshot.flatmates.find((f) => f.user_id === otherId) ?? null;
  const otherProfile = otherListing?.profile ?? null;
  const isBlocked = otherId ? blockedUserIds.includes(otherId) : false;
  const isOnline = otherId ? onlineUserIds.has(otherId) : false;
  const messages = snapshot.messages.filter((m) => m.match_id === matchId);

  useEffect(() => { if (matchId) markMessagesRead(matchId); }, [matchId]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const handleSend = () => {
    if (!draft.trim()) return;
    sendMessage(matchId, draft.trim());
    setDraft("");
  };

  async function uploadAttachment(file: File, type: "image" | "video" | "file" | "audio") {
    setUploading(true);
    setAttachOpen(false);
    try {
      if (supabase && user) {
        const ext = file.name.split(".").pop() ?? "bin";
        const path = `chat/${matchId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("property-images").upload(path, file, { upsert: false });
        if (error) { toast.error("Upload failed. Please try again."); return; }
        const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
        sendMessage(matchId, "", urlData.publicUrl, type);
      } else {
        sendMessage(matchId, "", URL.createObjectURL(file), type);
      }
    } finally {
      setUploading(false);
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fallbackType: "image" | "file") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : fallbackType;
    await uploadAttachment(file, type);
    e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        const audioFile = Object.assign(blob, { name: `voice-${Date.now()}.webm` }) as File;
        await uploadAttachment(audioFile, "audio");
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (!match || !otherProfile) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Conversation not found.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="shrink-0 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-sm">
        <button type="button" onClick={() => navigate(backTo)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted transition active:scale-95">
          <ArrowLeft size={18} />
        </button>

        <button type="button" onClick={() => setProfileOpen(true)} className="flex flex-1 items-center gap-3 text-left">
          <div className="relative">
            <div className="h-10 w-10 overflow-hidden rounded-full">
              <Avatar
                name={otherProfile.full_name}
                src={otherListing?.profile_image_url ?? otherProfile.avatar_url}
                className="h-full w-full"
              />
            </div>
            {isOnline && (
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            )}
          </div>
          <div>
            <p className="font-semibold leading-tight">{otherProfile.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {isOnline ? "Online now" : otherProfile.city ? `${otherProfile.city} · Tap to view` : "Tap to view profile"}
            </p>
          </div>
        </button>

        {/* Three-dot menu */}
        <div className="relative">
          <button type="button" onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted transition active:scale-95">
            <MoreVertical size={18} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <motion.div className="fixed inset-0 z-30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setMenuOpen(false)} />
                <motion.div
                  className="absolute right-0 top-11 z-40 min-w-[160px] overflow-hidden rounded-2xl border border-border bg-background shadow-card"
                  initial={{ opacity: 0, scale: 0.9, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -8 }} transition={{ duration: 0.15 }}
                >
                  {isBlocked ? (
                    <button type="button"
                      onClick={() => { setMenuOpen(false); if (otherId) { unblockUser(otherId); toast.success("User unblocked"); } }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition">
                      Unblock user
                    </button>
                  ) : (
                    <button type="button"
                      onClick={() => { setMenuOpen(false); setBlockConfirm(true); }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/5 transition">
                      Block user
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Blocked banner ── */}
      {isBlocked && (
        <div className="shrink-0 bg-destructive/10 px-4 py-2 text-center text-xs font-medium text-destructive">
          You have blocked this user. Their conversation is hidden from your inbox.
        </div>
      )}

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <BedDouble size={24} className="text-primary" />
            </div>
            <p className="font-semibold">You matched!</p>
            <p className="text-sm text-muted-foreground px-6">
              Say hello to {otherProfile.full_name} and start the conversation.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender_id === snapshot.profile.id;
          const time = new Date(msg.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
              {!isMine && (
                <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full mb-1">
                  <Avatar
                    name={otherProfile.full_name}
                    src={otherListing?.profile_image_url ?? otherProfile.avatar_url}
                    className="h-full w-full"
                  />
                </div>
              )}
              <div className="max-w-[78%] space-y-1">
                {msg.attachment_url && (
                  <div className={isMine ? "flex justify-end" : ""}>
                    <AttachmentBubble url={msg.attachment_url} type={msg.attachment_type} isMine={isMine} />
                  </div>
                )}
                {msg.content && (
                  <div className={`rounded-[1.4rem] px-4 py-2.5 text-sm leading-relaxed ${
                    isMine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-card text-card-foreground shadow-sm"
                  }`}>
                    {msg.content}
                  </div>
                )}
                <p className={`text-[10px] text-muted-foreground ${isMine ? "text-right pr-1" : "pl-1"}`}>
                  {time} {isMine && (msg.read ? "· Read" : "· Sent")}
                </p>
              </div>
            </div>
          );
        })}

        {uploading && (
          <div className="flex justify-end">
            <div className="rounded-2xl bg-primary/20 px-4 py-3 text-xs text-primary animate-pulse">Uploading…</div>
          </div>
        )}
      </div>

      {/* ── Input bar ── */}
      {!isBlocked && (
        <div className="shrink-0 border-t border-border bg-background px-4 pb-6 pt-3">
          {recording ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-1 items-center gap-3 rounded-full border border-destructive/50 bg-destructive/5 px-4 py-2.5">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-destructive" />
                <span className="text-sm font-medium text-destructive">{fmt(recordingTime)}</span>
                <span className="text-xs text-muted-foreground">Recording…</span>
              </div>
              <button type="button" onClick={stopRecording}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive text-white shadow-glow transition active:scale-95">
                <Square size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Attachment button */}
              <div className="relative">
                <button type="button" onClick={() => setAttachOpen(!attachOpen)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition active:scale-95">
                  <Paperclip size={18} />
                </button>
                <AnimatePresence>
                  {attachOpen && (
                    <>
                      <motion.div className="fixed inset-0 z-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setAttachOpen(false)} />
                      <motion.div
                        className="absolute bottom-12 left-0 z-30 flex flex-col gap-1 rounded-2xl border border-border bg-background p-2 shadow-card min-w-[160px]"
                        initial={{ opacity: 0, scale: 0.9, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 8 }} transition={{ duration: 0.15 }}
                      >
                        <button type="button" onClick={() => { setAttachOpen(false); imageInputRef.current?.click(); }}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted transition">
                          <Image size={16} className="text-primary" /> Photo / Video
                        </button>
                        <button type="button" onClick={() => { setAttachOpen(false); fileInputRef.current?.click(); }}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted transition">
                          <File size={16} className="text-amber-500" /> File
                        </button>
                        <button type="button" onClick={() => { setAttachOpen(false); startRecording(); }}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted transition">
                          <Mic size={16} className="text-rose-500" /> Voice note
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={`Message ${otherProfile.full_name.split(" ")[0]}…`}
                className="flex-1 rounded-full border border-border bg-muted/50 px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />

              {draft.trim() ? (
                <button type="button" onClick={handleSend}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition active:scale-95">
                  <Send size={16} />
                </button>
              ) : (
                <button type="button" onClick={startRecording}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition active:scale-95">
                  <Mic size={18} />
                </button>
              )}
            </div>
          )}

          <input ref={imageInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => handleFileChange(e, "image")} />
          <input ref={fileInputRef} type="file" accept="*" className="hidden" onChange={(e) => handleFileChange(e, "file")} />
        </div>
      )}

      {/* ── Profile sheet ── */}
      <AnimatePresence>
        {profileOpen && (
          <ProfileSheet key="profile-sheet" profile={otherProfile} listing={otherListing} onClose={() => setProfileOpen(false)} />
        )}
      </AnimatePresence>

      {/* ── Block confirmation ── */}
      <AnimatePresence>
        {blockConfirm && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setBlockConfirm(false)} />
            <motion.div
              className="fixed inset-x-4 bottom-6 z-50 rounded-[2rem] bg-background p-6 shadow-card"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mx-auto">
                <MicOff size={22} className="text-destructive" />
              </div>
              <h3 className="mt-3 text-center font-display text-xl font-bold">Block {otherProfile.full_name}?</h3>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Their conversation will be hidden from your inbox. You can unblock them anytime.
              </p>
              <div className="mt-5 flex gap-3">
                <button type="button" onClick={() => setBlockConfirm(false)}
                  className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold transition hover:bg-muted">
                  Cancel
                </button>
                <button type="button"
                  onClick={() => { if (otherId) { blockUser(otherId); navigate("/messages"); } }}
                  className="flex-1 rounded-2xl bg-destructive py-3 text-sm font-semibold text-white transition active:scale-95">
                  Block
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
