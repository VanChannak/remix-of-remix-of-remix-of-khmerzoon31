import { Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { AccessBadge } from "@/components/badges/AccessBadge";
import { useIsTablet } from "@/hooks/use-tablet";

interface AnimeCardProps {
  id: string;
  anilistId?: string;
  title: string;
  image: string;
  episodes?: number;
  rating?: number;
  type: string;
  rank?: number;
  hoverScale?: number;
  noSlideUp?: boolean;
  access?: "free" | "rent" | "vip";
}

export const AnimeCard = ({ 
  id,
  anilistId,
  title,
  image, 
  episodes, 
  rating, 
  type, 
  rank,
  hoverScale = 1.05,
  noSlideUp = false,
  access = "free"
}: AnimeCardProps) => {
  const isTablet = useIsTablet();
  
  return (
    <Link to={`/anime/${anilistId || id}`}>
      <Card
      className={`group/card relative overflow-hidden border-border/30 bg-card cursor-pointer ${
        isTablet 
          ? 'transition-none' 
          : 'transition-all duration-[400ms] ease-[cubic-bezier(0.175,0.885,0.32,1.275)] md:hover:scale-[1.08] md:hover:-translate-y-[25px] hover:z-[1000] md:hover:shadow-[0_30px_60px_rgba(0,209,209,0.25),0_0_0_1px_rgba(0,209,209,0.3),0_0_50px_rgba(0,209,209,0.15)] md:hover:border-cyan-300 origin-bottom'
      }`}
    >
      <div className="absolute top-2 left-2 z-10 flex gap-2">
        {rank && (
          <div className="bg-primary text-white text-xs font-bold px-2 py-1 rounded">
            #{rank}
          </div>
        )}
        <AccessBadge access={access} />
      </div>
      
      <div className="relative aspect-[2/3] overflow-hidden bg-secondary/20">
        <img
          src={image}
          alt={title}
          className={`w-full h-full object-cover ${isTablet ? '' : 'transition-transform duration-[400ms] ease-out md:group-hover/card:scale-105'}`}
        />
        {!isTablet && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent opacity-0 md:group-hover/card:opacity-100 transition-all duration-500" />
            
            <div className="absolute inset-0 opacity-0 md:group-hover/card:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full md:group-hover/card:translate-x-full transition-transform duration-1000" />
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center opacity-0 md:group-hover/card:opacity-100 transition-all duration-500 delay-100">
              <div className="w-12 h-12 rounded-full bg-primary/60 flex items-center justify-center backdrop-blur-md transform scale-0 md:group-hover/card:scale-110 transition-all duration-500 shadow-2xl shadow-primary/40">
                <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
              </div>
            </div>

            <div className="absolute bottom-0 left-0 p-3 opacity-0 md:group-hover/card:opacity-100 transition-opacity duration-300 z-20">
              <h3 className="font-semibold text-sm text-white drop-shadow-lg line-clamp-2 mb-1">
                {title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-white/90 drop-shadow-md">
                {episodes && <span>{episodes} eps</span>}
              </div>
            </div>
          </>
        )}
      </div>
      </Card>
    </Link>
  );
};
