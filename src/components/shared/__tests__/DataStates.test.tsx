import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState, EmptyState, LoadingState } from '../DataStates';

describe('DataStates', () => {
  it('LoadingState renders a status role', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toBeTruthy();
  });
  it('ErrorState shows message and calls onRetry', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Yükleme hatası" onRetry={onRetry} />);
    expect(screen.getByText('Yükleme hatası')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /yeniden dene/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
  it('EmptyState shows title', () => {
    render(<EmptyState title="Ürün yok" />);
    expect(screen.getByText('Ürün yok')).toBeTruthy();
  });
});
