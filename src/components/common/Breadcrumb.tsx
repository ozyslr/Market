import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JsonLd } from '../seo/JsonLd';
import { breadcrumbSchema } from '../seo/schemas';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  light?: boolean;
}

export function Breadcrumb({ items, className, light = false }: BreadcrumbProps) {
  const schemaItems = items.filter(i => i.href).map(i => ({ name: i.label, url: i.href! }));

  return (
    <>
      {schemaItems.length > 0 && <JsonLd data={breadcrumbSchema(schemaItems)} />}
      <nav
        aria-label="Breadcrumb"
        className={cn('flex items-center flex-wrap gap-1', className)}
      >
      <Link
        to="/"
        className={cn(
          'flex items-center transition-colors shrink-0',
          light
            ? 'text-white/70 hover:text-white'
            : 'text-brand-primary/40 hover:text-accent dark:text-white/40 dark:hover:text-accent'
        )}
      >
        <Home size={11} />
      </Link>

      {items.map((item, i) => (
        <React.Fragment key={i}>
          <ChevronRight
            size={10}
            className={cn('shrink-0', light ? 'text-white/40' : 'text-brand-primary/20 dark:text-white/20')}
          />
          {item.href ? (
            <Link
              to={item.href}
              className={cn(
                'text-[11px] font-bold transition-colors truncate max-w-[140px]',
                light
                  ? 'text-white/70 hover:text-white'
                  : 'text-brand-primary/50 hover:text-accent dark:text-white/50 dark:hover:text-accent'
              )}
            >
              {item.label}
            </Link>
          ) : (
            <span
              className={cn(
                'text-[11px] font-bold truncate max-w-[180px]',
                light ? 'text-white' : 'text-brand-primary dark:text-white'
              )}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
    </>
  );
}
