import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsTablet } from "@/hooks/use-tablet";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import CastMemberProfile from "./CastMemberProfile";
import CastMemberDialogTabs from "./CastMemberDialogTabs";

interface CastMember {
  id: string;
  actor_name: string;
  character_name?: string;
  profile_url?: string;
  order_index?: number;
  tmdb_id?: number | null;
}

interface TMDBPerson {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  gender: number;
  popularity: number;
  also_known_as: string[];
  homepage: string | null;
}

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

interface CastMemberDialogProps {
  castMember: CastMember | null;
  isOpen: boolean;
  onClose: () => void;
  castType?: 'movie' | 'series';
}

const CastMemberDialog = ({ castMember, isOpen, onClose, castType = 'series' }: CastMemberDialogProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [tmdbData, setTmdbData] = useState<{
    person: TMDBPerson | null;
    movieCredits: TMDBCredit[];
    tvCredits: TMDBCredit[];
  }>({ person: null, movieCredits: [], tvCredits: [] });
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isCompact = isMobile || isTablet;
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (castMember && isOpen) {
      fetchTMDBData();
      checkFollowStatus();
    }
  }, [castMember, isOpen, user?.id]);

  const checkFollowStatus = async () => {
    if (!user?.id || !castMember) return;
    
    try {
      const { data, error } = await supabase
        .from('user_followed_cast')
        .select('id')
        .eq('user_id', user.id)
        .eq('cast_id', castMember.id)
        .eq('cast_type', castType)
        .maybeSingle();
      
      if (!error && data) {
        setIsFollowing(true);
      } else {
        setIsFollowing(false);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const fetchTMDBData = async () => {
    if (!castMember) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-tmdb-cast', {
        body: { 
          tmdbPersonId: castMember.tmdb_id,
          actorName: castMember.actor_name 
        },
      });

      if (error) throw error;

      if (data.success) {
        setTmdbData(data.data);
      }
    } catch (error) {
      console.error('Error fetching TMDB data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user?.id) {
      toast({
        title: "Login Required",
        description: "Please login to follow cast members",
        variant: "destructive"
      });
      return;
    }

    if (!castMember) return;

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_followed_cast')
          .delete()
          .eq('user_id', user.id)
          .eq('cast_id', castMember.id)
          .eq('cast_type', castType);

        if (error) throw error;

        setIsFollowing(false);
        toast({
          title: "Unfollowed",
          description: `You unfollowed ${castMember.actor_name}`,
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('user_followed_cast')
          .insert({
            user_id: user.id,
            cast_id: castMember.id,
            cast_type: castType,
            tmdb_person_id: castMember.tmdb_id || null,
            actor_name: castMember.actor_name,
            profile_url: castMember.profile_url || null,
          });

        if (error) throw error;

        setIsFollowing(true);
        toast({
          title: "Following",
          description: `You are now following ${castMember.actor_name}`,
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive"
      });
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share && castMember) {
      navigator.share({
        title: `${castMember.actor_name} - Cast Member`,
        text: `Check out ${castMember.actor_name}${castMember.character_name ? ` who plays ${castMember.character_name}` : ''}`,
        url: window.location.href,
      });
    } else if (castMember) {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Link copied to clipboard",
      });
    }
  };

  if (!castMember) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`${
          isCompact 
            ? 'fixed inset-0 max-w-full w-full h-full m-0 p-0 rounded-none data-[state=open]:slide-in-from-bottom [&>button]:hidden' 
            : 'max-w-4xl h-[90vh]'
        } bg-black/95 backdrop-blur-xl border-gray-800/30 text-white overflow-hidden flex flex-col`}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Cast Member Details</DialogTitle>
        </DialogHeader>
        
        {/* Close Button for mobile/tablet */}
        {isCompact && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-3 right-3 z-50 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        {/* Profile Header - Fixed at top */}
        <div className={`flex-shrink-0 bg-gradient-to-b from-gray-900/40 to-black/40 backdrop-blur-md border-b border-gray-700/30 ${isCompact ? 'pt-10' : ''}`}>
          <div className={`${isCompact ? 'p-4' : 'p-6'}`}>
            <CastMemberProfile
              castMember={castMember}
              isFollowing={isFollowing}
              isMobile={isCompact}
              onFollow={handleFollow}
              onShare={handleShare}
              isFollowLoading={isFollowLoading}
            />
          </div>
        </div>
        
        {/* Tabs Section - Scrollable content */}
        <div className="flex-1 min-h-0 overflow-hidden bg-black/20 backdrop-blur-sm">
          <CastMemberDialogTabs
            castMember={castMember}
            tmdbPerson={tmdbData.person}
            movieCredits={tmdbData.movieCredits}
            tvCredits={tmdbData.tvCredits}
            isLoading={isLoading}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isMobile={isCompact}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CastMemberDialog;