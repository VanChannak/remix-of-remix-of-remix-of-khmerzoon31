import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { FeaturedDialog } from "./FeaturedDialog";
import { TableSkeleton } from "./TableSkeleton";

interface FeaturedItem {
  id: string;
  media_id: string;
  media_type: string;
  display_order: number;
  title?: string;
  thumbnail?: string;
}

export function FeaturedTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FeaturedItem | null>(null);
  const queryClient = useQueryClient();

  const { data: featuredItems, isLoading } = useQuery({
    queryKey: ["featured-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("featured_content")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;

      // Fetch media details for each featured item
      const itemsWithDetails = await Promise.all(
        data.map(async (item) => {
          let mediaData = null;
          
          if (item.media_type === "movie") {
            const { data: movie } = await supabase
              .from("movies")
              .select("title, thumbnail")
              .eq("id", item.media_id)
              .single();
            mediaData = movie;
          } else if (item.media_type === "series") {
            const { data: series } = await supabase
              .from("series")
              .select("title, thumbnail")
              .eq("id", item.media_id)
              .single();
            mediaData = series;
          } else if (item.media_type === "anime") {
            const { data: anime } = await supabase
              .from("animes")
              .select("title, thumbnail")
              .eq("id", item.media_id)
              .single();
            mediaData = anime;
          }

          return {
            ...item,
            title: mediaData?.title || "Unknown",
            thumbnail: mediaData?.thumbnail || "",
          };
        })
      );

      return itemsWithDetails;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("featured_content")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featured-content"] });
      toast.success("Featured item removed successfully");
    },
    onError: () => {
      toast.error("Failed to remove featured item");
    },
  });

  const handleEdit = (item: FeaturedItem) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to remove this featured item?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredItems = featuredItems?.filter((item) =>
    item.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search now"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleAdd}>Add Featured</Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cover</TableHead>
                <TableHead>Media Order</TableHead>
                <TableHead>Media ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Media Type</TableHead>
                <TableHead className="text-right">Options</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <TableSkeleton rows={5} columns={6} showImage />
                  </TableCell>
                </TableRow>
              ) : filteredItems && filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <img
                        src={item.thumbnail || "/placeholder.svg"}
                        alt={item.title}
                        className="w-16 h-20 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell>{item.display_order}</TableCell>
                    <TableCell className="font-mono text-xs">{item.media_id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell className="capitalize">{item.media_type}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No featured items found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <FeaturedDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
      />
    </>
  );
}
