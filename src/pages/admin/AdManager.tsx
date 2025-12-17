import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Pencil, Trash2, BarChart3 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AdPreviewToggle } from "@/components/admin/AdPreviewToggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function AdManager() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("manual");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const queryClient = useQueryClient();

  const { data: ads, isLoading } = useQuery({
    queryKey: ["ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      toast.success("Ad deleted successfully");
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete ad");
    },
  });

  const filteredAds = ads?.filter((ad) => {
    const matchesSearch = ad.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = ad.ad_type === activeTab;
    const matchesPreview = !isPreviewMode || !ad.is_active;
    return matchesSearch && matchesTab && matchesPreview;
  });

  const renderAdTable = () => {
    if (isLoading) return <TableSkeleton />;

    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Title</TableHead>
              {activeTab === "manual" && (
                <>
                  <TableHead>Image Type</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Format</TableHead>
                </>
              )}
              {activeTab === "video" && (
                <>
                  <TableHead>Video Type</TableHead>
                  <TableHead>Placement</TableHead>
                </>
              )}
              <TableHead>Impressions</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAds?.map((ad) => {
              const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : "0.00";
              return (
                <TableRow key={ad.id}>
                  <TableCell>
                    <img 
                      src={ad.image_url || '/placeholder.svg'} 
                      alt={ad.title}
                      className="w-16 h-10 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{ad.title}</TableCell>
                  {activeTab === "manual" && (
                    <>
                      <TableCell className="capitalize">{ad.image_type || "-"}</TableCell>
                      <TableCell className="capitalize">{ad.device || "-"}</TableCell>
                      <TableCell className="capitalize">{ad.ad_format || "-"}</TableCell>
                    </>
                  )}
                  {activeTab === "video" && (
                    <>
                      <TableCell className="capitalize">{ad.video_type || "-"}</TableCell>
                      <TableCell className="capitalize">{ad.placement?.replace('_', ' ') || "-"}</TableCell>
                    </>
                  )}
                  <TableCell>{ad.impressions?.toLocaleString() || 0}</TableCell>
                  <TableCell>{ad.clicks?.toLocaleString() || 0}</TableCell>
                  <TableCell>
                    <Badge variant={ad.is_active ? "default" : "secondary"}>
                      {ad.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/ad-manager/edit/${ad.id}`)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(ad.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Ad Manager</h1>
            <p className="text-muted-foreground">
              Manage advertisements and track performance
              {isPreviewMode && <Badge variant="secondary" className="ml-2">Preview Mode - Showing Inactive Ads</Badge>}
            </p>
          </div>
          <div className="flex gap-2">
            <AdPreviewToggle onPreviewChange={setIsPreviewMode} />
            <Button variant="outline" onClick={() => navigate("/admin/ad-analytics")}>
              <BarChart3 className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
            <Button onClick={() => navigate(`/admin/ad-manager/create?type=${activeTab}`)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Advertisement
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="manual">Manual Ads</TabsTrigger>
            <TabsTrigger value="adsense">AdSense</TabsTrigger>
            <TabsTrigger value="video">Video Advertisements</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search manual ads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {renderAdTable()}
          </TabsContent>

          <TabsContent value="adsense" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search AdSense ads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {renderAdTable()}
          </TabsContent>

          <TabsContent value="video" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search video ads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {renderAdTable()}
          </TabsContent>
        </Tabs>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Advertisement</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this ad? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
