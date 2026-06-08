import { useState } from "react";
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
} from "lucide-react";

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

function FAQItem({ question, answer, isOpen, onClick }: FAQItemProps) {
  return (
    <div className="overflow-hidden border border-gray-200 rounded-xl">
      <button
        onClick={onClick}
        className="flex items-start justify-between w-full gap-3 p-4 text-left transition-colors bg-white hover:bg-gray-50 sm:p-5"
      >
        <span className="font-semibold text-gray-800">{question}</span>
        {isOpen ? (
          <ChevronUp className="flex-shrink-0 w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="flex-shrink-0 w-5 h-5 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 sm:p-5">
          <p className="leading-relaxed text-gray-600">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function Help() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const whatsappChatLink =
    import.meta.env.VITE_WHATSAPP_CHAT_LINK?.trim() ||
    "https://wa.me/26653530122?text=Hello%20LendSmart";
  const youtubeChannelLink =
    import.meta.env.VITE_YOUTUBE_CHANNEL_LINK?.trim() ||
    "https://youtube.com/@lendsmart?si=jGCZ7wA22YBsQWDu";

  const faqs = [
    {
      question: "How do I add a new borrower?",
      answer:
        "Navigate to the Borrowers section from the sidebar. Click the 'Add Borrower' button in the top right corner. Fill in the borrower's name, email, phone number, and optional address. Click 'Add Borrower' to create the borrower record.",
    },
    {
      question: "How do I record a new loan?",
      answer:
        "Go to the Loans section and click 'Create Loan'. Select the borrower from the dropdown, enter the loan amount, interest rate, term in months, and start date. The app calculates the due date, EMI, and total payable automatically.",
    },
    {
      question: "How do I record repayments?",
      answer:
        "In the Repayments section, click 'Record Payment'. Select the active loan, enter the payment amount, date, and payment method (cash, bank transfer, UPI, or other). The loan status updates automatically based on the repayment total and due date.",
    },
    {
      question: "How does the subscription system work?",
      answer:
        "LendSmart offers 4 plans: Free, Starter ($19/mo), Professional ($49/mo), and Enterprise ($99/mo). You can upgrade or downgrade anytime from the Subscription page based on the borrower and team limits that fit your business.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Yes. All data is stored in Supabase with Row Level Security (RLS) policies, so each user can only access their own borrowers, loans, repayments, and subscription records.",
    },
    {
      question: "Can I export my data?",
      answer:
        "Yes. The Reports section can export portfolio, collection, and borrower reports as CSV files so you can analyze or archive your data outside the app.",
    },
    {
      question: "How do I update my account settings?",
      answer:
        "Open Settings from the sidebar footer to review your account details, current subscription, notification preferences, and sign-out controls.",
    },
    {
      question: "What payment methods are supported?",
      answer:
        "Repayments can be recorded as cash, bank transfer, UPI, or other. Subscription upgrades use secure PayPal checkout and activate only after the payment is confirmed server-side.",
    },
  ];

  const guides = [
    {
      icon: Users,
      id: "getting-started",
      title: "Getting Started",
      description: "Set up your first borrower and loan",
    },
    {
      icon: CreditCard,
      id: "managing-loans",
      title: "Managing Loans",
      description: "Track balances, due dates, and status",
    },
    {
      icon: FileText,
      id: "reports-analytics",
      title: "Reports & Analytics",
      description: "Understand collections and portfolio health",
    },
    {
      icon: Shield,
      id: "security-best-practices",
      title: "Security Best Practices",
      description: "Protect user access and business data",
    },
  ];

  const supportOptions = [
    {
      icon: Mail,
      title: "Email Support",
      description: "contactus@lendsmart.me",
      link: "mailto:contactus@lendsmart.me",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      description: "+266 5353 0122",
      link: whatsappChatLink,
    },
    {
      icon: Video,
      title: "YouTube Channel",
      description: "Watch tutorials and walkthroughs",
      link: youtubeChannelLink,
    },
  ];

  const guideDetails = [
    {
      id: "getting-started",
      title: "Getting Started",
      body: "Create a borrower first, then issue a loan tied to that borrower. Once the loan exists, you can begin recording repayments and watch the dashboard update in real time.",
    },
    {
      id: "managing-loans",
      title: "Managing Loans",
      body: "Use the loan table to review amount, interest, term, due date, repayment progress, and live status. Overdue loans surface automatically when the due date passes and the loan is not fully paid.",
    },
    {
      id: "reports-analytics",
      title: "Reports & Analytics",
      body: "The dashboard charts highlight disbursement trends, collections, loan status distribution, and top borrowers. The Reports section adds exportable summaries for portfolio and collection performance.",
    },
    {
      id: "security-best-practices",
      title: "Security Best Practices",
      body: "Use strong passwords, keep Supabase environment variables private, and configure your production domain in Supabase Auth redirect settings before hosting the app.",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="p-6 text-white rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <HelpCircle className="w-8 h-8" />
          <h1 className="text-2xl font-bold sm:text-3xl">Help Center</h1>
        </div>
        <p className="max-w-2xl text-base text-indigo-100 sm:text-lg">
          Welcome to LendSmart Help Center. Find answers to common questions,
          browse our guides, or contact our support team.
        </p>
      </div>

      <div className="overflow-hidden bg-white border border-indigo-100 shadow-sm rounded-2xl">
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-5 sm:p-6 lg:p-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-indigo-700 rounded-full bg-indigo-50">
              <Video className="w-4 h-4" />
              Video walkthrough
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
              Watch how LendSmart works
            </h2>
            <p className="max-w-xl mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
              If you want a faster overview, this short video walks through the
              main workflow for managing borrowers, loans, repayments, and
              reports inside the app.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <a
                href="#faq"
                className="px-4 py-2 text-sm font-semibold text-white transition bg-indigo-600 rounded-full hover:bg-indigo-700"
              >
                Read the FAQ
              </a>
              <a
                href="https://youtu.be/w8v5jvjAx7k"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 transition border border-gray-200 rounded-full hover:border-indigo-200 hover:text-indigo-700"
              >
                Open on YouTube
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="p-3 bg-slate-950 sm:p-4 lg:p-5">
            <div className="overflow-hidden bg-black border shadow-2xl rounded-2xl border-white/10">
              <div className="aspect-video">
                <iframe
                  className="w-full h-full"
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
              className="p-5 transition-all bg-white border border-gray-200 group rounded-xl hover:border-indigo-200 hover:shadow-lg sm:p-6"
            >
              <div className="flex items-center justify-center w-12 h-12 mb-4 transition-colors bg-indigo-100 rounded-xl group-hover:bg-indigo-200">
                <Icon className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="mb-1 font-bold text-gray-800">{guide.title}</h3>
              <p className="text-sm text-gray-500">{guide.description}</p>
            </a>
          );
        })}
      </div>

      <div className="p-5 bg-white border border-gray-100 rounded-2xl sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Book className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">
            Quick Guides
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          {guideDetails.map((guide) => (
            <div
              key={guide.id}
              id={guide.id}
              className="p-4 border border-gray-200 scroll-mt-24 rounded-xl bg-gray-50 sm:p-5"
            >
              <h3 className="mb-2 font-semibold text-gray-800">
                {guide.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                {guide.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2" id="faq">
          <div className="flex items-center gap-3 mb-6">
            <Book className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">
              Frequently Asked Questions
            </h2>
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
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">
              Contact Support
            </h2>
          </div>
          <div className="space-y-4">
            {supportOptions.map((option) => {
              const Icon = option.icon;
              const opensInNewTab = option.link.startsWith("http");

              return (
                <a
                  key={option.title}
                  href={option.link}
                  target={opensInNewTab ? "_blank" : undefined}
                  rel={opensInNewTab ? "noreferrer" : undefined}
                  className="block p-4 transition-all bg-white border border-gray-200 rounded-xl hover:border-indigo-200 hover:shadow-md sm:p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100">
                      <Icon className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {option.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {option.description}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                </a>
              );
            })}
          </div>

          <div className="p-4 mt-6 border rounded-xl border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 sm:p-5">
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

      <div className="p-4 text-sm text-center text-gray-500 bg-gray-100 rounded-xl">
        LendSmart v1.0.0 | Build {new Date().toLocaleDateString()} |
        <a href="#faq" className="ml-1 text-indigo-600 hover:underline">
          Jump to FAQ
        </a>
      </div>

      {whatsappChatLink && (
        <a
          href={whatsappChatLink}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat on WhatsApp"
          className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_16px_40px_rgba(37,211,102,0.35)] transition-transform hover:scale-105 hover:bg-[#20bd5a] focus:outline-none focus:ring-4 focus:ring-[#25D366]/30 sm:bottom-6 sm:right-6"
        >
          <MessageCircle className="h-7 w-7" />
        </a>
      )}
    </div>
  );
}
