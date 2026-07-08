# Trendyol vs Hepsiburada -- Seller Platform Feature Comparison (2026)

Research date: 2026-05-27

---

## 1. Product Management

| Feature | Trendyol | Hepsiburada |
|---|---|---|
| Product listing (single/SKU) | V2 API: createProducts (max 1,000 items/request). Async batch processing. | API-based product upload via merchant panel. Category-taxonomy mapping required. |
| Variations (size/color) | Full variant support: updateVariantBulk (max 1,000 items). content+variant model. | Supported via offer/listing model -- variations linked to base product. |
| Bulk operations | Bulk create, update, delete (1,000 items/batch). Batch ID query for results. | Bulk inventory/price updates supported via API. |
| Image management | Image URLs in product data. Video API (1 active video per productContentId, approval-gated). | Image URLs in product offers. |
| Category/attribute system | getCategoryAttributes (V1+V2). required attributes per category. AttributeValueIds (array) or AttributeValue (string). | Category taxonomy with required attributes. |
| Product approval flow | Products pass through approval queue (filterApprovedProducts / filterUnapprovedProducts). | Product moderation with approval flow. |
| Product locking/unlocking | Lock system for low/high pricing, supply failure. unlockProducts API. | Not confirmed. |
| Archiving | archiveProducts endpoint. | Not confirmed. |
| Buybox visibility | getBuyboxInformation -- buybox rank, buybox price, competitor count (max 10 barcodes/call). | Not confirmed -- Hepsiburada uses different visibility model. |
| Listing limits (per seller) | 50K / 75K / 150K / 350K / unlimited tiers. Rate limits scale with tier. | Not confirmed. |

---

## 2. Order Management

| Feature | Trendyol | Hepsiburada |
|---|---|---|
| Order fetch | getShipmentPackages (page-based) + getShipmentPackagesStream (cursor-based pagination). | GET orders with date range filter. Only payment-completed orders flow via API. |
| Order status flow | Created -> Picking -> Invoiced -> Shipped -> Delivered | Open -> Picking/Packaged (seller prepares) -> Invoiced -> Packaged -> Shipped (cargo creates label) -> Delivered |
| Package splitting | splitShipmentPackage, multiSplitShipmentPackage, splitShipmentPackageByQuantity. | Not confirmed. |
| Package cancellation | cancelOrderPackageItem (supply failure notification). | CanceledByMerchant / CanceledByCustomer / CanceledBySap (fraud). |
| Invoice management | sendInvoiceLink, uploadInvoiceFile (PDF/JPEG/PNG), deleteInvoiceLink. | E-invoice / e-archive invoice support. |
| Order status updates | updatePackage (Picking/Invoiced). Manual delivery and return tracking. | Create Package -> List Shipping Info -> track status changes. |
| Webhooks (real-time) | Full webhook CRUD: create/update/delete/activate/deactivate/list. | Not confirmed in docs sampled. |
| Test orders | createTestOrder, updateTestOrderStatus (STAGE environment). | Not confirmed. |
| Customer Q&A | answerQuestion, getQuestion, getQuestionFilter (paginated). | Not confirmed. |

### Hepsiburada Order Status Machine (detailed):
```
New -> Picking -> Invoiced -> Packaged -> Shipped -> Delivered
  |       |          |          |
Cancel  Re-stock  [Skip if    Tracking
                   digital]    Push
```
Key difference: Hepsiburada manages delivery -- seller only prepares (pick & pack), then Hepsiburada requests label from shipping vendor.

---

## 3. Pricing & Promotions

| Feature | Trendyol | Hepsiburada |
|---|---|---|
| Price updates | updatePriceAndInventory (max 1,000 SKU, near-real-time). Domestic + export pricing. | API-based price update per offer. |
| List price vs sale price | listPrice and salePrice fields -- listPrice cannot be less than salePrice. | Not confirmed. |
| Frequency limits | 1 price update per day per barcode (export). Domestic: no limit on stock/price updates. | Not confirmed. |
| Promotion/coupon tools | Settlements API tracks discount/coupon transactions. Promotions managed via Seller Panel (non-API). | Not confirmed in API docs reviewed. |
| Dynamic pricing | Buybox information API enables competitive pricing strategies. | Not confirmed. |
| Price lock protection | Products auto-locked for abnormal pricing (low/high thresholds). unlockProducts to restore. | Not confirmed. |

---

## 4. Shipping & Logistics

| Feature | Trendyol | Hepsiburada |
|---|---|---|
| Payment models | Trendyol Pays (platform pays shipping) or Seller Pays. | Hepsiburada manages delivery (HepsiJet + partner carriers). |
| Integrated carriers | Aras Kargo, Horoz Lojistik, DHL eCommerce, Surat Kargo, Yurtici Kargo, PTT Kargo, Kolay Gelsin Kargo, Ceva Tedarik. | HepsiJet (internal), Yurtici Kargo, Aras Kargo, MNG Kargo, Surat Kargo, UPS Turkey. |
| Carrier change | changeCargoProvider API per package. | Not confirmed. |
| Label printing | Common Label (Ortak Etiket) -- createCommonLabel + getCommonLabel for TEX/Aras shipments. | Create Package API returns barcode + package number. |
| Tracking | Cargo tracking number push. Manual delivery/return by tracking number. | List Shipping Information API (check InTransit status for shipped). |
| Box/weight info | updateBoxInfo (weight and dimensions for UPS/CEVA). | Not confirmed. |
| Delivery extension | Extend agreed delivery date (agreedDeliveryDate). | Not confirmed. |
| Alternative delivery | processAlternativeDelivery (cargo link or phone). Digital product delivery support. | Not confirmed. |
| **Trendyol Express (TEX)** | Platform-owned fulfillment: TEX-specific compensation claims (getCompensationTickets). | N/A |
| **HepsiJet** | N/A | Internal logistics network, same-day delivery in major cities. |
| **Hepsiburada Depot** | N/A | Fulfillment service (Hepsiburada storage + HepsiJet delivery). Not confirmed in detail from docs reviewed. |
| Export/international | Full international marketplace integration (Mikro Ihracat). AB product label requirements. | Hepsiglobal cross-border sales program. |

---

## 5. Analytics & Reporting

| Feature | Trendyol | Hepsiburada |
|---|---|---|
| Sales dashboard | Settlements API: sales, returns, discounts, coupons, provisions details. Other Financials API: supplier financing, payments, invoices. | Commission and order data available via API. Seller Panel analytics (scope not fully confirmed from docs). |
| Performance metrics | Seller score affects visibility (implied by buybox system). | Seller score affects visibility -- faster order processing improves score. |
| Financial reporting | Cari Hesap Ekstresi (current account statement) integration. Cargo invoice details. | Commission per order, paymentTermInDays available in order data. |
| Batch reporting | Batch ID query for product/stock/price operation results (4-hour window). | Not confirmed. |

---

## 6. Store Management

| Feature | Trendyol | Hepsiburada |
|---|---|---|
| Store page | Store page managed via Seller Panel. Brand registration (getBrands, getBrandsByName). | Store page managed via Merchant Panel. |
| Brand certification | Brand list API (1,000 brands/page). Brand search by name. | Not confirmed from docs. |
| Video content | 1 active video per product (approval-gated, isApproved flag). | Not confirmed. |
| Seller Akademi | akademi.trendyol.com -- training platform. | Not confirmed. |
| Mobile app | Seller Panel mobile app (noted in docs for stock management coexistence). | Merchant Panel mobile access. |

---

## 7. Financial

| Feature | Trendyol | Hepsiburada |
|---|---|---|
| Commission rates | Textile: 20-25%, Electronics: 5-15% (varies by category). Per-category structure. | Commission per order returned in API (commission amount + commissionType). Category-dependent. |
| Payment schedule | 14-45 day maturation period. Settlements via API. | paymentTermInDays field (30 days typical). |
| Invoice system | E-invoice / E-archive. sendInvoiceLink, uploadInvoiceFile. | E-invoice / E-archive with tax info (taxNumber, taxOffice). |
| Seller financing | Other Financials API: supplier financing, money transfers, payments (hakedis). | Not confirmed. |
| Labor cost tracking | laborCosts -- update labor cost amounts for orders. | Not confirmed. |

---

## 8. Returns & Claims

| Feature | Trendyol | Hepsiburada |
|---|---|---|
| Return creation | createClaim -- for packages without return code. | Not confirmed in detail. |
| Return tracking | getClaims (list returns), getClaimItemAudits (status audit trail). | ClaimCreated status in order flow. |
| Return rejection | createClaimIssue (with file attachments), getClaimIssueReasons. | Not confirmed. |
| Return addresses | getSuppliersAddresses (return and shipment addresses). | Address fields in order data. |

---

## 9. Seller Support & Tools

| Feature | Trendyol | Hepsiburada |
|---|---|---|
| REST API | Full REST API with Basic Auth (username:password). API HealthCheck. | REST API with Basic Auth (merchantId-based). |
| Rate limits | Product: 1,000 req/min; Stock/Price: No limit; Order fetch: 2,000-No Limit (tiered); Order status: 300-No Limit (tiered). | Not confirmed in docs reviewed. |
| Webhook support | Full CRUD webhook management. | Not confirmed. |
| Integration ecosystem | Postman collections. Service limits documentation. Stage environment. | Integration partners (ECOSIRE, Hemi, etc.). |
| Support tickets | Support request API (11. Taleplerim). | Not confirmed. |
| IP whitelisting | Not mentioned in docs reviewed. | Supported (IP whitelist for API access). |

---

## Key Differentiators (Summary)

**Trendyol strengths:**
- Largest marketplace in Turkey (fashion, beauty, grocery dominant)
- Extensive API coverage (products, orders, pricing, financials, webhooks, videos)
- Trendyol Express (TEX) -- owned fulfillment network
- Tiered rate limits supporting large sellers (unlimited tier)
- Structured buybox competition system
- Stock/price updates have NO rate limit
- V2 API migration in progress (V1 deprecated August 2026)
- International export (Mikro Ihracat)

**Hepsiburada strengths:**
- 25+ year consumer trust, dominant in electronics/appliances
- HepsiJet -- internal logistics with same-day delivery capability
- Hepsiburada Depot -- fulfillment service
- HepsiPay -- integrated payments with installment options
- B2B marketplace for enterprise procurement
- Hepsiglobal -- cross-border sales
- Platform-managed delivery (seller only picks & packs)
- 30-day payment terms typical

---

## Sources
- Trendyol API Documentation: https://developers.trendyol.com/
- Trendyol Seller Panel: https://partner.trendyol.com/
- Hepsiburada Merchant Panel: https://merchant.hepsiburada.com/
- ECOSIRE Hepsiburada-Odoo Integration Guide (2026)
- Hemi Hepsiburada Order Management Technical Scope
- eHelp Marketplace Comparison Guide (2025)
- Trendyol Service Limits (updated May 2026)
- Trendyol Marketplace Business Models
