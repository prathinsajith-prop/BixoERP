'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

export type ViewMode = 'table' | 'grid' | 'list';

export interface ViewOption {
  value: ViewMode;
  label: string;
  icon: React.ReactNode;
}

interface ViewSwitcherProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  options: ViewOption[];
  className?: string;
  buttonClassName?: string;
}

export function ViewSwitcher({
  view,
  onViewChange,
  options,
  className = '',
  buttonClassName = '',
}: ViewSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // Determine alignment so popup doesn't overflow viewport
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropdownWidth = 192; // min-w-48
      const spaceRight = window.innerWidth - rect.right;
      setAlignRight(spaceRight < dropdownWidth ? false : true);
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const activeOption = useMemo(
    () => options.find((option) => option.value === view) ?? options[0],
    [options, view]
  );

  if (!activeOption) return null;

  return (
    <div className={`relative ${className}`.trim()} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`gogo-input inline-flex h-12 w-12 items-center justify-center bg-[var(--gogo-surface)] text-[var(--gogo-text-secondary)] transition hover:border-[var(--gogo-primary)] hover:text-[var(--gogo-primary)] ${buttonClassName}`.trim()}
        title="Change view"
        aria-label="Change view"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {activeOption.icon}
      </button>

      {open && (
        <div className={`absolute top-full z-50 mt-2 min-w-48 overflow-hidden rounded-[var(--radius-modal)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] shadow-[var(--shadow-hover)] ${alignRight ? 'right-0' : 'left-0'}`}>
          <div className="py-2">
            {options.map((option) => {
              const selected = option.value === view;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onViewChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${selected ? 'bg-[var(--gogo-grey-100)] font-medium text-[var(--gogo-primary)]' : 'text-[var(--gogo-text-primary)] hover:bg-[var(--gogo-grey-100)]'}`}
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gogo-grey-100)] text-current">
                    {option.icon}
                  </span>
                  <span className="flex-1">{option.label}</span>
                  {selected && <span className="h-2.5 w-2.5 rounded-full bg-[var(--gogo-primary)]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
