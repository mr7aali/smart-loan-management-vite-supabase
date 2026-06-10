import {
  Check,
  Sparkles,
  Crown,
  Building2,
  Zap,
} from 'lucide-react';
import { SUBSCRIPTION_PLANS, SubscriptionPlanId } from '../lib/subscription-plans';

interface SubscriptionPageProps {
  currentPlan: SubscriptionPlanId;
  changingPlan?: SubscriptionPlanId | null;
  onUpgrade: (plan: SubscriptionPlanId) => void;
}

const planIcons = {
  free: Sparkles,
  starter: Zap,
  professional: Crown,
  enterprise: Building2,
};

export default function SubscriptionPage({
  currentPlan,
  changingPlan,
  onUpgrade,
}: SubscriptionPageProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 sm:text-3xl">Choose Your Plan</h2>
        <p className="mt-2 text-sm text-gray-500 sm:text-base">Scale your lending business with the right plan</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const Icon = planIcons[plan.id];
          const isCurrentPlan = currentPlan === plan.id;
          const currentPlanDetails = SUBSCRIPTION_PLANS.find(
            (subscriptionPlan) => subscriptionPlan.id === currentPlan,
          );
          const isUpgrade =
            !currentPlanDetails || plan.price > currentPlanDetails.price;
          const isChanging = changingPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border-2 bg-white transition-all md:max-w-none ${
                plan.popular
                  ? 'border-indigo-500 shadow-xl shadow-indigo-200'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute left-0 right-0 top-0 bg-gradient-to-r from-indigo-600 to-purple-600 py-2 text-center text-xs font-semibold text-white sm:text-sm">
                  Most Popular
                </div>
              )}

              <div className={`p-5 sm:p-6 ${plan.popular ? 'pt-11 sm:pt-12' : ''}`}>
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${plan.color} sm:h-14 sm:w-14`}>
                  <Icon className="h-6 w-6 text-white sm:h-7 sm:w-7" />
                </div>

                <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-3xl font-bold text-gray-800 sm:text-4xl">${plan.price}</span>
                  <span className="text-gray-500 ml-1">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Up to {plan.limits}</p>

                <div className="mt-5 space-y-3 sm:mt-6">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => onUpgrade(plan.id)}
                  disabled={isCurrentPlan || Boolean(changingPlan)}
                  className={`mt-5 w-full rounded-xl py-3 font-semibold transition-all sm:mt-6 ${
                    isCurrentPlan
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : changingPlan
                      ? 'bg-gray-100 text-gray-400 cursor-wait'
                      : isUpgrade
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isChanging
                    ? 'Updating...'
                    : isCurrentPlan
                    ? 'Current Plan'
                    : isUpgrade
                    ? `Upgrade to ${plan.name}`
                    : 'Downgrade'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-5 sm:p-8">
        <h3 className="mb-6 text-center text-xl font-bold text-gray-800">Frequently Asked Questions</h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
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
            <p className="text-gray-500 text-sm">Paid plans use secure PayPal checkout. Free plan changes happen instantly inside your account.</p>
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
