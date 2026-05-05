import { useEffect, useState } from "react";

export function usePullToRefresh() {
  const [pullDistance, setPullDistance] = useState(0);

  useEffect(() => {
    let startY = 0;

    const handleStart = (event: TouchEvent) => {
      if (window.scrollY > 0) return;
      startY = event.touches[0]?.clientY ?? 0;
    };

    const handleMove = (event: TouchEvent) => {
      if (window.scrollY > 0 || !startY) return;
      const currentY = event.touches[0]?.clientY ?? 0;
      const next = Math.max(0, currentY - startY);
      setPullDistance(Math.min(next, 120));
    };

    const handleEnd = () => {
      if (pullDistance > 90) {
        window.location.reload();
      }
      startY = 0;
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
  }, [pullDistance]);

  return pullDistance;
}
