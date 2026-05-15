import React, { useState, useRef, useEffect } from 'react';
import { Menu } from 'lucide-react';

interface DraggableMenuButtonProps {
  onClick: () => void;
}

const DraggableMenuButton: React.FC<DraggableMenuButtonProps> = ({ onClick }) => {
  const [position, setPosition] = useState({ x: 16, y: 16 }); // Default top-4 left-4
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLButtonElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startMousePos = useRef({ x: 0, y: 0 });
  const didMove = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    didMove.current = false;
    startPos.current = { ...position };
    startMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    didMove.current = true;
    
    // Calculate new position
    let newX = startPos.current.x + (e.clientX - startMousePos.current.x);
    let newY = startPos.current.y + (e.clientY - startMousePos.current.y);

    // Bounding box logic to keep it within screen (assuming button is ~40x40)
    const maxX = window.innerWidth - 50;
    const maxY = window.innerHeight - 100; // Leave space for bottom nav

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    // Snap to edge could be added here if desired

    if (!didMove.current) {
      onClick();
    }
  };

  return (
    <button
      ref={dragRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        touchAction: 'none' // Prevent scrolling while dragging
      }}
      className={`absolute top-0 left-0 z-40 p-2 bg-purple-600/80 hover:bg-purple-600 backdrop-blur-md rounded-[14px] text-white shadow-xl ${isDragging ? 'shadow-purple-500/50 scale-110' : 'transition-[background,scale] shadow-black/20'}`}
    >
      <Menu size={24} />
    </button>
  );
};

export default DraggableMenuButton;
