import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <div className="erp-shell">
      <Sidebar />
      <div className="erp-main">
        <Topbar email={user?.email} />
        <main className="erp-content">{children}</main>
      </div>
    </div>
  );
}
