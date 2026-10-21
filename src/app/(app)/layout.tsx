import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { NavProgressBar } from "@/components/layout/nav-progress-bar";
import { getSession } from "@/lib/auth/session";
import { setActiveWorkspace } from "@/lib/data/store";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const orgName = session?.organizationName || "My Real Estate Workspace";
  const userName = session?.name || "Broker";
  const userRole = session?.role || "Owner";

  const userEmail = session?.email || "broker@realcrm.io";
  const organizationId = session?.organizationId || "";

  if (session?.organizationId) {
    setActiveWorkspace(
      session.organizationId,
      session.organizationName,
      session.name,
      session.role
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Suspense fallback={null}>
        <NavProgressBar />
      </Suspense>
      <Sidebar
        organizationName={orgName}
        userName={userName}
        userRole={userRole}
        userEmail={userEmail}
        organizationId={organizationId}
      />
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen w-full">
        <Header organizationName={orgName} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
