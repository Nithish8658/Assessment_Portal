import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StartAttemptResponse, CandidateResult } from '../../../../../types/assessment';
import { TimerHeader } from '../../../../../components/assessment/TimerHeader';
import apiClient from '../../../../../api/client';
import {
  MessageSquare,
  Send,
  User,
  CheckCircle2,
  Clock,
  Sparkles,
  Smile,
  Truck,
  Zap,
  Check,
  ChevronDown
} from 'lucide-react';
import { notify, confirmDialog } from '../../../../../components/ui/Dialogs';

interface WorkstationProps {
  attemptData: StartAttemptResponse;
  onSubmitComplete: (res: CandidateResult) => void;
}

interface ChatMessage {
  sender: 'customer' | 'agent' | 'system';
  text: string;
  timestamp: string;
  sentiment?: string;
}

interface ChatSession {
  session_id: string;
  customer_name: string;
  market: string;
  order_id: string;
  order_value: string;
  items: string[];
  carrier: string;
  tracking_status: string;
  initial_sentiment: string;
  issue_summary: string;
  messages: ChatMessage[];
  csat: number;
  is_resolved: boolean;
}

const DEFAULT_SESSIONS: Record<string, ChatSession> = {
  'CHAT-A': {
    session_id: 'CHAT-A',
    customer_name: 'Jessica Miller',
    market: 'Chicago, USA',
    order_id: '#US-94821',
    order_value: '$189.50',
    items: ['Ergonomic Bluetooth Keyboard', 'Precision Wireless Mouse'],
    carrier: 'FedEx Home Delivery',
    tracking_status: 'Delayed — Pending sorting hub scan in Memphis',
    initial_sentiment: 'frustrated',
    issue_summary: 'Express order 3 days late; customer has upcoming project presentation.',
    messages: [
      {
        sender: 'customer',
        text: 'Hi, I paid $25 extra for 2-day express shipping on order #US-94821 and it has been 4 days! Tracking has not updated in 48 hours. I need this keyboard for a client presentation tomorrow morning. Where is my order?!',
        timestamp: '10:02 AM',
        sentiment: 'frustrated'
      }
    ],
    csat: 2.0,
    is_resolved: false
  },
  'CHAT-B': {
    session_id: 'CHAT-B',
    customer_name: 'Marcus Vance',
    market: 'Toronto, Canada',
    order_id: '#CA-51203',
    order_value: '$420.00',
    items: ['Studio Noise-Canceling Headphones', 'Audio DAC Interface'],
    carrier: 'DHL Express International',
    tracking_status: 'Customs Clearance Exception — Duty Payment Pending',
    initial_sentiment: 'anxious',
    issue_summary: 'Customer received DHL notification demanding $58 CAD duty on DDP order.',
    messages: [
      {
        sender: 'customer',
        text: 'Hello. DHL just delivered a note saying my package #CA-51203 is on hold at Ontario customs until I pay $58 CAD in import taxes. But your website said all taxes are included in Delivered Duty Paid (DDP)! Why am I being billed twice?',
        timestamp: '10:05 AM',
        sentiment: 'anxious'
      }
    ],
    csat: 3.0,
    is_resolved: false
  },
  'CHAT-C': {
    session_id: 'CHAT-C',
    customer_name: 'Sarah Lin',
    market: 'Austin, USA',
    order_id: '#US-88129',
    order_value: '$650.00',
    items: ['UltraWide 34" 4K HDR Monitor'],
    carrier: 'UPS Ground',
    tracking_status: 'Delivered — Damaged outer packaging reported',
    initial_sentiment: 'upset',
    issue_summary: '4K monitor arrived with cracked display panel upon unboxing.',
    messages: [
      {
        sender: 'customer',
        text: 'I just opened my monitor delivery and the entire display glass is shattered across the top corner! The UPS box had a huge dent on the side. I cannot believe this happened. I need an urgent replacement shipped today!',
        timestamp: '10:08 AM',
        sentiment: 'upset'
      }
    ],
    csat: 1.5,
    is_resolved: false
  }
};

const CANNED_MACROS = [
  {
    title: 'Empathy & Sincere Apology',
    text: 'I completely understand how frustrating this situation is, and I sincerely apologize for the inconvenience. Let me review your order details right away and get this resolved for you.'
  },
  {
    title: 'Investigating Shipping & Tracking',
    text: 'I am currently checking our carrier portal and logistics system to trace your package location. Please allow me one moment while I retrieve the latest scan details.'
  },
  {
    title: 'Shipping Fee Refund & Expedite',
    text: 'I have immediately refunded your express shipping fee back to your original payment method. In addition, I have escalated with our courier team to prioritize delivery.'
  },
  {
    title: 'DDP Customs Duty Credit Approval',
    text: 'Since your order was placed with Delivered Duty Paid (DDP) shipping, our store covers all import duties. I will gladly credit the customs amount back to your account immediately upon reviewing the carrier receipt.'
  },
  {
    title: 'Damaged Item Express Replacement',
    text: 'I am so sorry to hear the item arrived damaged. For your safety, please do not handle broken glass. I am dispatching a complimentary express replacement unit right now with priority delivery.'
  },
  {
    title: 'Professional Closing Reassurance',
    text: 'Thank you so much for your patience today. I have sent all confirmation details and tracking updates to your registered email. Please let me know if there is anything else I can assist you with!'
  }
];

export const ChatRound4SupportConsole: React.FC<WorkstationProps> = ({
  attemptData,
  onSubmitComplete
}) => {
  const questions = attemptData.questions || [];
  const currentQ = questions[0] || { id: 'q_chat_sim', title: 'Live Customer Support Simulation' };

  // Multi-session state
  const [sessions, setSessions] = useState<Record<string, ChatSession>>(() => {
    const saved = attemptData.saved_answers?.[currentQ.id];
    if (saved && typeof saved === 'object' && saved.sessions) {
      return saved.sessions;
    }
    return DEFAULT_SESSIONS;
  });

  const [activeSessionId, setActiveSessionId] = useState<string>('CHAT-A');
  const [inputText, setInputText] = useState<string>('');
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [macroDropdownOpen, setMacroDropdownOpen] = useState<boolean>(false);

  const activeSession = sessions[activeSessionId] || DEFAULT_SESSIONS['CHAT-A'];
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession.messages, isAiTyping]);

  // Persist session state to backend
  const persistSessionState = async (updatedSessions: Record<string, ChatSession>) => {
    try {
      await apiClient.post(`/assessment/attempts/${attemptData.attempt_id}/save-answer`, {
        question_id: currentQ.id,
        answer: {
          sessions: updatedSessions,
          active_session: activeSessionId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error('Failed to autosave chat simulation state:', err);
    }
  };

  // Send candidate reply
  const handleSendMessage = async (textToSend?: string) => {
    const msg = (textToSend || inputText).trim();
    if (!msg || isAiTyping) return;

    setInputText('');
    setMacroDropdownOpen(false);

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const agentMsg: ChatMessage = {
      sender: 'agent',
      text: msg,
      timestamp: nowStr
    };

    const newHistory = [...activeSession.messages, agentMsg];

    // Optimistically update candidate message
    const updatedSessions = {
      ...sessions,
      [activeSessionId]: {
        ...activeSession,
        messages: newHistory
      }
    };
    setSessions(updatedSessions);
    setIsAiTyping(true);

    try {
      // Call backend AI simulation engine
      const res = await apiClient.post('/assessment/simulation/chat-turn', {
        attempt_id: attemptData.attempt_id,
        question_id: currentQ.id,
        conversation_history: newHistory.map((m) => ({
          sender: m.sender,
          text: m.text,
          timestamp: m.timestamp
        })),
        agent_message: msg
      });

      const data = res.data;
      const customerReply = data.customer_reply || data.response || 'Thank you for looking into this for me.';
      const rawCsat = typeof data.csat_score === 'number' ? data.csat_score : activeSession.csat;
      const normalizedCsat = rawCsat > 5.0 ? Math.max(1.0, Math.min(5.0, Number((rawCsat / 20.0).toFixed(1)))) : Number(rawCsat.toFixed(1));

      const customerMsg: ChatMessage = {
        sender: 'customer',
        text: customerReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sentiment: data.sentiment || 'neutral'
      };

      const finalSessions = {
        ...updatedSessions,
        [activeSessionId]: {
          ...updatedSessions[activeSessionId],
          messages: [...newHistory, customerMsg],
          csat: normalizedCsat,
          is_resolved: !!data.is_complete || !!data.completed
        }
      };

      setSessions(finalSessions);
      await persistSessionState(finalSessions);
    } catch (err) {
      console.error('Simulation turn error:', err);
      const customerFallback: ChatMessage = {
        sender: 'customer',
        text: 'Thank you for your response. Could you please confirm when I will receive the email update?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sentiment: 'neutral'
      };

      const fallbackSessions = {
        ...updatedSessions,
        [activeSessionId]: {
          ...updatedSessions[activeSessionId],
          messages: [...newHistory, customerFallback]
        }
      };
      setSessions(fallbackSessions);
      await persistSessionState(fallbackSessions);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Mark session as resolved
  const toggleResolveSession = (sId: string) => {
    const updated = {
      ...sessions,
      [sId]: {
        ...sessions[sId],
        is_resolved: !sessions[sId].is_resolved
      }
    };
    setSessions(updated);
    persistSessionState(updated);
  };

  // Submit complete attempt
  const handleSubmitAttempt = async () => {
    const totalTurns = Object.values(sessions).reduce((acc, s) => acc + s.messages.length, 0);
    if (totalTurns < 4) {
      if (!(await confirmDialog('You have only exchanged a few messages. Are you sure you want to conclude the support simulation?'))) {
        return;
      }
    } else {
      if (!(await confirmDialog('Are you ready to submit your Chat Simulation sessions for AI evaluation?'))) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await persistSessionState(sessions);
      const res = await apiClient.post<CandidateResult>(
        `/assessment/attempts/${attemptData.attempt_id}/submit`
      );
      onSubmitComplete(res.data);
    } catch (err: any) {
      console.error('Submission failed:', err);
      notify(err?.response?.data?.detail || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen max-h-screen bg-[#F6F8FA] text-[#0F172A] flex flex-col font-sans overflow-hidden selection:bg-[#FF5500] selection:text-white">
      {/* Top Bar */}
      <TimerHeader
        attemptData={attemptData}
        onSubmit={handleSubmitAttempt}
        isSubmitting={isSubmitting}
      />

      {/* Production Support App Header Bar */}
      <div className="border-b border-[#E2E8F0] bg-white px-6 py-2.5 flex items-center justify-between text-xs shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded bg-[#FF5500]/10 text-[#FF5500] font-bold border border-[#FF5500]/20 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#FF5500]" />
            Live Customer Support Center
          </span>
          <span className="text-[#64748B] font-medium">Agent Console (Tier-1 International)</span>
          <span className="text-[#CBD5E1]">|</span>
          <span className="text-emerald-600 flex items-center gap-1 font-mono text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block mr-1" />
            3 Active Live Chats
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[#64748B]">
            <span>Average CSAT:</span>
            <span className="font-mono font-bold text-[#FF5500]">
              {(
                Object.values(sessions).reduce((acc, s) => acc + s.csat, 0) /
                Object.keys(sessions).length
              ).toFixed(1)}{' '}
              / 5.0
            </span>
          </div>
        </div>
      </div>

      {/* Main Support Workspace */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Left Sidebar: Active Chat Queue Tabs (3 cols) */}
        <div className="col-span-3 border-r border-[#E2E8F0] bg-white flex flex-col justify-between overflow-hidden">
          <div className="p-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider px-1">
              Active Support Inquiries
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8F0] p-2 space-y-1">
            {Object.values(sessions).map((s) => {
              const isActive = activeSessionId === s.session_id;
              const lastMsg = s.messages[s.messages.length - 1];

              return (
                <button
                  key={s.session_id}
                  onClick={() => setActiveSessionId(s.session_id)}
                  className={`w-full text-left p-3 rounded-xl transition-all space-y-2 border cursor-pointer ${
                    isActive
                      ? 'bg-[#FF5500]/10 border-[#FF5500] shadow-xs ring-1 ring-[#FF5500]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F172A]">{s.customer_name}</span>
                    <span className="text-[10px] font-mono text-[#64748B]">{s.order_id}</span>
                  </div>

                  <p className="text-[11px] text-[#64748B] line-clamp-2 leading-relaxed">
                    {lastMsg ? lastMsg.text : s.issue_summary}
                  </p>

                  <div className="flex items-center justify-between text-[10px] pt-1">
                    <span
                      className={`px-1.5 py-0.5 rounded font-medium ${
                        s.is_resolved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {s.is_resolved ? 'Resolved' : 'Active Chat'}
                    </span>

                    <span className="text-[#64748B] font-mono font-medium">CSAT: {s.csat.toFixed(1)} ⭐</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* SLA & Performance Guidelines Footer */}
          <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#64748B] space-y-2">
            <div className="flex items-center gap-1.5 text-[#FF5500] font-semibold text-[11px]">
              <Sparkles className="w-3.5 h-3.5" /> Performance SLA Goals
            </div>
            <ul className="space-y-1 text-[11px] text-[#64748B] list-disc list-inside">
              <li>First Response SLA &lt; 45s</li>
              <li>Maintain &gt; 4.0 Customer CSAT</li>
              <li>Adhere to SOP Refund Limits</li>
            </ul>
          </div>
        </div>

        {/* Center Pane: Active Live Conversation Window (6 cols) */}
        <div className="col-span-6 border-r border-[#E2E8F0] bg-[#F6F8FA] flex flex-col justify-between overflow-hidden">
          {/* Active Chat Header */}
          <div className="p-3.5 border-b border-[#E2E8F0] bg-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/20 flex items-center justify-center font-bold text-xs">
                {activeSession.customer_name.charAt(0)}
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                  {activeSession.customer_name}
                  <span className="text-[10px] font-normal text-[#64748B]">({activeSession.market})</span>
                </h4>
                <p className="text-[11px] text-[#64748B]">{activeSession.issue_summary}</p>
              </div>
            </div>

            <button
              onClick={() => toggleResolveSession(activeSessionId)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 cursor-pointer ${
                activeSession.is_resolved
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold'
                  : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F0F3F6]'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              {activeSession.is_resolved ? 'Marked Resolved' : 'Resolve Chat'}
            </button>
          </div>

          {/* Chat Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeSession.messages.map((msg, mIdx) => {
              const isAgent = msg.sender === 'agent';

              return (
                <div
                  key={mIdx}
                  className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-[#64748B] px-1">
                    <span>{isAgent ? 'You (Support Agent)' : activeSession.customer_name}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed font-sans ${
                      isAgent
                        ? 'bg-[#FF5500] text-white font-medium rounded-br-xs shadow-sm'
                        : 'bg-white border border-[#E2E8F0] text-[#0F172A] rounded-bl-xs shadow-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {/* AI Typing Indicator */}
            {isAiTyping && (
              <div className="flex items-start gap-2">
                <div className="bg-white border border-[#E2E8F0] px-3 py-2 rounded-2xl text-xs text-[#64748B] flex items-center gap-2 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500] animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] font-mono text-[#64748B] pl-1">
                    {activeSession.customer_name} is typing...
                  </span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Canned Macro Bar & Message Input */}
          <div className="p-3 border-t border-[#E2E8F0] bg-white space-y-2">
            {/* Quick Macro Dropdown Toggle */}
            <div className="relative">
              <button
                onClick={() => setMacroDropdownOpen(!macroDropdownOpen)}
                className="text-[11px] px-2.5 py-1 bg-[#F0F3F6] hover:bg-[#E2E8F0] text-[#475569] rounded-lg border border-[#E2E8F0] flex items-center gap-1.5 transition-all cursor-pointer font-medium"
              >
                <Zap className="w-3 h-3 text-[#FF5500]" />
                Canned Response Templates (Macros)
                <ChevronDown className="w-3 h-3 text-[#64748B]" />
              </button>

              {macroDropdownOpen && (
                <div className="absolute bottom-9 left-0 w-96 bg-white border border-[#E2E8F0] rounded-xl shadow-xl p-2 z-20 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-[#64748B] px-2 py-1">
                    Select Support Macro
                  </div>
                  {CANNED_MACROS.map((macro, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputText(macro.text);
                        setMacroDropdownOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-[#FFF8F5] text-xs text-[#0F172A] transition-all space-y-0.5 border border-transparent hover:border-[#FF5500]/20 cursor-pointer"
                    >
                      <p className="font-semibold text-[#FF5500] text-[11px]">{macro.title}</p>
                      <p className="text-[#64748B] text-[10px] line-clamp-1">{macro.text}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input Box */}
            <div className="flex items-center gap-2">
              <textarea
                rows={2}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Type a professional response to ${activeSession.customer_name}... (Press Enter to send)`}
                className="flex-1 bg-[#F0F3F6] border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] resize-none font-sans"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isAiTyping}
                className="h-full px-4 py-3 bg-[#FF5500] hover:bg-[#E64D00] disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center justify-center transition-all shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Customer CRM & Order Dossier (3 cols) */}
        <div className="col-span-3 bg-white p-4 space-y-4 overflow-y-auto border-l border-[#E2E8F0]">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#FF5500]" />
              Customer CRM Dossier
            </h3>

            {/* Order Details Card */}
            <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <span className="text-[#64748B]">Order Reference</span>
                <span className="font-mono font-bold text-[#0F172A]">{activeSession.order_id}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Total Billed</span>
                <span className="font-mono text-emerald-600 font-bold">{activeSession.order_value}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Carrier Partner</span>
                <span className="text-[#475569]">{activeSession.carrier}</span>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#64748B]">Ordered Items</span>
                <ul className="space-y-1 text-[#475569] text-[11px] list-disc list-inside">
                  {activeSession.items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Live Logistics Timeline */}
            <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2 text-xs">
              <span className="text-[10px] uppercase font-bold text-[#64748B] flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#FF5500]" /> Carrier Tracking Status
              </span>
              <p className="text-[11px] text-[#FF5500] font-medium leading-relaxed bg-[#FFF8F5] p-2 rounded-lg border border-[#FF5500]/20">
                {activeSession.tracking_status}
              </p>
            </div>

            {/* Real-Time Sentiment & CSAT Gauge */}
            <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-3 text-xs">
              <span className="text-[10px] uppercase font-bold text-[#64748B] flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5 text-emerald-600" /> Real-Time Satisfaction Score
              </span>

              <div className="flex items-center justify-between">
                <span className="text-[#475569]">Live CSAT Meter:</span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                    activeSession.csat >= 4.0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : activeSession.csat >= 2.5
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-red-50 text-red-600 border border-red-200'
                  }`}
                >
                  {activeSession.csat.toFixed(1)} / 5.0
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    activeSession.csat >= 4.0
                      ? 'bg-emerald-500'
                      : activeSession.csat >= 2.5
                      ? 'bg-[#FF5500]'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${(activeSession.csat / 5.0) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Submit Final Assessment */}
          <div className="pt-2">
            <button
              onClick={handleSubmitAttempt}
              disabled={isSubmitting}
              className="w-full py-3 bg-[#FF5500] hover:bg-[#E64D00] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Evaluating All Chats with Gemini...' : 'Complete & Submit Assessment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
