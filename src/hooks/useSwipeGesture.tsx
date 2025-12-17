import { useEffect, useRef } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
}: SwipeGestureOptions) => {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);
  const isSwiping = useRef(false);

  const minSwipeDistance = threshold;
  const MIN_MOVE_DISTANCE = 15; // Minimum distance to consider it a swipe, not a tap

  const onTouchStart = (e: TouchEvent) => {
    touchEnd.current = null;
    isSwiping.current = false;
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  };

  const onTouchMove = (e: TouchEvent) => {
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
    
    // Check if user has moved enough to consider it a swipe
    if (touchStart.current && touchEnd.current) {
      const distanceX = Math.abs(touchEnd.current.x - touchStart.current.x);
      const distanceY = Math.abs(touchEnd.current.y - touchStart.current.y);
      
      // Only consider horizontal swipes (X movement > Y movement)
      if (distanceX > MIN_MOVE_DISTANCE && distanceX > distanceY) {
        isSwiping.current = true;
      }
    }
  };

  const onTouchEnd = () => {
    // Only process swipe if user was actually swiping (not just tapping)
    if (!touchStart.current || !touchEnd.current || !isSwiping.current) {
      isSwiping.current = false;
      return;
    }
    
    const distance = touchStart.current.x - touchEnd.current.x;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
    
    isSwiping.current = false;
  };

  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', onTouchStart, { passive: true });
    element.addEventListener('touchmove', onTouchMove, { passive: true });
    element.addEventListener('touchend', onTouchEnd);

    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight]);

  return elementRef;
};
