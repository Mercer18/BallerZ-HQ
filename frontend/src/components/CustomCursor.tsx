'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Custom cursor component.
 * Implements mouse tracking, touch check fail-safe, click shrinking, and hover delegation.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return

    let cursorX = -999, cursorY = -999;
    let cursorInitialized = false;
    let isTouchUser = false;
    let lastTouchTime = 0;

    // 1. Mobile/Touch Detection: Instantly restore native touch behavior on mobile/tablet
    const handleTouch = () => {
      isTouchUser = true;
      lastTouchTime = Date.now();
      document.body.classList.remove('cursor-ready', 'custom-cursor-active');
      const cursorDot = dotRef.current;
      if (cursorDot) {
        cursorDot.style.display = 'none';
      }
    };

    window.addEventListener('touchstart', handleTouch, { passive: true });
    window.addEventListener('touchmove', handleTouch, { passive: true });
    window.addEventListener('touchend', handleTouch, { passive: true });

    function shouldIgnoreMouse() {
      return isTouchUser || (Date.now() - lastTouchTime < 500);
    }

    // 2. Track Mouse Movement
    function updateCursorPos(e: MouseEvent) {
      if (Date.now() - lastTouchTime < 500) return;
      if (!e || typeof e.clientX !== 'number' || typeof e.clientY !== 'number' || isNaN(e.clientX) || isNaN(e.clientY)) return;
      
      if (isTouchUser) {
        isTouchUser = false;
        const cursorDot = dotRef.current;
        if (cursorDot) {
          cursorDot.style.display = 'block';
        }
      }
      
      cursorX = e.clientX;
      cursorY = e.clientY;
      if (!cursorInitialized) {
        cursorInitialized = true;
      }
      document.body.classList.add('cursor-ready', 'custom-cursor-active');
    }

    window.addEventListener('mousemove', updateCursorPos);
    window.addEventListener('mouseenter', updateCursorPos);
    
    const handleMouseLeave = () => {
      document.body.classList.remove('cursor-ready', 'custom-cursor-active');
    };
    window.addEventListener('mouseleave', handleMouseLeave);

    // 3. Coordinate Update Loop (uses GPU-accelerated translate3d for high framerate rendering)
    let rafId: number;
    function tickCursor() {
      if (cursorInitialized && !shouldIgnoreMouse()) {
        if (isNaN(cursorX) || isNaN(cursorY)) {
          cursorX = window.innerWidth / 2;
          cursorY = window.innerHeight / 2;
        }
        const cursorDot = dotRef.current;
        if (cursorDot) {
          cursorDot.style.transform = `translate3d(${cursorX}px,${cursorY}px,0) translate3d(-50%,-50%,0)`;
        }
      }
      rafId = requestAnimationFrame(tickCursor);
    }
    tickCursor();

    // 4. Click Tracking (shrink dot on mousedown)
    const handleMouseDown = (e: MouseEvent) => {
      if (shouldIgnoreMouse()) return;
      if (e && typeof e.clientX === 'number' && typeof e.clientY === 'number' && !isNaN(e.clientX) && !isNaN(e.clientY)) {
        cursorX = e.clientX;
        cursorY = e.clientY;
      }
      document.body.classList.add('cursor-down');
    };
    const handleMouseUp = () => {
      if (shouldIgnoreMouse()) return;
      document.body.classList.remove('cursor-down');
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // 5. Interactive Hover Event Delegation (scale on links/buttons/interactive tags)
    const hoverSelectors = 'a, button, [role="button"], .btn, .project-link, .contact-link, .theme-toggle, #themeBtn, .forage-card';
    
    const handleMouseOver = (e: MouseEvent) => {
      if (shouldIgnoreMouse()) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest && target.closest(hoverSelectors)) {
        document.body.classList.add('cursor-hover');
      }
    };
    const handleMouseOut = (e: MouseEvent) => {
      if (shouldIgnoreMouse()) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest && target.closest(hoverSelectors)) {
        document.body.classList.remove('cursor-hover');
      }
    };

    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mouseout', handleMouseOut);

    // Cleanup
    return () => {
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('touchmove', handleTouch);
      window.removeEventListener('touchend', handleTouch);
      window.removeEventListener('mousemove', updateCursorPos);
      window.removeEventListener('mouseenter', updateCursorPos);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(rafId);
      document.body.classList.remove('cursor-ready', 'custom-cursor-active', 'cursor-hover', 'cursor-down');
    };
  }, [pathname])

  return (
    <div ref={dotRef} id="cursor-dot" aria-hidden="true" />
  )
}
