import { AdminPanel } from "@/components/features/admin/admin-panel";
import { PageHeader } from "@/components/layout/page-header";

export function AdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Moderation and platform health"
        description="Frontend gate is present, while the accompanying SQL migration enforces role checks with security-definer helpers."
      />
      <AdminPanel />
    </div>
  );
}
