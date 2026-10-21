import {
  getFollowUps,
  getCustomers,
  getProperties,
  getRequirements,
} from "@/lib/data/store";
import { FollowUpView } from "@/components/follow-ups/follow-up-view";

interface FollowUpsPageProps {
  searchParams: Promise<{ newForCustomerId?: string; newForRequirementId?: string }>;
}

export default async function FollowUpsPage({ searchParams }: FollowUpsPageProps) {
  const { newForCustomerId, newForRequirementId } = await searchParams;

  const followUps = await getFollowUps();
  const customers = await getCustomers();
  const { properties } = await getProperties({ limit: 100 });
  const requirements = await getRequirements();

  return (
    <FollowUpView
      initialFollowUps={followUps}
      customers={customers}
      properties={properties}
      requirements={requirements}
      defaultCustomerId={newForCustomerId}
      defaultRequirementId={newForRequirementId}
    />
  );
}
