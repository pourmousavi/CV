import { requireAuth } from '@/lib/session';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will redirect to login if not authenticated
  await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="ml-64">
        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
