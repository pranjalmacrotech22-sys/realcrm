import { getProperties } from "@/lib/data/store";
import { PropertyListView } from "@/components/properties/property-list-view";

export default async function PropertiesPage() {
  const { properties, total } = await getProperties({ limit: 100 });

  return <PropertyListView initialProperties={properties} totalCount={total} />;
}
