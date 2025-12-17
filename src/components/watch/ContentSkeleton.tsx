import { Skeleton } from "@/components/ui/skeleton";

export const CastSkeleton = () => {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 8 }).map((_, idx) => (
        <div key={idx} className="flex-shrink-0">
          <Skeleton className="w-24 h-36 rounded-lg" />
          <Skeleton className="h-3 w-20 mt-2 mx-auto" />
          <Skeleton className="h-3 w-16 mt-1 mx-auto" />
        </div>
      ))}
    </div>
  );
};

export const EpisodesSkeleton = () => {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 6 }).map((_, idx) => (
        <Skeleton key={idx} className="flex-shrink-0 w-48 aspect-video rounded-lg" />
      ))}
    </div>
  );
};

export const RecommendedSkeleton = ({ columns = 4 }: { columns?: number }) => {
  return (
    <div className={`grid grid-cols-${columns} gap-2`}>
      {Array.from({ length: 8 }).map((_, idx) => (
        <Skeleton key={idx} className="aspect-[2/3] rounded-lg" />
      ))}
    </div>
  );
};
