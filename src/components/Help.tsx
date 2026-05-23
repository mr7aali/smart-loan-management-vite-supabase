import { useState } from 'react';
import {
  HelpCircle,
  Book,
  MessageCircle,
  Mail,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Video,
  FileText,
  Users,
  Shield,
  CreditCard,
  Zap,
} from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

function FAQItem({ question, answer, isOpen, onClick }: FAQItemProps) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-5 bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-800 text-left">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="p-5 bg-gray-50 border-t border-gray-200">
          <p className="text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function Help() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const faqs = [
    {
      question: "How do I add a new borrower?",
      answer: "Navigate to the Borrowers section from the sidebar. Click the 'Add Borrower' button in the top right corner. Fill in the borrower's name, email, phone number, and optional address. Click 'Save' to create the borrower record.",
    },
    {
      question: "How do I record a new loan?",
      answer: "Go to the Loans section and click 'Add Loan'. Select the borrower from the dropdown, enter the loan amount, interest rate, term in months, start date, and due date. The system will automatically calculate the total payable amount based on your inputs.",
    },
    {
      question: "How do I record repayments?",
      answer: "In the Repayments section, click 'Add Repayment'. Select the active loan, enter the payment amount, date, and payment method (cash, bank transfer, UPI, or other). The loan status will automatically update based on the total repayments received.",
    },
    {
      question: "How does the subscription system work?",
      answer: "LendSmart offers 4 plans: Free (5 borrowers), Starter ($9/mo - 25 borrowers), Professional ($19/mo - unlimited), and Enterprise ($49/mo - team features). You can upgrade or downgrade anytime from the Subscription page.",
    },
    {
      question: "Is my data secure?",
      answer: "Yes! All your data is encrypted and stored securely in our database. We use Row Level Security (RLS) to ensure each user can only access their own data. Your financial information is never shared with third parties.",
    },
    {
      question: "Can I export my data?",
      answer: "The Reports section allows you to generate comprehensive reports of your borrowers, loans, and repayments. You can view summary statistics and detailed breakdowns of your portfolio performance.",
    },
    {
      question: "How do I update my account settings?",
      answer: "Click on your profile name in the sidebar or navigate to Settings. Here you can update your profile information, change your password, manage email notifications, and view your subscription details.",
    },
    {
      question: "What payment methods are supported?",
      answer: "We currently support PayPal for payments. When upgrading to a paid plan, you'll be redirected to PayPal to complete your secure payment. Credit cards and other payment methods can be added through your PayPal account.",
    },
  ];

  const guides = [
    {
      icon: Users,
      title: "Getting Started Guide",
      description: "Learn the basics of LendSmart",
      link: "#",
    },
    {
      icon: CreditCard,
      title: "Managing Loans",
      description: "Best practices for loan management",
      link: "#",
    },
    {
      icon: FileText,
      title: "Reports & Analytics",
      description: "Understanding your portfolio",
      link: "#",
    },
    {
      icon: Shield,
      title: "Security Best Practices",
      description: "Keep your data safe",
      link: "#",
    },
  ];

  const supportOptions = [
    {
      icon: Mail,
      title: "Email Support",
      description: "support@lendsmart.app",
      link: "mailto:support@lendsmart.app",
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Available on Pro plans",
      link: "#",
    },
    {
      icon: Video,
      title: "Video Tutorials",
      description: "Step-by-step guides",
      link: "#",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <HelpCircle className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Help Center</h1>
        </div>
        <p className="text-indigo-100 text-lg max-w-2xl">
          Welcome to LendSmart Help Center. Find answers to common questions,
          browse our guides, or contact our support team.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {guides.map((guide, index) => {
          const Icon = guide.icon;
          return (
            <a
              key={index}
              href={guide.link}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-indigo-200 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                <Icon className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">{guide.title}</h3>
              <p className="text-sm text-gray-500">{guide.description}</p>
            </a>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FAQ Section */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <Book className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-800">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === index}
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
              />
            ))}
          </div>
        </div>

        {/* Support Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-bold text-gray-800">Contact Support</h2>
          </div>
          <div className="space-y-4">
            {supportOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <a
                  key={index}
                  href={option.link}
                  className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-indigo-200 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{option.title}</h3>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                </a>
              );
            })}
          </div>

          {/* Pro Badge */}
          <div className="mt-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-amber-600" />
              <span className="font-bold text-amber-800">Pro Tip</span>
            </div>
            <p className="text-sm text-amber-700">
              Upgrade to Professional or Enterprise plan for priority support,
              custom reports, and team collaboration features.
            </p>
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="bg-gray-100 rounded-xl p-4 text-center text-sm text-gray-500">
        LendSmart v1.0.0 • Build {new Date().toLocaleDateString()} •
        <a href="#" className="text-indigo-600 hover:underline ml-1">Check for Updates</a>
      </div>
    </div>
  );
}
