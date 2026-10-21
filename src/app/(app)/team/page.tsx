import { getTeamMembers } from "@/lib/data/store";
import { TeamManagementView } from "@/components/team/team-management-view";

export default async function TeamPage() {
  const members = await getTeamMembers();

  return <TeamManagementView initialMembers={members} />;
}
