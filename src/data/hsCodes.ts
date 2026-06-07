// HS (Harmonized System) codes for international trade
// Keyed by category ID, used for customs declarations

export const HS_CODES: Record<string, string> = {
  electronics: '8471.30',
  phones: '8517.12',
  tablets: '8471.30',
  computers: '8471.30',
  headphones: '8518.30',
  speakers: '8518.22',
  cameras: '8525.80',
  clothing: '6109.10',
  't-shirts': '6109.10',
  dresses: '6204.42',
  sweaters: '6110.20',
  jackets: '6201.92',
  shoes: '6403.99',
  bags: '4202.21',
  'home-garden': '9403.60',
  furniture: '9403.60',
  lighting: '9405.40',
  ceramics: '6911.10',
  textiles: '6302.21',
  jewelry: '7117.19',
  'precious-jewelry': '7113.19',
  watches: '9102.11',
  art: '9701.10',
  paintings: '9701.10',
  sculptures: '9703.90',
  'food-beverage': '2106.90',
  'baked-goods': '1905.90',
  cosmetics: '3304.99',
  skincare: '3304.99',
  perfume: '3303.00',
  books: '4901.99',
  toys: '9503.00',
  'sports-equipment': '9506.99',
  musical_instruments: '9202.90',
  pet_supplies: '4201.00',
  default: '6117.90',
};

export const HS_CODE_LABELS: Record<string, string> = {
  '8471.30': 'Computers / Bilgisayarlar',
  '8517.12': 'Smartphones / Akıllı Telefonlar',
  '8518.30': 'Headphones / Kulaklıklar',
  '8518.22': 'Speakers / Hoparlörler',
  '8525.80': 'Cameras / Kameralar',
  '6109.10': 'T-Shirts / Tişörtler',
  '6204.42': 'Dresses / Elbiseler',
  '6110.20': 'Sweaters / Kazaklar',
  '6201.92': 'Jackets / Ceketler',
  '6403.99': 'Shoes / Ayakkabılar',
  '4202.21': 'Bags / Çantalar',
  '9403.60': 'Furniture / Mobilya',
  '9405.40': 'Lighting / Aydınlatma',
  '6911.10': 'Ceramics / Seramik',
  '6302.21': 'Textiles / Tekstil',
  '7117.19': 'Costume Jewelry / Kostüm Takı',
  '7113.19': 'Precious Jewelry / Değerli Takı',
  '9102.11': 'Watches / Saatler',
  '9701.10': 'Paintings / Tablolar',
  '9703.90': 'Sculptures / Heykeller',
  '2106.90': 'Food Preparations / Gıda',
  '1905.90': 'Baked Goods / Unlu Mamüller',
  '3304.99': 'Cosmetics / Kozmetik',
  '3303.00': 'Perfume / Parfüm',
  '4901.99': 'Books / Kitaplar',
  '9503.00': 'Toys / Oyuncaklar',
  '9506.99': 'Sports Equipment / Spor Ekipmanı',
  '9202.90': 'Musical Instruments / Müzik Aletleri',
  '4201.00': 'Pet Supplies / Evcil Hayvan',
  '6117.90': 'Other Textile Articles / Diğer Tekstil',
};

export function getHsCode(categoryId: string): string {
  const key = (categoryId || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  return HS_CODES[key] || HS_CODES.default;
}

export function getHsCodeLabel(hsCode: string): string {
  return HS_CODE_LABELS[hsCode] || '';
}
