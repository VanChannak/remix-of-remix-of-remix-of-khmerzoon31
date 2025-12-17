import { lazy, Suspense, useState } from "react";
import { Header } from "@/components/public/Header";
import { Hero } from "@/components/public/Hero";
import { AuthProvider } from "@/hooks/useAuth";
import { AdDisplay } from "@/components/ads/AdDisplay";
import { useIsTablet } from "@/hooks/use-tablet";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { RefreshCw } from "lucide-react";

// Lazy load sections below the fold
const TrendingSection = lazy(() => import("@/components/public/TrendingSection").then(m => ({
  default: m.TrendingSection
})));
const ContinueWatchingSection = lazy(() => import("@/components/public/ContinueWatchingSection").then(m => ({
  default: m.ContinueWatchingSection
})));
const RecommendedSection = lazy(() => import("@/components/public/RecommendedSection").then(m => ({
  default: m.RecommendedSection
})));
const LatestAnime = lazy(() => import("@/components/public/LatestAnime").then(m => ({
  default: m.LatestAnime
})));
const NewSeriesSection = lazy(() => import("@/components/public/NewSeriesSection").then(m => ({
  default: m.NewSeriesSection
})));
const NewMoviesSection = lazy(() => import("@/components/public/NewMoviesSection").then(m => ({
  default: m.NewMoviesSection
})));
const ComingSoonSection = lazy(() => import("@/components/public/ComingSoonSection").then(m => ({
  default: m.ComingSoonSection
})));

// Loading fallback component
const SectionLoader = () => <section className="py-8">
    <div className="max-w-[1600px] mx-auto px-4 md:px-6">
      <div className="h-8 w-48 bg-secondary animate-pulse rounded-lg mb-6" />
      <div className="flex gap-4 overflow-hidden">
        {[...Array(6)].map((_, i) => <div key={i} className="min-w-[200px] h-[320px] bg-secondary animate-pulse rounded-lg" />)}
      </div>
    </div>
  </section>;
const Index = () => {
  const isTablet = useIsTablet();
  const isMobile = useIsMobile();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshKey(prev => prev + 1);
  };

  const { isPulling, pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  const showPullToRefresh = isMobile || isTablet;
  
  return <AuthProvider>
      <div className="min-h-screen bg-background">
        <Header />
        {showPullToRefresh && (
          <div
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-300 pointer-events-none"
            style={{
              transform: `translateY(${Math.min(pullDistance, 80)}px)`,
              opacity: Math.min(pullDistance / 80, 1),
            }}
          >
            <div className="bg-primary/90 backdrop-blur-md rounded-full p-3 shadow-lg">
              <RefreshCw
                className={`w-5 h-5 text-primary-foreground ${isRefreshing ? 'animate-spin' : ''}`}
                style={{
                  transform: `rotate(${pullDistance * 2}deg)`,
                }}
              />
            </div>
          </div>
        )}
        
        {/* Hero Section */}
        <Hero key={`hero-${refreshKey}`} />
        
        {/* Trending Section */}
        <Suspense fallback={<SectionLoader />}>
          <TrendingSection key={`trending-${refreshKey}`} />
        </Suspense>
        
        {/* Homepage Banner Ad */}
        <div className={`max-w-[1600px] mx-auto ${isTablet ? 'px-2' : 'px-4 md:px-6 py-2'}`}>
          <AdDisplay placement="banner" device="web" />
        </div>
        
        <Suspense fallback={<SectionLoader />}>
          <ContinueWatchingSection key={`continue-${refreshKey}`} />
        </Suspense>
        
        <Suspense fallback={<SectionLoader />}>
          <RecommendedSection key={`recommended-${refreshKey}`} />
        </Suspense>
        
        <Suspense fallback={<SectionLoader />}>
          <NewSeriesSection key={`new-series-${refreshKey}`} />
        </Suspense>
        
        <Suspense fallback={<SectionLoader />}>
          <NewMoviesSection key={`new-movies-${refreshKey}`} />
        </Suspense>
        
        <Suspense fallback={<SectionLoader />}>
          <ComingSoonSection key={`coming-${refreshKey}`} />
        </Suspense>

        <footer className="border-t border-border py-6 mt-8 max-md:mt-4 bg-secondary/30">
          <div className="max-w-[1600px] mx-auto px-4 md:px-6 text-center text-sm text-muted-foreground transition-all duration-300">
            <p>© 2025 KHMERZOON. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </AuthProvider>;
};
export default Index;