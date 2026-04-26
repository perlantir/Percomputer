import type React from 'react';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  badge?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}
