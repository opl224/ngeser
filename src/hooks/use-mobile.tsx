import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false); // Default to false (desktop)
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true); // Indicate component has mounted on client
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    checkIsMobile(); // Initial check
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // During SSR and first client render (before useEffect), hasMounted is false.
  // In this phase, we return the default 'false' (desktop).
  // After mount, hasMounted is true, and we return the actual client-side isMobile state.
  return hasMounted ? isMobile : false;
}
