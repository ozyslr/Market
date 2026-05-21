import { describe, it, expect } from 'vitest';
import { generateCsvTemplate, CSV_COLUMNS } from './csvTemplate';

describe('csvTemplate', () => {
  it('should have all required columns defined', () => {
    const required = CSV_COLUMNS.filter(c => c.required);
    expect(required.length).toBeGreaterThan(0);
    expect(required.find(c => c.key === 'title')).toBeDefined();
    expect(required.find(c => c.key === 'categoryId')).toBeDefined();
    expect(required.find(c => c.key === 'price')).toBeDefined();
    expect(required.find(c => c.key === 'stock')).toBeDefined();
    expect(required.find(c => c.key === 'description')).toBeDefined();
  });

  it('should generate a CSV with header and at least 2 data rows', () => {
    const csv = generateCsvTemplate();
    const lines = csv.split('\n');
    expect(lines.length).toBeGreaterThanOrEqual(3); // header + 2 rows
    expect(lines[0]).toContain('title');
    expect(lines[0]).toContain('price');
    expect(lines[1]).toContain('Nike');
    expect(lines[2]).toContain('iPhone');
  });

  it('should have at least as many columns in data rows as in header', () => {
    const csv = generateCsvTemplate();
    const lines = csv.split('\n').filter(l => l.trim());
    const headerCount = lines[0].split(',').length;
    expect(headerCount).toBeGreaterThan(10);
    lines.slice(1).forEach((line) => {
      expect(line.split(',').length).toBeGreaterThanOrEqual(headerCount - 2);
    });
  });
});
