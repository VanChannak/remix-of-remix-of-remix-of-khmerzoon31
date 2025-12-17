import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Search, Pencil, Trash2, Film, Pin, Users, Download } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AnimeDialog } from "@/components/admin/AnimeDialog";
import { AnimeImportDialog } from "@/components/admin/AnimeImportDialog";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
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

export default function Animes() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [animeToDelete, setAnimeToDelete] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: animes, isLoading } = useQuery({
    queryKey: ["animes", typeFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("animes")
        .select("*")
        .order("created_at", { ascending: false });

      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("animes")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Anime deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["animes"] });
      setDeleteDialogOpen(false);
      setAnimeToDelete(null);
    },
    onError: (error: Error) => {
      toast.error("Failed to delete anime: " + error.message);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("animes")
        .delete()
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Successfully deleted ${selectedIds.length} animes!`);
      queryClient.invalidateQueries({ queryKey: ["animes"] });
      setSelectedIds([]);
    },
    onError: (error: Error) => {
      toast.error("Failed to delete animes: " + error.message);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("animes")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["animes"] });
      toast.success("Status updated successfully!");
    },
    onError: (error: Error) => {
      toast.error("Failed to update status: " + error.message);
    },
  });

  const updateVersionMutation = useMutation({
    mutationFn: async ({ id, version }: { id: string; version: string }) => {
      const { error } = await supabase
        .from("animes")
        .update({ version })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["animes"] });
      toast.success("Version updated successfully!");
    },
    onError: (error: Error) => {
      toast.error("Failed to update version: " + error.message);
    },
  });

  const handleAddNew = () => {
    setSelectedAnime(null);
    setDialogOpen(true);
  };

  const handleEdit = (anime: any) => {
    navigate(`/admin/animes/edit/${anime.id}`);
  };

  const handleDeleteClick = (anime: any) => {
    setAnimeToDelete(anime);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (animeToDelete) {
      deleteMutation.mutate(animeToDelete.id);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} animes?`)) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredAnimes.map(a => a.id));
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

  const filteredAnimes = animes?.filter((anime) =>
    anime.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "tv":
        return "bg-blue-500";
      case "movie":
        return "bg-purple-500";
      case "ova":
        return "bg-green-500";
      case "ona":
        return "bg-orange-500";
      case "special":
        return "bg-pink-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Anime Management</h1>
            <p className="text-muted-foreground">
              Manage your anime content library
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Download className="mr-2 h-4 w-4" />
              Import from AniList
            </Button>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Anime
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search anime..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="tv">TV Series</SelectItem>
                  <SelectItem value="movie">Movie</SelectItem>
                  <SelectItem value="ova">OVA</SelectItem>
                  <SelectItem value="ona">ONA</SelectItem>
                  <SelectItem value="special">Special</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {animes?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Total Anime</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {animes?.filter(a => a.type === 'tv').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">TV Series</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {animes?.filter(a => a.type === 'movie').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Movies</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {animes?.filter(a => a.pinned).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Pinned</p>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {selectedIds.length} Selected
            </Button>
          </div>
        )}

        {/* Table */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <TableSkeleton rows={8} columns={11} showCheckbox showImage />
            ) : filteredAnimes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.length === filteredAnimes.length && filteredAnimes.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Cover</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Studio</TableHead>
                    <TableHead>Episodes</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Pinned</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnimes.map((anime) => (
                    <TableRow key={anime.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(anime.id)}
                          onCheckedChange={(checked) => handleSelectOne(anime.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        {anime.thumbnail ? (
                          <img
                            src={anime.thumbnail}
                            alt={anime.title}
                            className="w-12 h-16 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                            <Film className="h-4 w-4" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {anime.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getTypeColor(anime.type)}`} />
                          <span className="capitalize text-sm">{anime.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {anime.studio || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {anime.episodes_count || 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          ⭐ <span className="text-sm">{anime.rating || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {anime.views?.toLocaleString() || "0"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Pin className="h-3 w-3" />
                          {anime.pinned ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={anime.status || "published"}
                          onValueChange={(value) => updateStatusMutation.mutate({ id: anime.id, status: value })}
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
                          value={anime.version || "Free"}
                          onValueChange={(value) => updateVersionMutation.mutate({ id: anime.id, version: value })}
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
                            onClick={() => navigate(`/admin/animes/${anime.id}/characters`)}
                            title="Manage Characters"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(anime)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(anime)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No anime found</p>
                <Button onClick={handleAddNew} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Anime
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <AnimeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        anime={selectedAnime}
      />

      {/* Import Dialog */}
      <AnimeImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{animeToDelete?.title}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
