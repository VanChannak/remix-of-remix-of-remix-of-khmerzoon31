import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MaintenanceSettings {
  enabled: boolean;
  message: string;
}

export function useMaintenanceMode() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['maintenance-mode'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'maintenance_mode')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.setting_value) {
        try {
          const value = typeof data.setting_value === 'string' 
            ? JSON.parse(data.setting_value) 
            : data.setting_value;
          return value as MaintenanceSettings;
        } catch {
          return { enabled: false, message: '' };
        }
      }

      return { enabled: false, message: '' };
    },
  });

  const { mutate: updateSettings, isPending: isUpdating } = useMutation({
    mutationFn: async (newSettings: MaintenanceSettings) => {
      const settingValue = JSON.stringify(newSettings);
      
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', 'maintenance_mode')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({
            setting_value: settingValue,
            updated_at: new Date().toISOString(),
          })
          .eq('setting_key', 'maintenance_mode');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({
            setting_key: 'maintenance_mode',
            setting_value: settingValue,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-mode'] });
      toast.success('Maintenance settings updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update maintenance settings');
    },
  });

  return {
    settings,
    isLoading,
    isMaintenanceEnabled: settings?.enabled ?? false,
    maintenanceMessage: settings?.message ?? '',
    updateSettings,
    isUpdating,
  };
}
