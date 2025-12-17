import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

export default function AdCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const adType = searchParams.get("type") || "manual";
  
  const [formData, setFormData] = useState({
    ad_type: adType,
    title: "",
    description: "",
    image_url: "",
    link_url: "",
    placement: "homepage",
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: "",
    is_active: true,
    adsense_code: "",
    image_type: "",
    device: "",
    ad_format: "",
    video_url: "",
    video_type: "",
    skip_after_seconds: 5,
    midroll_time_seconds: 120,
    rotation_interval_seconds: 30,
    show_close_button: true,
    auto_play: true,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        start_date: data.start_date || undefined,
        end_date: data.end_date || null,
      };
      
      const { error } = await supabase
        .from("ads")
        .insert([payload]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      toast.success("Ad created successfully");
      navigate("/admin/ad-manager");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create ad");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.placement) {
      toast.error("Title and placement are required");
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/ad-manager")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Add Advertisement</h1>
            <p className="text-muted-foreground">Create a new advertisement for your platform</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Advertisement Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ad title"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ad description"
                  rows={2}
                />
              </div>

              {formData.ad_type === "manual" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="image_type">Image Type *</Label>
                      <Select
                        value={formData.image_type}
                        onValueChange={(value) => setFormData({ ...formData, image_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select image type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">Portrait</SelectItem>
                          <SelectItem value="landscape">Landscape</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="device">Device *</Label>
                      <Select
                        value={formData.device}
                        onValueChange={(value) => setFormData({ ...formData, device: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select device" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="web">Web</SelectItem>
                          <SelectItem value="app">App</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="ad_format">Type *</Label>
                    <Select
                      value={formData.ad_format}
                      onValueChange={(value) => setFormData({ ...formData, ad_format: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ad format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="banner">Banner</SelectItem>
                        <SelectItem value="script">Script</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="image_url">Image URL</Label>
                      <Input
                        id="image_url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="link_url">Link URL</Label>
                      <Input
                        id="link_url"
                        value={formData.link_url}
                        onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </>
              )}

              {formData.ad_type === "adsense" && (
                <div className="space-y-2">
                  <Label htmlFor="adsense_code">Google AdSense Code *</Label>
                  <Textarea
                    id="adsense_code"
                    value={formData.adsense_code}
                    onChange={(e) => setFormData({ ...formData, adsense_code: e.target.value })}
                    placeholder="Paste your AdSense ad unit code here (e.g., <ins class='adsbygoogle'...)"
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>
              )}

              {formData.ad_type === "video" && (
                <>
                  <div>
                    <Label htmlFor="video_type">Video Type *</Label>
                    <Select
                      value={formData.video_type}
                      onValueChange={(value) => setFormData({ ...formData, video_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select video type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Pre-roll Video Ad</SelectItem>
                        <SelectItem value="popup">Overlay/Popup Ad</SelectItem>
                        <SelectItem value="banner">Banner Ad (Player)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="video_url">Video URL</Label>
                    <Input
                      id="video_url"
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="placement">Placement *</Label>
                    <Select
                      value={formData.placement}
                      onValueChange={(value) => setFormData({ ...formData, placement: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video_player">Video Player</SelectItem>
                        <SelectItem value="homepage">Homepage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="skip_after_seconds">Skip After (seconds)</Label>
                      <Input
                        id="skip_after_seconds"
                        type="number"
                        min="0"
                        max="60"
                        value={formData.skip_after_seconds}
                        onChange={(e) => setFormData({ ...formData, skip_after_seconds: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Seconds before skip button appears (0-60)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="midroll_time_seconds">Mid-roll Time (seconds)</Label>
                      <Input
                        id="midroll_time_seconds"
                        type="number"
                        min="0"
                        max="3600"
                        value={formData.midroll_time_seconds}
                        onChange={(e) => setFormData({ ...formData, midroll_time_seconds: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        When to show overlay ad (0-3600)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto_play"
                      checked={formData.auto_play}
                      onCheckedChange={(checked) => setFormData({ ...formData, auto_play: checked })}
                    />
                    <Label htmlFor="auto_play" className="cursor-pointer">Auto-play video ad</Label>
                  </div>
                </>
              )}

              {formData.ad_type === "manual" && (
                <div>
                  <Label htmlFor="rotation_interval">Ad Rotation Interval (seconds)</Label>
                  <Input
                    id="rotation_interval"
                    type="number"
                    min="5"
                    max="300"
                    value={formData.rotation_interval_seconds}
                    onChange={(e) => setFormData({ ...formData, rotation_interval_seconds: parseInt(e.target.value) || 30 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    How often to rotate ads (5-300 seconds)
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>


              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show_close_button"
                    checked={formData.show_close_button}
                    onCheckedChange={(checked) => setFormData({ ...formData, show_close_button: checked })}
                  />
                  <Label htmlFor="show_close_button" className="cursor-pointer">Show Close Button</Label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate("/admin/ad-manager")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {saveMutation.isPending ? "Creating..." : "Create Advertisement"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AdminLayout>
  );
}
