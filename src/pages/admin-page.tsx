import { AdminPanel } from "@/components/features/admin/admin-panel";
import { PageHeader } from "@/components/layout/page-header";

export function AdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin CRM"
        title="Platform management"
        description="Review listings, verify landlords, and manage accounts."
      />
      <AdminPanel />
    </div>
  );
}
