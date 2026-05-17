import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { UserX } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/contexts/auth-context";
import {
  useHouseholdMembers, useLeaveHousehold, useRemoveMember, useHousehold,
} from "@/hooks/use-household";
import { MemberAvatar } from "@/components/features/household/MemberAvatar";
import { getMemberName } from "@/lib/household-utils";
import { InviteCodeDisplay } from "@/components/features/household/InviteCodeDisplay";
import { useRegenerateInviteCode } from "@/hooks/use-household";

export function MembersPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: household } = useHousehold(id);
  const { data: members = [], isLoading } = useHouseholdMembers(id);
  const { mutateAsync: leave, isPending: leaving } = useLeaveHousehold(id!);
  const { mutateAsync: remove } = useRemoveMember(id!);
  const { mutateAsync: regen, isPending: regenerating } = useRegenerateInviteCode(id!);

  const myRole = members.find((m) => m.user_id === user?.id)?.role;
  const isOwnerOrAdmin = myRole === "owner" || myRole === "admin";

  async function handleLeave() {
    if (!user || !id) return;
    if (!confirm("Leave this household?")) return;
    try {
      await leave(user.id);
      toast.success("You left the household.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleRemove(uid: string) {
    if (!confirm("Remove this member?")) return;
    try {
      await remove(uid);
      toast.success("Member removed.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title="Members" />
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Members list */}
        <div className="space-y-2">
          {isLoading && (
            <div className="flex justify-center py-6">
              <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-3 rounded-2xl bg-background/70 dark:bg-slate-800/60 p-3.5">
              <MemberAvatar member={m} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{getMemberName(m)}</p>
                <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
              </div>
              {isOwnerOrAdmin && m.user_id !== user?.id && (
                <button
                  type="button"
                  onClick={() => handleRemove(m.user_id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <UserX size={15} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Invite code */}
        {household && (
          <InviteCodeDisplay
            code={household.invite_code}
            onRegenerate={isOwnerOrAdmin ? async () => {
              try { await regen(); toast.success("New code generated!"); }
              catch (err) { toast.error((err as Error).message); }
            } : undefined}
            regenerating={regenerating}
          />
        )}

        {/* Leave */}
        <button
          type="button"
          onClick={handleLeave}
          disabled={leaving}
          className="w-full rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-3 text-sm font-semibold text-destructive active:scale-[0.97] transition-transform disabled:opacity-50"
        >
          {leaving ? "Leaving…" : "Leave Household"}
        </button>
      </div>
    </div>
  );
}
