import { describe, it, expectTypeOf } from 'vitest';
import type { UserProfile } from '../types';
import type { OneClickCheckoutResult } from '../types/order';

describe('UserProfile one-click fields', () => {
  it('has optional stripe fields', () => {
    expectTypeOf<UserProfile['stripeCustomerId']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<UserProfile['defaultPaymentMethodId']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<UserProfile['defaultPaymentMethodLast4']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<UserProfile['defaultPaymentMethodBrand']>().toEqualTypeOf<string | undefined>();
  });

  it('OneClickCheckoutResult has required status field', () => {
    expectTypeOf<OneClickCheckoutResult['status']>().toEqualTypeOf<'succeeded' | 'requires_action' | 'failed'>();
  });
});
