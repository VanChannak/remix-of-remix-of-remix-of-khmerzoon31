import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function UserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    role: "user",
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      
      if (profileError) throw profileError;

      const { data: role, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", id)
        .single();
      
      return { ...profile, role: role?.role || "user" };
    },
  });

  const { data: subscriptions } = useQuery({
    queryKey: ["user-subscriptions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*, subscription_plans(name, price)")
        .eq("user_id", id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: watchHistory } = useQuery({
    queryKey: ["watch-history", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("watch_history")
        .select("*")
        .eq("user_id", id)
        .order("last_watched_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (user) {
      setFormData({
        role: user.role || "user",
      });
    }
  }, [user]);

  const updateRoleMutation = useMutation({
    mutationFn: async (newRole: string) => {
      // Delete existing role
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", id);

      // Insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert([{ user_id: id, role: newRole as "admin" | "user" }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      toast.success("User role updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update role");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRoleMutation.mutate(formData.role);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-8 flex items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/users")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">User Details</h1>
            <p className="text-muted-foreground">Manage user information and permissions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">User ID</Label>
                <p className="font-mono text-xs">{user?.id}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Joined</Label>
                <p>{format(new Date(user?.created_at), "MMM dd, yyyy")}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
                <div>
                  <Label htmlFor="role">User Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={updateRoleMutation.isPending}>
                  {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Active Subscriptions</CardTitle>
              <CardDescription>User's subscription history</CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptions && subscriptions.length > 0 ? (
                <div className="space-y-3">
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{(sub.subscription_plans as any)?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(sub.start_date), "MMM dd, yyyy")} - {format(new Date(sub.end_date), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={sub.is_active ? "default" : "secondary"}>
                          {sub.is_active ? "Active" : "Expired"}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1 capitalize">{sub.payment_status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No subscriptions</p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Recent Watch History</CardTitle>
              <CardDescription>Last 10 items watched</CardDescription>
            </CardHeader>
            <CardContent>
              {watchHistory && watchHistory.length > 0 ? (
                <div className="space-y-2">
                  {watchHistory.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="text-sm">
                          {item.movie_id ? "Movie" : "Episode"} ID: {item.movie_id || item.episode_id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.last_watched_at), "MMM dd, yyyy HH:mm")}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={item.completed ? "default" : "secondary"}>
                          {Math.round((item.progress / item.duration) * 100)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No watch history</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
