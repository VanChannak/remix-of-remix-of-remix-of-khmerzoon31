import { AdminLayout } from "@/components/admin/AdminLayout";

export default function Headers() {
  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Headers & User Agents</h1>
        <p className="text-muted-foreground">Manage HTTP headers and user agent configurations.</p>
      </div>
    </AdminLayout>
  );
}
