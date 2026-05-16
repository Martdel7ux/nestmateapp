import { MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { MentorBadge } from "./MentorBadge";

interface PeerCardPeer {
  user_id: string;
  is_mentor: boolean;
  profiles: {
    id?: string;
    full_name: string;
    avatar_url?: string | null;
    university?: string | null;
  };
}

interface Props {
  peer: PeerCardPeer;
  onMessage: () => void;
  onRequestMentor?: () => void;
}

export function PeerCard({ peer, onMessage, onRequestMentor }: Props) {
  const { profiles, is_mentor } = peer;

  return (
    <div className="rounded-2xl bg-card border border-border/60 shadow-sm p-4">
      {/* Avatar + info */}
      <div className="flex items-start gap-3">
        <Avatar
          name={profiles.full_name}
          src={profiles.avatar_url}
          className="h-12 w-12 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground truncate">{profiles.full_name}</span>
            {is_mentor && <MentorBadge />}
          </div>
          {profiles.university && (
            <p className="mt-0.5 text-xs text-muted-foreground truncate">{profiles.university}</p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onMessage}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-background py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <MessageCircle size={14} />
          Message
        </button>

        {is_mentor && onRequestMentor && (
          <button
            type="button"
            onClick={onRequestMentor}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            Request mentor
          </button>
        )}
      </div>
    </div>
  );
}
