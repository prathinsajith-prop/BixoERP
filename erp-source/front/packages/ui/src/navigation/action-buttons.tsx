'use client';

import React from 'react';
import { Button } from '../forms/button';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ActionButtonItem {
  key?: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  title?: string;
  visible?: boolean;
}

interface ActionButtonsProps {
  actions: ActionButtonItem[];
  className?: string;
}

export function ActionButtons({ actions, className = '' }: ActionButtonsProps) {
  const visibleActions = actions.filter((action) => action.visible !== false);

  if (visibleActions.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`.trim()}>
      {visibleActions.map((action, index) => (
        <Button
          key={action.key ?? `${action.label}-${index}`}
          type={action.type ?? 'button'}
          variant={action.variant ?? 'outline'}
          size={action.size ?? 'sm'}
          onClick={action.onClick}
          disabled={action.disabled}
          loading={action.loading}
          title={action.title ?? action.label}
          className={`h-12 gap-1.5 px-4 ${action.className ?? ''}`.trim()}
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
    </div>
  );
}
