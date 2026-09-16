import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

const LAST_UPDATED = '16 September 2026';

export const PrivacyNoticeView: React.FC = () => {
  const { setCurrentView } = useApp();

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16" id="privacy-notice-container">
      <button
        type="button"
        onClick={() => setCurrentView('home')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
        id="btn-privacy-back-home"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to WALAYI
      </button>

      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-mono-code font-bold border border-blue-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          PRIVACY NOTICE
        </div>
        <h1 className="text-2xl sm:text-3xl font-display-legal font-bold text-slate-900">
          WALAYI Privacy Notice
        </h1>
        <p className="text-xs text-slate-500">Last updated {LAST_UPDATED}</p>
      </div>

      <div className="prose-legal space-y-6 text-sm text-slate-700 leading-relaxed">

        <section className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
          <p>
            This Notice explains what personal information WALAYI collects, why, who can see it, and
            the choices and rights available to you. WALAYI is a technology platform operated by Enen
            Digital Labs that provides a workflow for uploading, commissioning and verifying documents
            in Uganda. It does not itself act as a Commissioner for Oaths, a notary or any other
            professional authority.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Information we collect</h2>
          <p>We collect and process the following categories of information:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account particulars</strong> — full name, email address, phone number, and role (deponent, uploader or Commissioner-category professional).</li>
            <li><strong>Professional information</strong> — for Commissioner-category applicants: practising station, chambers or firm name, statutory authority claimed, and related particulars submitted for Master Admin review.</li>
            <li><strong>Verification documents and identification</strong> — national identification numbers, practising certificates, warrants and other credential documents submitted for admission or identity verification.</li>
            <li><strong>Photographs and biometric-adjacent images</strong> — profile photographs and, where you choose to use it, a live camera capture used only for identity presentation on your profile.</li>
            <li><strong>Signatures and stamps</strong> — signature images you draw or upload, and a Commissioner's configured digital stamp design.</li>
            <li><strong>Uploaded documents</strong> — the documents you submit for commissioning, together with the finalised, signed and stamped output.</li>
            <li><strong>Payment references and mobile-money details</strong> — for Commissioners, the mobile-money network, number and account-holder name used as a payout destination; for all users, payment references and transaction confirmations relating to fees paid.</li>
            <li><strong>Technical information</strong> — device and browser information, IP address, and diagnostic logs needed to operate and secure the platform.</li>
            <li><strong>Audit records</strong> — a tamper-evident log of key actions (admission decisions, payment-destination changes, marketplace-eligibility changes, document commissioning events) kept for accountability.</li>
            <li><strong>Communication preferences</strong> — your choices about in-app, push, WhatsApp and SMS notifications.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Why we process this information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To create and maintain your account and verify your identity or professional standing.</li>
            <li>To operate the commissioning workflow: document upload, Commissioner selection, live commissioning sessions, signing, sealing and finalisation.</li>
            <li>To review and admit Commissioner-category applicants, and to maintain accurate marketplace eligibility.</li>
            <li>To process payments, calculate fees, and pay out Commissioner professional fees to a configured destination.</li>
            <li>To send notifications relevant to your documents, transactions and account status.</li>
            <li>To detect fraud, secure the platform and investigate misuse.</li>
            <li>To meet legal, regulatory and audit obligations.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Who can see your information</h2>
          <p>Access is role-based and limited to what a role needs to perform its function:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>An uploader/deponent's document is visible to themselves and to the Commissioner they have chosen or been assigned to for that specific transaction.</li>
            <li>A Commissioner's professional papers and admission particulars are visible to the Master Admin reviewing their application, and are not published to the marketplace until admission is granted.</li>
            <li>A Commissioner's payment destination is never exposed publicly and is visible only to that Commissioner and to platform administrators for support and audit purposes.</li>
            <li><strong>Limited public verification disclosure:</strong> a completed certificate's Security Number, certificate number and integrity status can be looked up through the public Verification Portal so that a third party (for example a court or institution) can confirm authenticity. This disclosure is limited to what is needed to verify the instrument — it does not expose the underlying document content, payment details or private account information.</li>
            <li>WALAYI personnel and Enen Digital Labs administrators may access information as needed to operate, secure and support the platform, under access controls appropriate to their role.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Third-party service providers</h2>
          <p>
            We use a limited number of third-party service providers to operate WALAYI — for example,
            infrastructure and database hosting, mobile-money payment processing, and messaging
            delivery for device push, WhatsApp or SMS notifications where you have opted in. We do not
            display the names or technical details of these providers in the ordinary application
            interface; categories of provider are disclosed here, and further detail is available on
            request or as required by law.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">5. Retention</h2>
          <p>
            We retain account particulars, completed documents, audit records and transaction records
            for as long as your account is active and thereafter for the period needed to meet legal,
            evidentiary and regulatory retention obligations relevant to commissioned legal instruments.
            Draft or incomplete documents you choose to delete are removed, save for the minimum audit
            trail needed to record that a deletion occurred.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">6. Your rights</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You may request a copy of the personal information we hold about you.</li>
            <li>You may request correction of inaccurate account particulars.</li>
            <li>You may request deletion of your account and associated data, subject to our ability to retain records required for legal, audit or evidentiary reasons (for example, a completed commissioned instrument and its audit trail).</li>
            <li>You may manage your communication preferences, including opting out of WhatsApp, SMS or push notifications, at any time from your account settings.</li>
          </ul>
          <p>To exercise any of these rights, contact us through the details on your account or the WALAYI website.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">7. Security measures</h2>
          <p>
            We apply role-based access controls, server-side enforcement of who may read or write
            each category of data, encryption in transit, and an audit trail for sensitive actions such
            as admission decisions and payment-destination changes. No system is completely
            invulnerable, and we continually work to improve these safeguards.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">8. Changes to this Notice</h2>
          <p>
            We may update this Notice as WALAYI's features develop. Material changes will be
            reflected by updating the date above, and, where appropriate, by an in-app notification.
          </p>
        </section>

      </div>
    </div>
  );
};
