# Mercora → Benim Olan Rebranding Master Plan

**Project Goal**: Transform the Mercora marketplace system into "Benim Olan" with complete visual, structural, and content rebranding.

**Timeline**: Phase-based approach (4-6 weeks)  
**Status**: Planning  
**Last Updated**: 2026-05-23

---

## Phase 1: Foundation & Design (Week 1)

### 1.1 Visual Identity System
- [ ] **Logo & Brand Mark**
  - Primary logo with "Benim Olan" wordmark
  - Icon mark (symbol-only version)
  - Logo variations (horizontal, vertical, single color)
  - Design files: Figma, SVG exports
  
- [ ] **Color Palette**
  - Dominant color: Warm orange/amber (#E8722D or similar)
  - Secondary: Professional neutral
  - Accent colors: Supporting brand colors
  - CSS variables for consistency
  
- [ ] **Typography System**
  - Display font: Bold, characterful (not Inter/Roboto)
  - Body font: Clean, readable serif or sans
  - Font weights: 300, 400, 600, 700, 900
  - Include Turkish language support

- [ ] **Design Tokens**
  - Spacing scale
  - Border radius system
  - Shadow system
  - Motion/animation guidelines
  - Component library specifications

### 1.2 Brand Guidelines Document
- [ ] Logo usage rules
- [ ] Color specifications & accessibility
- [ ] Typography guidelines
- [ ] Imagery & photography style
- [ ] Voice & tone guidelines
- [ ] Dos and Don'ts

**Deliverable**: design-system.figma + BRAND_GUIDELINES.md

---

## Phase 2: Codebase Refactoring (Week 2-3)

### 2.1 Directory & File Renaming
- [ ] Rename `mercora-next/` → `benimolan-next/`
- [ ] Rename internal references in:
  - [ ] package.json scripts
  - [ ] build configurations
  - [ ] CI/CD pipelines
  - [ ] Docker files (if any)

### 2.2 Component & Variable Refactoring
- [ ] Search & replace "mercora" → "benimolan" in:
  - [ ] Component names (MercoraSeller → BenimolanSeller)
  - [ ] Context names (MercorContext → BenimolanContext)
  - [ ] Service class names
  - [ ] API endpoint references
  - [ ] Class names & BEM naming

- [ ] Update internal comments & documentation
- [ ] Update environment variable names

### 2.3 Configuration Updates
- [ ] `.env` variables:
  - `VITE_APP_NAME="Benim Olan"`
  - `REACT_APP_BRAND="benimolan"`
  - API endpoints if needed

- [ ] Firebase project names/identifiers
- [ ] Analytics tracking IDs
- [ ] Meta tags & SEO variables

**Deliverable**: Clean, rebrand-ready codebase

---

## Phase 3: Visual & UI Updates (Week 3-4)

### 3.1 Design System Integration
- [ ] Import new typography (Google Fonts or custom)
- [ ] Create CSS variables file:
  ```css
  --color-primary: #E8722D;
  --color-secondary: #ffffff;
  --font-display: 'Neue Aachen', serif;
  --font-body: 'Figtree', sans-serif;
  --spacing-unit: 8px;
  ```

- [ ] Update Tailwind config with brand colors
- [ ] Apply color palette across all components
- [ ] Update button & interactive element styles

### 3.2 Component Updates
- [ ] **Navigation & Header**
  - [ ] Logo replacement (all positions)
  - [ ] Brand color application
  - [ ] Link text updates if needed

- [ ] **Product Cards**
  - [ ] Brand styling
  - [ ] Accent color application

- [ ] **Seller Dashboard**
  - [ ] UI refresh with brand colors
  - [ ] Logo & branding elements

- [ ] **Review & Rating Components**
  - [ ] Visual consistency
  - [ ] Brand-aligned badges

- [ ] **Modals & Dialogs**
  - [ ] CTA buttons (brand primary color)
  - [ ] Accent elements

### 3.3 Page & Hero Sections
- [ ] Homepage hero redesign
- [ ] Category pages
- [ ] Search results page
- [ ] Seller onboarding flow
- [ ] User account pages

**Deliverable**: Fully styled, brand-compliant UI

---

## Phase 4: Content & Copy (Week 4)

### 4.1 Marketing Copy
- [ ] **Site-wide text**
  - [ ] Page titles & meta descriptions
  - [ ] Button labels (CTAs)
  - [ ] Placeholder text
  - [ ] Error messages
  - [ ] Empty states

- [ ] **Marketing messages**
  - [ ] Homepage hero copy
  - [ ] Feature highlights
  - [ ] Call-to-action copy
  - [ ] Seller value proposition

### 4.2 Multi-language Support
- [ ] **Turkish (tr)**
  - [ ] All UI text
  - [ ] Slogans & taglines
  - [ ] Help text & tooltips

- [ ] **English (en)**
  - [ ] International version
  - [ ] Consistency with Turkish messaging

- [ ] Update i18n/language files
- [ ] Test language switching

### 4.3 Slogans & Brand Messaging

**Primary Slogan**: "Benim Olan, Benim Kurallarım"  
(Translation: "Mine, My Rules")

**Supporting Slogans**:
- "Sende Kalsın" - It stays with you
- "Kendi İşinin Ustası" - Master of your own business
- "Sahip Ol, Büyüt, Kazandır" - Own, Grow, Earn

**Taglines by Section**:
- For Buyers: "Güvenilir alışveriş, sana ait"
- For Sellers: "Kendi mağazanı, kendi kurallarınla"

**Deliverable**: i18n configuration + brand messaging guide

---

## Phase 5: Domain & Infrastructure (Week 4-5)

### 5.1 Domain Setup
- [ ] **Primary domain**: benimolan.com (main platform)
- [ ] **Regional**: benimolan.co.uk, benimolan.uk
- [ ] **Category domains**: 
  - [ ] benimolan.store (e-commerce focus)
  - [ ] benimolan.shop (quick shop)
  - [ ] benimolan.org (community/info)

### 5.2 SSL & Security
- [ ] SSL certificates for all domains
- [ ] HTTPS enforcement
- [ ] Security headers

### 5.3 Redirects & SEO
- [ ] 301 redirects from mercora.* to benimolan.*
- [ ] Update sitemap.xml
- [ ] Update robots.txt
- [ ] Google Search Console updates
- [ ] Canonical tags if needed

### 5.4 Analytics & Tracking
- [ ] Update Google Analytics property/tag
- [ ] Update conversion tracking IDs
- [ ] Update Sentry project if used
- [ ] Review Firebase Analytics configuration

**Deliverable**: Domain infrastructure ready, redirects in place

---

## Phase 6: Testing & QA (Week 5-6)

### 6.1 Functional Testing
- [ ] Product browsing & filtering
- [ ] Search functionality
- [ ] User registration & login
- [ ] Product details & reviews
- [ ] Shopping cart & checkout
- [ ] Seller dashboard
- [ ] Payment integration (Stripe, Iyzipay)

### 6.2 Visual Testing
- [ ] Brand color application across all pages
- [ ] Typography consistency
- [ ] Logo placement & sizing
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)

### 6.3 Multi-language Testing
- [ ] Turkish language completeness
- [ ] English language completeness
- [ ] RTL support (if needed)
- [ ] Language switching
- [ ] Date/time formatting

### 6.4 Performance Testing
- [ ] Lighthouse scores
- [ ] Page load speed
- [ ] Core Web Vitals
- [ ] Image optimization with brand colors

### 6.5 SEO & Meta Testing
- [ ] Meta titles & descriptions
- [ ] Open Graph tags (og:title, og:image with new logo)
- [ ] Twitter cards
- [ ] Canonical tags
- [ ] Structured data (schema.org)

**Deliverable**: QA checklist completed, bugs documented

---

## Phase 7: Deployment & Launch (Week 6+)

### 7.1 Pre-launch Checklist
- [ ] All code merged to main/production branch
- [ ] Build artifacts generated
- [ ] Environment variables configured
- [ ] Database backups taken
- [ ] Analytics tracking verified
- [ ] Email notifications tested
- [ ] Payment systems verified

### 7.2 Deployment Strategy
- [ ] Blue-green deployment (if possible)
- [ ] Canary rollout (10% → 50% → 100%)
- [ ] Monitoring & alerting active
- [ ] Rollback plan documented

### 7.3 Post-launch
- [ ] Monitor error logs & performance
- [ ] User feedback collection
- [ ] Bug fixes & hotfixes
- [ ] Social media announcements
- [ ] Email communications to existing users

### 7.4 Marketing & Communications
- [ ] Launch announcement
- [ ] Email to user base about rebranding
- [ ] Social media campaign
- [ ] Press release (if applicable)
- [ ] Partner notifications

**Deliverable**: Live Benim Olan platform

---

## Technical Details

### Files to Rename/Refactor
```
mercora-next/               → benimolan-next/
src/components/commerce/    → src/components/marketplace/
src/pages/SearchResults.tsx → Updated theme
public/images/mercora-*     → public/images/benimolan-*
```

### Environment Variables to Update
```env
VITE_APP_NAME=Benim Olan
VITE_APP_DOMAIN=benimolan.com
REACT_APP_BRAND=benimolan
```

### Color Palette (Proposed)
```css
--primary: #E8722D    /* Warm Orange */
--secondary: #1a1a1a  /* Dark Charcoal */
--accent: #00d084     /* Fresh Green */
--neutral-50: #f9fafb
--neutral-900: #111827
```

### Typography (Proposed)
- **Display**: Neue Aachen, Georgia, serif (bold, distinctive)
- **Body**: Figtree, Inter, system-ui, sans-serif (readable, modern)

---

## Success Criteria

- [ ] All "mercora" references replaced with "benimolan"
- [ ] Brand colors applied consistently across UI
- [ ] All pages render correctly with new branding
- [ ] Multi-language support fully functional
- [ ] SEO metrics maintained or improved
- [ ] No functional regressions
- [ ] Performance metrics stable
- [ ] Mobile responsiveness verified
- [ ] Accessibility standards maintained (WCAG 2.1 AA)
- [ ] Analytics tracking working

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Data loss during migration | Full backup before starting, version control |
| SEO impact from rebranding | 301 redirects, search console updates, schema markup |
| User confusion | Clear communication, email announcement |
| Mobile responsiveness breaks | Thorough mobile testing before launch |
| Payment processing issues | Test all payment flows before launch |
| Downtime during deployment | Blue-green or canary deployment strategy |

---

## Rollback Plan

If critical issues arise:
1. Keep mercora-* branches alive for quick rollback
2. Database backups before each phase
3. DNS switchback capability
4. User communication about revert (if needed)

---

## Dependencies

- [ ] Design tools access (Figma)
- [ ] Font licensing (if using premium fonts)
- [ ] Domain registration & DNS access
- [ ] Firebase/backend admin access
- [ ] DNS & hosting provider access
- [ ] Email service for notifications
- [ ] Analytics accounts

---

## Team & Responsibilities

- **Design**: Visual identity, design system, UI mockups
- **Frontend**: Component updates, CSS refactoring, testing
- **Backend**: Configuration updates, data migrations
- **DevOps**: Domain setup, deployment, monitoring
- **QA**: Testing, bug documentation
- **Product**: Launch strategy, user communication

---

## Timeline & Milestones

| Week | Milestone | Owner |
|------|-----------|-------|
| 1 | Design system complete | Design |
| 2 | Codebase refactoring done | Frontend/Backend |
| 3 | UI updates complete | Frontend |
| 4 | Content & domains ready | Product/DevOps |
| 5 | Testing complete, bugs fixed | QA |
| 6 | Deployment & launch | DevOps |

---

## Next Steps

1. ✅ Approval of this plan
2. Start Phase 1: Design system creation
3. Parallel: Phase 2 codebase refactoring
4. Sequential: Phases 3-7
5. Review & adjust timeline based on progress

---

**Plan Owner**: [Your Name]  
**Last Updated**: 2026-05-23  
**Status**: Ready for review & approval
