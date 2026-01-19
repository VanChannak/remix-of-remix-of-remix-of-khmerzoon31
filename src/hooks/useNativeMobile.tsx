import { useState, useEffect } from "react";

interface NativeMobileState {
  isNative: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  platform: string | null;
}

export function useNativeMobile(): NativeMobileState {
  const [state, setState] = useState<NativeMobileState>({
    isNative: false,
    isAndroid: false,
    isIOS: false,
    platform: null,
  });

  useEffect(() => {
    // Check if running inside Capacitor
    const isCapacitor = !!(window as any).Capacitor;
    
    // Get platform info
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(userAgent);
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    
    // Check for Capacitor native platform
    let isNative = false;
    let platform: string | null = null;
    
    if (isCapacitor) {
      const Capacitor = (window as any).Capacitor;
      isNative = Capacitor.isNativePlatform?.() ?? false;
      platform = Capacitor.getPlatform?.() ?? null;
    }

    setState({
      isNative,
      isAndroid: isNative && (platform === 'android' || isAndroid),
      isIOS: isNative && (platform === 'ios' || isIOS),
      platform,
    });
  }, []);

  return state;
}
