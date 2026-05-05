import { BadgeCheck, Globe2, Heart, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { VerificationUpload } from "@/components/features/verification/verification-upload";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useData } from "@/contexts/data-context";

export function ProfilePage() {
  const { snapshot } = useData();
  const isLandlord = snapshot.profile.user_type === "landlord";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title={snapshot.profile.full_name}
        description="Manage your student identity, trust signals, and accommodation preferences."
      />
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar
              name={snapshot.profile.full_name}
              src={snapshot.profile.avatar_url}
              className="h-20 w-20 text-xl"
            />
            <div>
              <h2 className="font-display text-3xl">{snapshot.profile.full_name}</h2>
              <p className="text-sm text-muted-foreground">{snapshot.profile.university}</p>
            </div>
          </div>
          <p className="text-muted-foreground">{snapshot.profile.bio}</p>
          <div className="flex flex-wrap gap-2">
            <Badge>{snapshot.profile.city}</Badge>
            <Badge>{snapshot.profile.user_type}</Badge>
            {snapshot.profile.is_verified_landlord && (
              <Badge className="bg-sky-500/10 text-sky-600">
                <ShieldCheck size={12} />
                Verified landlord
              </Badge>
            )}
            <Badge className="bg-success/15 text-accent">
              <ShieldCheck size={12} />
              GDPR complete
            </Badge>
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Profile completion</p>
              <span className="text-sm text-muted-foreground">88%</span>
            </div>
            <Progress value={88} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                icon: BadgeCheck,
                title: "Identity",
                copy: "Student role, university, and city stored on your profile."
              },
              {
                icon: Globe2,
                title: "Language",
                copy: "English and Greek are available through the context-based i18n system."
              },
              {
                icon: Heart,
                title: "Saved homes",
                copy: `${snapshot.savedProperties.length} shortlisted properties ready for comparison.`
              },
              {
                icon: ShieldCheck,
                title: "Verification",
                copy: isLandlord
                  ? "Upload your ID and selfie below to get your verified badge."
                  : "Landlord identity uploads route through a moderated verification flow."
              }
            ].map((item) => (
              <div key={item.title} className="rounded-[1.5rem] bg-muted/40 p-4">
                <item.icon className="text-primary" size={18} />
                <p className="mt-3 font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.copy}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {isLandlord && <VerificationUpload />}
    </div>
  );
}
