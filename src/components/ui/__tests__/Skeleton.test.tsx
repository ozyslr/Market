import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  ProductCardSkeleton,
  ProductGridSkeleton,
  CategoryListSkeleton,
  TableRowSkeleton,
  SearchResultsSkeleton,
} from '../Skeleton';

describe('Skeleton', () => {
  it('renders with default classes', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="w-20 h-20" />);
    expect(container.firstChild).toHaveClass('w-20', 'h-20');
  });
});

describe('ProductCardSkeleton', () => {
  it('renders without errors', () => {
    const { container } = render(<ProductCardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('ProductGridSkeleton', () => {
  it('renders default 8 items', () => {
    const { container } = render(<ProductGridSkeleton />);
    const items = container.firstChild!.childNodes;
    expect(items.length).toBe(8);
  });

  it('renders custom count', () => {
    const { container } = render(<ProductGridSkeleton count={4} />);
    const items = container.firstChild!.childNodes;
    expect(items.length).toBe(4);
  });
});

describe('CategoryListSkeleton', () => {
  it('renders default 6 items', () => {
    const { container } = render(<CategoryListSkeleton />);
    const items = container.firstChild!.childNodes;
    expect(items.length).toBe(6);
  });
});

describe('TableRowSkeleton', () => {
  it('renders default 5 columns', () => {
    const { container } = render(<TableRowSkeleton />);
    const cols = container.firstChild!.childNodes;
    expect(cols.length).toBe(5);
  });
});

describe('SearchResultsSkeleton', () => {
  it('renders without errors', () => {
    const { container } = render(<SearchResultsSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
