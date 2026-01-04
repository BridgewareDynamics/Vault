import { useState, useEffect, useRef } from 'react';

interface ResizableDividerProps {
  position: number; // Percentage (0-100)
  onResize: (position: number) => void;
  minLeft?: number; // Minimum percentage for left side (default: 20)
  minRight?: number; // Minimum percentage for right side (default: 30)
}

export function ResizableDivider({ 
  position, 
  onResize, 
  minLeft = 20, 
  minRight = 30 
}: ResizableDividerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartPositionRef = useRef<number>(50);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartPositionRef.current = position;

    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const viewportWidth = window.innerWidth;
      const deltaX = e.clientX - dragStartXRef.current;
      const deltaPercent = (deltaX / viewportWidth) * 100;
      const newPosition = dragStartPositionRef.current + deltaPercent;

      // Constrain to min/max bounds
      const maxPosition = 100 - minRight;
      const constrainedPosition = Math.max(minLeft, Math.min(newPosition, maxPosition));

      onResize(constrainedPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, onResize, minLeft, minRight]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`relative cursor-col-resize z-10 group flex-shrink-0 ${
        isDragging ? 'bg-cyber-purple-500/80' : 'bg-cyber-purple-500/0 group-hover:bg-cyber-purple-500/60'
      } transition-colors`}
      style={{
        width: '4px',
        // Extend the hit area for easier grabbing
        marginLeft: '-2px',
        marginRight: '-2px',
        paddingLeft: '2px',
        paddingRight: '2px',
      }}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize divider"
    >
      {/* Visual indicator */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-0.5 transition-colors ${
          isDragging
            ? 'bg-cyber-purple-500/80'
            : 'bg-cyber-purple-500/0 group-hover:bg-cyber-purple-500/60'
        }`}
      />
    </div>
  );
}

