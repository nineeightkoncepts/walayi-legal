import React from 'react';
import { useApp } from '../../context/AppContext';
import { Scale, ArrowLeft } from 'lucide-react';

const LAST_UPDATED = '16 September 2026';

export const TermsAndConditionsView: React.FC = () => {
  const { setCurrentView } = useApp();

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16" id="terms-conditions-container">
      <button
        type="button"
        onClick={() => setCurrentView('home')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
        id="btn-terms-back-home"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to WALAYI
      </button>

      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-mono-code font-bold border border-amber-200">
          <Scale className="w-3.5 h-3.5" />
          TERMS AND CONDITIONS
        </div>
        <h1 className="text-2xl sm:text-3xl font-display-legal font-bold text-slate-900">
          WALAYI Terms and Conditions
        </h1>
        <p className="text-xs text-slate-500">Last updated {LAST_UPDATED}</p>
      </div>

      <div className="prose-legal space-y-6 text-sm text-slate-700 leading-relaxed">

        <section className="p-5 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2">
          <p>
            WALAYI is a technology platform operated by Enen Digital Labs. WALAYI does not itself act
            as a Commissioner for Oaths, a notary or any other professional authority, and does not
            guarantee that every electronically commissioned document will be accepted by every court
            or institution. Users remain responsible for ensuring that their document and the
            commissioning process meet applicable professional, institutional and procedural
            requirements.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Acceptance of these Terms</h2>
          <p>
            By creating an account or using WALAYI, you agree to these Terms and to our Privacy
            Notice. If you do not agree, you should not use the platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Eligibility and account registration</h2>
          <p>
            You must provide accurate information when registering and keep it up to date. You are
            responsible for activity that occurs under your account and for keeping your sign-in
            credentials secure.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Roles: Uploader, Deponent and Commissioner</h2>
          <p>
            WALAYI treats the uploader of a document, the deponent (the person swearing or declaring),
            and the Commissioner-category professional handling the commissioning as distinct roles,
            even where the same individual occupies more than one of them. Each role carries different
            responsibilities and different access to information within a transaction.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Verification and admission of Commissioners</h2>
          <p>
            Registering as a Commissioner-category professional does not itself grant marketplace
            access. Every such account begins as PENDING and is reviewed by the Master Admin, who
            may admit, reject or suspend it based on the professional papers submitted. Only an
            admitted and active professional is searchable, selectable or able to receive commissioning
            requests. WALAYI does not represent that admission onto the platform constitutes, replaces
            or substitutes for any statutory licence, warrant or professional authority a Commissioner
            is separately required to hold.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">5. Marketplace participation</h2>
          <p>
            Deponents and uploaders select an admitted Commissioner through the marketplace.
            Commissioners set their own professional fees, availability and payment destination, subject
            to the review, suspension and audit mechanisms described in these Terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">6. Document uploads and the saved-document workflow</h2>
          <p>
            You may upload a document, save it as a draft, and return to complete it later. Documents
            are stored against your authenticated account. A document already submitted to a
            Commissioner should not be resubmitted as a separate, duplicate workflow. You may delete a
            draft; where deletion is irreversible, you will be asked to confirm before it proceeds.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">7. Fees, refunds, reversals and disputes</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Fees are shown before you commit to a transaction, comprising the Commissioner's professional fee and the separate WALAYI platform fee.</li>
            <li>Funds are held in escrow and released to the Commissioner according to the ledger and payout rules in Section 8 below.</li>
            <li>Refunds and reversals are processed where a transaction fails, is cancelled before completion, or is upheld following a dispute.</li>
            <li>You may raise a dispute over a transaction; WALAYI will review the transaction record and audit trail and respond accordingly.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">8. Ledger and payout rules</h2>
          <p>
            A Commissioner's ledger reflects real, transaction-based entries — not an invented balance.
            Amounts move through PENDING, CONFIRMED, RELEASED and PAID states, with FAILED,
            REFUNDED, REVERSED and DISPUTED as exception states. A payout is marked PAID only once
            the payment provider confirms it. Payouts are sent only to the payment destination a
            Commissioner has configured and confirmed in their settings; changing that destination
            requires confirmation and is recorded in the audit trail.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">9. Signatures, digital stamps and Security Numbers</h2>
          <p>
            Signatures are captured by drawing or upload and applied to the specific document you are
            commissioning. An admitted Commissioner is provided a standard default digital stamp,
            positioned beside their signature and embedded permanently into the finalised PDF once the
            commissioning is complete; a finalised document cannot be edited afterward. A completed
            instrument receives a unique Security Number that can be independently checked through the
            public Verification Portal. The digital stamp does not automatically replace any physical
            seal, statutory stamp or other professional authority requirement that otherwise applies to
            you.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">10. Verification and fraud</h2>
          <p>
            You must not submit false professional credentials, impersonate another person, or
            otherwise attempt to defraud WALAYI or another user. We may suspend or terminate an
            account, reverse a transaction, and report conduct to relevant authorities where we
            reasonably believe fraud or misuse has occurred.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">11. Privacy</h2>
          <p>
            Our collection and use of personal information is described in the WALAYI Privacy Notice,
            which forms part of these Terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">12. Third-party services</h2>
          <p>
            WALAYI relies on third-party providers for functions such as payment processing and
            message delivery. We are not responsible for outages or failures originating solely within a
            third-party provider's own systems, though we will work to verify transaction status and
            protect your data in line with this Notice.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">13. Availability, suspension and termination</h2>
          <p>
            We aim to keep WALAYI available but do not guarantee uninterrupted service. We may
            suspend or terminate an account for breach of these Terms, fraud, non-payment, or where
            required by law, and a Commissioner's marketplace eligibility may be suspended or
            withdrawn following review.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">14. Liability</h2>
          <p>
            WALAYI provides a technology-enabled workflow for commissioning documents. Users remain
            responsible for ensuring that the document and commissioning process meet applicable
            professional, institutional and procedural requirements. To the fullest extent permitted by
            law, WALAYI and Enen Digital Labs are not liable for a court, institution or third party
            declining to accept a commissioned document, or for losses arising from a user's own breach
            of these Terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">15. Intellectual property</h2>
          <p>
            The WALAYI platform, its branding, and its underlying software belong to Enen Digital Labs
            and its licensors. You retain ownership of the documents you upload; you grant WALAYI the
            limited licence needed to store, process and deliver them as part of the commissioning
            workflow you request.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">16. Updates to these Terms</h2>
          <p>
            These Terms will be updated as WALAYI's features develop. We will update the date above
            when changes are made, and, where a change is material, notify users in-app.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">17. Dispute resolution</h2>
          <p>
            We encourage users to raise concerns with WALAYI support in the first instance so a
            transaction and its audit trail can be reviewed. Nothing in these Terms limits a user's right
            to pursue any other remedy available to them under applicable law.
          </p>
        </section>

      </div>
    </div>
  );
};
