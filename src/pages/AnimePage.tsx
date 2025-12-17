import { Header } from "@/components/public/Header";
import { AnimeCard } from "@/components/public/AnimeCard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInView } from "@/hooks/useInView";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface Anime {
  id: string;
  title: string;
  thumbnail: string;
  rating: number;
  type: string;
  release_year: number;
  genre: string;
  status: string;
}

const AnimePage = () => {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [filteredAnime, setFilteredAnime] = useState<Anime[]>([]);
  const [displayedAnime, setDisplayedAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [genres, setGenres] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;
  const { ref, isInView } = useInView({ threshold: 0.1 });

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        const { data, error } = await supabase
          .from('animes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          setAnimeList(data);
          
          // Extract unique values for filters
          const uniqueGenres = [...new Set(data.map(a => a.genre).filter(Boolean))];
          const uniqueYears = [...new Set(data.map(a => a.release_year).filter(Boolean))].sort((a, b) => b - a);
          const uniqueTypes = [...new Set(data.map(a => a.type).filter(Boolean))];
          const uniqueStatuses = [...new Set(data.map(a => a.status).filter(Boolean))];
          
          setGenres(uniqueGenres);
          setYears(uniqueYears);
          setTypes(uniqueTypes);
          setStatuses(uniqueStatuses);
        }
      } catch (error) {
        console.error('Error fetching anime:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnime();
  }, []);

  useEffect(() => {
    let filtered = [...animeList];

    // Filter by genre
    if (selectedGenre !== "all") {
      filtered = filtered.filter(anime => anime.genre === selectedGenre);
    }

    // Filter by year
    if (selectedYear !== "all") {
      filtered = filtered.filter(anime => anime.release_year === parseInt(selectedYear));
    }

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter(anime => anime.type === selectedType);
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(anime => anime.status === selectedStatus);
    }

    // Filter by rating
    filtered = filtered.filter(anime => anime.rating >= minRating);

    // Sort
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => b.release_year - a.release_year);
        break;
      case "oldest":
        filtered.sort((a, b) => a.release_year - b.release_year);
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "popular":
        filtered.sort((a, b) => (b.rating * 10) - (a.rating * 10));
        break;
    }

    setFilteredAnime(filtered);
    setPage(1); // Reset to first page when filters change
  }, [animeList, selectedGenre, selectedYear, selectedType, selectedStatus, minRating, sortBy]);

  useEffect(() => {
    const startIndex = 0;
    const endIndex = page * itemsPerPage;
    setDisplayedAnime(filteredAnime.slice(startIndex, endIndex));
  }, [filteredAnime, page]);

  const clearFilters = () => {
    setSelectedGenre("all");
    setSelectedYear("all");
    setSelectedType("all");
    setSelectedStatus("all");
    setMinRating(0);
    setSortBy("newest");
  };

  const hasActiveFilters = selectedGenre !== "all" || selectedYear !== "all" || selectedType !== "all" || selectedStatus !== "all" || minRating > 0 || sortBy !== "newest";

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium mb-2 block">Genre</label>
        <Select value={selectedGenre} onValueChange={setSelectedGenre}>
          <SelectTrigger>
            <SelectValue placeholder="All Genres" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genres</SelectItem>
            {genres.map(genre => (
              <SelectItem key={genre} value={genre}>{genre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Year</label>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger>
            <SelectValue placeholder="All Years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Type</label>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {types.map(type => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Status</label>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statuses.map(status => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">
          Minimum Rating: {minRating.toFixed(1)}
        </label>
        <Slider
          value={[minRating]}
          onValueChange={(value) => setMinRating(value[0])}
          max={10}
          step={0.5}
          className="mt-2"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Sort By</label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="rating">Highest Rating</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="title">Title (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button onClick={clearFilters} variant="outline" className="w-full">
          <X className="w-4 h-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-16">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">All Anime</h1>
              <p className="text-muted-foreground">
                Showing {filteredAnime.length} of {animeList.length} anime
              </p>
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                      !
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex gap-6">
            {/* Desktop Filters Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </h2>
                <FilterContent />
              </div>
            </aside>

            {/* Anime Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="w-full h-[320px] bg-secondary animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : filteredAnime.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-xl text-muted-foreground">No anime found matching your filters.</p>
                  <Button onClick={clearFilters} variant="outline" className="mt-4">
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <>
                  <div ref={ref} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {displayedAnime.map((anime, index) => (
                      <div
                        key={anime.id}
                        className="transition-all duration-700"
                        style={{
                          transitionDelay: isInView ? `${index * 30}ms` : '0ms',
                          opacity: isInView ? 1 : 0,
                          transform: isInView ? 'translateY(0)' : 'translateY(20px)'
                        }}
                      >
                        <AnimeCard
                          id={anime.id}
                          title={anime.title}
                          image={anime.thumbnail}
                          rating={anime.rating}
                          type={anime.type}
                        />
                      </div>
                    ))}
                  </div>
                  {displayedAnime.length < filteredAnime.length && (
                    <div className="flex justify-center mt-8">
                      <Button onClick={() => setPage(page + 1)} size="lg">
                        Load More ({filteredAnime.length - displayedAnime.length} remaining)
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnimePage;
