
"use client";

import * as React from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") {
      setMatches(false); // Default to false or handle as per your SSR strategy
      return;
    }

    const mediaQueryList = window.matchMedia(query);
    
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Set initial state
    setMatches(mediaQueryList.matches);

    // Listen for changes
    try {
        mediaQueryList.addEventListener("change", handleChange);
    } catch (e) {
        // Fallback for older browsers
        mediaQueryList.addListener(handleChange);
    }
    

    return () => {
      try {
        mediaQueryList.removeEventListener("change", handleChange);
      } catch (e) {
        // Fallback for older browsers
        mediaQueryList.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches === undefined ? false : matches; // Return false during SSR or initial undefined state
}
