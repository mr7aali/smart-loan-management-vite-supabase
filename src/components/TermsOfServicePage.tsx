import LegalPageLayout from "./LegalPageLayout";

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      title="Terms and Conditions"
      pageTitle="Terms of Service - LendSmart"
      lastUpdated="January 1, 2025"
    >
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 p-5 text-indigo-900">
        <p className="m-0">
          <strong>Important:</strong> By accessing or using LendSmart, you agree
          to be bound by these Terms and Conditions. If you do not agree, please
          do not use the service.
        </p>
      </div>

      <h2>1. Acceptance of Terms</h2>
      <p>
        Welcome to LendSmart (&quot;we,&quot; &quot;us,&quot; or
        &quot;our&quot;). By accessing or using our website at
        <a href="https://www.lendsmart.me" target="_blank" rel="noreferrer">
          {" "}
          www.lendsmart.me
        </a>{" "}
        and the LendSmart loan management application and services
        (collectively, the &quot;Service&quot;), you agree to be bound by these
        Terms and Conditions.
      </p>
      <p>
        By creating an account, subscribing to our service, or using any part
        of the service, you acknowledge that you have read, understood, and
        agree to be bound by these Terms and our Privacy Policy.
      </p>

      <h2>2. Description of Service</h2>
      <p>LendSmart is a cloud-based loan management platform that enables users to:</p>
      <ul>
        <li>Manage borrower information and records</li>
        <li>Create and track loans with interest calculations</li>
        <li>Record and monitor repayments</li>
        <li>Generate reports and analytics</li>
        <li>Access subscription-based features based on a selected plan</li>
      </ul>
      <p>
        We reserve the right to modify, suspend, or discontinue any part of the
        service at any time without prior notice.
      </p>

      <h2>3. Account Registration</h2>
      <h3>3.1 Eligibility</h3>
      <ul>
        <li>You must be at least 18 years old to use the service.</li>
        <li>You must provide accurate, current, and complete registration information.</li>
        <li>You are responsible for maintaining the security of your account credentials.</li>
        <li>One person or entity may not maintain more than one free account.</li>
      </ul>

      <h3>3.2 Account Security</h3>
      <p>
        You are solely responsible for all activities that occur under your
        account. You must immediately notify us of any unauthorized use of your
        account.
      </p>

      <h3>3.3 Email Verification</h3>
      <p>
        Upon registration, you must verify your email address through the
        confirmation link sent to your inbox. Failure to verify your email may
        limit access to certain features.
      </p>

      <h2>4. Subscription Plans and Payments</h2>
      <h3>4.1 Subscription Tiers</h3>
      <div className="not-prose mt-4 overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100">
              <th className="px-4 py-3 font-semibold text-slate-700">Plan</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Price</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Features</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="px-4 py-3 font-semibold text-slate-900">Free</td>
              <td className="px-4 py-3">$0/month</td>
              <td className="px-4 py-3">Up to 10 borrowers, up to 20 loans, basic reporting, email support, 1 user</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="px-4 py-3 font-semibold text-slate-900">Starter</td>
              <td className="px-4 py-3">$19/month</td>
              <td className="px-4 py-3">Up to 50 borrowers, unlimited loans, advanced reporting, priority support, SMS reminders, 3 users</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="px-4 py-3 font-semibold text-slate-900">Professional</td>
              <td className="px-4 py-3">$49/month</td>
              <td className="px-4 py-3">Up to 200 borrowers, unlimited loans, full analytics, 24/7 support, WhatsApp reminders, 10 users, API access, custom branding</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="px-4 py-3 font-semibold text-slate-900">Enterprise</td>
              <td className="px-4 py-3">$99/month</td>
              <td className="px-4 py-3">Unlimited borrowers, unlimited loans, full analytics, dedicated support, all reminder types, unlimited users, API access, custom branding, white-label, SSO integration</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>4.2 Payment Terms</h3>
      <ul>
        <li>All subscription fees are billed monthly in advance.</li>
        <li>Payments are processed through PayPal.</li>
        <li>All fees are in USD unless otherwise specified.</li>
      </ul>

      <h3>4.3 Refunds</h3>
      <p>
        Subscription fees are non-refundable. If you cancel before the end of
        your billing period, you retain access to paid features until that
        period ends.
      </p>

      <h2>5. User Responsibilities</h2>
      <h3>5.1 Acceptable Use</h3>
      <p>You agree to use the service only for lawful purposes. You agree not to:</p>
      <ul>
        <li>Use the service in a way that violates applicable laws or regulations</li>
        <li>Violate the rights of others, including privacy and intellectual property rights</li>
        <li>Upload or transmit malware or harmful code</li>
        <li>Attempt to gain unauthorized access to the service</li>
        <li>Interfere with or disrupt the service</li>
        <li>Collect user data without consent</li>
        <li>Use the service to facilitate illegal lending practices</li>
      </ul>

      <h3>5.2 Data Accuracy</h3>
      <p>
        You are responsible for the accuracy of the data you enter into the
        service. We are not responsible for decisions made based on inaccurate
        data entered by you.
      </p>

      <h2>6. Data Privacy and Security</h2>
      <p>Your data is stored securely using industry-standard safeguards, including:</p>
      <ul>
        <li>Encryption in transit and at rest</li>
        <li>Secure infrastructure through Supabase</li>
        <li>Regular security reviews</li>
      </ul>
      <p>For full details, please review our Privacy Policy.</p>

      <h2>7. Intellectual Property</h2>
      <p>
        All content, features, and functionality of the service are owned by
        LendSmart and protected by applicable copyright and trademark laws. You
        retain ownership of the data you input into the service.
      </p>

      <h2>8. Limitation of Liability</h2>
      <ul>
        <li>The service is provided on an &quot;as is&quot; basis without warranties.</li>
        <li>We do not warrant that the service will be error-free or uninterrupted.</li>
        <li>We are not liable for indirect, incidental, or consequential damages.</li>
        <li>Our total liability will not exceed the amount paid in the preceding 12 months.</li>
      </ul>

      <h2>9. Termination</h2>
      <p>
        You may cancel your subscription at any time. We may suspend or
        terminate your account if you violate these terms or engage in illegal
        activity.
      </p>

      <h2>10. Modifications to Terms</h2>
      <p>
        We may update these terms at any time. Material changes may be
        communicated by email or by notice in the service.
      </p>

      <h2>11. Governing Law</h2>
      <p>
        These terms are governed by the laws of the United States, and disputes
        will be resolved in the courts of the United States through binding
        arbitration where applicable.
      </p>

      <div className="rounded-2xl bg-slate-100 p-6">
        <h3 className="mt-0">Contact Us</h3>
        <p>If you have questions about these Terms, contact us at:</p>
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
