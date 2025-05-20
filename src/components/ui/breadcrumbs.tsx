import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react'; // Or use simple characters like '/' or '>'

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={`mb-4 text-sm text-muted-foreground ${className}`}>
      <ol className="flex items-center space-x-1 md:space-x-2">
        {items.map((item, index) => (
          <li key={index} className="inline-flex items-center">
            {index > 0 && (
              <span className="mx-1">/</span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-foreground hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              // Last item, not a link
              <span className="font-medium text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
} 