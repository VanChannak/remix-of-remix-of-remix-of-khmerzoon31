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

export function SeriesTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: seriesList = [], isLoading } = useQuery({
    queryKey: ["series"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("series")
        .delete()
        .eq("id", id)
        .select();
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error("Series was not deleted. You may not have permission.");
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
      toast.success("Series deleted successfully!");
    },
    onError: (error) => {
      toast.error("Failed to delete series: " + error.message);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data, error } = await supabase
        .from("series")
        .delete()
        .in("id", ids)
        .select();
      
      if (error) throw error;
      
      // Check if any rows were actually deleted
      if (!data || data.length === 0) {
        throw new Error("No series were deleted. You may not have permission to delete these items.");
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
      setSelectedIds([]);
      toast.success(`Successfully deleted ${data.length} series!`);
    },
    onError: (error) => {
      toast.error("Failed to delete series: " + error.message);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("series")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
      toast.success("Status updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to update status: " + error.message);
    },
  });

  const updateAccessMutation = useMutation({
    mutationFn: async ({ id, access }: { id: string; access: 'free' | 'rent' | 'vip' }) => {
      // Update series access
      const { error } = await supabase
        .from("series")
        .update({ access })
        .eq("id", id);
      if (error) throw error;

      // Cascade update to all episodes
      const { data: seasonsData } = await supabase
        .from("seasons")
        .select("id")
        .eq("media_id", id);

      if (seasonsData && seasonsData.length > 0) {
        const seasonIds = seasonsData.map(s => s.id);
        
        const { error: episodesError } = await supabase
          .from("episodes")
          .update({ access })
          .in("season_id", seasonIds);

        if (episodesError) throw episodesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
      toast.success("Access type updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to update access type: " + error.message);
    },
  });

  const filteredSeries = seriesList.filter((series) =>
    series.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (id: string) => {
    navigate(`/admin/series/edit/${id}`);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this series?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} series with all their seasons and episodes?`)) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredSeries.map(s => s.id));
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
          {isLoading ? (
            <TableSkeleton rows={8} columns={10} showCheckbox showImage />
          ) : filteredSeries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No series found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === filteredSeries.length && filteredSeries.length > 0}
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
                {filteredSeries.map((series) => (
                  <TableRow key={series.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(series.id)}
                        onCheckedChange={(checked) => handleSelectOne(series.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      {series.thumbnail ? (
                        <img
                          src={series.thumbnail}
                          alt={series.title}
                          className="h-16 w-12 object-cover rounded"
                        />
                      ) : (
                        <div className="h-16 w-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {series.tmdb_id || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {series.imdb_id || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {series.views?.toLocaleString() || "0"}
                    </TableCell>
                    <TableCell className="font-medium">{series.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        ⭐ {series.rating || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Pin className="h-3 w-3" />
                        {series.pinned ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={series.status || "published"}
                        onValueChange={(value) => updateStatusMutation.mutate({ id: series.id, status: value })}
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
                        value={series.access || "free"}
                        onValueChange={(value) => updateAccessMutation.mutate({ id: series.id, access: value as 'free' | 'rent' | 'vip' })}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="rent">Rent</SelectItem>
                          <SelectItem value="vip">VIP</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(series.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(series.id)}
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
    </div>
  );
}
