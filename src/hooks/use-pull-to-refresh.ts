import { useEffect, useRef, useState } from "react";

export function usePullToRefresh(onRefresh: () => void) {
  const [pullDistance, setPullDistance] = useState(0);
  const pullRef = useRef(0);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    let startY = 0;

    const handleStart = (event: TouchEvent) => {
      if (window.scrollY > 0) return;
      startY = event.touches[0]?.clientY ?? 0;
    };

    const handleMove = (event: TouchEvent) => {
      if (window.scrollY > 0 || !startY) return;
      const currentY = event.touches[0]?.clientY ?? 0;
      const next = Math.min(Math.max(0, currentY - startY), 120);
      pullRef.current = next;
      setPullDistance(next);
    };

    const handleEnd = () => {
      if (pullRef.current > 90) {
        onRefreshRef.current();
      }
      startY = 0;
      pullRef.current = 0;
      setPullDistance(0);
    };

    window.addEventListener("touchstart", handleStart, { passive: true });
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("touchstart", handleStart);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, []);

  return pullDistance;
}
