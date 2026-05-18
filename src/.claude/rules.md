# Mercora — Kodlama Standartları

## TypeScript
- `any` yasak — her zaman tip tanımla
- `strictNullChecks` — null/undefined kontrolü zorunlu
- Interface > Type alias (nesne şekilleri için)
- Enum yasak — union string veya `as const` object kullan

## Yorum Politikası
- Yorum yok — iyi isimlendirilmiş değişken/fonksiyon yeterli
- Sadece non-obvious workaround varsa ekle (1 satır max)

## Bileşen Kuralları
- Her dosya tek named export (default değil)
- Props interface dosyanın en üstünde
- `useEffect` dependency array her zaman eksiksiz
- Inline event handler yok — ayrı fonksiyon yaz

## Backend Kuralları
- Her POST/PATCH/PUT endpoint Zod ile validate edilir
- Asla string concatenation ile SQL — her zaman `db.prepare(...).run(...)`
- Auth gereken route: `authenticate` middleware ilk sırada
- Error response formatı: `{ error: string }`

## Git Commit Kuralları
- `feat:` yeni özellik
- `fix:` hata düzeltme
- `chore:` config / yapılandırma değişikliği
- `refactor:` davranış değişmeden kod düzenleme
- Her commit tek mantıksal değişiklik içerir

## Test Standartları
- Yeni route → en az 1 happy path + 1 error case testi
- Frontend bileşen → render + user interaction testi
- Mock DB yasak — in-memory SQLite kullan
