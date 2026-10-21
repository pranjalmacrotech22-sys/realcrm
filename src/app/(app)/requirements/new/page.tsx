import { getCustomers } from "@/lib/data/store";
import { RequirementForm } from "@/components/requirements/requirement-form";

interface NewRequirementPageProps {
  searchParams: Promise<{ customerId?: string }>;
}

export default async function NewRequirementPage({ searchParams }: NewRequirementPageProps) {
  const { customerId } = await searchParams;
  const customers = await getCustomers();

  return <RequirementForm customers={customers} defaultCustomerId={customerId} />;
}
