import { AdminLayout } from "@/components/admin/AdminLayout";
import { FeaturedTable } from "@/components/admin/FeaturedTable";

export default function Featured() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Featured Content</h1>
          <p className="text-muted-foreground">Manage featured movies, series, and animes</p>
        </div>
        
        <FeaturedTable />
      </div>
    </AdminLayout>
  );
}
