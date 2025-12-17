import { AdminLayout } from "@/components/admin/AdminLayout";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CastMember {
  id: string;
  actor_name: string;
  character_name: string | null;
  profile_url: string | null;
  order_index: number | null;
  media_id: string | null;
  media_type: "movie" | "series";
  media_title?: string;
}

export default function Casters() {
  const navigate = useNavigate();
  const [castMembers, setCastMembers] = useState<CastMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [castToDelete, setCastToDelete] = useState<CastMember | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCastMembers();
  }, []);

  const fetchCastMembers = async () => {
    try {
      setLoading(true);
      
      const { data: movieCast } = await supabase
        .from("movie_cast" as any)
        .select("*")
        .order("order_index", { ascending: true }) as any;

      const { data: seriesCast } = await supabase
        .from("series_cast" as any)
        .select("*")
        .order("order_index", { ascending: true });

      const movieIds = movieCast?.map((c: any) => c.movie_id).filter(Boolean) || [];
      const seriesIds = seriesCast?.map((c: any) => c.series_id).filter(Boolean) || [];

      const moviesDataPromise = movieIds.length > 0
        ? supabase.from("movies").select("id, title").in("id", movieIds)
        : Promise.resolve({ data: [] });
      
      const seriesDataPromise = seriesIds.length > 0
        ? supabase.from("series").select("id, title").in("id", seriesIds)
        : Promise.resolve({ data: [] });

      const [moviesData, seriesData] = await Promise.all([
        moviesDataPromise,
        seriesDataPromise,
      ]);

      const moviesMap = new Map((moviesData.data || []).map((m: any) => [m.id, m.title]));
      const seriesMap = new Map((seriesData.data || []).map((s: any) => [s.id, s.title]));

      const formattedMovieCast: CastMember[] = (movieCast || []).map((cast: any) => ({
        id: cast.id,
        actor_name: cast.actor_name,
        character_name: cast.character_name,
        profile_url: cast.profile_url,
        order_index: cast.order_index,
        media_id: cast.movie_id,
        media_type: "movie" as const,
        media_title: moviesMap.get(cast.movie_id || "") as string,
      }));

      const formattedSeriesCast: CastMember[] = (seriesCast || []).map((cast: any) => ({
        id: cast.id,
        actor_name: cast.actor_name,
        character_name: cast.character_name,
        profile_url: cast.profile_url,
        order_index: cast.order_index,
        media_id: cast.series_id,
        media_type: "series" as const,
        media_title: seriesMap.get(cast.series_id || "") as string,
      }));

      setCastMembers([...formattedMovieCast, ...formattedSeriesCast]);
    } catch (error) {
      console.error("Error fetching cast members:", error);
      toast({
        title: "Error",
        description: "Failed to fetch cast members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!castToDelete) return;

    try {
      const table = castToDelete.media_type === "movie" ? "movie_cast" : "series_cast";
      const { error } = await supabase.from(table as any).delete().eq("id", castToDelete.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Cast member deleted successfully",
      });

      fetchCastMembers();
      setDeleteDialogOpen(false);
      setCastToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete cast member",
        variant: "destructive",
      });
    }
  };

  const filteredCastMembers = castMembers.filter((cast) =>
    cast.actor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cast.character_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cast.media_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Cast Management</h1>
            <p className="text-muted-foreground">
              Manage actors and crew for movies and series
            </p>
          </div>
          <Button onClick={() => navigate("/admin/casters/edit/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Cast Member
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by actor, character, or media..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Actor</TableHead>
                  <TableHead>Character</TableHead>
                  <TableHead>Media</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCastMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No cast members found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCastMembers.map((cast) => (
                    <TableRow key={cast.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={cast.profile_url || undefined} alt={cast.actor_name} />
                            <AvatarFallback>
                              {cast.actor_name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{cast.actor_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{cast.character_name || "-"}</TableCell>
                      <TableCell>{cast.media_title || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={cast.media_type === "movie" ? "default" : "secondary"}>
                          {cast.media_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{cast.order_index ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/admin/casters/edit/${cast.id}`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCastToDelete(cast);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Cast Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {castToDelete?.actor_name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
