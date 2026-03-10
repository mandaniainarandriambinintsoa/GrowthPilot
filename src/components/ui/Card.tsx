import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-surface-light border border-white/5 rounded-2xl p-6 ${
        hover ? 'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
