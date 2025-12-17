import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ShakaPlayer } from './ShakaPlayer';

interface EpisodeTrailerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  episodeNumber: number;
  episodeName: string;
  trailerUrl: string;
}

export const EpisodeTrailerDialog = ({
  open,
  onOpenChange,
  episodeNumber,
  episodeName,
  trailerUrl,
}: EpisodeTrailerDialogProps) => {
  // Convert trailer URL to proper video source format
  const videoSources = trailerUrl ? [{
    id: 'trailer',
    server_name: 'Trailer',
    source_type: trailerUrl.includes('.m3u8') ? 'hls' : trailerUrl.includes('.mpd') ? 'dash' : 'mp4',
    url: trailerUrl,
    is_default: true,
  }] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Episode {episodeNumber} Preview: {episodeName}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <AspectRatio ratio={16 / 9}>
            {videoSources.length > 0 ? (
              <ShakaPlayer
                videoSources={videoSources}
                autoplay
                className="rounded-lg overflow-hidden"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg">
                <p className="text-muted-foreground">No trailer available</p>
              </div>
            )}
          </AspectRatio>
        </div>
      </DialogContent>
    </Dialog>
  );
};
