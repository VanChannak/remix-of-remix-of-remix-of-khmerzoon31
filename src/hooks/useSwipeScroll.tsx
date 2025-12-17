import { useEffect, useRef } from 'react';

interface UseSwipeScrollOptions {
  enabled?: boolean;
}

export const useSwipeScroll = ({ enabled = true }: UseSwipeScrollOptions = {}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    let isScrolling = false;
    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;
    let velocity = 0;
    let lastX = 0;
    let lastTime = 0;
    const DRAG_THRESHOLD = 10; // pixels moved before considering it a drag

    const handleTouchStart = (e: TouchEvent) => {
      isScrolling = true;
      isDragging = false;
      startX = e.touches[0].pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
      velocity = 0;
      lastX = e.touches[0].pageX;
      lastTime = Date.now();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isScrolling) return;

      const x = e.touches[0].pageX - container.offsetLeft;
      const walk = (x - startX) * 2;
      
      // Only consider it a drag if moved beyond threshold
      if (Math.abs(walk) > DRAG_THRESHOLD) {
        isDragging = true;
        e.preventDefault();
      }
      
      if (isDragging) {
        container.scrollLeft = scrollLeft - walk;

        const now = Date.now();
        const dt = now - lastTime;
        const dx = e.touches[0].pageX - lastX;
        velocity = dx / dt;
        lastX = e.touches[0].pageX;
        lastTime = now;
      }
    };

    const handleTouchEnd = () => {
      const wasDragging = isDragging;
      isScrolling = false;
      isDragging = false;

      if (!wasDragging) return;

      // Apply momentum scrolling
      const momentum = velocity * 100;
      let currentScroll = container.scrollLeft;
      const targetScroll = currentScroll - momentum;
      
      const animate = () => {
        const diff = targetScroll - currentScroll;
        if (Math.abs(diff) < 1) return;
        
        currentScroll += diff * 0.1;
        container.scrollLeft = currentScroll;
        requestAnimationFrame(animate);
      };
      
      if (Math.abs(momentum) > 10) {
        animate();
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled]);

  return containerRef;
};
