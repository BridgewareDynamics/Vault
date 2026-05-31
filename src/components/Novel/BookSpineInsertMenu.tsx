import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';

interface BookSpineInsertMenuProps {
  isOpen: boolean;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onToggle: () => void;
  onClose: () => void;
  onInsertLeft: () => void;
  onInsertRight: () => void;
  menuClassName: string;
  buttonClassName: string;
  mutedClassName: string;
}

export function BookSpineInsertMenu({
  isOpen,
  anchorRef,
  onToggle,
  onClose,
  onInsertLeft,
  onInsertRight,
  menuClassName,
  buttonClassName,
  mutedClassName,
}: BookSpineInsertMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!isOpen || !anchorRef.current) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorRef, isOpen]);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        className={buttonClassName}
        aria-label="Insert page options"
        aria-expanded={isOpen}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {isOpen &&
        position &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Close insert menu"
              className="fixed inset-0 z-[200] cursor-default bg-transparent"
              onClick={onClose}
            />
            <div
              ref={menuRef}
              className={`fixed z-[210] w-52 -translate-x-1/2 rounded-xl border p-2 shadow-2xl ${menuClassName}`}
              style={{ top: position.top, left: position.left }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <p className={`px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider ${mutedClassName}`}>
                Insert at spine
              </p>
              <button
                type="button"
                className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10"
                onClick={(event) => {
                  event.stopPropagation();
                  onInsertLeft();
                }}
              >
                Insert page — Left
              </button>
              <button
                type="button"
                className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10"
                onClick={(event) => {
                  event.stopPropagation();
                  onInsertRight();
                }}
              >
                Insert page — Right
              </button>
            </div>
          </>,
          window.document.body
        )}
    </>
  );
}
