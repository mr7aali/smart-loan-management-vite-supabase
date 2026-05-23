import { Check, Sparkles, Crown, Building2, Zap } from 'lucide-react';

interface SubscriptionPageProps {
  currentPlan: string;
  onUpgrade: (plan: string, price: number) => void;
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    icon: Sparkles,
    color: 'from-gray-400 to-gray-500',
    features: [
      'Up to 10 borrowers',
      'Up to 20 loans',
      'Basic reporting',
      'Email support',
      '1 user',
    ],
    limits: '10 borrowers',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 19,
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
    popular: false,
    features: [
      'Up to 50 borrowers',
      'Unlimited loans',
      'Advanced reporting',
      'Priority support',
      'SMS reminders',
      '3 users',
    ],
    limits: '50 borrowers',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 49,
    icon: Crown,
    color: 'from-purple-500 to-pink-500',
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
    limits: '200 borrowers',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    icon: Building2,
    color: 'from-amber-500 to-orange-500',
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
    limits: 'Unlimited',
  },
];

export default function SubscriptionPage({ currentPlan, onUpgrade }: SubscriptionPageProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800">Choose Your Plan</h2>
        <p className="text-gray-500 mt-2">Scale your lending business with the right plan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = currentPlan === plan.id;
          const isUpgrade =
            (currentPlan === 'free' && plan.id !== 'free') ||
            (currentPlan === 'starter' && ['professional', 'enterprise'].includes(plan.id)) ||
            (currentPlan === 'professional' && plan.id === 'enterprise');

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 overflow-hidden transition-all ${
                plan.popular
                  ? 'border-indigo-500 shadow-xl shadow-indigo-200'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-2 text-sm font-semibold">
                  Most Popular
                </div>
              )}

              <div className={`p-6 ${plan.popular ? 'pt-12' : ''}`}>
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-4xl font-bold text-gray-800">${plan.price}</span>
                  <span className="text-gray-500 ml-1">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Up to {plan.limits}</p>

                <div className="mt-6 space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => onUpgrade(plan.id, plan.price)}
                  disabled={isCurrentPlan}
                  className={`w-full mt-6 py-3 rounded-xl font-semibold transition-all ${
                    isCurrentPlan
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isUpgrade
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isCurrentPlan ? 'Current Plan' : isUpgrade ? `Upgrade to ${plan.name}` : 'Downgrade'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Frequently Asked Questions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Can I change plans later?</h4>
            <p className="text-gray-500 text-sm">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Is there a free trial?</h4>
            <p className="text-gray-500 text-sm">The Free plan is available indefinitely. Paid plans come with a 14-day money-back guarantee.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">What payment methods do you accept?</h4>
            <p className="text-gray-500 text-sm">We accept all major credit cards, PayPal, and bank transfers for annual plans.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Do you offer discounts?</h4>
            <p className="text-gray-500 text-sm">Yes! Annual billing saves you 20% compared to monthly. Contact us for team discounts.</p>
          </div>
        </div>
      </div>
    </div>
  );
}