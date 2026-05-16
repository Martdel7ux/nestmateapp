import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useSendMentorRequest } from "@/hooks/use-mentor-request";

interface Props {
  open: boolean;
  onClose: () => void;
  mentorId: string;
  courseId: string;
  courseName: string;
}

export function MentorRequestModal({ open, onClose, mentorId, courseId, courseName }: Props) {
  const [message, setMessage] = useState("");
  const { mutate: sendRequest, isPending } = useSendMentorRequest();

  if (!open) return null;

  const handleSend = () => {
    sendRequest(
      { mentorId, courseId, message: message.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Mentor request sent — you'll be notified when they respond");
          setMessage("");
          onClose();
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to send request");
        },
      }
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-background shadow-xl px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
        {/* Handle */}
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-muted" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-foreground">Request a Mentor</h2>
            <p className="text-sm text-muted-foreground">{courseName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message textarea */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Message (optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell the mentor what you need help with…"
            rows={4}
            maxLength={500}
            className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {message.length}/500
          </p>
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={isPending}
          className="w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
        >
          {isPending ? "Sending…" : "Send Request"}
        </button>
      </div>
    </>
  );
}
