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
        className="flex w-full items-start justify-between gap-3 bg-white p-4 text-left transition-colors hover:bg-gray-50 sm:p-5"
      >
        <span className="font-semibold text-gray-800">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="border-t border-gray-200 bg-gray-50 p-4 sm:p-5">
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
      question: 'How do I add a new borrower?',
      answer: "Navigate to the Borrowers section from the sidebar. Click the 'Add Borrower' button in the top right corner. Fill in the borrower's name, email, phone number, and optional address. Click 'Add Borrower' to create the borrower record.",
    },
    {
      question: 'How do I record a new loan?',
      answer: "Go to the Loans section and click 'Create Loan'. Select the borrower from the dropdown, enter the loan amount, interest rate, term in months, and start date. The app calculates the due date, EMI, and total payable automatically.",
    },
    {
      question: 'How do I record repayments?',
      answer: "In the Repayments section, click 'Record Payment'. Select the active loan, enter the payment amount, date, and payment method (cash, bank transfer, UPI, or other). The loan status updates automatically based on the repayment total and due date.",
    },
    {
      question: 'How does the subscription system work?',
      answer: 'LendSmart offers 4 plans: Free, Starter ($19/mo), Professional ($49/mo), and Enterprise ($99/mo). You can upgrade or downgrade anytime from the Subscription page based on the borrower and team limits that fit your business.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes. All data is stored in Supabase with Row Level Security (RLS) policies, so each user can only access their own borrowers, loans, repayments, and subscription records.',
    },
    {
      question: 'Can I export my data?',
      answer: 'Yes. The Reports section can export portfolio, collection, and borrower reports as CSV files so you can analyze or archive your data outside the app.',
    },
    {
      question: 'How do I update my account settings?',
      answer: 'Open Settings from the sidebar footer to review your account details, current subscription, notification preferences, and sign-out controls.',
    },
    {
      question: 'What payment methods are supported?',
      answer: 'Repayments can be recorded as cash, bank transfer, UPI, or other. Subscription upgrades use secure PayPal checkout and activate only after the payment is confirmed server-side.',
    },
  ];

  const guides = [
    {
      icon: Users,
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Set up your first borrower and loan',
    },
    {
      icon: CreditCard,
      id: 'managing-loans',
      title: 'Managing Loans',
      description: 'Track balances, due dates, and status',
    },
    {
      icon: FileText,
      id: 'reports-analytics',
      title: 'Reports & Analytics',
      description: 'Understand collections and portfolio health',
    },
    {
      icon: Shield,
      id: 'security-best-practices',
      title: 'Security Best Practices',
      description: 'Protect user access and business data',
    },
  ];

  const supportOptions = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'contactus@lendsmart.me',
      link: 'mailto:contactus@lendsmart.me',
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Available on Professional and Enterprise plans',
      link: 'mailto:contactus@lendsmart.me?subject=Live%20Chat%20Request',
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Request a walkthrough from support',
      link: 'mailto:contactus@lendsmart.me?subject=Video%20Tutorial%20Request',
    },
  ];

  const guideDetails = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      body: 'Create a borrower first, then issue a loan tied to that borrower. Once the loan exists, you can begin recording repayments and watch the dashboard update in real time.',
    },
    {
      id: 'managing-loans',
      title: 'Managing Loans',
      body: 'Use the loan table to review amount, interest, term, due date, repayment progress, and live status. Overdue loans surface automatically when the due date passes and the loan is not fully paid.',
    },
    {
      id: 'reports-analytics',
      title: 'Reports & Analytics',
      body: 'The dashboard charts highlight disbursement trends, collections, loan status distribution, and top borrowers. The Reports section adds exportable summaries for portfolio and collection performance.',
    },
    {
      id: 'security-best-practices',
      title: 'Security Best Practices',
      body: 'Use strong passwords, keep Supabase environment variables private, and configure your production domain in Supabase Auth redirect settings before hosting the app.',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white sm:p-8">
        <div className="mb-4 flex items-center gap-3">
          <HelpCircle className="w-8 h-8" />
          <h1 className="text-2xl font-bold sm:text-3xl">Help Center</h1>
        </div>
        <p className="max-w-2xl text-base text-indigo-100 sm:text-lg">
          Welcome to LendSmart Help Center. Find answers to common questions,
          browse our guides, or contact our support team.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-5 sm:p-6 lg:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
              <Video className="h-4 w-4" />
              Video walkthrough
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
              Watch how LendSmart works
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base">
              If you want a faster overview, this short video walks through the
              main workflow for managing borrowers, loans, repayments, and
              reports inside the app.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="#faq"
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Read the FAQ
              </a>
              <a
                href="https://youtu.be/w8v5jvjAx7k"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-indigo-200 hover:text-indigo-700"
              >
                Open on YouTube
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="bg-slate-950 p-3 sm:p-4 lg:p-5">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
              <div className="aspect-video">
                <iframe
                  className="h-full w-full"
                  src="https://www.youtube.com/embed/w8v5jvjAx7k?rel=0"
                  title="LendSmart help video walkthrough"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
        {guides.map((guide) => {
          const Icon = guide.icon;
          return (
            <a
              key={guide.id}
              href={`#${guide.id}`}
              className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-indigo-200 hover:shadow-lg sm:p-6"
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

      <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <Book className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">Quick Guides</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          {guideDetails.map((guide) => (
            <div key={guide.id} id={guide.id} className="scroll-mt-24 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
              <h3 className="font-semibold text-gray-800 mb-2">{guide.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{guide.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2" id="faq">
          <div className="mb-6 flex items-center gap-3">
            <Book className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <FAQItem
                key={faq.question}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === index}
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
              />
            ))}
          </div>
        </div>

        <div id="support">
          <div className="mb-6 flex items-center gap-3">
            <Zap className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">Contact Support</h2>
          </div>
          <div className="space-y-4">
            {supportOptions.map((option) => {
              const Icon = option.icon;
              return (
                <a
                  key={option.title}
                  href={option.link}
                  className="block rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-200 hover:shadow-md sm:p-5"
                >
                  <div className="flex items-start gap-4">
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

          <div className="mt-6 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-amber-600" />
              <span className="font-bold text-amber-800">Pro Tip</span>
            </div>
            <p className="text-sm text-amber-700">
              Upgrade to Professional or Enterprise for priority support,
              exportable reports, and stronger collaboration features.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-gray-100 p-4 text-center text-sm text-gray-500">
        LendSmart v1.0.0 | Build {new Date().toLocaleDateString()} |
        <a href="#faq" className="text-indigo-600 hover:underline ml-1">Jump to FAQ</a>
      </div>
    </div>
  );
}
