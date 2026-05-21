'use client';

export const CSV_COLUMNS = [
  { key: 'title',                 label: 'Ürün Adı',              required: true,  hint: 'Ürünün tam adı' },
  { key: 'brand',                 label: 'Marka',                 required: false, hint: 'Marka adı' },
  { key: 'categoryId',            label: 'Kategori ID',           required: true,  hint: 'Admin panelinden kopyalayın' },
  { key: 'sku',                   label: 'SKU',                   required: false, hint: 'Stok kodu' },
  { key: 'price',                 label: 'Satış Fiyatı',          required: true,  hint: 'Sayısal — ör: 149.99' },
  { key: 'oldPrice',              label: 'Eski Fiyat',            required: false, hint: 'İndirimli ürün için' },
  { key: 'currency',              label: 'Para Birimi',           required: false, hint: 'TRY / USD / EUR / GBP' },
  { key: 'stock',                 label: 'Stok Adedi',            required: true,  hint: 'Tam sayı — ör: 50' },
  { key: 'description',           label: 'Kısa Açıklama',         required: true,  hint: 'Ürün özeti' },
  { key: 'longDescription',       label: 'Detaylı Açıklama',      required: false, hint: 'Uzun ürün açıklaması' },
  { key: 'images',                label: 'Görseller (URL)',        required: false, hint: 'Pipe ile ayır: url1|url2' },
  { key: 'tags',                  label: 'Etiketler',             required: false, hint: 'Virgülle ayır: spor,outdoor' },
  { key: 'weight',                label: 'Ağırlık (kg)',          required: false, hint: 'Sayısal — ör: 0.5' },
  { key: 'originCountry',         label: 'Menşei Ülke',           required: false, hint: 'Türkiye' },
  { key: 'hsCode',                label: 'HS Kodu',               required: false, hint: 'Gümrük kodu' },
  { key: 'estimatedDeliveryDays', label: 'Teslimat Süresi (Gün)', required: false, hint: 'Tam sayı — ör: 3' },
  { key: 'deliveryTerms',         label: 'Teslimat Koşulları',    required: false, hint: '3-5 iş günü içinde kargo' },
  { key: 'returnPolicy',          label: 'İade Politikası',       required: false, hint: '14 gün iade hakkı' },
  { key: 'visibility',            label: 'Görünürlük',            required: false, hint: 'public / hidden / draft' },
  { key: 'metaDescription',       label: 'Meta Açıklama (SEO)',   required: false, hint: 'Maks 160 karakter' },
] as const;

const EXAMPLE_1 = [
  'Nike Air Max 90 Erkek','Nike','sport','NKE-AM90-001','2499','2999','TRY','25',
  'Klasik Nike Air Max 90 erkek spor ayakkabısı',
  'Nike Air Max 90 ikonik Air-Sole yastıklama ile maksimum konfor sunar.',
  'https://example.com/img1.jpg|https://example.com/img2.jpg',
  'spor,ayakkabı,nike','0.8','Türkiye','6404.11','3',
  '3-5 iş günü içinde kargo','30 gün iade hakkı','public',
  'Nike Air Max 90 erkek — %16 indirimle 2499 TL. Ücretsiz kargo.',
];

const EXAMPLE_2 = [
  'iPhone 15 Şeffaf Silikon Kılıf','','electronics','','149','','TRY','100',
  'iPhone 15 uyumlu ultra ince şeffaf kılıf','','','kilif,iphone',
  '0.05','Türkiye','','2','','','public','',
];

export function generateCsvTemplate(): string {
  const header = CSV_COLUMNS.map(c => c.key).join(',');
  return [header, EXAMPLE_1.join(','), EXAMPLE_2.join(',')].join('\n');
}

export function downloadCsvTemplate() {
  const blob = new Blob(['\uFEFF' + generateCsvTemplate()], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'mercora-urun-sablonu.csv'; a.click();
  URL.revokeObjectURL(url);
}
