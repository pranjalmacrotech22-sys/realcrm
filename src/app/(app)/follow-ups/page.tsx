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

  const [followUps, customers, { properties }, requirements] = await Promise.all([
    getFollowUps(),
    getCustomers(),
    getProperties({ limit: 100 }),
    getRequirements(),
  ]);

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
