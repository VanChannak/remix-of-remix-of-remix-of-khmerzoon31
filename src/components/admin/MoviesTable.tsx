import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TableSkeleton } from "./TableSkeleton";

export function MoviesTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: moviesList = [], isLoading } = useQuery({
    queryKey: ["movies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("movies")
        .delete()
        .eq("id", id)
        .select();
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error("Movie was not deleted. You may not have permission.");
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      toast.success("Movie deleted successfully!");
    },
    onError: (error) => {
      toast.error("Failed to delete movie: " + error.message);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data, error } = await supabase
        .from("movies")
        .delete()
        .in("id", ids)
        .select();
      
      if (error) throw error;
      
      // Check if any rows were actually deleted
      if (!data || data.length === 0) {
        throw new Error("No movies were deleted. You may not have permission to delete these items.");
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      setSelectedIds([]);
      toast.success(`Successfully deleted ${data.length} movies!`);
    },
    onError: (error) => {
      toast.error("Failed to delete movies: " + error.message);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("movies")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      toast.success("Status updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to update status: " + error.message);
    },
  });

  const updateVersionMutation = useMutation({
    mutationFn: async ({ id, version }: { id: string; version: string }) => {
      const { error } = await supabase
        .from("movies")
        .update({ version })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      toast.success("Version updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to update version: " + error.message);
    },
  });

  const filteredMovies = moviesList.filter((movie) =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (id: string) => {
    navigate(`/admin/movies/edit/${id}`);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this movie?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} movies?`)) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredMovies.map(m => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search now"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        {selectedIds.length > 0 && (
          <Button 
            variant="destructive" 
            onClick={handleBulkDelete}
            disabled={bulkDeleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete {selectedIds.length} Selected
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.length === filteredMovies.length && filteredMovies.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Cover</TableHead>
                <TableHead>TMDB ID</TableHead>
                <TableHead>IMDB ID</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Vote</TableHead>
                <TableHead>Pinned</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Version</TableHead>
                <TableHead className="text-right">Options</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovies.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No movies found.
                  </TableCell>
                </TableRow>
              ) : !isLoading ? (
                filteredMovies.map((movie) => (
                  <TableRow key={movie.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(movie.id)}
                        onCheckedChange={(checked) => handleSelectOne(movie.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      {movie.thumbnail ? (
                        <img
                          src={movie.thumbnail}
                          alt={movie.title}
                          className="h-16 w-12 object-cover rounded"
                        />
                      ) : (
                        <div className="h-16 w-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {movie.tmdb_id || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {movie.imdb_id || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {movie.views?.toLocaleString() || "0"}
                    </TableCell>
                    <TableCell className="font-medium">{movie.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        ⭐ {movie.rating || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Pin className="h-3 w-3" />
                        {movie.pinned ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={movie.status || "published"}
                        onValueChange={(value) => updateStatusMutation.mutate({ id: movie.id, status: value })}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="published">Public</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="on_air">On Air</SelectItem>
                          <SelectItem value="ended">Ended</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={movie.version || "Free"}
                        onValueChange={(value) => updateVersionMutation.mutate({ id: movie.id, version: value })}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Free">Free</SelectItem>
                          <SelectItem value="Rent">Rent</SelectItem>
                          <SelectItem value="VIP">VIP</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(movie.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(movie.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : null}
            </TableBody>
          </Table>
          {isLoading && (
            <div className="p-0">
              <TableSkeleton rows={8} columns={10} showCheckbox showImage />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
