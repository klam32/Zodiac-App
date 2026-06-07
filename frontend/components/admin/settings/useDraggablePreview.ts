import { useState, useEffect, useRef, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

export const useDraggablePreview = (initialPosition: Position = { x: 0, y: 0 }) => {
  const [position, setPosition] = useState<Position>(() => {
    try {
      const saved = localStorage.getItem('zodiac_preview_position');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse zodiac_preview_position', e);
    }
    return initialPosition;
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0
  });

  const widgetRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: MouseEvent | TouchEvent) => {
    if (!headerRef.current) return;
    
    // Only drag with left mouse click
    if ('button' in e && e.button !== 0) return;

    // Check if the click/touch was on interactive elements inside the header
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('a')) {
      return;
    }

    e.stopPropagation();
    
    // Prevent default touch/mouse action to avoid scrolling or text selection, but allow inputs if any
    if (e.cancelable) {
      e.preventDefault();
    }
    
    setIsDragging(true);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      posX: position.x,
      posY: position.y
    };

    document.body.style.userSelect = 'none';
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - dragStartRef.current.startX;
    const deltaY = clientY - dragStartRef.current.startY;

    let newX = dragStartRef.current.posX + deltaX;
    let newY = dragStartRef.current.posY + deltaY;

    // Constrain position within window boundaries
    if (widgetRef.current) {
      const w = widgetRef.current.offsetWidth || 360;
      const h = widgetRef.current.offsetHeight || 520;
      const winWidth = window.innerWidth;
      const winHeight = window.innerHeight;

      // Keep it within screen margins
      const minX = -(winWidth - w - 24);
      const maxX = 24;
      const minY = -(winHeight - h - 24);
      const maxY = 24;

      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));
    }

    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      document.body.style.userSelect = '';
      try {
        localStorage.setItem('zodiac_preview_position', JSON.stringify(position));
      } catch (e) {
        console.error(e);
      }
    }
  }, [isDragging, position]);

  useEffect(() => {
    const header = headerRef.current;
    if (header) {
      header.addEventListener('mousedown', handleMouseDown);
      header.addEventListener('touchstart', handleMouseDown, { passive: false });
    }

    return () => {
      if (header) {
        header.removeEventListener('mousedown', handleMouseDown);
        header.removeEventListener('touchstart', handleMouseDown);
      }
    };
  }, [handleMouseDown]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const resetPosition = useCallback(() => {
    setPosition({ x: 0, y: 0 });
    try {
      localStorage.removeItem('zodiac_preview_position');
    } catch (e) {
      console.error(e);
    }
  }, []);

  return {
    position,
    setPosition,
    isDragging,
    widgetRef,
    headerRef,
    resetPosition
  };
};
