import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Upload, X, AlertTriangle, Image as ImageIcon, Sun, Moon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import defaultLogo from '@/assets/logo.png';

export default function SettingsLogo() {
  const navigate = useNavigate();
  const lightLogoInputRef = useRef<HTMLInputElement>(null);
  const darkLogoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  
  const [lightLogoPreview, setLightLogoPreview] = useState<string | null>(null);
  const [darkLogoPreview, setDarkLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [lightLogoFile, setLightLogoFile] = useState<File | null>(null);
  const [darkLogoFile, setDarkLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLogos = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('setting_key, setting_value')
          .in('setting_key', ['site_logo_light', 'site_logo_dark', 'site_favicon']);

        let hasLightLogo = false;
        let hasDarkLogo = false;
        let hasFavicon = false;

        if (data) {
          data.forEach(setting => {
            try {
              const value = typeof setting.setting_value === 'string' 
                ? JSON.parse(setting.setting_value) 
                : setting.setting_value;
              if (setting.setting_key === 'site_logo_light' && value?.url) {
                setLightLogoPreview(value.url);
                hasLightLogo = true;
              }
              if (setting.setting_key === 'site_logo_dark' && value?.url) {
                setDarkLogoPreview(value.url);
                hasDarkLogo = true;
              }
              if (setting.setting_key === 'site_favicon' && value?.url) {
                setFaviconPreview(value.url);
                hasFavicon = true;
              }
            } catch {
              // Ignore parse errors
            }
          });
        }

        if (!hasLightLogo) setLightLogoPreview(defaultLogo);
        if (!hasDarkLogo) setDarkLogoPreview(defaultLogo);
        if (!hasFavicon) setFaviconPreview(defaultLogo);
      } catch (error) {
        console.error('Error loading logos:', error);
        setLightLogoPreview(defaultLogo);
        setDarkLogoPreview(defaultLogo);
        setFaviconPreview(defaultLogo);
      } finally {
        setIsLoading(false);
      }
    };
    loadLogos();
  }, []);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void,
    setPreview: (preview: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        toast.error('Please upload a valid image file (PNG, JPG, JPEG)');
        return;
      }
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (
    setPreview: (preview: string | null) => void,
    setFile: (file: File | null) => void,
    inputRef: React.RefObject<HTMLInputElement>,
    defaultValue?: string
  ) => {
    setPreview(defaultValue || null);
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!lightLogoFile && !darkLogoFile && !faviconFile) {
      toast.error('Please select at least one image to upload');
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadFile = async (file: File): Promise<string> => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      };

      const upsertSetting = async (key: string, url: string) => {
        const { data: existing } = await supabase
          .from('site_settings')
          .select('id')
          .eq('setting_key', key)
          .single();

        const settingValue = JSON.stringify({ url });

        if (existing) {
          await supabase
            .from('site_settings')
            .update({ setting_value: settingValue })
            .eq('setting_key', key);
        } else {
          await supabase
            .from('site_settings')
            .insert({ setting_key: key, setting_value: settingValue });
        }
      };

      if (lightLogoFile) {
        const logoBase64 = await uploadFile(lightLogoFile);
        await upsertSetting('site_logo_light', logoBase64);
      }

      if (darkLogoFile) {
        const logoBase64 = await uploadFile(darkLogoFile);
        await upsertSetting('site_logo_dark', logoBase64);
      }

      if (faviconFile) {
        const faviconBase64 = await uploadFile(faviconFile);
        await upsertSetting('site_favicon', faviconBase64);
      }

      toast.success('Logos updated successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to update logos');
    } finally {
      setIsSubmitting(false);
    }
  };

  const LogoUploadCard = ({
    title,
    icon,
    preview,
    inputRef,
    onRemove,
    onChange
  }: {
    title: string;
    icon: React.ReactNode;
    preview: string | null;
    inputRef: React.RefObject<HTMLInputElement>;
    onRemove: () => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          className="relative w-full aspect-[3/1] bg-muted/30 rounded-lg border-2 border-primary/50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          {preview ? (
            <>
              <img 
                src={preview} 
                alt={`${title} preview`} 
                className="max-w-full max-h-full object-contain p-4"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors z-10"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 text-muted-foreground text-sm bg-background/80 px-3 py-1 rounded-full">
                <Upload className="h-4 w-4" />
                <span>Click to change</span>
              </div>
            </>
          ) : (
            <div className="text-center p-6">
              <div className="w-24 h-24 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-primary/40" />
              </div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Upload className="h-5 w-5" />
                <span>Click to upload</span>
              </div>
            </div>
          )}
        </div>
        
        <Input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg"
          onChange={onChange}
          className="hidden"
        />
        
        <p className="text-xs text-muted-foreground">
          Supported Files: <span className="text-primary font-medium">.png, .jpg, .jpeg</span>
        </p>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/settings')}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Logo & Favicon</h1>
            <p className="text-muted-foreground">Upload logos for light and dark mode, and your favicon</p>
          </div>
        </div>

        {/* Warning Alert */}
        <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">
            If the logo and favicon are not changed after you update from this page, please{' '}
            <button 
              onClick={() => window.location.reload()} 
              className="text-primary underline hover:no-underline font-medium"
            >
              clear the cache
            </button>{' '}
            from your browser. As we keep the filename the same after the update, it may show the old image for the cache.
          </p>
        </div>

        {/* Logo Upload Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Light Mode Logo */}
          <LogoUploadCard
            title="Logo (Light Mode)"
            icon={<Sun className="h-5 w-5 text-primary" />}
            preview={lightLogoPreview}
            inputRef={lightLogoInputRef}
            onRemove={() => removeFile(setLightLogoPreview, setLightLogoFile, lightLogoInputRef, defaultLogo)}
            onChange={(e) => handleFileChange(e, setLightLogoFile, setLightLogoPreview)}
          />

          {/* Dark Mode Logo */}
          <LogoUploadCard
            title="Logo (Dark Mode)"
            icon={<Moon className="h-5 w-5 text-primary" />}
            preview={darkLogoPreview}
            inputRef={darkLogoInputRef}
            onRemove={() => removeFile(setDarkLogoPreview, setDarkLogoFile, darkLogoInputRef, defaultLogo)}
            onChange={(e) => handleFileChange(e, setDarkLogoFile, setDarkLogoPreview)}
          />
        </div>

        {/* Favicon Upload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LogoUploadCard
            title="Favicon"
            icon={<ImageIcon className="h-5 w-5 text-primary" />}
            preview={faviconPreview}
            inputRef={faviconInputRef}
            onRemove={() => removeFile(setFaviconPreview, setFaviconFile, faviconInputRef, defaultLogo)}
            onChange={(e) => handleFileChange(e, setFaviconFile, setFaviconPreview)}
          />
        </div>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg"
        >
          {isSubmitting ? 'Saving...' : 'Submit'}
        </Button>
      </div>
    </AdminLayout>
  );
}
