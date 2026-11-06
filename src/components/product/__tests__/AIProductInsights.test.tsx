import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AIProductInsights } from '../AIProductInsights';
import { generateProductInsights } from '@/services/aiContentService';

vi.mock('@/services/aiContentService', () => ({ generateProductInsights: vi.fn() }));

describe('AIProductInsights', () => {
  it('drops a summary that arrives after the user moved to another product', async () => {
    let answer!: (v: unknown) => void;
    vi.mocked(generateProductInsights).mockReturnValue(new Promise((r) => (answer = r)) as never);

    const { rerender } = render(<AIProductInsights productTitle="Kupa A" description="" />);
    fireEvent.click(screen.getByRole('button'));
    rerender(<AIProductInsights productTitle="Tabak B" description="" />);
    await act(async () => answer({ summary: 'Kupa A özeti', pros: [], cons: [] }));

    expect(screen.queryByText('Kupa A özeti')).toBeNull();
    expect(screen.getByRole('button').textContent).toContain('Yapay zekâ ile ürün özeti');
  });

  it('shows the summary for the same product', async () => {
    vi.mocked(generateProductInsights).mockResolvedValue({
      summary: 'Kupa A özeti',
      pros: [],
      cons: [],
    } as never);

    render(<AIProductInsights productTitle="Kupa A" description="" />);
    await act(async () => fireEvent.click(screen.getByRole('button')));

    expect(screen.getByText('Kupa A özeti')).toBeTruthy();
  });
});
