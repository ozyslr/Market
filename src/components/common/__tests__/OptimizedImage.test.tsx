import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OptimizedImage } from '../OptimizedImage';

describe('OptimizedImage', () => {
  it('renders image with alt text', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test ürün" />);
    const img = screen.getByAltText('Test ürün');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/test.jpg');
  });

  it('renders fallback when src is empty', () => {
    render(<OptimizedImage src="" alt="Yok" />);
    // aria-label falls back to alt when provided
    expect(screen.getByRole('img', { name: 'Yok' })).toBeInTheDocument();
  });

  it('renders fallback text when both src and alt are empty', () => {
    render(<OptimizedImage src="" alt="" />);
    expect(screen.getByRole('img', { name: 'Image not available' })).toBeInTheDocument();
  });

  it('sets lazy loading by default', () => {
    render(<OptimizedImage src="/test.jpg" alt="Lazy" />);
    expect(screen.getByAltText('Lazy')).toHaveAttribute('loading', 'lazy');
  });

  it('disables lazy loading when lazy=false', () => {
    render(<OptimizedImage src="/test.jpg" alt="Eager" lazy={false} />);
    expect(screen.getByAltText('Eager')).not.toHaveAttribute('loading');
  });

  it('applies aspect ratio to container', () => {
    const { container } = render(
      <OptimizedImage src="/test.jpg" alt="Ratio" aspectRatio="1/1" />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.aspectRatio).toBe('1/1');
  });

  it('applies custom className to image', () => {
    render(<OptimizedImage src="/test.jpg" alt="Classy" className="rounded-lg" />);
    expect(screen.getByAltText('Classy')).toHaveClass('rounded-lg');
  });

  it('renders with referrerPolicy', () => {
    render(
      <OptimizedImage
        src="/test.jpg"
        alt="Referrer"
        referrerPolicy="no-referrer"
      />
    );
    expect(screen.getByAltText('Referrer')).toHaveAttribute(
      'referrerPolicy',
      'no-referrer'
    );
  });
});
