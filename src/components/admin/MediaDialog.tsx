import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Media } from "@/pages/Admin";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { ImageUploadField } from "./ImageUploadField";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["movie", "series"]),
  access: z.enum(["free", "rent", "vip"]),
  genre: z.string().min(1, "Genre is required"),
  releaseYear: z.coerce.number().min(1900).max(2100),
  rating: z.coerce.number().min(0).max(10),
  price: z.coerce.number().optional(),
  thumbnail: z.string().url().optional().or(z.literal("")),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

interface MediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media?: Media;
}

export function MediaDialog({ open, onOpenChange, media }: MediaDialogProps) {
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "movie",
      access: "free",
      genre: "",
      releaseYear: new Date().getFullYear(),
      rating: 0,
      price: undefined,
      thumbnail: "",
      description: "",
    },
  });

  // Update form when media changes
  useEffect(() => {
    if (media) {
      form.reset({
        title: media.title,
        type: media.type,
        access: media.access,
        genre: media.genre,
        releaseYear: media.releaseYear,
        rating: media.rating,
        price: media.price,
        thumbnail: media.thumbnail || "",
        description: media.description,
      });
    } else {
      form.reset({
        title: "",
        type: "movie",
        access: "free",
        genre: "",
        releaseYear: new Date().getFullYear(),
        rating: 0,
        price: undefined,
        thumbnail: "",
        description: "",
      });
    }
  }, [media, form]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const tableName = values.type === "movie" ? "movies" : "series";
      const dataToSave = {
        title: values.title,
        type: values.type,
        access: values.access,
        genre: values.genre,
        release_year: values.releaseYear,
        rating: values.rating,
        price: values.price || null,
        thumbnail: values.thumbnail || "/placeholder.svg",
        description: values.description,
      };

      if (media) {
        // Update existing media
        const { error } = await supabase
          .from(tableName)
          .update(dataToSave)
          .eq("id", media.id);

        if (error) throw error;
      } else {
        // Insert new media
        const { error } = await supabase.from(tableName).insert(dataToSave);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      queryClient.invalidateQueries({ queryKey: ["series"] });
      toast.success(media ? "Media updated successfully!" : "Media added successfully!");
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error("Failed to save media: " + error.message);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{media ? "Edit Media" : "Add New Media"}</DialogTitle>
          <DialogDescription>
            {media
              ? "Update the media information below."
              : "Fill in the information to add new content."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="movie">Movie</SelectItem>
                        <SelectItem value="series">Series</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="access"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select access" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="rent">Rent</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="genre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genre</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Action, Drama" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="releaseYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Release Year</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating (0-10)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        placeholder="8.5"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (if rental)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="4.99"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="thumbnail"
              render={({ field }) => (
                <FormItem>
                  <ImageUploadField
                    label="Thumbnail/Poster"
                    value={field.value || ''}
                    onChange={field.onChange}
                    bucketPath="media/posters"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter description..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">{media ? "Update" : "Add"} Media</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
