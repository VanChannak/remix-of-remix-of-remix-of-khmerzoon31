import React, { useEffect } from "react";
import { useNativeMobile } from "@/hooks/useNativeMobile";
import { useScreenOrientation } from "@/hooks/useScreenOrientation";

interface PortraitLockProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that locks the app to portrait mode on native devices.
 * The Watch page's ShakaPlayer handles its own landscape rotation for fullscreen.
 */
export const PortraitLockProvider = ({ children }: PortraitLockProviderProps) => {
  const { isNative, isAndroid, isIOS } = useNativeMobile();
  const { lockPortrait } = useScreenOrientation();

  useEffect(() => {
    if (isNative && (isAndroid || isIOS)) {
      // Lock to portrait on app mount
      lockPortrait();
    }
  }, [isNative, isAndroid, isIOS, lockPortrait]);

  return <>{children}</>;
};
