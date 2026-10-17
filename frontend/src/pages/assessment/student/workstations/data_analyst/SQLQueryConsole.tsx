import React, { useState, useEffect } from 'react';
import { StartAttemptResponse, CandidateResult } from '../../../../../types/assessment';
import { TimerHeader } from '../../../../../components/assessment/TimerHeader';
import { AssessmentCodeEditor } from '../../../../../components/assessment/AssessmentCodeEditor';
import apiClient from '../../../../../api/client';
import { Database, Play, Table } from 'lucide-react';
import { notify, confirmDialog } from '../../../../../components/ui/Dialogs';

interface WorkstationProps {
  attemptData: StartAttemptResponse;
  onSubmitComplete: (res: CandidateResult) => void;
}

export const SQLQueryConsole: React.FC<WorkstationProps> = ({ attemptData, onSubmitComplete }) => {
  const questions = attemptData.questions || [];
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const currentQ = questions[currentQIndex];

  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM orders LIMIT 10;');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const debounceTimerRef = React.useRef<any>(null);

  useEffect(() => {
    if (currentQ) {
      const saved = attemptData.saved_answers?.[currentQ.id] || attemptData.saved_answers?.[String(currentQ.id)];
      if (saved) {
        setSqlQuery(saved);
      } else {
        setSqlQuery('SELECT * FROM orders LIMIT 10;');
      }
      setQueryResult(null);
    }
  }, [currentQIndex, attemptData]);

  const handleSQLChange = (newSQL: string) => {
    setSqlQuery(newSQL);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(async () => {
      if (!currentQ) return;
      try {
        await apiClient.post('/assessment/attempts/save-response', {
          attempt_id: attemptData.attempt_id,
          question_id: currentQ.id,
          response_payload: newSQL
        });
      } catch (err) {
        console.error('Failed to debounced autosave SQL query', err);
      }
    }, 800);
  };

  const handleRunSQL = async () => {
    if (!currentQ) return;
    setIsRunning(true);
    setQueryResult(null);
    try {
      const res = await apiClient.post('/assessment/coding/run-sql', {
        question_id: currentQ.id,
        sql_query: sqlQuery
      });
      setQueryResult(res.data);

      await apiClient.post('/assessment/attempts/save-response', {
        attempt_id: attemptData.attempt_id,
        question_id: currentQ.id,
        response_payload: sqlQuery
      });
    } catch (err: any) {
      console.error('SQL run failed', err);
      setQueryResult({
        status: 'Error',
        error: err.response?.data?.detail || 'Failed to execute query.'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const performSubmit = async (isManual = false) => {
    if (isManual) {
      if (!(await confirmDialog('Are you sure you want to submit your SQL assessment? Your queries will be evaluated.'))) {
        return;
      }
    }
    setIsSubmitting(true);
    try {
      if (currentQ) {
        await apiClient.post('/assessment/attempts/save-response', {
          attempt_id: attemptData.attempt_id,
          question_id: currentQ.id,
          response_payload: sqlQuery
        });
      }
      const res = await apiClient.post('/assessment/attempts/submit', {
        attempt_id: attemptData.attempt_id
      });
      onSubmitComplete(res.data);
    } catch (err: any) {
      console.error('Failed to submit SQL round', err);
      if (isManual) {
        notify(err.response?.data?.detail || 'Failed to submit round.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-[#F6F8FA] text-[#0F172A] font-sans">
      <TimerHeader
        attemptData={attemptData}
        onSubmit={() => performSubmit(true)}
        isSubmitting={isSubmitting}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Problem & Schema Inspector */}
        <div className="lg:col-span-5 flex flex-col space-y-4 max-h-[82vh] overflow-y-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
              <span className="text-xs font-mono font-bold bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/20 px-2.5 py-0.5 rounded-md">
                SQL Challenge {currentQIndex + 1} of {questions.length}
              </span>

              {questions.length > 1 && (
                <div className="flex space-x-1">
                  {questions.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentQIndex(idx)}
                      className={`w-6 h-6 rounded-md text-xs font-mono border cursor-pointer ${
                        idx === currentQIndex
                          ? 'bg-[#FF5500] text-white font-bold border-[#FF5500]'
                          : 'bg-[#F0F3F6] text-[#64748B] border-[#E2E8F0] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <h2 className="text-sm font-bold text-[#0F172A]">{currentQ?.title}</h2>
            <div className="text-xs text-[#475569] whitespace-pre-wrap leading-relaxed bg-[#F0F3F6] p-3.5 rounded-xl border border-[#E2E8F0] font-mono">
              {currentQ?.content}
            </div>
          </div>

          {/* Database Schema Inspector */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 border-b border-[#E2E8F0] pb-2">
              <Database className="w-4 h-4 text-[#FF5500]" />
              <span className="text-xs font-bold text-[#0F172A]">Database Tables & Schema</span>
            </div>

            <div className="space-y-2 text-[11px] font-mono">
              <div className="p-2 bg-[#F0F3F6] rounded-lg border border-[#E2E8F0] text-[#475569]">
                <span className="text-[#FF5500] font-bold">customers</span>: (customer_id, name, country, signup_date)
              </div>
              <div className="p-2 bg-[#F0F3F6] rounded-lg border border-[#E2E8F0] text-[#475569]">
                <span className="text-[#FF5500] font-bold">products</span>: (product_id, product_name, category, price)
              </div>
              <div className="p-2 bg-[#F0F3F6] rounded-lg border border-[#E2E8F0] text-[#475569]">
                <span className="text-[#FF5500] font-bold">orders</span>: (order_id, customer_id, product_id, order_date, quantity, total_amount)
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: SQL Editor & Result Grid */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
              <div className="flex items-center space-x-2">
                <Table className="w-4 h-4 text-[#FF5500]" />
                <span className="text-xs font-bold text-[#0F172A]">SQL Query Console</span>
              </div>

              <button
                onClick={handleRunSQL}
                disabled={isRunning}
                className="px-3.5 py-1.5 bg-[#FF5500] hover:bg-[#E64D00] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isRunning ? 'Executing SQL...' : 'Run Query'}</span>
              </button>
            </div>

            <AssessmentCodeEditor
              language="sql"
              value={sqlQuery}
              onChange={handleSQLChange}
              onRun={handleRunSQL}
              isReadOnly={isRunning || isSubmitting}
              compilerErrors={queryResult?.error ? queryResult.error : null}
              height="220px"
            />
          </div>

          {/* Results Table & Console */}
          {queryResult && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm space-y-3 flex-1 overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                <span className="text-xs font-bold text-[#0F172A]">Query Output & Diagnostics</span>
                <span className="text-[10px] font-mono text-[#64748B] bg-[#F0F3F6] px-2 py-0.5 rounded border border-[#E2E8F0]">
                  {queryResult.execution_time_ms || 0} ms • {queryResult.status || 'Executed'}
                </span>
              </div>

              {queryResult.error || queryResult.stderr ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                  {queryResult.error || queryResult.stderr}
                </div>
              ) : queryResult.stdout ? (
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200 font-mono text-xs text-emerald-800 max-h-56 overflow-y-auto whitespace-pre-wrap">
                  {queryResult.stdout}
                </div>
              ) : (
                <div className="p-3 bg-[#F0F3F6] rounded-xl border border-[#E2E8F0] text-xs font-mono text-[#64748B]">
                  Query executed successfully with no returned rows.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
