import { notFound } from "next/navigation";
import { getPropertyById } from "@/lib/data/store";
import { PropertyForm } from "@/components/properties/property-form";

interface EditPropertyPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPropertyPage({ params }: EditPropertyPageProps) {
  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property) {
    notFound();
  }

  return <PropertyForm initialData={property} isEditing={true} />;
}
