import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { QuestionPaper } from '../../types';
import { FileText, Cpu, CheckCircle2, AlertTriangle, Send, Eye, ShieldCheck, Plus, CheckSquare, Square, Layers, BookOpen } from 'lucide-react';

export const QuestionPaperBuilder: React.FC = () => {
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);
  const [showAutoModal, setShowAutoModal] = useState(false);

  // Creation Mode State
  const [creationMode, setCreationMode] = useState<'AI' | 'MANUAL'>('MANUAL');

  // Common Paper Meta State
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState(1);
  const [maxMarks, setMaxMarks] = useState(50.0);
  const [duration, setDuration] = useState(90);

  // AI Rule State
  const [unit1Count, setUnit1Count] = useState(5);
  const [unit2Count, setUnit2Count] = useState(5);

  // Manual Mode State
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [selectedQIds, setSelectedQIds] = useState<number[]>([]);
  const [showAddSpotQuestion, setShowAddSpotQuestion] = useState(false);

  // On-the-Spot New Question Form State
  const [newQText, setNewQText] = useState('');
  const [newOptA, setNewOptA] = useState('');
  const [newOptB, setNewOptB] = useState('');
  const [newOptC, setNewOptC] = useState('');
  const [newOptD, setNewOptD] = useState('');
  const [newCorrectOpt, setNewCorrectOpt] = useState('A');
  const [newUnit, setNewUnit] = useState(1);
  const [newMarks, setNewMarks] = useState(2.0);
  const [newBloom, setNewBloom] = useState('Understand');
  const [newCO, setNewCO] = useState(1);

  useEffect(() => {
    fetchPapers();
  }, []);

  useEffect(() => {
    if (showAutoModal && courseId) {
      fetchBankQuestions(courseId);
    }
  }, [courseId, showAutoModal]);

  const fetchPapers = () => {
    apiClient.get('/question-papers').then(res => {
      setPapers(res.data);
      if (res.data && res.data.length > 0 && !selectedPaper) {
        loadPaperDetail(res.data[0].id);
      }
    });
  };

  const fetchBankQuestions = (cId: number) => {
    apiClient.get(`/questions?course_id=${cId}`).then(res => {
      setBankQuestions(res.data || []);
    });
  };

  const toggleSelectQuestion = (qId: number) => {
    setSelectedQIds(prev =>
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    );
  };

  const handleCreateOnTheSpotQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim()) return;

    try {
      const res = await apiClient.post('/questions', {
        question_text: newQText,
        course_id: Number(courseId),
        unit: Number(newUnit),
        marks: Number(newMarks),
        difficulty: 'Medium',
        bloom_level: newBloom,
        question_type: 'MCQ',
        co_id: Number(newCO),
        options: [
          { option_text: newOptA || 'Option A', is_correct: newCorrectOpt === 'A' },
          { option_text: newOptB || 'Option B', is_correct: newCorrectOpt === 'B' },
          { option_text: newOptC || 'Option C', is_correct: newCorrectOpt === 'C' },
          { option_text: newOptD || 'Option D', is_correct: newCorrectOpt === 'D' }
        ]
      });

      const createdQ = res.data;
      // Refresh Question Bank list & auto-select the newly added question
      fetchBankQuestions(courseId);
      if (createdQ && createdQ.id) {
        setSelectedQIds(prev => [...prev, createdQ.id]);
      }

      // Reset inline form
      setNewQText('');
      setNewOptA('');
      setNewOptB('');
      setNewOptC('');
      setNewOptD('');
      setShowAddSpotQuestion(false);
    } catch (err) {
      console.error('Failed to create on-the-spot question:', err);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creationMode === 'AI') {
      await apiClient.post('/question-papers/generate', {
        course_id: Number(courseId),
        title: title || 'Internal Assessment Test 1 — Generated',
        max_marks: Number(maxMarks),
        duration_minutes: Number(duration),
        unit_distribution: { 1: Number(unit1Count), 2: Number(unit2Count) }
      });
    } else {
      if (selectedQIds.length === 0) {
        alert('Please select at least 1 question from the bank to create a manual paper.');
        return;
      }
      await apiClient.post('/question-papers/manual-create', {
        course_id: Number(courseId),
        title: title || 'Manual Question Paper',
        max_marks: Number(maxMarks),
        duration_minutes: Number(duration),
        question_ids: selectedQIds
      });
    }
    setShowAutoModal(false);
    setSelectedQIds([]);
    fetchPapers();
  };

  const loadPaperDetail = async (id: number) => {
    const res = await apiClient.get(`/question-papers/${id}`);
    setSelectedPaper(res.data);
  };

  const handleWorkflowAction = async (id: number, action: string) => {
    await apiClient.post(`/question-papers/${id}/action?action=${action}`);
    loadPaperDetail(id);
    fetchPapers();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Question Paper Builder & Blueprint Generator</h2>
          <p className="text-xs text-slate-500">Manual Mapping & AI Rule-Based Blueprint Generator (Draft ➔ Review ➔ Approved ➔ Published)</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setCreationMode('MANUAL');
              setShowAutoModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Question Paper</span>
          </button>
          <button
            onClick={() => {
              setCreationMode('AI');
              setShowAutoModal(true);
            }}
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition flex items-center space-x-2"
          >
            <Cpu className="w-4 h-4" />
            <span>Rule-Based Auto Generator</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Paper List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Question Papers Registry</h3>
            <button
              onClick={() => {
                setCreationMode('MANUAL');
                setShowAutoModal(true);
              }}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Paper</span>
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {papers.map((p) => (
              <div
                key={p.id}
                onClick={() => loadPaperDetail(p.id)}
                className={`p-3 rounded-lg cursor-pointer transition ${selectedPaper?.id === p.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'}`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs text-slate-900">{p.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    p.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                    p.status === 'Submitted' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                  <span>{p.course_code}</span>
                  <span>{p.max_marks} Marks ({p.duration_minutes}m)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Paper Detail & Blueprint Visualizer */}
        <div className="lg:col-span-2 space-y-4">
          {selectedPaper ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedPaper.title}</h3>
                  <p className="text-xs text-slate-500">{selectedPaper.course_code} — {selectedPaper.course_title}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedPaper.status === 'Submitted' && (
                    <button
                      onClick={() => handleWorkflowAction(selectedPaper.id, 'Approve')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Paper</span>
                    </button>
                  )}
                  {selectedPaper.status === 'Approved' && (
                    <button
                      onClick={() => handleWorkflowAction(selectedPaper.id, 'Publish')}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold"
                    >
                      Publish Paper
                    </button>
                  )}
                </div>
              </div>

              {/* Blueprint Summary Cards */}
              {selectedPaper.blueprint && (
                <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500">Total Questions:</span>
                    <p className="font-bold text-slate-900 text-sm">{selectedPaper.blueprint.total_questions}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Unit Distribution:</span>
                    <p className="font-bold text-blue-700">Unit I: {selectedPaper.blueprint.unit_distribution['1'] || 0}, Unit II: {selectedPaper.blueprint.unit_distribution['2'] || 0}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Cognitive Breakdown:</span>
                    <p className="font-bold text-purple-700">Remember: {selectedPaper.blueprint.bloom_distribution['Remember'] || 0}, Apply: {selectedPaper.blueprint.bloom_distribution['Apply'] || 0}</p>
                  </div>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Question Paper Layout</h4>
                {selectedPaper.questions.map((q: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between font-semibold text-slate-500 text-[11px]">
                      <span>{q.section} — Q{q.order} ({q.marks} Marks)</span>
                      <span className="text-purple-700">Bloom: {q.bloom_level} | CO: {q.co_code}</span>
                    </div>
                    <p className="font-medium text-slate-900">{q.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              Select a question paper from the registry on the left to preview its blueprint and approval state.
            </div>
          )}
        </div>
      </div>

      {/* Question Paper Generator & Creator Modal (AI vs MANUAL Toggle) */}
      {showAutoModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-xs my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Question Paper Builder & Blueprint Generator</span>
              </h3>
              <button onClick={() => setShowAutoModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm px-2">✕</button>
            </div>

            {/* Mode Switcher Toggle Tabs */}
            <div className="bg-slate-100 p-1 rounded-xl flex space-x-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setCreationMode('MANUAL')}
                className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center space-x-2 transition ${
                  creationMode === 'MANUAL'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Manual Question Mapping</span>
              </button>
              <button
                type="button"
                onClick={() => setCreationMode('AI')}
                className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center space-x-2 transition ${
                  creationMode === 'AI'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>AI / Rule-Based Auto Blueprint</span>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Paper Metadata Inputs */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Paper Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. End Semester Model Exam — Data Structures"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Course</label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value={1}>23BCA401 — Data Structures</option>
                    <option value={2}>23BCA402 — Java Programming</option>
                    <option value={3}>23BCA403 — Operating Systems</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Marks & Duration</label>
                  <select
                    value={maxMarks}
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      setMaxMarks(m);
                      setDuration(m === 100 ? 180 : 90);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value={50}>50 Marks (90 mins)</option>
                    <option value={100}>100 Marks (180 mins)</option>
                  </select>
                </div>
              </div>

              {/* Mode 1: AI Rule-Based View */}
              {creationMode === 'AI' && (
                <div className="space-y-3 border-t pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Unit 1 Target Qs</label>
                      <input type="number" value={unit1Count} onChange={(e) => setUnit1Count(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium" min={1} />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Unit 2 Target Qs</label>
                      <input type="number" value={unit2Count} onChange={(e) => setUnit2Count(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium" min={1} />
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50 border border-purple-200 text-purple-900 rounded-lg text-[11px] space-y-1">
                    <div className="font-bold flex items-center space-x-1">
                      <Cpu className="w-3.5 h-3.5 text-purple-600" />
                      <span>Outcome-Based Education (OBE) Blueprint Engine</span>
                    </div>
                    <p className="text-[10px] text-purple-800">
                      Algorithm automatically selects balanced questions from the Question Bank across Bloom's Taxonomy levels (*Remember, Understand, Apply, Analyze*) and Course Outcomes (*CO1-CO5*).
                    </p>
                  </div>
                </div>
              )}

              {/* Mode 2: Manual Question Mapping View */}
              {creationMode === 'MANUAL' && (
                <div className="space-y-4 border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                      Map Questions from Question Bank ({selectedQIds.length} Selected)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddSpotQuestion(!showAddSpotQuestion)}
                      className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-lg flex items-center space-x-1 shadow-sm transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showAddSpotQuestion ? 'Close Add Form' : 'Add Question On-the-Spot'}</span>
                    </button>
                  </div>

                  {/* Inline On-the-Spot New Question Creation Form */}
                  {showAddSpotQuestion && (
                    <div className="bg-emerald-950/5 border border-emerald-300 p-4 rounded-xl space-y-3 text-xs">
                      <h4 className="font-bold text-emerald-900 flex items-center space-x-1">
                        <Plus className="w-4 h-4 text-emerald-600" />
                        <span>Add New Question Direct to Question Bank</span>
                      </h4>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Question Text</label>
                        <textarea
                          rows={2}
                          value={newQText}
                          onChange={(e) => setNewQText(e.target.value)}
                          placeholder="Enter your question statement here..."
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Option A" value={newOptA} onChange={(e) => setNewOptA(e.target.value)} className="bg-white border p-1.5 rounded" />
                        <input type="text" placeholder="Option B" value={newOptB} onChange={(e) => setNewOptB(e.target.value)} className="bg-white border p-1.5 rounded" />
                        <input type="text" placeholder="Option C" value={newOptC} onChange={(e) => setNewOptC(e.target.value)} className="bg-white border p-1.5 rounded" />
                        <input type="text" placeholder="Option D" value={newOptD} onChange={(e) => setNewOptD(e.target.value)} className="bg-white border p-1.5 rounded" />
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600">Correct Option</label>
                          <select value={newCorrectOpt} onChange={(e) => setNewCorrectOpt(e.target.value)} className="w-full bg-white border p-1 rounded">
                            <option value="A">Option A</option>
                            <option value="B">Option B</option>
                            <option value="C">Option C</option>
                            <option value="D">Option D</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600">Unit</label>
                          <input type="number" value={newUnit} onChange={(e) => setNewUnit(Number(e.target.value))} className="w-full bg-white border p-1 rounded" min={1} max={5} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600">Marks</label>
                          <input type="number" value={newMarks} onChange={(e) => setNewMarks(Number(e.target.value))} className="w-full bg-white border p-1 rounded" min={1} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600">Bloom Level</label>
                          <select value={newBloom} onChange={(e) => setNewBloom(e.target.value)} className="w-full bg-white border p-1 rounded">
                            <option value="Remember">Remember</option>
                            <option value="Understand">Understand</option>
                            <option value="Apply">Apply</option>
                            <option value="Analyze">Analyze</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleCreateOnTheSpotQuestion}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm"
                      >
                        Save Question to Bank & Attach to Paper
                      </button>
                    </div>
                  )}

                  {/* Question Bank Selection List */}
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 border rounded-xl p-2 bg-slate-50">
                    {bankQuestions.length > 0 ? (
                      bankQuestions.map((q: any) => {
                        const isSelected = selectedQIds.includes(q.id);
                        return (
                          <div
                            key={q.id}
                            onClick={() => toggleSelectQuestion(q.id)}
                            className={`p-2.5 rounded-lg border cursor-pointer transition flex items-start space-x-3 ${
                              isSelected
                                ? 'bg-blue-50/90 border-blue-400 shadow-sm'
                                : 'bg-white border-slate-200 hover:bg-slate-100/60'
                            }`}
                          >
                            <div className="mt-0.5 text-blue-600">
                              {isSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-300" />}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-slate-500">Unit {q.unit} • {q.marks} Marks</span>
                                <span className="font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                  {q.bloom_level} | {q.co_code}
                                </span>
                              </div>
                              <p className="font-semibold text-slate-900 text-xs">{q.question_text}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center text-slate-400">
                        No questions found in Question Bank for this course. Click "+ Add Question On-the-Spot" above to add new questions.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-3 border-t">
                <button type="button" onClick={() => setShowAutoModal(false)} className="px-4 py-2 border rounded-lg text-slate-600 font-semibold">Cancel</button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white font-bold rounded-lg shadow-md transition flex items-center space-x-1 ${
                    creationMode === 'AI' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>{creationMode === 'AI' ? 'Generate & Build Paper' : `Create Manual Paper (${selectedQIds.length} Qs)`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
