# Phase 1: Reviews, Ratings & QA Enhancement

**Date:** 2026-06-01 | **Status:** In Progress

## Scope

Enhance the product detail page's social proof systems using existing components.

### A. Photo Reviews
- `ReviewCard`: photo grid + lightbox for existing `photos?: string[]`
- `ReviewSection`: photo upload during review creation (Firebase Storage)
- `reviewService`: add photo upload helper

### B. Rating Summary
- 5-star bar chart visualization
- Category ratings display (quality, shipping, description)
- "Customers also bought" widget near review section

### C. Q&A Enhancement
- Top questions accordion in QASection
- Seller response highlighting (badge + styling)
- Quick answer button on each question card

### D. Social Proof
- "X people bought in last 24h" indicator
- "X people viewing now" live indicator
- Social proof bar refresh in ProductDetail
