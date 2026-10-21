import {
  Organization,
  Property,
  Customer,
  Requirement,
  FollowUp,
  Activity,
  Membership,
} from "@/types";

export const DEFAULT_WORKSPACE_ID = "workspace-default";

export const initialOrganization: Organization = {
  id: DEFAULT_WORKSPACE_ID,
  name: "My Real Estate Workspace",
  slug: "my-workspace",
  status: "active",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// No pre-populated demo records - fresh workspace for every registered organization
export const initialMemberships: Membership[] = [];
export const initialProperties: Property[] = [];
export const initialCustomers: Customer[] = [];
export const initialRequirements: Requirement[] = [];
export const initialFollowUps: FollowUp[] = [];
export const initialActivities: Activity[] = [];
