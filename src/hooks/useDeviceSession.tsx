import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface DeviceSession {
  id: string;
  device_id: string;
  device_name: string;
  device_type: string;
  last_active_at: string;
  created_at: string;
}

// Generate a unique device ID based on browser fingerprint
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

// Get device information
const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  let deviceType = 'Desktop';
  let deviceName = 'Unknown Device';

  if (/mobile/i.test(ua)) {
    deviceType = 'Mobile';
    if (/iPhone/i.test(ua)) deviceName = 'iPhone';
    else if (/Android/i.test(ua)) deviceName = 'Android Phone';
    else deviceName = 'Mobile Device';
  } else if (/tablet|ipad/i.test(ua)) {
    deviceType = 'Tablet';
    deviceName = 'Tablet';
  } else {
    if (/Mac/i.test(ua)) deviceName = 'Mac';
    else if (/Windows/i.test(ua)) deviceName = 'Windows PC';
    else if (/Linux/i.test(ua)) deviceName = 'Linux PC';
    else deviceName = 'Desktop';
  }

  return { deviceType, deviceName };
};

export const useDeviceSession = (customMaxDevices?: number) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [currentDeviceId] = useState(getDeviceId());
  const [canStream, setCanStream] = useState(true);
  const [maxDevices, setMaxDevices] = useState(2);
  const [loading, setLoading] = useState(true);

  // Register or update current device session
  const registerDevice = async () => {
    if (!user) return;

    const { deviceType, deviceName } = getDeviceInfo();

    try {
      const { error } = await supabase
        .from('user_sessions')
        .upsert({
          user_id: user.id,
          device_id: currentDeviceId,
          device_name: deviceName,
          device_type: deviceType,
          user_agent: navigator.userAgent,
          last_active_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,device_id',
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to register device:', error);
    }
  };

  // Check device limit based on subscription or custom limit
  const checkDeviceLimit = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      let effectiveMaxDevices = customMaxDevices || 2;
      
      // Only fetch subscription plan if no custom limit is provided
      if (!customMaxDevices) {
        const { data: subscription, error: subError } = await supabase
          .from('user_subscriptions')
          .select('*, subscription_plans(*)')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .gte('end_date', new Date().toISOString())
          .single();

        if (subError && subError.code !== 'PGRST116') {
          throw subError;
        }

        effectiveMaxDevices = subscription?.subscription_plans?.max_devices || 2;
      }
      
      setMaxDevices(effectiveMaxDevices);

      // Get active sessions (last active within 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: activeSessions, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('last_active_at', oneHourAgo)
        .order('last_active_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      setSessions(activeSessions || []);

      // Check if current device is in active sessions
      const currentDeviceSession = activeSessions?.find(s => s.device_id === currentDeviceId);
      const otherActiveSessions = activeSessions?.filter(s => s.device_id !== currentDeviceId) || [];

      if (otherActiveSessions.length >= effectiveMaxDevices && !currentDeviceSession) {
        setCanStream(false);
        toast.error(`Maximum ${effectiveMaxDevices} devices allowed. Sign out from another device to continue.`);
      } else {
        setCanStream(true);
        await registerDevice();
      }
    } catch (error) {
      console.error('Failed to check device limit:', error);
      setCanStream(true); // Allow streaming on error
    } finally {
      setLoading(false);
    }
  };

  // Update session activity
  const updateActivity = async () => {
    if (!user || !canStream) return;

    try {
      await supabase
        .from('user_sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('device_id', currentDeviceId);
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  };

  // Sign out from a specific device
  const signOutDevice = async (deviceId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', user.id)
        .eq('device_id', deviceId);

      if (error) throw error;

      toast.success('Device signed out successfully');
      await checkDeviceLimit();
    } catch (error) {
      console.error('Failed to sign out device:', error);
      toast.error('Failed to sign out device');
    }
  };

  // Sign out from all devices except current
  const signOutAllDevices = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', user.id)
        .neq('device_id', currentDeviceId);

      if (error) throw error;

      toast.success('Signed out from all other devices');
      await checkDeviceLimit();
    } catch (error) {
      console.error('Failed to sign out all devices:', error);
      toast.error('Failed to sign out devices');
    }
  };

  // Initial check on mount and when customMaxDevices changes
  useEffect(() => {
    checkDeviceLimit();
  }, [user, customMaxDevices]);

  // Update activity every 5 minutes
  useEffect(() => {
    if (!user || !canStream) return;

    const interval = setInterval(() => {
      updateActivity();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, canStream]);

  return {
    sessions,
    currentDeviceId,
    canStream,
    maxDevices,
    loading,
    checkDeviceLimit,
    signOutDevice,
    signOutAllDevices,
  };
};
