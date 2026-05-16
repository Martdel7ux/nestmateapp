import { useState } from "react";
import { CheckCircle2, Lightbulb, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitSuggestion } from "@/hooks/use-suggestions";

interface Props {
  onClose: () => void;
}

export function SuggestEventModal({ onClose }: Props) {
  const [url,  setUrl]  = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  const mutation = useSubmitSuggestion();

  function handleSubmit() {
    mutation.mutate(
      { url, note },
      {
        onSuccess: () => setDone(true),
        onError:   (e) => alert(String(e)), // surface rate limit message
      }
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 z-50 max-w-md mx-auto -translate-y-1/2 overflow-hidden rounded-3xl bg-background shadow-card">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Lightbulb size={16} className="text-primary" />
            <h2 className="font-semibold">Suggest an event</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <X size={14} />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <CheckCircle2 size={36} className="text-emerald-500" />
            <p className="font-semibold">Thanks!</p>
            <p className="text-sm text-muted-foreground">
              We'll review it and add it if it's a good fit.
            </p>
            <Button onClick={onClose} className="mt-2">Close</Button>
          </div>
        ) : (
          <div className="space-y-4 px-5 py-5">
            <p className="text-sm text-muted-foreground">
              Know about an event that should be on NestMate? Share it with us!
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Event URL <span className="normal-case text-muted-foreground/70">(optional but helpful)</span>
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://eventbrite.com/… or Facebook event"
                className="w-full rounded-2xl border border-border bg-muted/30 px-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Note <span className="normal-case text-muted-foreground/70">(optional)</span>
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anything we should know? e.g. Saw this on Instagram, great for CS students"
                className="min-h-[80px] text-sm"
              />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Button
                onClick={handleSubmit}
                disabled={mutation.isPending || (!url.trim() && !note.trim())}
                className="flex-1"
              >
                {mutation.isPending
                  ? <><Loader2 size={14} className="animate-spin" /> Submitting…</>
                  : "Submit suggestion"}
              </Button>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
