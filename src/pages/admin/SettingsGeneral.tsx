import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, X, ArrowLeft, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface GeneralSettings {
  site_title: string;
  currency: string;
  currency_symbol: string;
  timezone: string;
  site_base_color: string;
  site_secondary_color: string;
  currency_format: string;
  items_per_page: number;
  currency_display_format: string;
  file_upload_server: string;
  video_skip_time: number;
  tmdb_api_key: string;
  default_genres: string[];
  pusher_app_id: string;
  pusher_app_key: string;
  pusher_app_secret: string;
  pusher_cluster: string;
  socket_app_uri: string;
}

const defaultSettings: GeneralSettings = {
  site_title: '',
  currency: 'USD',
  currency_symbol: '$',
  timezone: 'UTC',
  site_base_color: '#D50055',
  site_secondary_color: '#1B1B3F',
  currency_format: '20',
  items_per_page: 20,
  currency_display_format: 'symbol_text',
  file_upload_server: 'current',
  video_skip_time: 5,
  tmdb_api_key: '',
  default_genres: [],
  pusher_app_id: '',
  pusher_app_key: '',
  pusher_app_secret: '',
  pusher_cluster: 'ap2',
  socket_app_uri: '',
};

const timezones = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Phnom_Penh',
  'Australia/Sydney',
];

const currencyFormats = [
  { value: 'symbol_only', label: 'Show Symbol Only ($100)' },
  { value: 'text_only', label: 'Show Text Only (100 USD)' },
  { value: 'symbol_text', label: 'Show Currency Text and Symbol Both ($100 USD)' },
];

const itemsPerPageOptions = ['10', '20', '30', '50', '100'];

const fileUploadServers = [
  { value: 'current', label: 'Current Server' },
  { value: 'idrive', label: 'iDrive E2 Storage' },
  { value: 's3', label: 'Amazon S3' },
];

export default function SettingsGeneral() {
  const [settings, setSettings] = useState<GeneralSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newGenre, setNewGenre] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .eq('setting_key', 'general_settings')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
      }

      if (data?.setting_value) {
        const savedSettings = data.setting_value as unknown as GeneralSettings;
        setSettings({ ...defaultSettings, ...savedSettings });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', 'general_settings')
        .single();

      const settingsJson = JSON.parse(JSON.stringify(settings));

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({
            setting_value: settingsJson,
            updated_at: new Date().toISOString(),
          })
          .eq('setting_key', 'general_settings');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([{
            setting_key: 'general_settings',
            setting_value: settingsJson,
          }]);
        if (error) throw error;
      }
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof GeneralSettings>(
    key: K,
    value: GeneralSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const addGenre = () => {
    if (newGenre.trim() && !settings.default_genres.includes(newGenre.trim())) {
      updateSetting('default_genres', [...settings.default_genres, newGenre.trim()]);
      setNewGenre('');
    }
  };

  const removeGenre = (genre: string) => {
    updateSetting('default_genres', settings.default_genres.filter(g => g !== genre));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/settings')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">General Setting</h1>
            <p className="text-muted-foreground">Configure the fundamental information of the site</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Site Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Row 1: Site Title, Currency, Currency Symbol, Timezone */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="site_title">
                  Site Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="site_title"
                  value={settings.site_title}
                  onChange={(e) => updateSetting('site_title', e.target.value)}
                  placeholder="My Streaming Site"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">
                  Currency <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => updateSetting('currency', e.target.value)}
                  placeholder="USD"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency_symbol">
                  Currency Symbol <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="currency_symbol"
                  value={settings.currency_symbol}
                  onChange={(e) => updateSetting('currency_symbol', e.target.value)}
                  placeholder="$"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">
                  Timezone <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) => updateSetting('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Site Colors, Currency Format, Items per page */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="site_base_color">
                  Site Base Color <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <div
                    className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                    style={{ backgroundColor: settings.site_base_color }}
                    onClick={() => document.getElementById('base_color_input')?.click()}
                  />
                  <Input
                    id="base_color_input"
                    type="color"
                    value={settings.site_base_color}
                    onChange={(e) => updateSetting('site_base_color', e.target.value)}
                    className="sr-only"
                  />
                  <Input
                    value={settings.site_base_color.replace('#', '').toUpperCase()}
                    onChange={(e) => updateSetting('site_base_color', `#${e.target.value}`)}
                    placeholder="D50055"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_secondary_color">
                  Site Secondary Color <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <div
                    className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                    style={{ backgroundColor: settings.site_secondary_color }}
                    onClick={() => document.getElementById('secondary_color_input')?.click()}
                  />
                  <Input
                    id="secondary_color_input"
                    type="color"
                    value={settings.site_secondary_color}
                    onChange={(e) => updateSetting('site_secondary_color', e.target.value)}
                    className="sr-only"
                  />
                  <Input
                    value={settings.site_secondary_color.replace('#', '').toUpperCase()}
                    onChange={(e) => updateSetting('site_secondary_color', `#${e.target.value}`)}
                    placeholder="1B1B3F"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="items_per_page">
                  Items Per Page <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={settings.items_per_page.toString()}
                  onValueChange={(value) => updateSetting('items_per_page', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Items per page" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemsPerPageOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option} items per page</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency_display_format">
                  Currency Showing Format
                </Label>
                <Select
                  value={settings.currency_display_format}
                  onValueChange={(value) => updateSetting('currency_display_format', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyFormats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: File Upload, Video Skip Time, TMDB API Key, Genres */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="file_upload_server">File Upload Server</Label>
                <Select
                  value={settings.file_upload_server}
                  onValueChange={(value) => updateSetting('file_upload_server', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select server" />
                  </SelectTrigger>
                  <SelectContent>
                    {fileUploadServers.map((server) => (
                      <SelectItem key={server.value} value={server.value}>
                        {server.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="video_skip_time">Video Skip Time</Label>
                <div className="flex gap-2">
                  <Input
                    id="video_skip_time"
                    type="number"
                    value={settings.video_skip_time}
                    onChange={(e) => updateSetting('video_skip_time', parseInt(e.target.value) || 5)}
                    placeholder="5"
                    className="flex-1"
                  />
                  <div className="flex items-center px-3 bg-muted rounded-md border border-border">
                    <span className="text-sm text-muted-foreground">Seconds</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tmdb_api_key">TMDB API KEY</Label>
                <Input
                  id="tmdb_api_key"
                  value={settings.tmdb_api_key}
                  onChange={(e) => updateSetting('tmdb_api_key', e.target.value)}
                  placeholder="Enter TMDB API Key"
                  type="password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="genres">
                  Genres <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-wrap gap-2 p-2 min-h-10 rounded-md border border-border bg-background">
                  {settings.default_genres.map((genre) => (
                    <Badge key={genre} variant="secondary" className="flex items-center gap-1">
                      {genre}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => removeGenre(genre)}
                      />
                    </Badge>
                  ))}
                  <Input
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())}
                    placeholder="Add genre..."
                    className="flex-1 min-w-[100px] border-0 p-0 h-6 focus-visible:ring-0"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pusher Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Pusher Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pusher_app_id">
                  App ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="pusher_app_id"
                  value={settings.pusher_app_id}
                  onChange={(e) => updateSetting('pusher_app_id', e.target.value)}
                  placeholder="1498855"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pusher_app_key">
                  App Key <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="pusher_app_key"
                  value={settings.pusher_app_key}
                  onChange={(e) => updateSetting('pusher_app_key', e.target.value)}
                  placeholder="eda7073a2db44e878ec8"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pusher_app_secret">
                  App Secret Key <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="pusher_app_secret"
                  type="password"
                  value={settings.pusher_app_secret}
                  onChange={(e) => updateSetting('pusher_app_secret', e.target.value)}
                  placeholder="108bd05bb0bdcb287e0f"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pusher_cluster">
                  Cluster <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="pusher_cluster"
                  value={settings.pusher_cluster}
                  onChange={(e) => updateSetting('pusher_cluster', e.target.value)}
                  placeholder="ap2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Socket Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Socket Configuration</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <a href="https://pusher.com/docs" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Documentation
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="socket_app_uri">
                  App URI <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="socket_app_uri"
                  value={settings.socket_app_uri}
                  onChange={(e) => updateSetting('socket_app_uri', e.target.value)}
                  placeholder="wss://your-domain.com/websocket"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full h-12 text-lg"
          size="lg"
        >
          <Save className="h-5 w-5 mr-2" />
          {isSaving ? 'Saving...' : 'Submit'}
        </Button>
      </div>
    </AdminLayout>
  );
}
