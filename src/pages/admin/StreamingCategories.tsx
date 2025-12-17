import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Pencil, Trash2, Folder } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StreamingCategoryDialog } from "@/components/admin/StreamingCategoryDialog";
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
import { Badge } from "@/components/ui/badge";

interface CategoryData {
  name: string;
  count: number;
}

export default function StreamingCategories() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["streaming_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("streaming_channels")
        .select("category");
      
      if (error) throw error;

      // Group by category and count
      const categoryMap = new Map<string, number>();
      data.forEach((channel) => {
        if (channel.category) {
          const count = categoryMap.get(channel.category) || 0;
          categoryMap.set(channel.category, count + 1);
        }
      });

      // Convert to array and sort
      const categoryList: CategoryData[] = Array.from(categoryMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return categoryList;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (categoryName: string) => {
      // Set category to null for all channels with this category
      const { error } = await supabase
        .from("streaming_channels")
        .update({ category: null })
        .eq("category", categoryName);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streaming_categories"] });
      queryClient.invalidateQueries({ queryKey: ["streaming_channels"] });
      toast.success("Category removed from all channels");
      setDeleteCategory(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete category");
    },
  });

  const filteredCategories = categories?.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalChannels = categories?.reduce((sum, cat) => sum + cat.count, 0) || 0;

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Streaming Categories</h1>
            <p className="text-muted-foreground">
              Manage categories for streaming channels
            </p>
          </div>
          <Button onClick={() => { setSelectedCategory(null); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Folder className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Categories</span>
            </div>
            <p className="text-2xl font-bold">{categories?.length || 0}</p>
          </div>
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Folder className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Channels</span>
            </div>
            <p className="text-2xl font-bold">{totalChannels}</p>
          </div>
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Folder className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Avg Channels/Category</span>
            </div>
            <p className="text-2xl font-bold">
              {categories?.length ? Math.round(totalChannels / categories.length) : 0}
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Channels Count</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories && filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => (
                    <TableRow key={category.name}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-muted-foreground" />
                          {category.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{category.count} channels</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCategory(category);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteCategory(category.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "No categories found" : "No categories yet. Add one to get started."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <StreamingCategoryDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          category={selectedCategory}
        />

        <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this category? This will remove the category from all channels using it, but won't delete the channels themselves.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteCategory && deleteMutation.mutate(deleteCategory)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
