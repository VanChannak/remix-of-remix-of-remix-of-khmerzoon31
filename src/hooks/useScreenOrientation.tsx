import { useEffect, useCallback } from "react";
import { useNativeMobile } from "./useNativeMobile";

interface ScreenOrientationHook {
  lockPortrait: () => Promise<void>;
  unlockOrientation: () => Promise<void>;
  lockLandscape: () => Promise<void>;
}

export function useScreenOrientation(): ScreenOrientationHook {
  const { isNative, isAndroid, isIOS } = useNativeMobile();

  // Lock to portrait mode
  const lockPortrait = useCallback(async () => {
    if (!isNative) return;

    try {
      // Try using Capacitor ScreenOrientation plugin if available
      const ScreenOrientation = (window as any).Capacitor?.Plugins?.ScreenOrientation;
      if (ScreenOrientation?.lock) {
        await ScreenOrientation.lock({ orientation: 'portrait' });
        return;
      }

      // Fallback to web API
      const screen = window.screen as any;
      if (screen.orientation?.lock) {
        await screen.orientation.lock('portrait-primary');
      }
    } catch (error) {
      console.log('Could not lock portrait orientation:', error);
    }
  }, [isNative]);

  // Lock to landscape mode
  const lockLandscape = useCallback(async () => {
    try {
      // Try using Capacitor ScreenOrientation plugin if available
      const ScreenOrientation = (window as any).Capacitor?.Plugins?.ScreenOrientation;
      if (ScreenOrientation?.lock) {
        await ScreenOrientation.lock({ orientation: 'landscape' });
        return;
      }

      // Fallback to web API
      const screen = window.screen as any;
      if (screen.orientation?.lock) {
        await screen.orientation.lock('landscape-primary');
      }
    } catch (error) {
      console.log('Could not lock landscape orientation:', error);
    }
  }, []);

  // Unlock orientation (allow all orientations)
  const unlockOrientation = useCallback(async () => {
    try {
      // Try using Capacitor ScreenOrientation plugin if available
      const ScreenOrientation = (window as any).Capacitor?.Plugins?.ScreenOrientation;
      if (ScreenOrientation?.unlock) {
        await ScreenOrientation.unlock();
        return;
      }

      // Fallback to web API
      const screen = window.screen as any;
      if (screen.orientation?.unlock) {
        screen.orientation.unlock();
      }
    } catch (error) {
      console.log('Could not unlock orientation:', error);
    }
  }, []);

  // Lock to portrait on mount for native apps (except on watch pages)
  useEffect(() => {
    if (isNative) {
      // Check if we're on a watch page - don't auto-lock there
      const isWatchPage = window.location.pathname.includes('/watch');
      if (!isWatchPage) {
        lockPortrait();
      }
    }

    return () => {
      // Don't unlock on unmount - let the app control this
    };
  }, [isNative, lockPortrait]);

  return {
    lockPortrait,
    unlockOrientation,
    lockLandscape,
  };
}
