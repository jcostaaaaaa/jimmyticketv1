import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${className}`}>
      {children}
    </span>
  );
} 