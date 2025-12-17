import { Film, Tv, TrendingUp, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function AdminStats() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [moviesResult, seriesResult] = await Promise.all([
        supabase.from("movies").select("price"),
        supabase.from("series").select("price"),
      ]);
      
      if (moviesResult.error) throw moviesResult.error;
      if (seriesResult.error) throw seriesResult.error;
      
      const movieCount = moviesResult.data?.length || 0;
      const seriesCount = seriesResult.data?.length || 0;
      const totalRevenue = [
        ...(moviesResult.data || []),
        ...(seriesResult.data || []),
      ].reduce((sum, m) => sum + (m.price || 0), 0);
      
      return [
        {
          title: "Total Movies",
          value: movieCount.toString(),
          change: "+12.5%",
          icon: Film,
          color: "text-blue-500",
        },
        {
          title: "Total Series",
          value: seriesCount.toString(),
          change: "+8.2%",
          icon: Tv,
          color: "text-purple-500",
        },
        {
          title: "Active Users",
          value: "0",
          change: "+0%",
          icon: TrendingUp,
          color: "text-green-500",
        },
        {
          title: "Revenue",
          value: `$${totalRevenue.toFixed(2)}`,
          change: "+15.3%",
          icon: DollarSign,
          color: "text-yellow-500",
        },
      ];
    },
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats?.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                <p className="text-sm text-green-500 mt-1">{stat.change}</p>
              </div>
              <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
