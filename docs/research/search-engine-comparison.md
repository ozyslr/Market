# Arama Motoru Karşılaştırma Raporu

**Tarih:** 19 Mayıs 2026
**Hazırlayan:** CEO (web araştırması)

---

## Karşılaştırma: Meilisearch vs Typesense vs Algolia

### Fiyatlandırma

| Senaryo | Algolia (cloud) | Meilisearch (self-hosted) | Typesense (self-hosted) |
|---|---|---|---|
| 1M arama/ay | ~$500/ay | ~$16/ay | ~$16/ay |
| Yıllık maliyet | ~$6,000 | ~$192 | ~$192 |

### Özellik Karşılaştırması

| Özellik | Meilisearch | Typesense | Algolia |
|---|---|---|---|
| Self-hosted | ✅ (MIT) | ✅ (GPLv3) | ❌ (sadece cloud) |
| Firebase uyumu | ⭐ Çok iyi (5 dk kurulum) | İyi | Orta |
| Typo tolerance | ✅ Out-of-the-box | ✅ | ✅ |
| Faceted search | ✅ | ✅ (daha iyi) | ✅ (en iyi) |
| Field weighting | ❌ (custom ranking kuralları) | ✅ | ✅ |
| RAM gereksinimi | Düşük (disk-backed LMDB) | Yüksek (tüm veri RAM'de) | N/A (cloud) |
| Kurulum süresi | 5 dakika | 30+ dakika | Hemen (cloud) |
| Ölçeklenebilirlik | Çok iyi | RAM ile sınırlı | Mükemmel (pahalı) |

### Tavsiye: Meilisearch

**Gerekçeler:**
1. Firebase ile en hızlı entegrasyon (Cloud Functions ile indexing)
2. Self-hosted, yıllık ~$200 maliyet
3. Disk-backed depolama — ürün kataloğu büyüdükçe RAM sınırı yok
4. Typo tolerance sıfır konfigürasyonla çalışır
5. InstantSearch adaptörleri ile frontend değişmeden geçiş yapılabilir

**Algolia'dan kaçının** — kurumsal bütçeniz yoksa ($50K+/yıl) maliyet kontrolsüz büyür.

---

## Entegrasyon Planı (Meilisearch)

### 1. Meilisearch Sunucusu
```bash
# Docker ile kurulum
docker run -d -p 7700:7700 \
  -e MEILI_MASTER_KEY=xxx \
  -v meili_data:/meili_data \
  getmeili/meilisearch:v1.12
```

### 2. Firebase → Meilisearch Senkronizasyonu
Firestore'daki ürünler Cloud Functions ile Meilisearch'e indexlenir:
```
Firestore (products) → Cloud Function (onWrite) → Meilisearch API
```

### 3. Frontend Arama
Mevcut searchService.ts'deki MOCK_PRODUCTS filter() çağrısı,
Meilisearch JavaScript client'ı ile değiştirilir:
```ts
import { MeiliSearch } from 'meilisearch'
const client = new MeiliSearch({ host: 'http://localhost:7700', apiKey: 'xxx' })
const results = await client.index('products').search(query, { filters: 'categoryId = electronics' })
```

### 4. Deployment
- Production: Railway / Fly.io / DigitalOcean ($7-15/ay)
- Development: Docker compose ile local
