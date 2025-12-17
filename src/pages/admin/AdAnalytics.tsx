import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Eye, MousePointerClick, TrendingUp, DollarSign } from "lucide-react";

export default function AdAnalytics() {
  const { data: ads, isLoading } = useQuery({
    queryKey: ["ads-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-8">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </AdminLayout>
    );
  }

  const totalImpressions = ads?.reduce((sum, ad) => sum + (ad.impressions || 0), 0) || 0;
  const totalClicks = ads?.reduce((sum, ad) => sum + (ad.clicks || 0), 0) || 0;
  const averageCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";

  // Group by ad type
  const adTypeData = [
    {
      name: "Manual",
      impressions: ads?.filter(ad => ad.ad_type === "manual").reduce((sum, ad) => sum + (ad.impressions || 0), 0) || 0,
      clicks: ads?.filter(ad => ad.ad_type === "manual").reduce((sum, ad) => sum + (ad.clicks || 0), 0) || 0,
    },
    {
      name: "AdSense",
      impressions: ads?.filter(ad => ad.ad_type === "adsense").reduce((sum, ad) => sum + (ad.impressions || 0), 0) || 0,
      clicks: ads?.filter(ad => ad.ad_type === "adsense").reduce((sum, ad) => sum + (ad.clicks || 0), 0) || 0,
    },
    {
      name: "Video",
      impressions: ads?.filter(ad => ad.ad_type === "video").reduce((sum, ad) => sum + (ad.impressions || 0), 0) || 0,
      clicks: ads?.filter(ad => ad.ad_type === "video").reduce((sum, ad) => sum + (ad.clicks || 0), 0) || 0,
    },
  ];

  // Calculate CTR by ad type
  const ctrByType = adTypeData.map(type => ({
    name: type.name,
    ctr: type.impressions > 0 ? ((type.clicks / type.impressions) * 100).toFixed(2) : 0,
  }));

  // Top performing ads
  const topAds = [...(ads || [])]
    .sort((a, b) => {
      const ctrA = a.impressions > 0 ? (a.clicks / a.impressions) * 100 : 0;
      const ctrB = b.impressions > 0 ? (b.clicks / b.impressions) * 100 : 0;
      return ctrB - ctrA;
    })
    .slice(0, 5)
    .map(ad => ({
      name: ad.title.substring(0, 20) + (ad.title.length > 20 ? "..." : ""),
      impressions: ad.impressions || 0,
      clicks: ad.clicks || 0,
      ctr: ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : 0,
    }));

  const COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444"];

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Ad Analytics</h1>
          <p className="text-muted-foreground">Track ad performance and insights</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All time views</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total engagements</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average CTR</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageCTR}%</div>
              <p className="text-xs text-muted-foreground">Click-through rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Ads</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {ads?.filter(ad => ad.is_active).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Ad Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={adTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="impressions" fill="#8b5cf6" />
                  <Bar dataKey="clicks" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CTR by Ad Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ctrByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, ctr }) => `${name}: ${ctr}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="ctr"
                  >
                    {ctrByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Top Performing Ads</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={topAds}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="impressions" stroke="#8b5cf6" strokeWidth={2} />
                  <Line type="monotone" dataKey="clicks" stroke="#06b6d4" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
