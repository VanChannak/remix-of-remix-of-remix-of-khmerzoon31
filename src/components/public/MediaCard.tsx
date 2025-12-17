import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import { Link } from "react-router-dom";
import { AccessBadge } from "@/components/badges/AccessBadge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsTablet } from "@/hooks/use-tablet";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface MediaCardProps {
  id: string;
  title: string;
  image: string;
  type: string;
  rating?: number;
  year?: number;
  tmdb_id?: string;
  access?: "free" | "rent" | "vip";
}

export const MediaCard = ({ id, title, image, type, rating, year, tmdb_id, access = "free" }: MediaCardProps) => {
  const detailPath = type === "movie" 
    ? `/watch/movie/${tmdb_id}` 
    : type === "series"
    ? `/watch/series/${tmdb_id}/1/1`
    : `/anime/${tmdb_id || id}`;
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [imageLoaded, setImageLoaded] = useState(false);
  
  return (
    <Link to={detailPath}>
      <Card className={`group/card relative overflow-hidden border-border/30 bg-card cursor-pointer origin-bottom ${!isMobile && !isTablet ? 'transition-all duration-[400ms] ease-[cubic-bezier(0.175,0.885,0.32,1.275)] hover:scale-[1.08] hover:-translate-y-[25px] hover:z-[1000] hover:shadow-[0_30px_60px_rgba(0,209,209,0.25),0_0_0_1px_rgba(0,209,209,0.3),0_0_50px_rgba(0,209,209,0.15)] hover:border-cyan-300' : ''}`}>
      <div className="aspect-[2/3] relative overflow-hidden bg-secondary/20">
        {!imageLoaded && (isMobile || isTablet) && (
          <Skeleton className="absolute inset-0 w-full h-full" />
        )}
        <img
          src={image || "/placeholder.svg"}
          alt={title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover ${!isMobile && !isTablet ? 'transition-transform duration-[400ms] ease-out group-hover/card:scale-105' : ''} ${!imageLoaded && (isMobile || isTablet) ? 'opacity-0' : 'opacity-100'}`}
        />
        
        {!isMobile && !isTablet && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent opacity-0 group-hover/card:opacity-100 transition-all duration-500">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-primary/60 flex items-center justify-center transform scale-0 group-hover/card:scale-110 transition-all duration-500 backdrop-blur-md shadow-2xl shadow-primary/40 delay-100">
                  <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                </div>
              </div>
            </div>
            
            {/* Shine effect */}
            <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000" />
            </div>
          </>
        )}

        <div className={`absolute top-2 left-2 z-10 flex gap-2 ${!isMobile && !isTablet ? 'transition-all duration-300 group-hover/card:scale-110' : ''}`}>
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-md shadow-lg border border-border/50">
            {type}
          </Badge>
          <AccessBadge access={access} />
        </div>

      </div>

      <div className={`absolute bottom-0 left-0 p-3 z-20 ${!isMobile && !isTablet ? 'opacity-0 group-hover/card:opacity-100 transition-opacity duration-300' : ''}`}>
        <h3 className="font-semibold text-sm text-white drop-shadow-lg line-clamp-2 mb-1">
          {title}
        </h3>
        {year && (
          <p className="text-xs text-white/90 drop-shadow-md">
            {year}
          </p>
        )}
      </div>
      </Card>
    </Link>
  );
};
