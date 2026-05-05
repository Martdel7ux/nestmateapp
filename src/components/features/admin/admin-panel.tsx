import { useState } from "react";
import { CheckCircle2, Flag, Home, ShieldCheck, Users2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/contexts/data-context";
import { formatCompactNumber } from "@/lib/utils";

export function AdminPanel() {
  const {
    snapshot,
    approveFlatmate,
    approveProperty,
    approveVerification,
    rejectVerification
  } = useData();

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const pendingProperties = snapshot.featuredProperties.filter((p) => !p.is_approved);
  const pendingFlatmates = snapshot.flatmates.filter((f) => !f.is_approved);
  const pendingVerifications = snapshot.verifications.filter(
    (v) => v.verification_status === "pending"
  );

  const handleReject = (landlordId: string) => {
    rejectVerification(landlordId, rejectReason || "Documents did not meet requirements.");
    setRejectingId(null);
    setRejectReason("");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          {
            label: "Total users",
            value: formatCompactNumber(snapshot.stats.totalUsers),
            icon: Users2
          },
          {
            label: "Properties",
            value: formatCompactNumber(snapshot.stats.totalProperties),
            icon: Home
          },
          {
            label: "Matches",
            value: formatCompactNumber(snapshot.stats.totalMatches),
            icon: ShieldCheck
          },
          {
            label: "Active listings",
            value: formatCompactNumber(snapshot.stats.activeListings),
            icon: CheckCircle2
          }
        ].map((item) => (
          <Card key={item.label} className="space-y-2">
            <item.icon className="text-primary" />
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="text-3xl font-bold">{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl">Property approvals</h3>
            <Badge>{pendingProperties.length} pending</Badge>
          </div>
          {(pendingProperties.length ? pendingProperties : snapshot.featuredProperties.slice(0, 2)).map(
            (property) => (
              <div key={property.id} className="rounded-[1.5rem] bg-muted/40 p-4">
                <p className="font-semibold">{property.title}</p>
                <p className="text-sm text-muted-foreground">{property.city}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => approveProperty(property.id, true)}>
                    <CheckCircle2 size={14} />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => approveProperty(property.id, false)}
                  >
                    <XCircle size={14} />
                    Reject
                  </Button>
                </div>
              </div>
            )
          )}
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl">Flatmate approvals</h3>
            <Badge>{pendingFlatmates.length} pending</Badge>
          </div>
          {(pendingFlatmates.length ? pendingFlatmates : snapshot.flatmates).map((flatmate) => (
            <div key={flatmate.id} className="rounded-[1.5rem] bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{flatmate.profile?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{flatmate.preferred_city}</p>
                </div>
                <Flag size={16} className="text-amber-500" />
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => approveFlatmate(flatmate.id, true)}>
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => approveFlatmate(flatmate.id, false)}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl">Landlord verifications</h3>
          <Badge className={pendingVerifications.length ? "bg-amber-500/15 text-amber-600" : ""}>
            {pendingVerifications.length} pending
          </Badge>
        </div>

        {snapshot.verifications.length === 0 && (
          <p className="text-sm text-muted-foreground">No verification requests yet.</p>
        )}

        {snapshot.verifications.map((verif) => (
          <div key={verif.id} className="rounded-[1.5rem] bg-muted/40 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{verif.profile?.full_name ?? "Landlord"}</p>
                <p className="text-sm text-muted-foreground">{verif.profile?.city}</p>
              </div>
              <Badge
                className={
                  verif.verification_status === "approved"
                    ? "bg-sky-500/10 text-sky-600"
                    : verif.verification_status === "rejected"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-amber-500/10 text-amber-600"
                }
              >
                {verif.verification_status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">ID Card</p>
                <img
                  src={verif.id_document_url}
                  alt="ID document"
                  className="h-28 w-full rounded-xl object-cover"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Selfie</p>
                <img
                  src={verif.selfie_url}
                  alt="Selfie"
                  className="h-28 w-full rounded-xl object-cover"
                />
              </div>
            </div>

            {verif.admin_notes && (
              <p className="text-sm text-destructive">Rejection reason: {verif.admin_notes}</p>
            )}

            {verif.verification_status === "pending" && (
              <>
                {rejectingId === verif.landlord_id ? (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Reason for rejection (optional)"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => handleReject(verif.landlord_id)}
                      >
                        <XCircle size={14} />
                        Confirm Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRejectingId(null);
                          setRejectReason("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approveVerification(verif.landlord_id)}>
                      <CheckCircle2 size={14} />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRejectingId(verif.landlord_id)}
                    >
                      <XCircle size={14} />
                      Reject
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
