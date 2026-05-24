export type SubscriptionPlanId =
  | 'free'
  | 'starter'
  | 'professional'
  | 'enterprise';

export type PaidSubscriptionPlanId = Exclude<SubscriptionPlanId, 'free'>;

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  price: number;
  color: string;
  limits: string;
  maxBorrowers: number | null;
  maxLoans: number | null;
  popular?: boolean;
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    color: 'from-gray-400 to-gray-500',
    limits: '10 borrowers',
    maxBorrowers: 10,
    maxLoans: 20,
    features: [
      'Up to 10 borrowers',
      'Up to 20 loans',
      'Basic reporting',
      'Email support',
      '1 user',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 19,
    color: 'from-blue-500 to-cyan-500',
    limits: '50 borrowers',
    maxBorrowers: 50,
    maxLoans: null,
    features: [
      'Up to 50 borrowers',
      'Unlimited loans',
      'Advanced reporting',
      'Priority support',
      'SMS reminders',
      '3 users',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 49,
    color: 'from-purple-500 to-pink-500',
    limits: '200 borrowers',
    maxBorrowers: 200,
    maxLoans: null,
    popular: true,
    features: [
      'Up to 200 borrowers',
      'Unlimited loans',
      'Full analytics',
      '24/7 support',
      'WhatsApp reminders',
      '10 users',
      'API access',
      'Custom branding',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    color: 'from-amber-500 to-orange-500',
    limits: 'Unlimited',
    maxBorrowers: null,
    maxLoans: null,
    features: [
      'Unlimited borrowers',
      'Unlimited loans',
      'Full analytics',
      'Dedicated support',
      'All reminder types',
      'Unlimited users',
      'API access',
      'Custom branding',
      'White-label',
      'SSO integration',
    ],
  },
];

export const SUBSCRIPTION_PLANS_BY_ID = Object.fromEntries(
  SUBSCRIPTION_PLANS.map((plan) => [plan.id, plan]),
) as Record<SubscriptionPlanId, SubscriptionPlan>;

export function isPaidSubscriptionPlanId(
  planId: SubscriptionPlanId,
): planId is PaidSubscriptionPlanId {
  return planId !== 'free';
}
