import { PageHeader } from "@/components/admin/page-header";
import { TeamPanel } from "@/components/admin/team-panel";
import { requireRole } from "@/lib/auth";
import { listTeamMembers } from "@/lib/admin/team";

export default async function TeamPage() {
  const profile = await requireRole("owner", "/admin/zespol");
  const members = await listTeamMembers();

  return (
    <div className="space-y-6">
      <PageHeader title="Zespół" />
      <TeamPanel members={members} currentUserId={profile.id} />
    </div>
  );
}
