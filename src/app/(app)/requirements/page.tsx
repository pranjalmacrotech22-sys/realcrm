import { getRequirements } from "@/lib/data/store";
import { RequirementListView } from "@/components/requirements/requirement-list-view";

export default async function RequirementsPage() {
  const requirements = await getRequirements();

  return <RequirementListView initialRequirements={requirements} />;
}
