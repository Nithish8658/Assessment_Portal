import React, { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  TrendingUp,
  Clock
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  tools_executed?: Array<{ tool: string; arguments?: any; result?: any }>;
  isStreaming?: boolean;
}

interface QuickSummary {
  active_in_progress_exams: number;
  pending_approvals: number;
  evaluated_attempts: number;
  user_role: string;
  department_name?: string | null;
}

interface VisibleTableData {
  headers: string[];
  rows: string[][];
  caption?: string;
}

interface PageContextPayload {
  current_path: string;
  page_title: string;
  active_tab?: string;
  metrics_summary: Record<string, string>;
  visible_tables: VisibleTableData[];
  quick_links: string[];
}

const QUICK_CHIPS = [
  { label: '📊 Live Exam Status', query: 'What is the current live status of ongoing exams and active students in the portal?' },
  { label: '🎯 Department KPIs', query: 'Show me the latest department KPIs, pass percentages, and average scores.' },
  { label: '⏳ Pending Approvals', query: 'Are there any student assessment activation requests pending HoD approval?' },
  { label: '⚠️ At-Risk Candidates', query: 'Identify at-risk students who scored below 50% in recent assessment rounds.' },
  { label: '📦 Question Bank Health', query: 'Provide a summary of question bank inventory across all assessment domains.' }
];

/**
 * Extracts live DOM table data, metrics cards, active route, and headings
 * from the user's active screen to ground the Gemini Live agent.
 */
function extractLivePageContext(): PageContextPayload {
  const current_path = window.location.pathname + window.location.search;

  // 1. Page Title / Primary Heading
  let page_title = document.title || 'MockRun';
  const headingEl = document.querySelector('h1, h2, [data-page-title]');
  if (headingEl && headingEl.textContent) {
    page_title = headingEl.textContent.trim();
  }

  // 2. Active Tab or Section
  let active_tab = '';
  const activeTabEl = document.querySelector('[role="tab"][aria-selected="true"], button.active, [data-active="true"]');
  if (activeTabEl && activeTabEl.textContent) {
    active_tab = activeTabEl.textContent.trim();
  }

  // 3. Visible Metric Badges & Stat Cards
  const metrics_summary: Record<string, string> = {};
  const statCards = document.querySelectorAll(
    '[data-stat], .stat-card, .metric-card, [class*="stat-"], [class*="metric-"], [class*="card"]'
  );
  let statIdx = 0;
  statCards.forEach((el) => {
    if (statIdx >= 8) return;
    const text = el.textContent?.trim().replace(/\s+/g, ' ') || '';
    if (text.length > 3 && text.length < 90 && !text.includes('function') && !text.includes('{')) {
      metrics_summary[`stat_${statIdx + 1}`] = text;
      statIdx++;
    }
  });

  // 4. Visible HTML Tables (Headers + top rows)
  const visible_tables: VisibleTableData[] = [];
  const tables = document.querySelectorAll('table');
  tables.forEach((tbl, tIdx) => {
    if (tIdx >= 3) return; // Limit to 3 visible tables

    const headers: string[] = [];
    tbl.querySelectorAll('thead th, tr:first-child th').forEach((th) => {
      const txt = th.textContent?.trim();
      if (txt) headers.push(txt);
    });

    const rows: string[][] = [];
    const trList = tbl.querySelectorAll('tbody tr');
    const trToProcess = trList.length > 0 ? trList : tbl.querySelectorAll('tr');
    trToProcess.forEach((tr, rIdx) => {
      if (rIdx >= 10) return; // Limit to 10 rows
      const rowCells: string[] = [];
      tr.querySelectorAll('td').forEach((td) => {
        rowCells.push(td.textContent?.trim().replace(/\s+/g, ' ') || '');
      });
      if (rowCells.length > 0) {
        rows.push(rowCells);
      }
    });

    if (headers.length > 0 || rows.length > 0) {
      visible_tables.push({
        headers,
        rows,
        caption: tbl.querySelector('caption')?.textContent?.trim() || `Table ${tIdx + 1}`
      });
    }
  });

  // 5. Active Sidebar / Navigation Links
  const quick_links: string[] = [];
  document.querySelectorAll('nav a, aside a').forEach((link, idx) => {
    if (idx < 8) {
      const href = link.getAttribute('href');
      const text = link.textContent?.trim();
      if (href && text && !href.startsWith('#')) {
        quick_links.push(`${text} (${href})`);
      }
    }
  });

  return {
    current_path,
    page_title,
    active_tab,
    metrics_summary,
    visible_tables,
    quick_links
  };
}

export const HodAdminChatbot: React.FC = () => {
  const { user, activeRole, token } = useAuth();

  // Strict Role Guard: Only HoD, Administrator, Super Admin, and Assessment Coordinator
  const isAuthorized =
    activeRole === 'HoD' ||
    activeRole === 'Administrator' ||
    (activeRole as string) === 'Super Admin' ||
    activeRole === 'Assessment Coordinator';

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeToolStatus, setActiveToolStatus] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'forbidden'>('disconnected');
  const [quickSummary, setQuickSummary] = useState<QuickSummary | null>(null);
  const [activePageContext, setActivePageContext] = useState<PageContextPayload | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const pingIntervalRef = useRef<any>(null);
  const sessionIdRef = useRef<string>(`sess_${user?.id || 'guest'}_${Math.floor(Date.now() / 1000)}`);

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading, activeToolStatus]);

  // Fetch quick summary stats on opening
  useEffect(() => {
    if (!isOpen || !isAuthorized) return;

    const fetchSummary = async () => {
      try {
        const res = await apiClient.get<QuickSummary>('/assessment/assistant/quick-summary');
        setQuickSummary(res.data);
      } catch (err) {
        console.warn('Failed to fetch quick summary:', err);
      }
    };

    fetchSummary();
  }, [isOpen, isAuthorized]);

  // Capture in-page DOM context whenever the drawer opens or route changes
  useEffect(() => {
    if (isOpen) {
      const ctx = extractLivePageContext();
      setActivePageContext(ctx);
    }
  }, [isOpen]);

  // ---------------------------------------------------------------------------
  // WebSocket Live Connection (ZERO Fallback to HTTP REST)
  // ---------------------------------------------------------------------------
  const connectWebSocket = useCallback(() => {
    if (!isAuthorized) return;
    const tokenStr = token || localStorage.getItem('nasc_token');
    if (!tokenStr) {
      setConnectionStatus('disconnected');
      return;
    }

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setConnectionStatus('connecting');

    // Build WebSocket URL
    const envBase = import.meta.env.VITE_API_BASE_URL;
    let wsHost = `${window.location.hostname}:8001`;
    let wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    if (envBase) {
      try {
        const parsed = new URL(envBase, window.location.origin);
        wsProto = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
        wsHost = parsed.host;
      } catch {
        // Fallback to default wsHost
      }
    }

    const wsUrl = `${wsProto}//${wsHost}/api/v1/assessment/assistant/ws-live?token=${encodeURIComponent(tokenStr)}&session_id=${encodeURIComponent(sessionIdRef.current)}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');

        // Setup ping heartbeat every 25 seconds
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'history') {
            // PostgreSQL Rehydrated Session History
            if (data.session_id) {
              sessionIdRef.current = data.session_id;
            }
            if (Array.isArray(data.messages) && data.messages.length > 0) {
              setMessages(data.messages);
            } else {
              setMessages([
                {
                  id: 'welcome_init',
                  sender: 'assistant',
                  text: `**Welcome, ${user?.full_name || 'Leader'}!**\n\nI am your **MockRun Autonomous AI Executive Copilot** (powered by **OpenLectern**), driven by **Gemini 3.1 Flash Live**.\n\nI have direct read-only analytical access for **Nehru Arts and Science College** across your permitted scope (*${data.department_name || activeRole}*). Ask me anything about student scores, class performance, question banks, or KPIs!`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              ]);
            }
          } else if (data.type === 'tool_start') {
            // Autonomous tool silently executing
          } else if (data.type === 'token') {
            // Real-time Token Streaming into Active Assistant Bubble
            const tokenText = data.text || '';
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.sender === 'assistant' && last.isStreaming) {
                return [
                  ...prev.slice(0, -1),
                  {
                    ...last,
                    text: last.text + tokenText
                  }
                ];
              } else {
                return [
                  ...prev,
                  {
                    id: `asst_stream_${Date.now()}`,
                    sender: 'assistant',
                    text: tokenText,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isStreaming: true
                  }
                ];
              }
            });
          } else if (data.type === 'turn_complete') {
            // Turn Complete Event
            setActiveToolStatus(null);
            setIsLoading(false);
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.sender === 'assistant') {
                return [
                  ...prev.slice(0, -1),
                  {
                    ...last,
                    text: data.text || last.text,
                    tools_executed: data.tools_executed || [],
                    timestamp: data.timestamp || last.timestamp,
                    isStreaming: false
                  }
                ];
              }
              return prev;
            });
          } else if (data.type === 'error') {
            setActiveToolStatus(null);
            setIsLoading(false);
            setMessages((prev) => [
              ...prev,
              {
                id: `err_${Date.now()}`,
                sender: 'assistant',
                text: `⚠️ **Live Agent Notice**: ${data.message || 'Encountered an issue processing query.'}`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]);
          }
        } catch (err) {
          console.error('Error parsing live assistant message:', err);
        }
      };

      ws.onclose = (ev) => {
        setConnectionStatus('disconnected');
        setActiveToolStatus(null);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

        if (ev.code === 4403) {
          setConnectionStatus('forbidden');
          setMessages((prev) => [
            ...prev,
            {
              id: `forbidden_${Date.now()}`,
              sender: 'assistant',
              text: '⛔ **Access Denied**: Live AI Executive Assistant is restricted strictly to HoD and Administrator accounts.',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          return;
        }

        // Auto-reconnect strictly via WebSockets (NO fallback to HTTP REST)
        if (isOpen && ev.code !== 1000) {
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 3500);
        }
      };

      ws.onerror = (err) => {
        console.warn('Live Assistant WebSocket error:', err);
      };
    } catch (e) {
      console.error('Failed to establish Live Agent WebSocket:', e);
      setConnectionStatus('disconnected');
    }
  }, [isAuthorized, token, activeRole, user, isOpen]);

  // Connect when opened, disconnect when closed
  useEffect(() => {
    if (isOpen && isAuthorized) {
      connectWebSocket();
    } else {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Drawer closed');
        wsRef.current = null;
      }
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      setConnectionStatus('disconnected');
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [isOpen, isAuthorized, connectWebSocket]);

  // ---------------------------------------------------------------------------
  // Message Transmission (Strictly WebSocket with In-Page DOM Grounding)
  // ---------------------------------------------------------------------------
  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    // Check WebSocket state
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert('Live Agent is currently reconnecting over WebSocket. Please wait a moment...');
      connectWebSocket();
      return;
    }

    setInputText('');

    // Extract updated in-page DOM tables and screen metrics
    const latestPageContext = extractLivePageContext();
    setActivePageContext(latestPageContext);

    // Append optimistic user message
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Transmit over WebSocket with in-page DOM table awareness
    const payload = {
      type: 'message',
      text: query,
      page_context: latestPageContext
    };

    wsRef.current.send(JSON.stringify(payload));
  };

  const handleClearChat = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'clear_history' }));
    } else {
      setMessages([
        {
          id: 'welcome_init',
          sender: 'assistant',
          text: `**Conversation cleared.**\n\nHow can I help you analyze live assessment data or review pending requests?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  // Helper to format rich Markdown & clean multi-row tables
  const formatMarkdownText = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentTableRows: string[][] = [];
    let tableHeaders: string[] = [];
    let inTable = false;

    const flushTable = (keyPrefix: number) => {
      if (tableHeaders.length > 0 || currentTableRows.length > 0) {
        elements.push(
          <div key={`tbl_${keyPrefix}`} className="my-2 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
            <table className="w-full text-left text-xs font-mono">
              {tableHeaders.length > 0 && (
                <thead className="bg-slate-900 text-indigo-300 border-b border-slate-800">
                  <tr>
                    {tableHeaders.map((th, hIdx) => (
                      <th key={hIdx} className="px-3 py-2 font-bold whitespace-nowrap">
                        {th.trim().replace(/\*\*/g, '')}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {currentTableRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-900/40">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-1.5 whitespace-nowrap">
                        {cell.trim().replace(/\*\*(.*?)\*\*/g, '$1')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableHeaders = [];
        currentTableRows = [];
        inTable = false;
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const cells = trimmed.split('|').filter((_, cIdx, arr) => cIdx > 0 && cIdx < arr.length - 1);
        const isSeparator = trimmed.includes('---');
        if (isSeparator) {
          return;
        }
        if (!inTable) {
          inTable = true;
          tableHeaders = cells;
        } else {
          currentTableRows.push(cells);
        }
        return;
      } else if (inTable) {
        flushTable(idx);
      }

      if (trimmed.startsWith('### ')) {
        elements.push(
          <h4 key={idx} className="font-bold text-indigo-400 text-xs mt-3 uppercase tracking-wider">
            {trimmed.replace('### ', '')}
          </h4>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h3 key={idx} className="font-bold text-slate-100 text-sm mt-3">
            {trimmed.replace('## ', '')}
          </h3>
        );
      } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const item = trimmed.substring(2);
        elements.push(
          <div key={idx} className="flex items-start gap-1.5 pl-1 my-0.5">
            <span className="text-indigo-400 mt-0.5 font-bold">•</span>
            <span className="text-slate-200">{item.replace(/\*\*(.*?)\*\*/g, '$1')}</span>
          </div>
        );
      } else if (/^\d+\.\s/.test(trimmed)) {
        elements.push(
          <div key={idx} className="pl-1 text-slate-200 my-0.5">
            {trimmed.replace(/\*\*(.*?)\*\*/g, '$1')}
          </div>
        );
      } else if (!trimmed) {
        elements.push(<div key={idx} className="h-1" />);
      } else {
        elements.push(
          <p key={idx} className="text-slate-200 leading-relaxed my-1">
            {trimmed.replace(/\*\*(.*?)\*\*/g, '$1')}
          </p>
        );
      }
    });

    if (inTable) {
      flushTable(lines.length);
    }

    return <div className="space-y-1 leading-relaxed text-xs">{elements}</div>;
  };

  // If role is unauthorized, do not render floating widget at all
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 font-sans">
      {/* Floating Trigger Button (when closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white rounded-2xl shadow-2xl shadow-indigo-600/40 border border-indigo-400/30 transition-all transform hover:scale-105 active:scale-95 animate-bounce [animation-duration:3s]"
        >
          {/* Pulsing indicator ring */}
          <span className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
          </span>

          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin [animation-duration:8s]" />
            <div className="text-left">
              <p className="text-xs font-bold leading-tight">
                {activeRole === 'HoD' ? 'HoD AI Copilot' : 'Admin AI Copilot'}
              </p>
            </div>
          </div>
        </button>
      )}

      {/* Expanded Chatbot Drawer / Window */}
      {isOpen && (
        <div className="w-[460px] h-[650px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-4rem)] bg-slate-950/95 backdrop-blur-2xl border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header Bar */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 flex items-center justify-center font-bold text-xs shadow-inner">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-100">
                  {activeRole === 'HoD' ? 'HoD AI Copilot' : 'Admin AI Copilot'}
                </h3>
                {/* Connection Status Badge */}
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${connectionStatus === 'connected'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : connectionStatus === 'connecting'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected'
                      ? 'bg-emerald-400 animate-pulse'
                      : connectionStatus === 'connecting'
                        ? 'bg-amber-400 animate-ping'
                        : 'bg-rose-400'
                      }`}
                  />
                  {connectionStatus === 'connected' ? 'Live' : connectionStatus}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                title="Clear conversation"
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Stats Banner */}
          {quickSummary && (
            <div className="grid grid-cols-3 gap-1 px-3 py-2 bg-slate-900/60 border-b border-slate-800/80 text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5 bg-slate-950/40 p-1.5 rounded border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="truncate">Active: <strong className="text-slate-200">{quickSummary.active_in_progress_exams}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/40 p-1.5 rounded border border-slate-800">
                <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">Pending: <strong className="text-amber-300">{quickSummary.pending_approvals}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/40 p-1.5 rounded border border-slate-800">
                <TrendingUp className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="truncate">Graded: <strong className="text-cyan-300">{quickSummary.evaluated_attempts}</strong></span>
              </div>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => {
              const isUser = m.sender === 'user';

              return (
                <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 px-1">
                    <span>{isUser ? user?.full_name || 'You' : 'AI Live Agent'}</span>
                    <span>•</span>
                    <span>{m.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[92%] p-3.5 rounded-2xl text-xs leading-relaxed font-sans shadow-md ${isUser
                      ? 'bg-indigo-600 text-white rounded-br-xs shadow-indigo-600/10'
                      : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-xs'
                      }`}
                  >
                    {isUser ? m.text : formatMarkdownText(m.text)}

                    {/* Blinking streaming cursor indicator */}
                    {m.isStreaming && (
                      <span className="inline-block w-1.5 h-3 ml-1 bg-indigo-400 animate-pulse align-middle" />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Thinking / Streaming Indicator */}
            {isLoading && !messages.some((m) => m.isStreaming) && (
              <div className="flex items-start gap-2">
                <div className="bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-2xl text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-slate-400 pl-1 font-medium">
                    Live agent streaming...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips Carousel */}
          <div className="px-3 py-2 border-t border-slate-800/60 bg-slate-900/40 overflow-x-auto flex items-center gap-1.5 text-[11px] no-scrollbar">
            {QUICK_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip.query)}
                className="px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-slate-100 border border-slate-700/60 whitespace-nowrap transition-all shrink-0 active:scale-95"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input Box Bar */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                connectionStatus === 'connected'
                  ? 'Ask any question about active screen, live exams, or analytics...'
                  : 'Reconnecting to Live WebSocket...'
              }
              disabled={connectionStatus === 'connecting'}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading || connectionStatus !== 'connected'}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center justify-center transition-all shadow-md shadow-indigo-600/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
