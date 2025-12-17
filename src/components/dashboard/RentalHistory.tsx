import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Film } from "lucide-react";

export const RentalHistory = () => {
  const { user } = useAuth();

  const { data: rentals, isLoading } = useQuery({
    queryKey: ["user-rentals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_rentals")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: mediaDetails } = useQuery({
    queryKey: ["rental-media-details", rentals],
    enabled: !!rentals && rentals.length > 0,
    queryFn: async () => {
      const details: any = {};
      for (const rental of rentals!) {
        if (rental.media_type === "movie") {
          const { data } = await supabase
            .from("movies")
            .select("title, thumbnail")
            .eq("id", rental.media_id)
            .single();
          if (data) details[rental.media_id] = data;
        } else if (rental.media_type === "series") {
          const { data } = await supabase
            .from("series")
            .select("title, thumbnail")
            .eq("id", rental.media_id)
            .single();
          if (data) details[rental.media_id] = data;
        } else if (rental.media_type === "anime") {
          const { data } = await supabase
            .from("animes")
            .select("title, thumbnail")
            .eq("id", rental.media_id)
            .single();
          if (data) details[rental.media_id] = data;
        }
      }
      return details;
    },
  });

  const getStatusBadge = (rental: any) => {
    const now = new Date();
    const endDate = new Date(rental.end_date);

    if (rental.payment_status !== "completed") {
      return <Badge variant="secondary">Pending</Badge>;
    }
    if (endDate < now) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    return <Badge className="bg-green-500">Active</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!rentals || rentals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Film className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No rental history yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {rentals.map((rental) => {
        const media = mediaDetails?.[rental.media_id];
        const daysLeft = Math.ceil(
          (new Date(rental.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        return (
          <Card key={rental.id}>
            <CardContent className="flex items-center gap-4 p-4">
              {media?.thumbnail && (
                <img
                  src={media.thumbnail}
                  alt={media.title}
                  className="w-16 h-24 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold">{media?.title || "Loading..."}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Expires: {new Date(rental.end_date).toLocaleDateString()}
                  </span>
                  {rental.payment_status === "completed" && daysLeft > 0 && (
                    <span className="text-primary">({daysLeft} days left)</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(rental)}
                  <Badge variant="outline" className="capitalize">
                    {rental.media_type}
                  </Badge>
                  <span className="text-sm font-semibold">${rental.rental_price}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
