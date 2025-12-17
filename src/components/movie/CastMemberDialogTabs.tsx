import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CastMemberOverview from "./CastMemberOverview";
import CastMemberFilmography from "./CastMemberFilmography";
import CastMemberDetails from "./CastMemberDetails";

interface CastMember {
  id: string;
  actor_name: string;
  character_name?: string;
  profile_url?: string;
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

interface CastMemberDialogTabsProps {
  castMember: CastMember;
  tmdbPerson: TMDBPerson | null;
  movieCredits: TMDBCredit[];
  tvCredits: TMDBCredit[];
  isLoading: boolean;
  activeTab: string;
  onTabChange: (value: string) => void;
  isMobile: boolean;
}

const CastMemberDialogTabs = ({
  castMember,
  tmdbPerson,
  movieCredits,
  tvCredits,
  isLoading,
  activeTab,
  onTabChange,
  isMobile
}: CastMemberDialogTabsProps) => {
  return (
    <div className="h-full flex flex-col bg-transparent">
      <Tabs value={activeTab} onValueChange={onTabChange} className="h-full flex flex-col">
        {/* Tab Navigation */}
        <TabsList className={`
          flex-shrink-0 w-full bg-black/20 backdrop-blur-lg border-b border-gray-600/20 rounded-none 
          ${isMobile ? 'h-10 px-3' : 'h-9 px-4'} grid grid-cols-3 gap-1
        `}>
          <TabsTrigger value="overview" className="
              data-[state=active]:bg-white/80 data-[state=active]:text-black data-[state=active]:shadow-sm data-[state=active]:backdrop-blur-sm
              bg-transparent text-white/80 hover:text-white hover:bg-white/10 hover:backdrop-blur-sm
              border-transparent rounded-md font-medium transition-all duration-200
              text-xs py-1 px-2
            ">
            Overview
          </TabsTrigger>
          <TabsTrigger value="filmography" className="
              data-[state=active]:bg-white/80 data-[state=active]:text-black data-[state=active]:shadow-sm data-[state=active]:backdrop-blur-sm
              bg-transparent text-white/80 hover:text-white hover:bg-white/10 hover:backdrop-blur-sm
              border-transparent rounded-md font-medium transition-all duration-200
              text-xs py-1 px-2
            ">
            Filmography
          </TabsTrigger>
          <TabsTrigger value="details" className="
              data-[state=active]:bg-white/80 data-[state=active]:text-black data-[state=active]:shadow-sm data-[state=active]:backdrop-blur-sm
              bg-transparent text-white/80 hover:text-white hover:bg-white/10 hover:backdrop-blur-sm
              border-transparent rounded-md font-medium transition-all duration-200
              text-xs py-1 px-2
            ">
            Details
          </TabsTrigger>
        </TabsList>

        {/* Tab Content with scroll */}
        <div className="flex-1 overflow-hidden">
          <TabsContent value="overview" className="h-full m-0 p-4 overflow-y-auto">
            <CastMemberOverview castMember={castMember} tmdbPerson={tmdbPerson} isLoading={isLoading} isMobile={isMobile} />
          </TabsContent>
          
          <TabsContent value="filmography" className="h-full m-0 p-4 overflow-y-auto">
            <CastMemberFilmography movieCredits={movieCredits} tvCredits={tvCredits} isLoading={isLoading} isMobile={isMobile} />
          </TabsContent>
          
          <TabsContent value="details" className="h-full m-0 p-4 overflow-y-auto">
            <CastMemberDetails castMember={castMember} tmdbPerson={tmdbPerson} isLoading={isLoading} isMobile={isMobile} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default CastMemberDialogTabs;
