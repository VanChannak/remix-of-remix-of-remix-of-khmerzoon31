import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageTransition } from "@/components/PageTransition";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PortraitLockProvider } from "@/components/PortraitLockProvider";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import AdAnalytics from "./pages/admin/AdAnalytics";
import Auth from "./pages/Auth";
import Users from "./pages/admin/Users";
import Moderators from "./pages/admin/Moderators";
import Comments from "./pages/admin/Comments";
import Reports from "./pages/admin/Reports";
import Analytics from "./pages/admin/Analytics";
import Settings from "./pages/admin/Settings";
import Movies from "./pages/admin/Movies";
import MoviesEdit from "./pages/admin/MoviesEdit";
import Series from "./pages/admin/Series";
import SeriesEdit from "./pages/admin/SeriesEdit";
import Featured from "./pages/admin/Featured";
import Animes from "./pages/admin/Animes";
import AnimesEdit from "./pages/admin/AnimesEdit";
import Streaming from "./pages/admin/Streaming";
import Upcoming from "./pages/admin/Upcoming";
import UpcomingCreate from "./pages/admin/UpcomingCreate";
import UpcomingEdit from "./pages/admin/UpcomingEdit";
import ServersDRM from "./pages/admin/ServersDRM";
import Headers from "./pages/admin/Headers";
import StreamingCategories from "./pages/admin/StreamingCategories";
import Genres from "./pages/admin/GenresManagement";
import Languages from "./pages/admin/Languages";
import Collections from "./pages/admin/Collections";
import Networks from "./pages/admin/Networks";
import Casters from "./pages/admin/Casters";
import CasterEdit from "./pages/admin/CasterEdit";
import UserEdit from "./pages/admin/UserEdit";
import Subscriptions from "./pages/admin/Subscriptions";
import AdManager from "./pages/admin/AdManager";
import AdCreate from "./pages/admin/AdCreate";
import AdEdit from "./pages/admin/AdEdit";
import Suggestions from "./pages/admin/Suggestions";
import Notifications from "./pages/admin/Notifications";
import NotFound from "./pages/NotFound";
import AnimeCharacters from "./pages/admin/AnimeCharacters";
import MediaManager from "./pages/admin/MediaManager";
import ComingSoonPage from "./pages/ComingSoonPage";
import LatestAnimePage from "./pages/LatestAnimePage";
import TopAnimePage from "./pages/TopAnimePage";
import TrendingAnimePage from "./pages/TrendingAnimePage";
import NewMoviesPage from "./pages/NewMoviesPage";
import NewSeriesPage from "./pages/NewSeriesPage";
import MoviesPage from "./pages/MoviesPage";
import SeriesPage from "./pages/SeriesPage";
import AnimePage from "./pages/AnimePage";
import Watch from "./pages/Watch";
import UserDashboard from "./pages/UserDashboard";
import UserSettings from "./pages/UserSettings";
import UserSubscriptions from "./pages/Subscriptions";
import ProfileSettings from "./pages/ProfileSettings";
import RentalHistory from "./pages/RentalHistory";
import Watchlist from "./pages/Watchlist";
import UserReports from "./pages/admin/UserReports";
import AdminLogin from "./pages/admin/AdminLogin";
import SettingsGeneral from "./pages/admin/SettingsGeneral";
import SettingsLogo from "./pages/admin/SettingsLogo";
import SettingsMaintenance from "./pages/admin/SettingsMaintenance";
import SettingsTemplates from "./pages/admin/SettingsTemplates";
import SettingsSitemap from "./pages/admin/SettingsSitemap";
import SettingsPolicy from "./pages/admin/SettingsPolicy";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><UserDashboard /></PageTransition>} />
        <Route path="/dashboard/subscriptions" element={<PageTransition><UserSubscriptions /></PageTransition>} />
        <Route path="/dashboard/rentals" element={<PageTransition><RentalHistory /></PageTransition>} />
        <Route path="/watchlist" element={<PageTransition><Watchlist /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><UserSettings /></PageTransition>} />
        <Route path="/profile-settings" element={<PageTransition><ProfileSettings /></PageTransition>} />
        <Route path="/coming-soon" element={<PageTransition><ComingSoonPage /></PageTransition>} />
        <Route path="/anime/latest" element={<PageTransition><LatestAnimePage /></PageTransition>} />
        <Route path="/anime/top" element={<PageTransition><TopAnimePage /></PageTransition>} />
        <Route path="/anime/trending" element={<PageTransition><TrendingAnimePage /></PageTransition>} />
        <Route path="/new-movies" element={<PageTransition><NewMoviesPage /></PageTransition>} />
        <Route path="/movies" element={<PageTransition><MoviesPage /></PageTransition>} />
        <Route path="/new-series" element={<PageTransition><NewSeriesPage /></PageTransition>} />
        <Route path="/series" element={<PageTransition><SeriesPage /></PageTransition>} />
        <Route path="/anime" element={<PageTransition><AnimePage /></PageTransition>} />
        {/* Watch routes */}
        <Route path="/watch/series/:id/:season/:episode" element={<PageTransition><Watch /></PageTransition>} />
        <Route path="/watch/:type/:id" element={<PageTransition><Watch /></PageTransition>} />
        {/* Admin login - public route */}
        <Route path="/admin/login" element={<PageTransition><AdminLogin /></PageTransition>} />
        <Route
          path="/admin" 
          element={
            <ProtectedRoute requireAdmin>
              <PageTransition><Admin /></PageTransition>
            </ProtectedRoute>
          } 
        />
        <Route path="/admin/featured" element={<ProtectedRoute requireAdmin><PageTransition><Featured /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/movies" element={<ProtectedRoute requireAdmin><PageTransition><Movies /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/movies/edit/:id" element={<ProtectedRoute requireAdmin><PageTransition><MoviesEdit /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/series" element={<ProtectedRoute requireAdmin><PageTransition><Series /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/series/edit/:id" element={<ProtectedRoute requireAdmin><PageTransition><SeriesEdit /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/animes" element={<ProtectedRoute requireAdmin><PageTransition><Animes /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/animes/edit/:id" element={<ProtectedRoute requireAdmin><PageTransition><AnimesEdit /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/animes/:id/characters" element={<ProtectedRoute requireAdmin><PageTransition><AnimeCharacters /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/streaming" element={<ProtectedRoute requireAdmin><PageTransition><Streaming /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/upcoming" element={<ProtectedRoute requireAdmin><PageTransition><Upcoming /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/upcoming/create" element={<ProtectedRoute requireAdmin><PageTransition><UpcomingCreate /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/upcoming/edit/:id" element={<ProtectedRoute requireAdmin><PageTransition><UpcomingEdit /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/servers-drm" element={<ProtectedRoute requireAdmin><PageTransition><ServersDRM /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/headers" element={<ProtectedRoute requireAdmin><PageTransition><Headers /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/streaming-categories" element={<ProtectedRoute requireAdmin><PageTransition><StreamingCategories /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/genres" element={<ProtectedRoute requireAdmin><PageTransition><Genres /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/languages" element={<ProtectedRoute requireAdmin><PageTransition><Languages /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/collections" element={<ProtectedRoute requireAdmin><PageTransition><Collections /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/networks" element={<ProtectedRoute requireAdmin><PageTransition><Networks /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/casters" element={<ProtectedRoute requireAdmin><PageTransition><Casters /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/casters/edit/:id" element={<ProtectedRoute requireAdmin><PageTransition><CasterEdit /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requireAdmin><PageTransition><Users /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/users/edit/:id" element={<ProtectedRoute requireAdmin><PageTransition><UserEdit /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/comments" element={<ProtectedRoute requireAdmin><PageTransition><Comments /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/subscriptions" element={<ProtectedRoute requireAdmin><PageTransition><Subscriptions /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/ad-manager" element={<ProtectedRoute requireAdmin><PageTransition><AdManager /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/ad-manager/create" element={<ProtectedRoute requireAdmin><PageTransition><AdCreate /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/ad-manager/edit/:id" element={<ProtectedRoute requireAdmin><PageTransition><AdEdit /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/ad-analytics" element={<ProtectedRoute requireAdmin><PageTransition><AdAnalytics /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute requireAdmin><PageTransition><Reports /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/user-reports" element={<ProtectedRoute requireAdmin><PageTransition><UserReports /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/suggestions" element={<ProtectedRoute requireAdmin><PageTransition><Suggestions /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute requireAdmin><PageTransition><Notifications /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute requireAdmin><PageTransition><Analytics /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/moderators" element={<ProtectedRoute requireAdmin><PageTransition><Moderators /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><PageTransition><Settings /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/settings/general" element={<ProtectedRoute requireAdmin><PageTransition><SettingsGeneral /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/settings/logo" element={<ProtectedRoute requireAdmin><PageTransition><SettingsLogo /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/settings/maintenance" element={<ProtectedRoute requireAdmin><PageTransition><SettingsMaintenance /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/settings/templates" element={<ProtectedRoute requireAdmin><PageTransition><SettingsTemplates /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/settings/sitemap" element={<ProtectedRoute requireAdmin><PageTransition><SettingsSitemap /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/settings/policy" element={<ProtectedRoute requireAdmin><PageTransition><SettingsPolicy /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/media-manager" element={<ProtectedRoute requireAdmin><PageTransition><MediaManager /></PageTransition></ProtectedRoute>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <PortraitLockProvider>
                  <AnimatedRoutes />
                </PortraitLockProvider>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;
