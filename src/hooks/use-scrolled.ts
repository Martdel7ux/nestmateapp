import { useEffect, useState } from "react";

/**
 * Returns true once any major scroll container on the page has scrolled past
 * `threshold` px. Handles both:
 *  - Default-layout pages where the window itself scrolls
 *  - Full-height pages (Discover, Study, Household, etc.) where an inner div
 *    scrolls while the window stays at 0 due to overflow-hidden on the shell
 */
export function useScrolled(threshold = 8) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Always reset on mount so we never inherit stale position from previous route
    setIsScrolled(false);

    // Window scroll — default-layout pages
    const onWindowScroll = () => {
      setIsScrolled(window.scrollY > threshold);
    };

    // Captured scroll — full-height pages with inner scroll containers.
    // capture: true lets us receive scroll events from any descendant element.
    // We filter to containers taller than 200px so small nested scrollables
    // (chat threads, dropdowns, code blocks) don't incorrectly trigger the header.
    const onCapturedScroll = (e: Event) => {
      const el = e.target as HTMLElement;
      if (!el || el === document.documentElement || el === document.body) return;
      if (el.clientHeight < 200) return;
      setIsScrolled(el.scrollTop > threshold);
    };

    window.addEventListener("scroll", onWindowScroll, { passive: true });
    document.addEventListener("scroll", onCapturedScroll, { passive: true, capture: true });

    return () => {
      window.removeEventListener("scroll", onWindowScroll);
      document.removeEventListener("scroll", onCapturedScroll, { capture: true });
    };
  }, [threshold]);

  return isScrolled;
}
