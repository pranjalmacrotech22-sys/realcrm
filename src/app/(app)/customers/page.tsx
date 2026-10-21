import { getCustomers } from "@/lib/data/store";
import { CustomerListView } from "@/components/customers/customer-list-view";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return <CustomerListView initialCustomers={customers} />;
}
