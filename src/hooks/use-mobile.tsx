import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isIPadPortrait = width >= 768 && width <= 1024 && height > width;
    return width < MOBILE_BREAKPOINT || isIPadPortrait;
  });

  React.useEffect(() => {
    const onChange = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      // Treat as mobile if: actually mobile OR iPad in portrait orientation (up to 1024px wide)
      const isIPadPortrait = width >= 768 && width <= 1024 && height > width;
      setIsMobile(width < MOBILE_BREAKPOINT || isIPadPortrait);
    };

    // Run once on mount and on every resize so iPad/tablet widths are handled correctly
    onChange();
    window.addEventListener("resize", onChange);
    window.addEventListener("orientationchange", onChange);

    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("orientationchange", onChange);
    };
  }, []);
 
  return isMobile;
}
