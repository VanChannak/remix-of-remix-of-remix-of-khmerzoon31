import { Film, Tv, LayoutDashboard, Settings, Users, Shield, MessageSquare, Flag, BarChart3, Star, Radio, Calendar, Server, FileText, Grid3x3, Palette, Globe, Circle, UserCog, CreditCard, DollarSign, Lightbulb, Bell, HardDrive } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

const mainNavItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { title: "Featured", icon: Star, path: "/admin/featured" },
];

const contentItems = [
  { title: "Movies", icon: Film, path: "/admin/movies" },
  { title: "Series", icon: Tv, path: "/admin/series" },
  { title: "Animes", icon: Circle, path: "/admin/animes" },
  { title: "Media Manager", icon: HardDrive, path: "/admin/media-manager" },
  { title: "Streaming", icon: Radio, path: "/admin/streaming" },
  { title: "Upcoming", icon: Calendar, path: "/admin/upcoming" },
  { title: "Servers & DRM", icon: Server, path: "/admin/servers-drm" },
  { title: "Headers & User Agents", icon: FileText, path: "/admin/headers" },
  { title: "Streaming Categories", icon: Grid3x3, path: "/admin/streaming-categories" },
  { title: "Genres", icon: Palette, path: "/admin/genres" },
  { title: "Languages", icon: Globe, path: "/admin/languages" },
  { title: "Collections", icon: Circle, path: "/admin/collections" },
  { title: "Networks", icon: Circle, path: "/admin/networks" },
];

const userManagementItems = [
  { title: "Casters", icon: UserCog, path: "/admin/casters" },
  { title: "Users", icon: Users, path: "/admin/users" },
  { title: "Comments", icon: MessageSquare, path: "/admin/comments" },
  { title: "Subscriptions & Coupon", icon: CreditCard, path: "/admin/subscriptions" },
];

const systemItems = [
  { title: "Ad Manager", icon: DollarSign, path: "/admin/ad-manager" },
  { title: "Reports", icon: Flag, path: "/admin/reports" },
  { title: "User Reports", icon: Flag, path: "/admin/user-reports" },
  { title: "Suggestions", icon: Lightbulb, path: "/admin/suggestions" },
  { title: "Notifications", icon: Bell, path: "/admin/notifications" },
  { title: "Analytics", icon: BarChart3, path: "/admin/analytics" },
  { title: "Moderators", icon: Shield, path: "/admin/moderators" },
  { title: "Settings", icon: Settings, path: "/admin/settings" },
];

export function AdminSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <Sidebar className={open ? "w-60 mt-16" : "w-20 mt-16"} collapsible="icon">
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <SidebarContent className="pb-4">
          <SidebarGroup className="pt-4">
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={currentPath === item.path}>
                      <NavLink 
                        to={item.path}
                        end={item.path === "/admin"}
                        className={open ? "hover:bg-sidebar-accent" : "hover:bg-sidebar-accent flex-col h-auto py-3 gap-1"}
                        activeClassName="bg-sidebar-accent"
                      >
                        <item.icon className="h-4 w-4" />
                        <span className={open ? "" : "text-[10px] font-normal"}>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Content</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {contentItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={currentPath === item.path}>
                      <NavLink 
                        to={item.path}
                        className={open ? "hover:bg-sidebar-accent" : "hover:bg-sidebar-accent flex-col h-auto py-3 gap-1"}
                        activeClassName="bg-sidebar-accent"
                      >
                        <item.icon className="h-4 w-4" />
                        <span className={open ? "" : "text-[10px] font-normal"}>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>User Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {userManagementItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={currentPath === item.path}>
                      <NavLink 
                        to={item.path}
                        className={open ? "hover:bg-sidebar-accent" : "hover:bg-sidebar-accent flex-col h-auto py-3 gap-1"}
                        activeClassName="bg-sidebar-accent"
                      >
                        <item.icon className="h-4 w-4" />
                        <span className={open ? "" : "text-[10px] font-normal"}>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>System</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {systemItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={currentPath === item.path}>
                      <NavLink 
                        to={item.path}
                        className={open ? "hover:bg-sidebar-accent" : "hover:bg-sidebar-accent flex-col h-auto py-3 gap-1"}
                        activeClassName="bg-sidebar-accent"
                      >
                        <item.icon className="h-4 w-4" />
                        <span className={open ? "" : "text-[10px] font-normal"}>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </ScrollArea>
    </Sidebar>
  );
}
