import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Breadcrumb } from '../Breadcrumb';

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('Breadcrumb', () => {
  it('renders home link', () => {
    renderWithRouter(<Breadcrumb items={[]} />);
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
  });

  it('renders item list', () => {
    renderWithRouter(
      <Breadcrumb items={[
        { label: 'Kategori', href: '/category' },
        { label: 'Ürün' },
      ]} />
    );
    expect(screen.getByText('Kategori')).toBeInTheDocument();
    expect(screen.getByText('Ürün')).toBeInTheDocument();
  });

  it('renders linked items as anchors', () => {
    renderWithRouter(
      <Breadcrumb items={[{ label: 'Kategori', href: '/category' }]} />
    );
    const link = screen.getByText('Kategori').closest('a');
    expect(link).toHaveAttribute('href', '/category');
  });

  it('renders last item as plain text (no href)', () => {
    renderWithRouter(
      <Breadcrumb items={[{ label: 'Son Sayfa' }]} />
    );
    const el = screen.getByText('Son Sayfa');
    expect(el.closest('a')).toBeNull();
  });

  it('applies light variant classes', () => {
    const { container } = renderWithRouter(
      <Breadcrumb items={[{ label: 'Test' }]} light />
    );
    const nav = container.firstChild as HTMLElement;
    expect(nav.className).toContain('flex');
  });

  it('applies custom className', () => {
    const { container } = renderWithRouter(
      <Breadcrumb items={[]} className="my-custom-class" />
    );
    const nav = container.firstChild as HTMLElement;
    expect(nav.className).toContain('my-custom-class');
  });
});
