import React, { useState, useEffect, useMemo } from 'react';
import { StartAttemptResponse, CandidateResult } from '../../../../../types/assessment';
import { TimerHeader } from '../../../../../components/assessment/TimerHeader';
import apiClient from '../../../../../api/client';
import {
  BookOpen,
  Search,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  Sparkles,
  FileText,
  Shield,
  Truck,
  RotateCcw,
  CreditCard,
  AlertTriangle,
  ExternalLink,
  Layers,
  HelpCircle,
  Clock,
  Tag,
  CheckCircle
} from 'lucide-react';

interface WorkstationProps {
  attemptData: StartAttemptResponse;
  onSubmitComplete: (res: CandidateResult) => void;
}

interface SopArticle {
  code: string;
  category: 'Returns' | 'Logistics' | 'Security' | 'Billing' | 'Warranty' | 'Escalations';
  title: string;
  policySummary: string;
  rules: string[];
  actionTag: string;
}

const SOP_ARTICLES: SopArticle[] = [
  {
    code: 'KB-RET-01',
    category: 'Returns',
    title: 'Return Window Eligibility (Electronics & General Merchandise)',
    policySummary: 'Consumer electronics are eligible for full refund within 30 days of delivery. Between days 31-45, store credit or exchange only. Beyond 45 days, returns are strictly rejected unless covered under manufacturer warranty.',
    rules: [
      'Delivered ≤ 30 days: Full refund to original payment method (Tag: REFUND_ORIGINAL).',
      'Delivered 31–45 days: Store credit or exchange only (Tag: RETURN_STORE_CREDIT).',
      'Delivered > 45 days: Ineligible for return unless manufacturer warranty claim.'
    ],
    actionTag: 'RETURN_STORE_CREDIT'
  },
  {
    code: 'KB-LOG-04',
    category: 'Logistics',
    title: 'Lost in Transit (LIT) Claims & Investigation Windows',
    policySummary: 'If carrier tracking shows no scan movement for 5 consecutive business days within North America (7 days international), the parcel is officially declared Lost-in-Transit (LIT).',
    rules: [
      'No movement ≥ 5 business days: Immediate priority replacement or full refund.',
      'Carrier claim auto-filed under reference #LIT-CARRIER.',
      'Customer signature required for high-value replacements (>$300).'
    ],
    actionTag: 'LIT_DECLARED'
  },
  {
    code: 'KB-SEC-02',
    category: 'Security',
    title: 'Customer Identity Verification & Authentication Protocol',
    policySummary: 'Before sharing order history, updating shipping address, or processing manual credits, Tier-1 agents must verify minimum 2 points of authentication.',
    rules: [
      'Required: Full Name + Billing Zip Code or Last 4 digits of payment card.',
      'NEVER ask for passwords, full credit card numbers, or OTP security codes.',
      'Third-party callers must have explicit written authorization on file.'
    ],
    actionTag: 'AUTH_VERIFIED'
  },
  {
    code: 'KB-REF-03',
    category: 'Billing',
    title: 'Refund Authorization Threshold Matrix',
    policySummary: 'Tier-1 Chat Agents are authorized to approve instant refunds up to $250.00. Refunds from $250.01 to $1,000.00 require Tier-2 Supervisor sign-off. Refunds >$1,000 require Department Manager approval.',
    rules: [
      '≤ $250.00: Tier-1 Instant Authorization.',
      '$250.01 – $1,000.00: Attach warehouse return receipt and escalate to Tier-2 Supervisor.',
      '> $1,000.00: Tier-2 Review + Manager Sign-off.'
    ],
    actionTag: 'REFUND_SUPERVISOR_REQ'
  },
  {
    code: 'KB-WAR-01',
    category: 'Warranty',
    title: 'Manufacturer Warranty Scope vs Accidental Damage',
    policySummary: 'Standard 1-Year Manufacturer Warranty covers internal hardware defects, component failure, and firmware malfunction under normal use.',
    rules: [
      'Covered: Pump failure, motherboard defect, sensor errors (Replacement/Free Repair).',
      'NOT Covered: Cracked casing from drops, liquid spills, unauthorized disassembly.',
      'Out-of-warranty options: Paid repair or 20% trade-in voucher.'
    ],
    actionTag: 'WARRANTY_SCOPE'
  },
  {
    code: 'KB-BIL-02',
    category: 'Billing',
    title: 'Post-Purchase Price Protection Policy (14-Day Match)',
    policySummary: 'Customers are eligible for a price match refund if the identical product (same SKU, color, model) is discounted on our store within 14 days of original order date.',
    rules: [
      'Order within 14 days: Refund difference directly to original payment method.',
      'Black Friday / Flash clearance sales are excluded from price protection.',
      'Competitor price match applies only to authorized retail partners.'
    ],
    actionTag: 'PRICE_MATCH_APPROVED'
  },
  {
    code: 'KB-SEC-05',
    category: 'Security',
    title: 'Fraud Alert & Stolen Payment Card Protocol',
    policySummary: 'When an unauthorized transaction or stolen card is reported, freeze pending shipments immediately, place account lock, and refer to Trust & Safety.',
    rules: [
      'Do NOT disclose delivery address or thief credentials to caller.',
      'Halt pending warehouse dispatch and apply fraud freeze tag.',
      'Direct cardholder to their bank issuer for official chargeback filing.'
    ],
    actionTag: 'FRAUD_FREEZE'
  },
  {
    code: 'KB-RET-04',
    category: 'Returns',
    title: 'Hazardous Materials & Damaged Lithium-Ion Battery Handling',
    policySummary: 'Damaged, swollen, or leaking lithium-ion batteries cannot be shipped back via standard commercial couriers due to transport safety regulations.',
    rules: [
      'DO NOT issue return shipping label for damaged/swollen batteries.',
      'Request clear photograph for compliance verification.',
      'Instruct customer on safe local electronic recycling disposal and process warranty unit.'
    ],
    actionTag: 'HAZMAT_EXEMPT'
  },
  {
    code: 'KB-RET-05',
    category: 'Returns',
    title: 'Restocking Fee Assessment & VIP Waiver Policy',
    policySummary: 'A 15% restocking fee applies to open-box remorse returns on major appliances and studio equipment. Fees are automatically waived for Platinum VIP members or defective goods.',
    rules: [
      'Standard remorse return: 15% restocking fee deducted from refund.',
      'Platinum VIP Member ($5,000+ spend): 100% fee waiver.',
      'Defective or incorrect item: 100% fee waiver.'
    ],
    actionTag: 'RESTOCK_FEE_WAIVED'
  },
  {
    code: 'KB-LOG-02',
    category: 'Logistics',
    title: 'In-Transit Address Modifications & Carrier Re-routes',
    policySummary: 'Once a shipment leaves the warehouse fulfillment center and is scanned into carrier hub, address changes cannot be made directly in internal ERP.',
    rules: [
      'Package in transit: Submit official Carrier Package Intercept / Re-route API request.',
      'Inform customer that carrier re-routing incurs a 24-48 hour delivery delay.',
      'If carrier intercept fails, customer must refuse delivery or return upon arrival.'
    ],
    actionTag: 'CARRIER_REROUTE'
  },
  {
    code: 'KB-INT-01',
    category: 'Logistics',
    title: 'International Customs, Import Duties & DDP vs DDU Shipping',
    policySummary: 'Orders shipped under Delivered Duty Paid (DDP) include all customs duties and taxes at checkout. If carrier mistakenly levies customs on delivery, credit back the customer.',
    rules: [
      'DDP Shipping: Verify customs receipt photo and refund levied fees immediately.',
      'DDU Shipping: Customs and duties are customer responsibility.',
      'Always check tracking line items for DDP indicator before reimbursing.'
    ],
    actionTag: 'DDP_DUTY_CREDIT'
  },
  {
    code: 'KB-ORD-03',
    category: 'Logistics',
    title: 'Split Shipments & Multi-Warehouse Fulfillment Tracking',
    policySummary: 'When items in a single multi-product order are fulfilled from separate regional warehouses, individual tracking numbers are generated per package.',
    rules: [
      'Before declaring item missing: Check order fulfillment tab for multiple tracking numbers.',
      'Provide secondary tracking link and estimated arrival date for remaining item(s).',
      'Only mark missing if all split packages have completed delivery.'
    ],
    actionTag: 'SPLIT_SHIPMENT_INFO'
  },
  {
    code: 'KB-BIL-06',
    category: 'Billing',
    title: 'Active Bank Chargeback Dispute Handling',
    policySummary: 'When a customer initiates a formal bank dispute (chargeback), merchant gateway locks manual refund capabilities on that transaction.',
    rules: [
      'Do NOT attempt manual refund on active chargeback (will create double loss).',
      'Explain politely that funds are in bank escrow pending dispute evidence.',
      'Route customer dossier to Dispute Management Team with chat transcript.'
    ],
    actionTag: 'CHARGEBACK_ESCROW'
  },
  {
    code: 'KB-SUB-02',
    category: 'Billing',
    title: 'SaaS Subscription Cancellation & Prorated Refund Policy',
    policySummary: 'Annual software licenses cancelled within first 30 days receive full refund. After 30 days, unused whole months are refunded on a prorated basis.',
    rules: [
      'Day 1–30: 100% full refund.',
      'Day 31+: Prorated refund for remaining unused full billing months.',
      'Disable auto-renewal immediately upon cancellation request.'
    ],
    actionTag: 'PRORATED_REFUND'
  },
  {
    code: 'KB-ESC-01',
    category: 'Escalations',
    title: 'Incident Severity Classification & Engineering Escalation Matrix',
    policySummary: 'Severity 1 (Critical) represents enterprise outage affecting >10% of users or core checkout down. Requires immediate incident broadcast and on-call page.',
    rules: [
      'Sev-1 (Critical): Checkout broken, total portal outage -> Page On-Call Engineering.',
      'Sev-2 (Major): Specific payment method down -> 1-Hour SLA engineering response.',
      'Sev-3 (Minor): UI glitch / non-blocking bug -> Standard ticket backlog.'
    ],
    actionTag: 'SEV1_INCIDENT_PAGE'
  }
];

export const ChatRound3KnowledgeBase: React.FC<WorkstationProps> = ({
  attemptData,
  onSubmitComplete
}) => {
  const questions = attemptData.questions || [];
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const currentQ = questions[currentIndex];

  const [savedAnswers, setSavedAnswers] = useState<Record<string, any>>(
    attemptData.saved_answers || {}
  );
  const [reviewFlags, setReviewFlags] = useState<Record<string, boolean>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // SOP Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [highlightedSop, setHighlightedSop] = useState<string | null>(null);

  // Load saved answer
  useEffect(() => {
    if (!currentQ) return;
    const existing = savedAnswers[currentQ.id];
    if (existing !== undefined && existing !== null) {
      setSelectedOption(String(existing));
    } else {
      setSelectedOption(null);
    }

    // Auto-detect referenced SOP in question text (e.g. KB-RET-01)
    const content = currentQ.content || (currentQ as any).candidate_content || '';
    const match = content.match(/KB-[A-Z]{3}-\d{2}/i);
    if (match) {
      setHighlightedSop(match[0].toUpperCase());
    } else {
      setHighlightedSop(null);
    }
  }, [currentIndex, currentQ?.id]);

  // Filtered SOP Articles
  const filteredSops = useMemo(() => {
    return SOP_ARTICLES.filter((art) => {
      const matchCat = selectedCategory === 'All' || art.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        art.code.toLowerCase().includes(q) ||
        art.title.toLowerCase().includes(q) ||
        art.policySummary.toLowerCase().includes(q) ||
        art.rules.some((r) => r.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [searchQuery, selectedCategory]);

  const options = useMemo(() => {
    if (!currentQ) return [];
    return (currentQ.options || (currentQ as any).options_json || []) as string[];
  }, [currentQ]);

  // Handle select option
  const handleSelectOption = async (optKey: string) => {
    setSelectedOption(optKey);
    if (!currentQ) return;

    setIsSaving(true);
    try {
      const updated = {
        ...savedAnswers,
        [currentQ.id]: optKey
      };
      setSavedAnswers(updated);

      await apiClient.post(`/assessment/attempts/${attemptData.attempt_id}/save-answer`, {
        question_id: currentQ.id,
        answer: optKey
      });
    } catch (err) {
      console.error('Failed to save answer:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleBookmark = (qId: string) => {
    setReviewFlags((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleNavigate = (idx: number) => {
    if (idx >= 0 && idx < questions.length) {
      setCurrentIndex(idx);
    }
  };

  const handleSubmitAttempt = async () => {
    if (!window.confirm('Are you ready to submit your SOP & Knowledge Base assessment?')) {
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiClient.post<CandidateResult>(
        `/assessment/attempts/${attemptData.attempt_id}/submit`
      );
      onSubmitComplete(res.data);
    } catch (err: any) {
      console.error('Submission failed:', err);
      alert(err?.response?.data?.detail || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const answeredCount = Object.keys(savedAnswers).length;

  return (
    <div className="h-screen max-h-screen bg-[#11110F] text-[#F8F5ED] flex flex-col font-sans overflow-hidden selection:bg-[#C9A227] selection:text-[#11110F]">
      {/* Top Bar */}
      <TimerHeader
        attemptData={attemptData}
        onSubmit={handleSubmitAttempt}
        isSubmitting={isSubmitting}
      />

      {/* Subheader Toolbar */}
      <div className="border-b border-[#2A2824] bg-[#1C1B18] px-6 py-2.5 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded bg-[#C9A227]/10 text-[#E3C766] font-semibold border border-[#C9A227]/30 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#C9A227]" />
            Standard Operating Procedure (SOP) Console
          </span>
          <span className="text-[#9E988A] font-medium">
            Case {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-[#6B665E]">|</span>
          <span className="text-[#9E988A]">
            {answeredCount} / {questions.length} Completed
          </span>
          {isSaving && <span className="text-[#C9A227] font-mono text-[11px] animate-pulse">Saving...</span>}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleBookmark(String(currentQ.id))}
            className={`px-3 py-1 rounded font-medium transition-all flex items-center gap-1.5 border cursor-pointer ${
              reviewFlags[currentQ.id]
                ? 'bg-[#EAB308]/20 border-[#EAB308]/40 text-[#EAB308]'
                : 'bg-[#141311] border-[#2A2824] text-[#9E988A] hover:text-[#F8F5ED]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            {reviewFlags[currentQ.id] ? 'Flagged for Review' : 'Flag Question'}
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Left Pane: Searchable Interactive SOP Handbook (6 cols) */}
        <div className="col-span-6 border-r border-[#2A2824] bg-[#1C1B18] flex flex-col overflow-hidden">
          {/* Handbook Search & Category Filters */}
          <div className="p-4 border-b border-[#2A2824] bg-[#141311] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#F8F5ED] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#C9A227]" />
                Live Customer Support Knowledge Base (KB)
              </span>
              <span className="text-[10px] text-[#E3C766] font-mono px-2 py-0.5 rounded bg-[#C9A227]/10 border border-[#C9A227]/30">
                15 SOP Articles Active
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#9E988A] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SOP policy code, keyword (e.g. KB-RET-01, refund, battery)..."
                className="w-full bg-[#11110F] border border-[#2A2824] rounded-lg pl-9 pr-4 py-2 text-xs text-[#F8F5ED] placeholder-[#6B665E] focus:outline-none focus:border-[#C9A227]"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              {['All', 'Returns', 'Logistics', 'Security', 'Billing', 'Warranty', 'Escalations'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#C9A227] text-[#11110F] font-bold shadow-sm'
                      : 'bg-[#1C1B18] text-[#9E988A] hover:text-[#F8F5ED] border border-[#2A2824]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* SOP Articles Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredSops.length === 0 ? (
              <div className="text-center py-12 text-[#9E988A] text-xs">
                No SOP articles matching "{searchQuery}"
              </div>
            ) : (
              filteredSops.map((art) => {
                const isTarget = highlightedSop === art.code;

                return (
                  <div
                    key={art.code}
                    className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                      isTarget
                        ? 'bg-[#C9A227]/10 border-[#C9A227] ring-1 ring-[#C9A227] shadow-lg shadow-[#C9A227]/10'
                        : 'bg-[#141311] border-[#2A2824] hover:bg-[#1C1B18]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#1C1B18] text-[#E3C766] border border-[#C9A227]/30">
                          {art.code}
                        </span>
                        <span className="text-[11px] font-semibold text-[#9E988A] uppercase tracking-wider">
                          {art.category}
                        </span>
                      </div>
                      {isTarget && (
                        <span className="text-[10px] font-bold text-[#E3C766] bg-[#C9A227]/20 px-2 py-0.5 rounded border border-[#C9A227]/30 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-[#C9A227]" /> Question Target SOP
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-[#F8F5ED] leading-snug">{art.title}</h4>

                    <p className="text-xs text-[#D8D2C5] leading-relaxed bg-[#11110F] p-2.5 rounded-lg border border-[#2A2824]">
                      {art.policySummary}
                    </p>

                    <div className="space-y-1 pt-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E988A]">
                        Operational Rules:
                      </p>
                      <ul className="space-y-1 text-xs text-[#9E988A] list-disc list-inside">
                        {art.rules.map((rule, rIdx) => (
                          <li key={rIdx} className="leading-relaxed">
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Scenario Application & Choice Selection (6 cols) */}
        <div className="col-span-6 bg-[#141311] p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-5">
            {/* Header / Case Title */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#C9A227]/15 text-[#E3C766] border border-[#C9A227]/30">
                  SOP CASE STUDY
                </span>
                {highlightedSop && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C1B18] text-[#E3C766] border border-[#2A2824]">
                    Ref: {highlightedSop}
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-[#F8F5ED] mt-2 leading-snug">
                {currentQ?.title || `SOP Scenario ${currentIndex + 1}`}
              </h2>
            </div>

            {/* Scenario Prompt */}
            <div className="p-4 bg-[#1C1B18] rounded-xl border border-[#2A2824] text-xs text-[#D8D2C5] leading-relaxed whitespace-pre-wrap font-sans border-l-4 border-l-[#C9A227]">
              {currentQ?.content || (currentQ as any)?.candidate_content || 'No prompt provided.'}
            </div>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold text-[#9E988A] uppercase tracking-wider block">
                Select Correct SOP Action & Tag:
              </span>

              {options.map((opt: string, idx: number) => {
                const optNumber = String(idx + 1);
                const optAlpha = String.fromCharCode(65 + idx);
                const isSelected =
                  selectedOption === optNumber ||
                  selectedOption === optAlpha ||
                  selectedOption === opt;

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(optNumber)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 cursor-pointer ${
                      isSelected
                        ? 'bg-[#C9A227]/15 border-[#C9A227] text-[#F8F5ED] shadow-lg ring-1 ring-[#C9A227]'
                        : 'bg-[#1C1B18] border-[#2A2824] text-[#D8D2C5] hover:border-[#C9A227]/40 hover:bg-[#24231F]'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                        isSelected
                          ? 'bg-[#C9A227] text-[#11110F] shadow-md'
                          : 'bg-[#141311] text-[#9E988A] border border-[#2A2824]'
                      }`}
                    >
                      {optNumber}
                    </div>

                    <div className="space-y-1.5 flex-1 pt-0.5">
                      <p className="text-xs leading-relaxed text-[#D8D2C5] font-sans font-medium">{opt}</p>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4ADE80] bg-[#4ADE80]/10 px-2 py-0.5 rounded border border-[#4ADE80]/20">
                          <CheckCircle className="w-3 h-3" /> Selected Policy Decision
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Navigator & Action */}
          <div className="pt-6 border-t border-[#2A2824] space-y-4">
            {/* Case Navigator Matrix */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#9E988A] font-mono uppercase tracking-wider">Case Navigator:</span>
              <div className="flex flex-wrap gap-1.5">
                {questions.map((q, idx) => {
                  const isAns = !!savedAnswers[q.id];
                  const isCur = idx === currentIndex;
                  const isBmk = reviewFlags[q.id];

                  return (
                    <button
                      key={q.id || idx}
                      onClick={() => handleNavigate(idx)}
                      className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all relative cursor-pointer border ${
                        isCur
                          ? 'bg-[#C9A227] text-[#11110F] border-[#C9A227] shadow-md ring-1 ring-[#C9A227]'
                          : isAns
                          ? 'bg-[#4ADE80]/15 text-[#4ADE80] border-[#4ADE80]/30'
                          : 'bg-[#141311] text-[#9E988A] border border-[#2A2824] hover:bg-[#24231F]'
                      }`}
                    >
                      {idx + 1}
                      {isBmk && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#EAB308] ring-2 ring-[#1C1B18]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prev / Next / Submit Controls */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleNavigate(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="px-4 py-2 bg-[#141311] hover:bg-[#24231F] disabled:opacity-40 text-[#D8D2C5] rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-[#2A2824] transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous Case
              </button>

              <div className="flex items-center gap-3">
                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => handleNavigate(currentIndex + 1)}
                    className="px-5 py-2 bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md shadow-[#C9A227]/20 cursor-pointer"
                  >
                    Next Case
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitAttempt}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#C9A227]/20 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isSubmitting ? 'Evaluating Submission...' : 'Submit Round'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
