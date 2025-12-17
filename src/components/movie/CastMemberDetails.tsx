import React from "react";
import { Users, User, Globe, Award, Calendar, MapPin } from "lucide-react";
import { formatDate, getAge, getGenderLabel } from "./utils";

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

interface CastMemberDetailsProps {
  castMember: CastMember;
  tmdbPerson: TMDBPerson | null;
  isLoading: boolean;
  isMobile: boolean;
}

const CastMemberDetails = ({ castMember, tmdbPerson, isLoading, isMobile }: CastMemberDetailsProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4 pb-6">
        {/* Personal Information Skeleton */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
          <div className="h-6 w-48 bg-gray-700/50 rounded animate-pulse mb-4" />
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-700/20 rounded-lg border border-gray-600/20">
                <div className="w-4 h-4 bg-gray-600/50 rounded animate-pulse" />
                <div className="flex-1">
                  <div className="h-3 w-16 bg-gray-700/50 rounded animate-pulse mb-1" />
                  <div className="h-4 w-24 bg-gray-600/50 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Also Known As Skeleton */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
          <div className="h-6 w-32 bg-gray-700/50 rounded animate-pulse mb-3" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-7 w-20 bg-gray-700/50 rounded-full animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!tmdbPerson) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-400 text-center">
          <User size={40} className="mx-auto mb-3 text-gray-600" />
          <div className="text-lg mb-2">No detailed information available</div>
          <div className="text-sm">Check back later for more details</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Personal Information */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
        <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold mb-4 flex items-center gap-2 text-white`}>
          <Users size={20} className="text-cyan-500" />
          Personal Information
        </h3>
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
          {tmdbPerson.known_for_department && (
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-600/20 to-yellow-700/10 rounded-lg border border-yellow-500/30">
              <Award size={16} className="text-yellow-400 flex-shrink-0" />
              <div>
                <span className="text-gray-400 text-xs block">Known For</span>
                <p className="font-semibold text-white text-sm">{tmdbPerson.known_for_department}</p>
              </div>
            </div>
          )}
          
          {tmdbPerson.birthday && (
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-600/20 to-blue-700/10 rounded-lg border border-blue-500/30">
              <Calendar size={16} className="text-blue-400 flex-shrink-0" />
              <div>
                <span className="text-gray-400 text-xs block">Birthday</span>
                <p className="font-semibold text-white text-sm">{formatDate(tmdbPerson.birthday)}</p>
                {getAge(tmdbPerson.birthday) && (
                  <p className="text-xs text-gray-400">({getAge(tmdbPerson.birthday)})</p>
                )}
              </div>
            </div>
          )}
          
          {tmdbPerson.place_of_birth && (
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-600/20 to-green-700/10 rounded-lg border border-green-500/30">
              <MapPin size={16} className="text-green-400 flex-shrink-0" />
              <div>
                <span className="text-gray-400 text-xs block">Place of Birth</span>
                <p className="font-semibold text-white text-sm">{tmdbPerson.place_of_birth}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-600/20 to-purple-700/10 rounded-lg border border-purple-500/30">
            <User size={16} className="text-purple-400 flex-shrink-0" />
            <div>
              <span className="text-gray-400 text-xs block">Gender</span>
              <p className="font-semibold text-white text-sm">{getGenderLabel(tmdbPerson.gender)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Also Known As */}
      {tmdbPerson.also_known_as && tmdbPerson.also_known_as.length > 0 && (
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
          <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold mb-3 flex items-center gap-2 text-white`}>
            <Globe size={20} className="text-cyan-500" />
            Also Known As
          </h3>
          <div className="flex flex-wrap gap-2">
            {tmdbPerson.also_known_as.map((name, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-700/50 rounded-full text-sm text-gray-300"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* External Links */}
      {tmdbPerson.homepage && (
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
          <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold mb-3 flex items-center gap-2 text-white`}>
            <Globe size={20} className="text-cyan-500" />
            External Links
          </h3>
          <a
            href={tmdbPerson.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 text-sm underline"
          >
            Official Website
          </a>
        </div>
      )}
    </div>
  );
};

export default CastMemberDetails;
