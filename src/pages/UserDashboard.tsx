import { useState, useEffect } from "react";
import { Header } from "@/components/public/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { RentalHistory } from "@/components/dashboard/RentalHistory";
import { ActivityTab } from "@/components/dashboard/ActivityTab";
import { WalletCard } from "@/components/wallet/WalletCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Clock, Film, Tv, Settings, Crown, MapPin, Link as LinkIcon, Facebook, Twitter, Instagram, Youtube, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProfileImageUpload } from "@/components/dashboard/ProfileImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { useProfileImage } from "@/hooks/useProfileImage";
import { Skeleton } from "@/components/ui/skeleton";

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user?.id || !user?.email) return;
    
    try {
      // First try to get existing profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      // If no profile exists, create one
      if (!data) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            display_name: user.email.split('@')[0],
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          return;
        }
        
        setProfileData(newProfile);
      } else {
        setProfileData(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const userStats = [
    { title: "Movies Watched", value: "24", icon: Film, trend: "+3 this week", color: "text-cyan-500" },
    { title: "Series Watched", value: "8", icon: Tv, trend: "+1 this week", color: "text-purple-500" },
    { title: "Favorites", value: "16", icon: Heart, trend: "+2 this week", color: "text-pink-500" },
    { title: "Watch Time", value: "127h", icon: Clock, trend: "+12h this week", color: "text-blue-500" },
  ];

  // Fetch signed URLs for profile images
  const { signedUrl: profileImageUrl, loading: profileLoading } = useProfileImage({ 
    imagePath: profileData?.profile_picture_url, 
    userId: user?.id 
  });
  const { signedUrl: coverImageUrl, loading: coverLoading } = useProfileImage({ 
    imagePath: profileData?.cover_picture_url, 
    userId: user?.id 
  });

  const socialLinks = profileData?.social_links as any || {};

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Facebook-style Cover and Profile Header */}
      <div className="pt-16">
        {/* Cover Photo */}
        <ProfileImageUpload 
          type="cover" 
          currentImage={profileData?.cover_picture_url}
          onUploadSuccess={loadProfile}
        >
          <div className="relative w-full h-[300px] md:h-[400px] bg-gradient-to-br from-primary/20 via-secondary to-accent/20 overflow-hidden">
            {coverLoading ? (
              <Skeleton className="w-full h-full" />
            ) : coverImageUrl ? (
              <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1536440136628-849c177e76a1')] bg-cover bg-center opacity-40" />
            )}
          </div>
        </ProfileImageUpload>
        
        {/* Profile Section */}
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          <div className="relative -mt-16 md:-mt-20 pb-6 border-b border-border">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-end">
              {/* Profile Picture */}
              <ProfileImageUpload 
                type="profile" 
                currentImage={profileData?.profile_picture_url}
                onUploadSuccess={loadProfile}
              >
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background bg-secondary flex items-center justify-center text-4xl md:text-5xl font-bold text-primary shadow-lg overflow-hidden">
                  {profileLoading ? (
                    <Skeleton className="w-full h-full rounded-full" />
                  ) : profileImageUrl ? (
                    <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user?.email?.charAt(0).toUpperCase()
                  )}
                </div>
              </ProfileImageUpload>
              
              {/* User Info */}
              <div className="flex-1 text-center md:text-left pb-4">
                <h1 className="text-3xl md:text-4xl font-bold mb-1">
                  {profileData?.display_name || user?.email?.split('@')[0]}
                </h1>
                {profileData?.bio && (
                  <p className="text-muted-foreground mb-2">{profileData.bio}</p>
                )}
                <div className="flex flex-wrap gap-4 justify-center md:justify-start mt-3">
                  {profileData?.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {profileData.location}
                    </div>
                  )}
                  {profileData?.website && (
                    <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                      <LinkIcon className="h-4 w-4" />
                      Website
                    </a>
                  )}
                  {socialLinks.facebook && (
                    <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <Facebook className="h-4 w-4" />
                    </a>
                  )}
                  {socialLinks.twitter && (
                    <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <Twitter className="h-4 w-4" />
                    </a>
                  )}
                  {socialLinks.instagram && (
                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <Instagram className="h-4 w-4" />
                    </a>
                  )}
                  {socialLinks.youtube && (
                    <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <Youtube className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-3 pb-4">
                <Button variant="outline" onClick={() => navigate("/dashboard/subscriptions")}>
                  <Crown className="h-4 w-4 mr-2 text-primary" />
                  Upgrade to VIP
                </Button>
                <Button variant="outline" onClick={() => navigate("/profile-settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                  <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="wallet" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                    <Wallet className="h-4 w-4 mr-2" />
                    Wallet
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                    Activity
                  </TabsTrigger>
                  <TabsTrigger value="rentals" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                    Rentals
                  </TabsTrigger>
                  <TabsTrigger value="favorites" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                    Favorites
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
      
      <main className="pb-12 px-4 max-w-[1600px] mx-auto mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {userStats.map((stat, index) => (
                <Card key={index} className="border-border/50 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                      <Badge variant="secondary" className="text-xs">{stat.trend}</Badge>
                    </div>
                    <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <ActivityTab />
          </TabsContent>

          <TabsContent value="wallet">
            <WalletCard />
          </TabsContent>

          <TabsContent value="rentals">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Your Rentals</CardTitle>
                <CardDescription>Track your rented content and access status</CardDescription>
              </CardHeader>
              <CardContent>
                <RentalHistory />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Your Favorites</CardTitle>
                <CardDescription>Content you've marked as favorite</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">No favorites yet</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default UserDashboard;
