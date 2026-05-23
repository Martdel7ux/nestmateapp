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
    setIsScrolled(false);

    let rafId: number | null = null;
    let nextValue = false;

    const update = (value: boolean) => {
      nextValue = value;
      if (rafId !== null) return; // rAF already pending; it will use nextValue
      rafId = requestAnimationFrame(() => {
        rafId = null;
        setIsScrolled(nextValue);
      });
    };

    const onWindowScroll = () => {
      update(window.scrollY > threshold);
    };

    const onCapturedScroll = (e: Event) => {
      const el = e.target as HTMLElement;
      if (!el || el === document.documentElement || el === document.body) return;
      if (el.clientHeight < 200) return;
      update(el.scrollTop > threshold);
    };

    window.addEventListener("scroll", onWindowScroll, { passive: true });
    document.addEventListener("scroll", onCapturedScroll, { passive: true, capture: true });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onWindowScroll);
      document.removeEventListener("scroll", onCapturedScroll, { capture: true });
    };
  }, [threshold]);

  return isScrolled;
}
