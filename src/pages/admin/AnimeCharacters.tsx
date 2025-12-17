import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
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
import { Plus, ArrowLeft, Pencil, Trash2, Users, Download } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CharacterDialog } from "@/components/admin/CharacterDialog";
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

export default function AnimeCharacters() {
  const { id: animeId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<any>(null);
  const [isLoadingAniList, setIsLoadingAniList] = useState(false);

  const { data: anime } = useQuery({
    queryKey: ["anime", animeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("animes")
        .select("*")
        .eq("id", animeId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: characters, isLoading } = useQuery({
    queryKey: ["anime_characters", animeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime_characters")
        .select("*")
        .eq("anime_id", animeId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("anime_characters")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Character deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["anime_characters", animeId] });
      setDeleteDialogOpen(false);
      setCharacterToDelete(null);
    },
    onError: (error: Error) => {
      toast.error("Failed to delete character: " + error.message);
    },
  });

  const fetchCharactersFromAniList = async () => {
    if (!anime?.anilist_id) {
      toast.error("This anime doesn't have an AniList ID");
      return;
    }

    setIsLoadingAniList(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-anilist-data", {
        body: { anilistId: anime.anilist_id, type: "anime" },
      });

      if (error) throw error;

      const media = data.Media;
      if (media?.characters?.edges) {
        const charactersToInsert = media.characters.edges
          .filter((edge: any) => edge.node && edge.role !== "BACKGROUND")
          .map((edge: any, index: number) => ({
            anime_id: animeId,
            name: edge.node.name.full,
            name_native: edge.node.name.native || "",
            description: edge.node.description ? edge.node.description.replace(/<[^>]*>/g, "") : "",
            image_url: edge.node.image?.large || "",
            role: edge.role === "MAIN" ? "main" : "supporting",
            age: edge.node.age?.toString() || "",
            gender: edge.node.gender || "",
            birth_date: edge.node.dateOfBirth ? 
              `${edge.node.dateOfBirth.year || ""}${edge.node.dateOfBirth.month ? `-${edge.node.dateOfBirth.month.toString().padStart(2, "0")}` : ""}${edge.node.dateOfBirth.day ? `-${edge.node.dateOfBirth.day.toString().padStart(2, "0")}` : ""}` 
              : "",
            anilist_id: edge.node.id,
            order_index: index,
          }));

        const { error: insertError } = await supabase
          .from("anime_characters")
          .insert(charactersToInsert);

        if (insertError) throw insertError;

        toast.success(`Imported ${charactersToInsert.length} characters from AniList!`);
        queryClient.invalidateQueries({ queryKey: ["anime_characters", animeId] });
      }
    } catch (error: any) {
      toast.error("Failed to fetch characters: " + error.message);
    } finally {
      setIsLoadingAniList(false);
    }
  };

  const handleAddNew = () => {
    setSelectedCharacter(null);
    setDialogOpen(true);
  };

  const handleEdit = (character: any) => {
    setSelectedCharacter(character);
    setDialogOpen(true);
  };

  const handleDeleteClick = (character: any) => {
    setCharacterToDelete(character);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (characterToDelete) {
      deleteMutation.mutate(characterToDelete.id);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "main":
        return "default";
      case "supporting":
        return "secondary";
      case "background":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/animes")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {anime?.title} - Characters
              </h1>
              <p className="text-muted-foreground">
                Manage characters and voice actors
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {anime?.anilist_id && (
              <Button
                variant="outline"
                onClick={fetchCharactersFromAniList}
                disabled={isLoadingAniList}
              >
                <Download className="mr-2 h-4 w-4" />
                {isLoadingAniList ? "Importing..." : "Import from AniList"}
              </Button>
            )}
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Character
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {characters?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Total Characters</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {characters?.filter(c => c.role === 'main').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Main Characters</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {characters?.filter(c => c.role === 'supporting').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Supporting Characters</p>
            </CardContent>
          </Card>
        </div>

        {/* Characters Table */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <TableSkeleton rows={6} columns={6} showCheckbox={false} showImage />
            ) : characters && characters.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Native Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Age/Gender</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {characters.map((character) => (
                    <TableRow key={character.id}>
                      <TableCell>
                        {character.image_url ? (
                          <img
                            src={character.image_url}
                            alt={character.name}
                            className="w-12 h-16 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                            <Users className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {character.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {character.name_native || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(character.role)}>
                          {character.role.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {character.age && character.gender 
                          ? `${character.age} / ${character.gender}`
                          : character.age || character.gender || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(character)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(character)}
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
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No characters added yet</p>
                <div className="flex gap-2 justify-center">
                  {anime?.anilist_id && (
                    <Button
                      variant="outline"
                      onClick={fetchCharactersFromAniList}
                      disabled={isLoadingAniList}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Import from AniList
                    </Button>
                  )}
                  <Button onClick={handleAddNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Character
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Character Dialog */}
      <CharacterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        character={selectedCharacter}
        animeId={animeId!}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Character?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{characterToDelete?.name}".
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
