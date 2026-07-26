import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Question } from '../../types';
import { HelpCircle, Filter, Plus, Copy, Search, Tag, Eye, Layers } from 'lucide-react';

export const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState('');
  const [bloomFilter, setBloomFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewQ, setPreviewQ] = useState<Question | null>(null);

  // New Question form state
  const [qText, setQText] = useState('');
  const [qCourseId, setQCourseId] = useState(1);
  const [qUnit, setQUnit] = useState(1);
  const [qMarks, setQMarks] = useState(2.0);
  const [qDifficulty, setQDifficulty] = useState('Medium');
  const [qBloom, setQBloom] = useState('Understand');
  const [qType, setQType] = useState('Multiple Choice');
  const [qSolution, setQSolution] = useState('');
  const [options, setOptions] = useState([
    { option_text: '', is_correct: true },
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false }
  ]);

  useEffect(() => {
    fetchQuestions();
  }, [bloomFilter, difficultyFilter, unitFilter]);

  const fetchQuestions = () => {
    let url = '/questions?';
    if (bloomFilter) url += `bloom_level=${bloomFilter}&`;
    if (difficultyFilter) url += `difficulty=${difficultyFilter}&`;
    if (unitFilter) url += `unit=${unitFilter}&`;
    if (search) url += `search=${search}&`;

    apiClient.get(url).then(res => setQuestions(res.data));
  };

  const handleDuplicate = async (id: number) => {
    await apiClient.post(`/questions/${id}/duplicate`);
    fetchQuestions();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiClient.post('/questions', {
      question_text: qText,
      course_id: Number(qCourseId),
      unit: Number(qUnit),
      marks: Number(qMarks),
      difficulty: qDifficulty,
      bloom_level: qBloom,
      question_type: qType,
      solution_answer: qSolution,
      options: qType === 'Multiple Choice' ? options : []
    });
    setShowCreateModal(false);
    setQText('');
    fetchQuestions();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Centralized Question Bank</h2>
          <p className="text-xs text-slate-500">Manage Item Bank, Tag Bloom's Taxonomy Levels, Course Outcomes (COs) & Difficulty Distributions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Question</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search questions by text or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchQuestions()}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={bloomFilter}
          onChange={(e) => setBloomFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 text-slate-700 rounded-lg px-3 py-2 text-xs font-medium"
        >
          <option value="">All Bloom Levels</option>
          <option value="Remember">Remember</option>
          <option value="Understand">Understand</option>
          <option value="Apply">Apply</option>
          <option value="Analyze">Analyze</option>
          <option value="Evaluate">Evaluate</option>
          <option value="Create">Create</option>
        </select>

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 text-slate-700 rounded-lg px-3 py-2 text-xs font-medium"
        >
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        <select
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 text-slate-700 rounded-lg px-3 py-2 text-xs font-medium"
        >
          <option value="">All Units</option>
          <option value="1">Unit I</option>
          <option value="2">Unit II</option>
          <option value="3">Unit III</option>
          <option value="4">Unit IV</option>
          <option value="5">Unit V</option>
        </select>

        <button onClick={fetchQuestions} className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg text-xs">
          Filter
        </button>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded border border-blue-200">
                    {q.course_code}
                  </span>
                  <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded border border-slate-200">
                    Unit {q.unit}
                  </span>
                  <span className="bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded border border-purple-200">
                    Bloom: {q.bloom_level}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                    {q.co_code}
                  </span>
                  <span className="bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-200">
                    Difficulty: {q.difficulty}
                  </span>
                  <span className="bg-slate-800 text-white font-bold px-2 py-0.5 rounded">
                    {q.marks} Marks
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 leading-relaxed">{q.question_text}</h3>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => setPreviewQ(q)}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                  title="Preview Question"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDuplicate(q.id)}
                  className="p-2 text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded-lg transition"
                  title="Duplicate Question"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewQ && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Question Preview</h3>
            <p className="text-sm font-semibold text-slate-800">{previewQ.question_text}</p>
            {previewQ.options.length > 0 && (
              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-bold text-slate-500 uppercase">Options:</p>
                {previewQ.options.map((opt, i) => (
                  <div key={i} className={`p-2.5 rounded-lg border text-xs ${opt.is_correct ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    {opt.option_text} {opt.is_correct && '✓ (Correct Answer)'}
                  </div>
                ))}
              </div>
            )}
            <div className="text-right pt-4">
              <button onClick={() => setPreviewQ(null)} className="bg-slate-800 text-white text-xs px-4 py-2 rounded-lg font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Create New Item Bank Question</h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Question Text</label>
                <textarea
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Number</label>
                  <input type="number" value={qUnit} onChange={(e) => setQUnit(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2" min={1} max={5} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Marks</label>
                  <input type="number" value={qMarks} onChange={(e) => setQMarks(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2" step={0.5} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bloom Level</label>
                  <select value={qBloom} onChange={(e) => setQBloom(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2">
                    <option value="Remember">Remember</option>
                    <option value="Understand">Understand</option>
                    <option value="Apply">Apply</option>
                    <option value="Analyze">Analyze</option>
                    <option value="Evaluate">Evaluate</option>
                    <option value="Create">Create</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Difficulty</label>
                  <select value={qDifficulty} onChange={(e) => setQDifficulty(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Question Type</label>
                  <select value={qType} onChange={(e) => setQType(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2">
                    <option value="Multiple Choice">Multiple Choice</option>
                    <option value="Descriptive">Descriptive</option>
                    <option value="True/False">True/False</option>
                  </select>
                </div>
              </div>

              {qType === 'Multiple Choice' && (
                <div className="space-y-2 border-t pt-3">
                  <label className="block font-bold text-slate-800">MCQ Options (Select Radio for Correct)</label>
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="correct_opt"
                        checked={opt.is_correct}
                        onChange={() => setOptions(options.map((o, idx) => ({ ...o, is_correct: idx === i })))}
                      />
                      <input
                        type="text"
                        placeholder={`Option ${i+1}`}
                        value={opt.option_text}
                        onChange={(e) => {
                          const copy = [...options];
                          copy[i].option_text = e.target.value;
                          setOptions(copy);
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg">Save Question</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
