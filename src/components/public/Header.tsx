import { Search, Radio, Shuffle, Newspaper, MessageSquare, SlidersHorizontal, LogOut, Shield, Crown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PublicSidebar } from "@/components/public/PublicSidebar";
import logoIcon from "@/assets/logo-icon.png";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SubscriptionDialog } from "@/components/subscription/SubscriptionDialog";
import { supabase } from "@/integrations/supabase/client";
import { useProfileImage } from "@/hooks/useProfileImage";

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const navigate = useNavigate();
  const {
    user,
    isAdmin,
    signOut
  } = useAuth();

  // Get signed URL for profile picture
  const { signedUrl: profileImageUrl } = useProfileImage({ 
    imagePath: profileData?.profile_picture_url,
    userId: user?.id 
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, profile_picture_url')
        .eq('id', user?.id)
        .single();
      
      setProfileData(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const getDisplayName = () => {
    if (profileData?.display_name) return profileData.display_name;
    return user?.email?.split('@')[0] || 'User';
  };

  return <>
      <PublicSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-background/95 backdrop-blur-xl border-b border-border shadow-lg" : "bg-transparent border-b border-transparent"}`}>
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 transition-all duration-300">
          <div className="flex h-16 items-center justify-between gap-4 rounded-none">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="text-foreground hover:text-primary transition-colors" aria-label="Open menu">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 1024 1024" className="h-6 w-6">
                  <path fill="currentColor" d="M704 192h160v736H160V192h160v64h384v-64zM288 512h448v-64H288v64zm0 256h448v-64H288v64zm96-576V96h256v96H384z" />
                </svg>
              </button>
              <img src={logoIcon} alt="Logo" className="h-8 w-8" />
              <h1 className="text-2xl font-bold text-foreground whitespace-nowrap cursor-pointer" onClick={() => navigate("/")}>
                KHMER<span className="text-primary">ZOON</span>
              </h1>
            </div>

          <div className="flex items-center gap-3 flex-1 justify-center max-w-2xl">
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search anime..." className="w-full pl-10 pr-20 bg-secondary/50 border-border/50 backdrop-blur focus:border-primary/50 transition-colors" />
              <Button size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 bg-primary hover:bg-primary/90">
                <SlidersHorizontal className="h-4 w-4 mr-1" />
                Filter
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="hidden xl:flex bg-transparent border border-primary/30 hover:border-primary hover:bg-primary/5" title="Watch2gether">
              <Radio className="h-4 w-4 text-primary" />
            </Button>
            <Button size="icon" variant="ghost" className="hidden xl:flex bg-transparent border border-primary/30 hover:border-primary hover:bg-primary/5" title="Random">
              <Shuffle className="h-4 w-4 text-primary" />
            </Button>
            <Button size="icon" variant="ghost" className="hidden lg:flex bg-transparent border border-primary/30 hover:border-primary hover:bg-primary/5" title="News">
              <Newspaper className="h-4 w-4 text-primary" />
            </Button>
            <Button size="icon" variant="ghost" className="hidden lg:flex bg-transparent border border-primary/30 hover:border-primary hover:bg-primary/5" title="Community">
              <MessageSquare className="h-4 w-4 text-primary" />
            </Button>
            <ThemeToggle />
            
            <Button 
              variant="outline" 
              className="bg-transparent border border-primary/30 hover:border-primary hover:bg-primary/5 text-primary whitespace-nowrap hidden md:flex gap-2"
              onClick={() => setShowSubscriptionDialog(true)}
            >
              <Crown className="h-4 w-4" />
              Join VIP
            </Button>
            
            {user ? <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-transparent border border-primary/30 hover:border-primary hover:bg-primary/5 text-primary whitespace-nowrap flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={profileImageUrl || undefined} alt={getDisplayName()} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span>{getDisplayName()}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <Shield className="mr-2 h-4 w-4" />
                    My Dashboard
                  </DropdownMenuItem>
                  {isAdmin && <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    </>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> : <Button variant="outline" className="bg-transparent border border-primary/30 hover:border-primary hover:bg-primary/5 text-primary whitespace-nowrap" onClick={() => navigate("/auth")}>
                Login
              </Button>}
          </div>
        </div>
      </div>
    </header>
    
    <SubscriptionDialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog} />
  </>;
};