import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, X, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TrailerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  trailerUrl: string | null;
  description?: string | null;
  releaseDate?: string | null;
  genre?: string | null;
  status?: string;
}

export function TrailerDialog({ 
  open, 
  onOpenChange, 
  title, 
  trailerUrl, 
  description, 
  releaseDate, 
  genre,
  status 
}: TrailerDialogProps) {
  const getYoutubeEmbedUrl = (url: string | null) => {
    if (!url) return null;
    
    // Extract video ID from various YouTube URL formats
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[7].length === 11 ? match[7] : null;
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    }
    
    return url;
  };

  const embedUrl = getYoutubeEmbedUrl(trailerUrl);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Coming soon';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return 'Coming soon';
    }
  };

  const getStatusBadge = (statusValue?: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'announced': { label: 'Announced', variant: 'secondary' },
      'in_production': { label: 'In Production', variant: 'default' },
      'post_production': { label: 'Post Production', variant: 'default' },
      'coming_soon': { label: 'Coming Soon', variant: 'outline' },
    };
    
    return statusValue ? statusMap[statusValue] || { label: statusValue, variant: 'outline' } : null;
  };

  const statusInfo = getStatusBadge(status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0 gap-0">
        <div className="absolute top-4 right-4 z-50">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="grid md:grid-cols-[1fr,400px] h-full">
          {/* Video Section */}
          <div className="relative bg-black flex items-center justify-center p-6">
            {embedUrl ? (
              <div className="w-full h-full flex items-center justify-center">
                <iframe
                  src={embedUrl}
                  title={`${title} Trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full rounded-lg"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <Play className="w-16 h-16 opacity-50" />
                <p className="text-lg">No trailer available</p>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="bg-background border-l">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                <div>
                  <DialogHeader>
                    <DialogTitle className="text-2xl leading-tight mb-3">{title}</DialogTitle>
                  </DialogHeader>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {statusInfo && (
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    )}
                    {genre && genre.toLowerCase().includes('original') && (
                      <Badge className="bg-green-500 text-white">Original</Badge>
                    )}
                    {genre && genre.toLowerCase().includes('iqiyi') && (
                      <Badge className="bg-green-400 text-black">iQIYI Only</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {releaseDate && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Release Date</p>
                        <p className="text-base">{formatDate(releaseDate)}</p>
                      </div>
                    </div>
                  )}

                  {genre && (
                    <div className="flex items-start gap-3">
                      <Tag className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Genre</p>
                        <p className="text-base">{genre}</p>
                      </div>
                    </div>
                  )}
                </div>

                {description && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Overview
                    </h3>
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {description}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground italic">
                    Trailer preview • Click outside or press ESC to close
                  </p>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
