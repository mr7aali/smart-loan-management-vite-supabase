import LegalPageLayout from "./LegalPageLayout";

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated="January 1, 2025"
    >
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-5 text-emerald-900">
        <p className="m-0">
          <strong>Your Privacy Matters:</strong> We are committed to protecting
          your personal information. This policy explains how we collect, use,
          and safeguard your data.
        </p>
      </div>

      <h2>1. Introduction</h2>
      <p>
        LendSmart (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is
        committed to protecting your privacy. This Privacy Policy explains how
        we collect, use, disclose, and safeguard your information when you use
        our website and the LendSmart loan management application and services.
      </p>

      <h2>2. Information We Collect</h2>
      <h3>2.1 Information You Provide Directly</h3>
      <p>
        <strong>Account information:</strong>
      </p>
      <ul>
        <li>Name</li>
        <li>Email address</li>
        <li>Password stored in encrypted form</li>
      </ul>

      <p>
        <strong>Financial data:</strong>
      </p>
      <ul>
        <li>Borrower names and contact information</li>
        <li>Loan amounts, interest rates, and terms</li>
        <li>Repayment records and payment methods</li>
        <li>Financial notes and documentation</li>
      </ul>

      <h3>2.2 Information Collected Automatically</h3>
      <ul>
        <li>Features accessed</li>
        <li>Time spent on the service</li>
        <li>Device type and operating system</li>
        <li>IP address and access times</li>
        <li>Cookies and usage patterns</li>
      </ul>

      <h2>3. How We Use Your Information</h2>
      <div className="not-prose mt-4 overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100">
              <th className="px-4 py-3 font-semibold text-slate-700">Purpose</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="px-4 py-3 font-semibold text-slate-900">Provide the Service</td>
              <td className="px-4 py-3">Create and manage your account, process your data, and deliver core features.</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="px-4 py-3 font-semibold text-slate-900">Process Payments</td>
              <td className="px-4 py-3">Manage subscriptions and process payments through PayPal.</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="px-4 py-3 font-semibold text-slate-900">Improve the Service</td>
              <td className="px-4 py-3">Analyze usage patterns to improve features and user experience.</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="px-4 py-3 font-semibold text-slate-900">Communicate With You</td>
              <td className="px-4 py-3">Send important updates, notifications, and support responses.</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="px-4 py-3 font-semibold text-slate-900">Ensure Security</td>
              <td className="px-4 py-3">Detect and prevent fraud, unauthorized access, and abuse.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>4. Information Sharing</h2>
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
        <p className="m-0">
          <strong>We do not sell your data:</strong> Your personal information
          is never sold, traded, or rented to third parties.
        </p>
      </div>

      <h3>4.1 Service Providers</h3>
      <p>We may share information with trusted providers needed to operate the service:</p>
      <div className="not-prose mt-4 overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100">
              <th className="px-4 py-3 font-semibold text-slate-700">Provider</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Purpose</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Data Shared</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="px-4 py-3 font-semibold text-slate-900">Supabase</td>
              <td className="px-4 py-3">Database and authentication</td>
              <td className="px-4 py-3">Account information and financial data</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="px-4 py-3 font-semibold text-slate-900">PayPal</td>
              <td className="px-4 py-3">Payment processing</td>
              <td className="px-4 py-3">Billing information</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>4.2 Legal Requirements</h3>
      <p>
        We may disclose your information when required to comply with legal
        obligations, protect our rights, or respond to valid government
        requests.
      </p>

      <h2>5. Data Security</h2>
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
        <p className="m-0">
          <strong>We protect your data:</strong> Data is encrypted in transit
          using HTTPS/TLS and stored using strong security controls.
        </p>
      </div>

      <h3>5.1 Security Measures</h3>
      <ul>
        <li>Encryption for data in transit and at rest</li>
        <li>Secure infrastructure and access controls</li>
        <li>Regular security audits and vulnerability reviews</li>
        <li>Automated threat detection where applicable</li>
      </ul>

      <h3>5.2 Your Responsibilities</h3>
      <ul>
        <li>Use a strong, unique password</li>
        <li>Do not share account credentials</li>
        <li>Report suspicious activity immediately</li>
        <li>Keep your email address up to date</li>
      </ul>

      <h2>6. Data Retention</h2>
      <div className="not-prose mt-4 overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100">
              <th className="px-4 py-3 font-semibold text-slate-700">Data Type</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Retention Period</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="px-4 py-3">Account information</td>
              <td className="px-4 py-3">Duration of account plus 90 days after closure</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="px-4 py-3">Financial data</td>
              <td className="px-4 py-3">Duration of account plus 90 days after closure</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="px-4 py-3">Usage analytics</td>
              <td className="px-4 py-3">24 months in aggregated or anonymized form</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="px-4 py-3">Communication records</td>
              <td className="px-4 py-3">3 years</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>7. Your Rights</h2>
      <ul>
        <li>Access your personal data</li>
        <li>Correct profile information</li>
        <li>Request deletion of your account and data</li>
        <li>Export your data in common formats</li>
        <li>Opt out of promotional emails</li>
      </ul>

      <h2>8. Cookies and Tracking</h2>
      <p>We use cookies and similar tools to improve your experience, including:</p>
      <ul>
        <li>Essential cookies for service functionality</li>
        <li>Analytics cookies for product improvement</li>
        <li>Preference cookies that remember your settings</li>
      </ul>

      <h2>9. Subscription Plans</h2>
      <p>
        The service offers Free, Starter, Professional, and Enterprise plans
        with different feature limits and pricing.
      </p>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <p className="m-0">
          <strong>Children&apos;s privacy:</strong> The service is not intended
          for individuals under 18 years of age, and we do not knowingly
          collect data from children.
        </p>
      </div>

      <h2>10. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Material changes
        may be communicated by email or by notice in the service.
      </p>

      <h2>11. Contact Us</h2>
      <div className="rounded-2xl bg-slate-100 p-6">
        <h3 className="mt-0">Data Protection Inquiries</h3>
        <p>For privacy questions or rights requests, contact us at:</p>
        <p className="mb-1">
          <strong>Email:</strong> contactus@lendsmart.me
        </p>
        <p className="mb-0">
          <strong>Website:</strong> www.lendsmart.me
        </p>
      </div>
    </LegalPageLayout>
  );
}
