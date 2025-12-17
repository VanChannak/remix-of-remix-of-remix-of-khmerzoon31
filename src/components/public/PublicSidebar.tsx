import { Home, User, Heart, FolderOpen, Play, Tv, Film, ShoppingBag, Crown, Gamepad2, TrendingUp, Radio, Trophy, Circle, Clock } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import logoIcon from "@/assets/logo-icon.png";

const menuItems = [
  { title: "My Feed", icon: Home, path: "/" },
  { title: "Dashboard", icon: User, path: "/dashboard" },
  { title: "Liked", icon: Heart, path: "/liked" },
  { title: "Collections", icon: FolderOpen, path: "/collections" },
  { title: "Coming Soon", icon: Clock, path: "/coming-soon" },
  { title: "Shorts", icon: Play, path: "/shorts" },
  { title: "Series", icon: Tv, path: "/series" },
  { title: "Movies", icon: Film, path: "/movies" },
  { title: "Anime", icon: Circle, path: "/anime/latest" },
  { title: "Shop", icon: ShoppingBag, path: "/shop" },
  { title: "Premium", icon: Crown, path: "/premium" },
  { title: "Gaming", icon: Gamepad2, path: "/gaming" },
  { title: "Finance & Crypto", icon: TrendingUp, path: "/finance" },
  { title: "LIVE", icon: Radio, path: "/live", badge: "LIVE" },
  { title: "Sports", icon: Trophy, path: "/sports" },
];

interface PublicSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PublicSidebar({ open, onOpenChange }: PublicSidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0 bg-background border-r border-border">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
          <img src={logoIcon} alt="Logo" className="h-8 w-8" />
          <h2 className="text-xl font-bold">
            KHMER<span className="text-primary">ZOON</span>
          </h2>
        </div>
        
        <nav className="flex flex-col py-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-6 py-3 hover:bg-secondary/50 transition-colors relative"
              activeClassName="bg-primary text-primary-foreground hover:bg-primary"
              onClick={() => onOpenChange(false)}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-destructive text-destructive-foreground">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
