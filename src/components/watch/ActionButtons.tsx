import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, Share2, Bookmark, MoreHorizontal, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

interface ActionButtonsProps {
  contentId?: string;
  contentType?: 'movie' | 'series';
  episodeId?: string;
  userId?: string;
  contentTitle?: string;
}

export const ActionButtons = ({ contentId, contentType, episodeId, userId, contentTitle }: ActionButtonsProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportType, setReportType] = useState("content");
  const [reportReason, setReportReason] = useState("");

  // Fetch initial like/dislike state and counts
  useEffect(() => {
    if (!contentId || !userId) return;
    
    const fetchLikeData = async () => {
      // Get user's like status
      const { data: userLike } = await supabase
        .from('user_likes')
        .select('like_type')
        .eq('user_id', userId)
        .eq('media_id', contentId)
        .eq('media_type', contentType || 'movie')
        .maybeSingle();
      
      if (userLike) {
        setLiked(userLike.like_type === 'like');
        setDisliked(userLike.like_type === 'dislike');
      }

      // Get total counts
      const { data: likes } = await supabase
        .from('user_likes')
        .select('like_type')
        .eq('media_id', contentId)
        .eq('media_type', contentType || 'movie');
      
      if (likes) {
        setLikeCount(likes.filter(l => l.like_type === 'like').length);
        setDislikeCount(likes.filter(l => l.like_type === 'dislike').length);
      }
    };

    fetchLikeData();
  }, [contentId, userId, contentType]);

  // Fetch watchlist status
  useEffect(() => {
    if (!contentId || !userId) return;
    
    const fetchWatchlistStatus = async () => {
      const { data } = await supabase
        .from('user_watchlist')
        .select('id')
        .eq('user_id', userId)
        .eq('media_id', contentId)
        .eq('media_type', contentType || 'movie')
        .maybeSingle();
      
      setSaved(!!data);
    };

    fetchWatchlistStatus();
  }, [contentId, userId, contentType]);

  const handleLike = async () => {
    if (!userId) {
      toast({
        title: "Login required",
        description: "Please login to like content",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      if (liked) {
        // Remove like
        await supabase
          .from('user_likes')
          .delete()
          .eq('user_id', userId)
          .eq('media_id', contentId!)
          .eq('media_type', contentType || 'movie');
        
        setLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        // Add or update like
        await supabase
          .from('user_likes')
          .upsert({
            user_id: userId,
            media_id: contentId!,
            media_type: contentType || 'movie',
            like_type: 'like'
          }, {
            onConflict: 'user_id,media_id,media_type'
          });
        
        if (disliked) {
          setDisliked(false);
          setDislikeCount(prev => prev - 1);
        }
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error updating like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDislike = async () => {
    if (!userId) {
      toast({
        title: "Login required",
        description: "Please login to dislike content",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      if (disliked) {
        // Remove dislike
        await supabase
          .from('user_likes')
          .delete()
          .eq('user_id', userId)
          .eq('media_id', contentId!)
          .eq('media_type', contentType || 'movie');
        
        setDisliked(false);
        setDislikeCount(prev => prev - 1);
      } else {
        // Add or update dislike
        await supabase
          .from('user_likes')
          .upsert({
            user_id: userId,
            media_id: contentId!,
            media_type: contentType || 'movie',
            like_type: 'dislike'
          }, {
            onConflict: 'user_id,media_id,media_type'
          });
        
        if (liked) {
          setLiked(false);
          setLikeCount(prev => prev - 1);
        }
        setDisliked(true);
        setDislikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error updating dislike:', error);
      toast({
        title: "Error",
        description: "Failed to update dislike",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = contentTitle || 'Check this out!';
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Watch ${shareTitle}`,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "The link has been copied to your clipboard.",
      });
    }
  };

  const handleSave = async () => {
    if (!userId) {
      toast({
        title: "Login required",
        description: "Please login to save content",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      if (saved) {
        // Remove from watchlist
        await supabase
          .from('user_watchlist')
          .delete()
          .eq('user_id', userId)
          .eq('media_id', contentId!)
          .eq('media_type', contentType || 'movie');
        
        setSaved(false);
        toast({
          title: "Removed from watchlist",
          description: "Removed from your watchlist",
        });
      } else {
        // Add to watchlist
        await supabase
          .from('user_watchlist')
          .insert({
            user_id: userId,
            media_id: contentId!,
            media_type: contentType || 'movie'
          });
        
        setSaved(true);
        toast({
          title: "Added to watchlist",
          description: "Added to your watchlist",
        });
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
      toast({
        title: "Error",
        description: "Failed to update watchlist",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReport = () => {
    if (!userId) {
      toast({
        title: "Login required",
        description: "Please login to report content",
        variant: "destructive"
      });
      return;
    }
    setReportDialogOpen(true);
  };

  const submitReport = async () => {
    if (!reportReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the report",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await supabase
        .from('user_reports')
        .insert({
          user_id: userId!,
          media_id: contentId,
          media_type: contentType,
          report_type: reportType,
          report_reason: reportReason,
          status: 'pending'
        });

      toast({
        title: "Report submitted",
        description: "Thank you for reporting. We'll review this content.",
      });
      setReportDialogOpen(false);
      setReportReason("");
      setReportType("content");
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error",
        description: "Failed to submit report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Like/Dislike Group */}
        <div className="flex items-center bg-secondary/80 hover:bg-secondary rounded-full overflow-hidden">
          <Button
            variant="ghost"
            size={isMobile ? "sm" : "default"}
            onClick={handleLike}
            disabled={loading}
            className={`rounded-none rounded-l-full hover:bg-transparent gap-2 ${
              liked ? 'text-primary' : ''
            }`}
          >
            <ThumbsUp className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
            {!isMobile && <span>{likeCount.toLocaleString()}</span>}
          </Button>
          <div className="h-6 w-[1px] bg-border" />
          <Button
            variant="ghost"
            size={isMobile ? "sm" : "default"}
            onClick={handleDislike}
            disabled={loading}
            className={`rounded-none rounded-r-full hover:bg-transparent ${
              disliked ? 'text-primary' : ''
            }`}
          >
            <ThumbsDown className={`h-4 w-4 ${disliked ? 'fill-current' : ''}`} />
            {!isMobile && dislikeCount > 0 && <span className="text-xs">{dislikeCount}</span>}
          </Button>
        </div>

        {/* Share Button */}
        <Button
          variant="secondary"
          size={isMobile ? "sm" : "default"}
          onClick={handleShare}
          className="rounded-full gap-2"
        >
          <Share2 className="h-4 w-4" />
          {!isMobile && <span>Share</span>}
        </Button>

        {/* Save Button */}
        <Button
          variant="secondary"
          size={isMobile ? "sm" : "default"}
          onClick={handleSave}
          disabled={loading}
          className={`rounded-full gap-2 ${saved ? 'text-primary' : ''}`}
        >
          <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
          {!isMobile && <span>{saved ? 'Saved' : 'Save'}</span>}
        </Button>

        {/* More Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size={isMobile ? "sm" : "icon"}
              className="rounded-full"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleReport}>
              <Flag className="mr-2 h-4 w-4" />
              Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Report Content</DialogTitle>
            <DialogDescription>
              Help us understand what's wrong with this content
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <RadioGroup value={reportType} onValueChange={setReportType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="content" id="content" />
                  <Label htmlFor="content" className="font-normal cursor-pointer">
                    Inappropriate Content
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="copyright" id="copyright" />
                  <Label htmlFor="copyright" className="font-normal cursor-pointer">
                    Copyright Violation
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="quality" id="quality" />
                  <Label htmlFor="quality" className="font-normal cursor-pointer">
                    Quality Issues
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="font-normal cursor-pointer">
                    Other
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-reason">Reason</Label>
              <Textarea
                id="report-reason"
                placeholder="Please describe the issue..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReportDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={submitReport} disabled={loading}>
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
