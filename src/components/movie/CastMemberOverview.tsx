import React from "react";
import { User, Calendar, MapPin, Star } from "lucide-react";
import { formatDate, getAge } from "./utils";

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

interface CastMemberOverviewProps {
  castMember: CastMember;
  tmdbPerson: TMDBPerson | null;
  isLoading: boolean;
  isMobile: boolean;
}

const CastMemberOverview = ({
  castMember,
  tmdbPerson,
  isLoading,
  isMobile
}: CastMemberOverviewProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Personal Information Skeleton */}
        <div className="bg-gray-800/20 backdrop-blur-md rounded-xl p-4 border border-gray-700/30">
          <div className="h-6 w-48 bg-gray-700/50 rounded animate-pulse mb-4" />
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-700/20 backdrop-blur-sm rounded-lg border border-gray-600/20">
                <div className="w-4 h-4 bg-gray-600/50 rounded animate-pulse" />
                <div className="flex-1">
                  <div className="h-3 w-16 bg-gray-700/50 rounded animate-pulse mb-1" />
                  <div className="h-4 w-24 bg-gray-600/50 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Biography Skeleton */}
        <div className="bg-gray-800/20 backdrop-blur-md rounded-xl p-4 border border-gray-700/30">
          <div className="h-6 w-32 bg-gray-700/50 rounded animate-pulse mb-3" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-700/50 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-700/50 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-700/50 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Personal Information Card */}
      <div className="bg-gray-800/20 backdrop-blur-md rounded-xl p-4 border border-gray-700/30">
        <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold mb-4 flex items-center gap-2 text-white`}>
          <User size={20} className="text-cyan-500" />
          Personal Information
        </h3>
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
          {tmdbPerson?.birthday && (
            <div className="flex items-center gap-3 p-3 bg-gray-700/20 backdrop-blur-sm rounded-lg border border-gray-600/20">
              <Calendar size={16} className="text-blue-400 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-400">Birthday</div>
                <div className="font-semibold text-sm">{formatDate(tmdbPerson.birthday)}</div>
                {getAge(tmdbPerson.birthday) && (
                  <div className="text-xs text-gray-400">({getAge(tmdbPerson.birthday)})</div>
                )}
              </div>
            </div>
          )}
          
          {tmdbPerson?.place_of_birth && (
            <div className="flex items-center gap-3 p-3 bg-gray-700/20 backdrop-blur-sm rounded-lg border border-gray-600/20">
              <MapPin size={16} className="text-green-400 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-400">Place of Birth</div>
                <div className="font-semibold text-sm">{tmdbPerson.place_of_birth}</div>
              </div>
            </div>
          )}
          
          {tmdbPerson?.known_for_department && (
            <div className="flex items-center gap-3 p-3 bg-gray-700/20 backdrop-blur-sm rounded-lg border border-gray-600/20">
              <Star size={16} className="text-yellow-400 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-400">Known For</div>
                <div className="font-semibold text-sm">{tmdbPerson.known_for_department}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Biography Section */}
      {tmdbPerson?.biography && (
        <div className="bg-gray-800/20 backdrop-blur-md rounded-xl p-4 border border-gray-700/30">
          <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold mb-3 text-white`}>
            Biography
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
            {tmdbPerson.biography}
          </p>
        </div>
      )}

      {/* Role in Movie */}
      <div className="bg-gray-800/20 backdrop-blur-md rounded-xl p-4 border border-gray-700/30">
        <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold mb-3 text-white`}>
          About
        </h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          {castMember.actor_name} plays the role of {castMember.character_name || 'a character'} in this production.
        </p>
      </div>
    </div>
  );
};

export default CastMemberOverview;
