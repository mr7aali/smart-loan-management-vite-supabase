export const PLAN_DETAILS = {
  free: {
    name: 'Free',
    price: 0,
    maxBorrowers: 10,
    maxLoans: 20,
  },
  starter: {
    name: 'Starter',
    price: 19,
    maxBorrowers: 50,
    maxLoans: null,
  },
  professional: {
    name: 'Professional',
    price: 49,
    maxBorrowers: 200,
    maxLoans: null,
  },
  enterprise: {
    name: 'Enterprise',
    price: 99,
    maxBorrowers: null,
    maxLoans: null,
  },
} as const;

export type SubscriptionPlanId = keyof typeof PLAN_DETAILS;
export type PaidSubscriptionPlanId = Exclude<SubscriptionPlanId, 'free'>;

export function isSubscriptionPlanId(value: unknown): value is SubscriptionPlanId {
  return typeof value === 'string' && value in PLAN_DETAILS;
}

export function isPaidSubscriptionPlanId(
  value: unknown,
): value is PaidSubscriptionPlanId {
  return isSubscriptionPlanId(value) && value !== 'free';
}
