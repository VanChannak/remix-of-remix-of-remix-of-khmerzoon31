import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminStats } from "@/components/admin/AdminStats";
import { MediaTable } from "@/components/admin/MediaTable";

export type MediaType = "movie" | "series";
export type AccessType = "free" | "rent" | "vip";

export interface Media {
  id: string;
  title: string;
  type: MediaType;
  access: AccessType;
  genre: string;
  releaseYear: number;
  rating: number;
  price?: number;
  thumbnail: string;
  description: string;
}

const Admin = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Manage your movies and series content</p>
        </div>

        <AdminStats />
        
        <MediaTable selectedType="all" />
      </div>
    </AdminLayout>
  );
};

export default Admin;
