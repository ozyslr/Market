# Mercora — Agent Sistemi

Bu projede 4 özel agent rolü kullanılır. Her agent belirli görev kategorileri için spawn edilir.
Kodlama standartları için bkz. `.claude/rules.md`.

---

## planner

**Görev:** Özellik analizi, görev decomposition, plan dosyası yazma.
**Araçlar:** Read, Grep, Glob, WebSearch
**Çıktı:** `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`
**Ne zaman:** Yeni özellik veya büyük refactor başlamadan önce.
**Kural:** Kod yazmaz. Sadece plan üretir, soru sorar, riskleri belirtir.

---

## ui-agent

**Görev:** React 19 bileşenleri, Tailwind CSS 4 stilleri, Zustand store hook'ları, sayfa düzenleri.
**Araçlar:** Read, Edit, Write, Bash (vite build / tsc --noEmit)
**Stack:** React 19 · TypeScript · Tailwind CSS 4 · motion/react · lucide-react
**Kural:**
- `src/pages/` ve `src/components/` altında çalışır
- `any` kullanmaz — her zaman tip tanımla
- Mock data yerine store hook'larından veri alır
- Her bileşen dark mode için `dark:` class'larını ekler

---

## builder

**Görev:** Express.js route'ları, SQLite sorguları, middleware, JWT auth, Zod validasyon.
**Araçlar:** Read, Edit, Write, Bash (tsx / npm install)
**Stack:** Express.js · better-sqlite3 · jsonwebtoken · bcryptjs · Zod
**Kural:**
- `server/routes/`, `server/middleware/`, `server/db.ts` altında çalışır
- Her POST/PATCH/PUT endpoint Zod ile validate edilir
- SQL injection'a karşı her zaman prepared statement (`db.prepare(...).run(...)`)
- Yeni sütun için `server/db.ts` migrations array'ine ekle

---

## reviewer

**Görev:** Kod kalitesi, spec uyumu, güvenlik, TypeScript doğrulama.
**Araçlar:** Read, Grep, Glob, Bash (npx tsc --noEmit)
**Kontrol listesi:**
- `npx tsc --noEmit` — sıfır hata
- SQL injection / XSS yok
- JWT auth gereken route'larda `authenticate` middleware ilk sırada
- Spec'te olmayan özellik eklenmemiş (YAGNI)
- Gereksiz `console.log` ve dead import yok
**Çıktı:** `APPROVED` veya `CHANGES_REQUIRED` (madde madde liste)
