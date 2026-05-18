import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, PlusCircle } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { TicketRow } from "@/features/help/components/TicketRow";
import { fetchMyTickets } from "@/features/help/api/help-api";

export function MyTicketsPage() {
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["help", "my-tickets"],
    queryFn:  fetchMyTickets,
    staleTime: 60 * 1000,
  });

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader
        variant="sub-page"
        title="My Tickets"
        universalSearch={false}
        right={{
          type: "custom",
          element: (
            <Link
              to="/profile/help/contact"
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              <PlusCircle size={13} />
              New
            </Link>
          ),
        }}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-5 pb-32 space-y-3">
          {isLoading && (
            <div className="flex justify-center py-10">
              <Loader2 size={22} className="animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && tickets.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-muted-foreground">No support tickets yet.</p>
              <Link
                to="/profile/help/contact"
                className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Contact support
              </Link>
            </div>
          )}

          {tickets.map((t) => (
            <TicketRow key={t.id} ticket={t} />
          ))}
        </div>
      </div>
    </div>
  );
}
