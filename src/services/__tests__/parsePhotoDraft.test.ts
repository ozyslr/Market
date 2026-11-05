import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/gemini', () => ({ geminiFetch: vi.fn() }));

import { parsePhotoDraft } from '../aiContentService';

describe('parsePhotoDraft', () => {
  it('reads JSON wrapped in prose/fences and keeps only known categories', () => {
    const text =
      'İşte sonuç:\n```json\n{"title":"Deri Cüzdan","description":"El yapımı.","categoryId":"aksesuar","brand":"","tags":["Cüzdan","deri"]}\n```';
    expect(parsePhotoDraft(text, ['aksesuar'])).toEqual({
      title: 'Deri Cüzdan',
      description: 'El yapımı.',
      categoryId: 'aksesuar',
      brand: '',
      tags: ['cüzdan', 'deri'],
    });
    expect(parsePhotoDraft(text, ['elektronik'])?.categoryId).toBe('');
  });

  it('returns null for non-JSON replies', () => {
    expect(parsePhotoDraft('Üzgünüm, göremiyorum.', ['x'])).toBeNull();
  });
});
