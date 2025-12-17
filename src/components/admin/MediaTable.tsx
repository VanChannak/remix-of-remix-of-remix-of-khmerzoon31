import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Media, MediaType } from "@/pages/Admin";
import { MediaDialog } from "./MediaDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MediaTableProps {
  selectedType: "all" | MediaType;
}

const accessColors = {
  free: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  rent: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  vip: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
};

export function MediaTable({ selectedType }: MediaTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | undefined>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch media from Supabase
  const { data: mediaList = [], isLoading } = useQuery({
    queryKey: ["media"],
    queryFn: async () => {
      const [moviesResult, seriesResult] = await Promise.all([
        supabase.from("movies").select("*").order("created_at", { ascending: false }),
        supabase.from("series").select("*").order("created_at", { ascending: false }),
      ]);

      if (moviesResult.error) throw moviesResult.error;
      if (seriesResult.error) throw seriesResult.error;
      
      // Map database fields to Media interface
      const movies = (moviesResult.data || []).map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type as MediaType,
        access: item.access,
        genre: item.genre,
        releaseYear: item.release_year,
        rating: item.rating,
        price: item.price,
        thumbnail: item.thumbnail,
        description: item.description,
      }));

      const series = (seriesResult.data || []).map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type as MediaType,
        access: item.access,
        genre: item.genre,
        releaseYear: item.release_year,
        rating: item.rating,
        price: item.price,
        thumbnail: item.thumbnail,
        description: item.description,
      }));

      return [...movies, ...series] as Media[];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: MediaType }) => {
      const tableName = type === "movie" ? "movies" : "series";
      const { error } = await supabase.from(tableName).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      queryClient.invalidateQueries({ queryKey: ["series"] });
      toast.success("Media deleted successfully!");
    },
    onError: (error) => {
      toast.error("Failed to delete media: " + error.message);
    },
  });

  const filteredMedia = mediaList.filter(
    (media) => selectedType === "all" || media.type === selectedType
  );

  const handleAdd = () => {
    setEditingMedia(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (media: Media) => {
    if (media.type === "series") {
      navigate(`/admin/series/edit/${media.id}`);
    } else {
      setEditingMedia(media);
      setDialogOpen(true);
    }
  };

  const handleDelete = (media: Media) => {
    if (confirm("Are you sure you want to delete this media?")) {
      deleteMutation.mutate({ id: media.id, type: media.type });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {selectedType === "all"
              ? "All Content"
              : selectedType === "movie"
              ? "Movies"
              : "Series"}
          </CardTitle>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading media...
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No media found. Click "Add New" to create your first entry.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedia.map((media) => (
                <TableRow key={media.id}>
                  <TableCell className="font-medium">{media.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {media.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={accessColors[media.access]}>
                      {media.access.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{media.genre}</TableCell>
                  <TableCell>{media.releaseYear}</TableCell>
                  <TableCell>⭐ {media.rating}</TableCell>
                  <TableCell>
                    {media.price ? `$${media.price}` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(media)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(media)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      <MediaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        media={editingMedia}
      />
    </>
  );
}
