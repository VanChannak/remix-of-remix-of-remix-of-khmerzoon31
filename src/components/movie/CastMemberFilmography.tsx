import React, { useState } from "react";
import { Film, Tv, Calendar, Search, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getImageUrl } from "./utils";

interface TMDBCredit {
  id: number;
  title?: string;
  name?: string;
  character?: string;
  media_type: 'movie' | 'tv';
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  overview: string;
}

interface CastMemberFilmographyProps {
  movieCredits: TMDBCredit[];
  tvCredits: TMDBCredit[];
  isLoading: boolean;
  isMobile: boolean;
}

const CastMemberFilmography = ({ movieCredits, tvCredits, isLoading, isMobile }: CastMemberFilmographyProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "movies" | "tv">("all");

  const filteredCredits = React.useMemo(() => {
    let allCredits = [...movieCredits, ...tvCredits];
    
    if (selectedType === "movies") {
      allCredits = movieCredits;
    } else if (selectedType === "tv") {
      allCredits = tvCredits;
    }
    
    if (searchTerm) {
      allCredits = allCredits.filter(credit =>
        (credit.title || credit.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        credit.character?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return allCredits.sort((a, b) => {
      const dateA = a.release_date || a.first_air_date;
      const dateB = b.release_date || b.first_air_date;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [movieCredits, tvCredits, searchTerm, selectedType]);

  if (isLoading) {
    return (
      <div className="space-y-4 h-full flex flex-col">
        {/* Filter Skeleton */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 flex-shrink-0">
          <div className="flex flex-col gap-3">
            <div className="h-6 w-40 bg-gray-700/50 rounded animate-pulse" />
            <div className="h-9 w-full bg-gray-700/50 rounded animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-7 w-20 bg-gray-700/50 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        
        {/* Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pb-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg overflow-hidden border border-gray-700/50">
              <div className="aspect-[2/3] bg-gray-700/50 animate-pulse" />
              <div className="p-2">
                <div className="h-4 w-3/4 bg-gray-700/50 rounded animate-pulse mb-1" />
                <div className="h-3 w-1/2 bg-gray-700/50 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 flex-shrink-0">
        <div className="flex flex-col gap-3">
          <h3 className={`${isMobile ? 'text-xl' : 'text-lg'} font-bold text-white`}>
            Filmography ({filteredCredits.length})
          </h3>
          
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search movies and TV shows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 h-9"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedType("all")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                selectedType === "all"
                  ? "bg-cyan-500 text-white"
                  : "bg-gray-700/50 text-gray-300 hover:bg-gray-700"
              }`}
            >
              All ({movieCredits.length + tvCredits.length})
            </button>
            <button
              onClick={() => setSelectedType("movies")}
              className={`px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
                selectedType === "movies"
                  ? "bg-cyan-500 text-white"
                  : "bg-gray-700/50 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <Film size={12} />
              Movies ({movieCredits.length})
            </button>
            <button
              onClick={() => setSelectedType("tv")}
              className={`px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
                selectedType === "tv"
                  ? "bg-cyan-500 text-white"
                  : "bg-gray-700/50 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <Tv size={12} />
              TV Shows ({tvCredits.length})
            </button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pb-4">
          {filteredCredits.map((credit) => (
            <div
              key={`${credit.media_type}-${credit.id}`}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg overflow-hidden border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-200"
            >
              <div className="aspect-[2/3] bg-gray-700 relative">
                {getImageUrl(credit.poster_path) ? (
                  <img
                    src={getImageUrl(credit.poster_path)!}
                    alt={credit.title || credit.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {credit.media_type === 'movie' ? <Film size={24} className="text-gray-500" /> : <Tv size={24} className="text-gray-500" />}
                  </div>
                )}
                <Badge className="absolute top-2 right-2 text-xs" variant={credit.media_type === 'movie' ? 'default' : 'secondary'}>
                  {credit.media_type === 'movie' ? 'Movie' : 'TV'}
                </Badge>
              </div>
              <div className="p-2">
                <h4 className="text-sm font-semibold text-white line-clamp-1">
                  {credit.title || credit.name}
                </h4>
                {credit.character && (
                  <p className="text-xs text-gray-400 line-clamp-1">as {credit.character}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {credit.vote_average > 0 && (
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-gray-300">{credit.vote_average.toFixed(1)}</span>
                    </div>
                  )}
                  {(credit.release_date || credit.first_air_date) && (
                    <div className="flex items-center gap-1">
                      <Calendar size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {new Date(credit.release_date || credit.first_air_date!).getFullYear()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredCredits.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p>No {selectedType === 'all' ? 'credits' : selectedType} found</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default CastMemberFilmography;
