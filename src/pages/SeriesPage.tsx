import { Header } from "@/components/public/Header";
import { MediaCard } from "@/components/public/MediaCard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInView } from "@/hooks/useInView";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface Series {
  id: string;
  title: string;
  thumbnail: string;
  rating: number;
  type: string;
  release_year: number;
  genre: string;
  status: string;
  tmdb_id?: string;
}

const SeriesPage = () => {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [filteredSeries, setFilteredSeries] = useState<Series[]>([]);
  const [displayedSeries, setDisplayedSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [genres, setGenres] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;
  const { ref, isInView } = useInView({ threshold: 0.1 });

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const { data, error } = await supabase
          .from('series')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          setSeriesList(data);
          
          // Extract unique values for filters
          const uniqueGenres = [...new Set(data.map(s => s.genre).filter(Boolean))];
          const uniqueYears = [...new Set(data.map(s => s.release_year).filter(Boolean))].sort((a, b) => b - a);
          const uniqueStatuses = [...new Set(data.map(s => s.status).filter(Boolean))];
          
          setGenres(uniqueGenres);
          setYears(uniqueYears);
          setStatuses(uniqueStatuses);
        }
      } catch (error) {
        console.error('Error fetching series:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeries();
  }, []);

  useEffect(() => {
    let filtered = [...seriesList];

    // Filter by genre
    if (selectedGenre !== "all") {
      filtered = filtered.filter(series => series.genre === selectedGenre);
    }

    // Filter by year
    if (selectedYear !== "all") {
      filtered = filtered.filter(series => series.release_year === parseInt(selectedYear));
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(series => series.status === selectedStatus);
    }

    // Filter by rating
    filtered = filtered.filter(series => series.rating >= minRating);

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

    setFilteredSeries(filtered);
    setPage(1); // Reset to first page when filters change
  }, [seriesList, selectedGenre, selectedYear, selectedStatus, minRating, sortBy]);

  useEffect(() => {
    const startIndex = 0;
    const endIndex = page * itemsPerPage;
    setDisplayedSeries(filteredSeries.slice(startIndex, endIndex));
  }, [filteredSeries, page]);

  const clearFilters = () => {
    setSelectedGenre("all");
    setSelectedYear("all");
    setSelectedStatus("all");
    setMinRating(0);
    setSortBy("newest");
  };

  const hasActiveFilters = selectedGenre !== "all" || selectedYear !== "all" || selectedStatus !== "all" || minRating > 0 || sortBy !== "newest";

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
              <h1 className="text-3xl font-bold text-foreground mb-2">All TV Series</h1>
              <p className="text-muted-foreground">
                Showing {filteredSeries.length} of {seriesList.length} series
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

            {/* Series Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="w-full h-[320px] bg-secondary animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : filteredSeries.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-xl text-muted-foreground">No series found matching your filters.</p>
                  <Button onClick={clearFilters} variant="outline" className="mt-4">
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {displayedSeries.map((series) => (
                      <MediaCard
                        key={series.id}
                        id={series.id}
                        title={series.title}
                        image={series.thumbnail}
                        rating={series.rating}
                        type={series.type}
                        year={series.release_year}
                        tmdb_id={series.tmdb_id}
                      />
                    ))}
                  </div>
                  <div ref={ref} />
                  {displayedSeries.length < filteredSeries.length && (
                    <div className="flex justify-center mt-8">
                      <Button onClick={() => setPage(page + 1)} size="lg">
                        Load More ({filteredSeries.length - displayedSeries.length} remaining)
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

export default SeriesPage;
