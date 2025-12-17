import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Search, Pencil, Trash2, Calendar, Play } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { TrailerDialog } from "@/components/admin/TrailerDialog";
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

export default function Upcoming() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [releaseToDelete, setReleaseToDelete] = useState<any>(null);
  const [trailerDialogOpen, setTrailerDialogOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<any>(null);

  const { data: releases, isLoading } = useQuery({
    queryKey: ["upcoming_releases", typeFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("upcoming_releases")
        .select("*")
        .order("release_date", { ascending: true });

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
        .from("upcoming_releases")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Release deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["upcoming_releases"] });
      setDeleteDialogOpen(false);
      setReleaseToDelete(null);
    },
    onError: (error: Error) => {
      toast.error("Failed to delete release: " + error.message);
    },
  });

  const handleAddNew = () => {
    navigate("/admin/upcoming/create");
  };

  const handleEdit = (release: any) => {
    navigate(`/admin/upcoming/edit/${release.id}`);
  };

  const handleDeleteClick = (release: any) => {
    setReleaseToDelete(release);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (releaseToDelete) {
      deleteMutation.mutate(releaseToDelete.id);
    }
  };

  const handlePosterClick = async (release: any) => {
    // If status is released, navigate to detail page
    if (release.status === "released" && release.tmdb_id) {
      try {
        // Look up the actual media ID based on TMDB ID
        let mediaId = null;
        
        if (release.type === "Movie") {
          const { data: movie } = await supabase
            .from("movies")
            .select("id")
            .eq("tmdb_id", release.tmdb_id)
            .single();
          mediaId = movie?.id;
          if (mediaId) navigate(`/watch/movie/${mediaId}`);
        } else if (release.type === "Series") {
          const { data: series } = await supabase
            .from("series")
            .select("id")
            .eq("tmdb_id", release.tmdb_id)
            .single();
          mediaId = series?.id;
          if (mediaId) navigate(`/watch/series/${mediaId}`);
        } else if (release.type === "Anime") {
          const { data: anime } = await supabase
            .from("animes")
            .select("id")
            .eq("tmdb_id", release.tmdb_id)
            .single();
          mediaId = anime?.id;
          if (mediaId) navigate(`/anime/${mediaId}`);
        }

        if (!mediaId) {
          toast.error("Media not found in database");
        }
      } catch (error) {
        console.error("Error finding media:", error);
        toast.error("Failed to navigate to media");
      }
    } else {
      // For announced or coming_soon, show trailer dialog
      setSelectedRelease(release);
      setTrailerDialogOpen(true);
    }
  };

  const filteredReleases = releases?.filter((release) =>
    release.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "announced":
        return "secondary";
      case "coming_soon":
        return "default";
      case "released":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "movie":
        return "bg-blue-500";
      case "series":
        return "bg-purple-500";
      case "anime":
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
            <h1 className="text-3xl font-bold tracking-tight">Upcoming Releases</h1>
            <p className="text-muted-foreground">
              Manage upcoming movies, series, and anime releases
            </p>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Release
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search releases..."
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
                  <SelectItem value="movie">Movies</SelectItem>
                  <SelectItem value="series">Series</SelectItem>
                  <SelectItem value="anime">Anime</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="announced">Announced</SelectItem>
                  <SelectItem value="coming_soon">Coming Soon</SelectItem>
                  <SelectItem value="released">Released</SelectItem>
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
                {releases?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Total Releases</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {releases?.filter(r => r.type === 'movie').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Movies</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {releases?.filter(r => r.type === 'series').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Series</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {releases?.filter(r => r.status === 'coming_soon').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Coming Soon</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <TableSkeleton rows={8} columns={7} showCheckbox={false} showImage />
            ) : filteredReleases && filteredReleases.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Poster</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Genre</TableHead>
                    <TableHead>Release Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Trailer</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReleases.map((release) => (
                    <TableRow key={release.id}>
                      <TableCell>
                        <div 
                          onClick={() => handlePosterClick(release)}
                          className="relative cursor-pointer group"
                        >
                          {release.thumbnail ? (
                            <div className="relative">
                              <img
                                src={release.thumbnail}
                                alt={release.title}
                                className="w-12 h-16 object-cover rounded"
                                onError={(e) => {
                                  e.currentTarget.src = '';
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="w-4 h-4 text-white" fill="white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                              No poster
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{release.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getTypeColor(release.type)}`} />
                          <span className="capitalize">{release.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {release.genre || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {release.release_date ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {format(new Date(release.release_date), "MMM d, yyyy")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">TBA</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(release.status)}>
                          {release.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {release.trailer_url ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRelease(release);
                              setTrailerDialogOpen(true);
                            }}
                            className="gap-2"
                          >
                            <Play className="h-3 w-3" />
                            Watch
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">No trailer</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(release)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(release)}
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
                <p className="text-muted-foreground mb-4">No upcoming releases found</p>
                <Button onClick={handleAddNew} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Release
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trailer Dialog */}
      <TrailerDialog
        open={trailerDialogOpen}
        onOpenChange={setTrailerDialogOpen}
        title={selectedRelease?.title || ""}
        trailerUrl={selectedRelease?.trailer_url || null}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{releaseToDelete?.title}" from upcoming releases.
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
