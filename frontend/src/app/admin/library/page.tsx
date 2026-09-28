'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Filter,
  Code,
  Sparkles,
  BookOpen,
  ChevronRight,
  Database,
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Layers,
  Edit2,
  Eye,
  RefreshCw,
  FolderPlus,
  ShieldCheck
} from 'lucide-react';

interface QuestionItem {
  id: string;
  title: string;
  topic_id?: string;
  topic?: { name: string };
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  marks: number;
  question_type: string; // SQL_TECHNICAL, PYTHON_TECHNICAL, MCQ
  code_language?: string;
  database_engine?: string;
  business_scenario?: string;
  problem_statement: string;
  task_description?: string;
  schema_ddl?: string;
  tables_schema_json?: any[];
  output_columns_json?: any[];
  example_input_json?: any;
  example_output_json?: any;
  example_explanation?: string;
  constraints?: string;
  tags_json?: string[];
  test_cases?: any[];
  mcq_options_json?: any[];
  correct_answer?: string;
  explanation?: string;
  function_signature?: string;
  library_source?: string;
  uniqueness_score?: number;
  created_at?: string;
}

interface AssessmentItem {
  id: string;
  title: string;
  duration_minutes: number;
  job_role: string;
}

// SQL curriculum topics per user specification
const SQL_TOPICS_LIST = [
  'All SQL Topics',
  'SQL Basics',
  'SELECT & Filtering',
  'Joins',
  'GROUP BY & HAVING',
  'Subqueries',
  'CTEs',
  'Window Functions',
  'Aggregations',
  'Date & Time Functions',
  'String Functions',
  'CASE Statements',
  'Set Operations',
  'Indexes',
  'Query Optimization',
  'Advanced SQL'
];

// Python curriculum topics per user specification
const PYTHON_TOPICS_LIST = [
  'All Python Topics',
  'Python Basics',
  'Variables & Data Types',
  'Lists & Tuples',
  'Dictionaries & Sets',
  'Functions',
  'Object-Oriented Programming',
  'Exception Handling',
  'File Handling',
  'Iterators & Generators',
  'Decorators',
  'Modules & Packages',
  'List Comprehensions',
  'Data Structures',
  'Algorithms',
  'Pandas',
  'NumPy',
  'Python for Data Engineering'
];

export default function LibraryPage() {
  // Sidebar Library Selection (Question Library vs My Library)
  const [selectedLibrary, setSelectedLibrary] = useState<'Question Library' | 'My Library'>('Question Library');

  // Sidebar Filters (Requirements 2 & 3)
  const [selectedLanguage, setSelectedLanguage] = useState<'ALL' | 'SQL' | 'Python'>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>('ALL');
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Data state
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Question Details Modal
  const [viewQuestion, setViewQuestion] = useState<QuestionItem | null>(null);

  // Edit Question Modal
  const [editQuestion, setEditQuestion] = useState<QuestionItem | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Add to Assessment Modal
  const [questionToAssign, setQuestionToAssign] = useState<QuestionItem | null>(null);
  const [targetAssessmentId, setTargetAssessmentId] = useState('');
  const [addingToAssessment, setAddingToAssessment] = useState(false);
  const [assignToast, setAssignToast] = useState('');

  // AI Question Generator Simplified Modal (Requirements 4, 5, 6, 7, 8, 9, 10, 11, 12)
  const [showAiModal, setShowAiModal] = useState(false);
  const [genQType, setGenQType] = useState<'TECHNICAL' | 'MCQ' | 'BOTH'>('TECHNICAL');
  const [genLanguage, setGenLanguage] = useState<'SQL' | 'Python'>('SQL');
  const [genCount, setGenCount] = useState<number>(3);
  const [genDifficulty, setGenDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [genSuccessResult, setGenSuccessResult] = useState<any | null>(null);

  // Fetch Questions from Backend
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedLibrary) {
        params.append('library_source', selectedLibrary);
      }
      if (selectedLanguage !== 'ALL') {
        params.append('language', selectedLanguage.toLowerCase());
      }
      if (selectedDifficulty !== 'ALL') {
        params.append('difficulty', selectedDifficulty);
      }
      if (selectedQuestionType !== 'ALL') {
        params.append('question_type', selectedQuestionType);
      }
      if (selectedTopic !== 'ALL' && !selectedTopic.startsWith('All ')) {
        params.append('topic_name', selectedTopic);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/questions?${params.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (err) {
      console.error('Failed to fetch library questions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Assessments for Add to Assessment modal
  const fetchAssessments = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/assessments', { headers });
      if (res.ok) {
        const data = await res.json();
        setAssessments(data);
        if (data.length > 0) {
          setTargetAssessmentId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch assessments:', err);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedLibrary, selectedLanguage, selectedDifficulty, selectedQuestionType, selectedTopic]);

  useEffect(() => {
    fetchAssessments();
  }, []);

  // Duplicate Question to My Library
  const handleDuplicate = async (questionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/questions/${questionId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        setSelectedLibrary('My Library');
        fetchQuestions();
      }
    } catch (err) {
      console.error('Failed to duplicate question:', err);
    }
  };

  // Delete Question from My Library
  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchQuestions();
      }
    } catch (err) {
      console.error('Failed to delete question:', err);
    }
  };

  // Save Inline Question Edit
  const handleSaveQuestionEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editQuestion) return;
    setSavingEdit(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/questions/${editQuestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editQuestion.title,
          business_scenario: editQuestion.business_scenario,
          problem_statement: editQuestion.problem_statement,
          task_description: editQuestion.task_description,
          difficulty: editQuestion.difficulty,
          marks: editQuestion.marks
        })
      });
      if (res.ok) {
        setEditQuestion(null);
        fetchQuestions();
      }
    } catch (err) {
      console.error('Failed to update question:', err);
    } finally {
      setSavingEdit(false);
    }
  };

  // Confirm Add Question to Assessment
  const handleConfirmAddToAssessment = async () => {
    if (!questionToAssign || !targetAssessmentId) return;
    setAddingToAssessment(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `/api/questions/${questionToAssign.id}/add-to-assessment/${targetAssessmentId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (res.ok) {
        const data = await res.json();
        setAssignToast(data.detail || 'Question added to assessment successfully!');
        setQuestionToAssign(null);
        setTimeout(() => setAssignToast(''), 3500);
      }
    } catch (err) {
      console.error('Failed to link question to assessment:', err);
    } finally {
      setAddingToAssessment(false);
    }
  };

  // Simplified AI Question Generation Submission (Requirements 4, 11, 12)
  const handleGenerateQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenError('');
    setGenSuccessResult(null);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        question_type: genQType,
        language: genLanguage,
        question_count: genCount,
        difficulty: genDifficulty,
        target_library: selectedLibrary || 'Question Library'
      };

      const res = await fetch('/api/question-generation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Generation failed.');
      }

      const data = await res.json();
      setGenSuccessResult(data);
      // Refresh question list in background
      fetchQuestions();
    } catch (err: any) {
      setGenError(err.message || 'An error occurred during AI question generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Dynamic Topics based on selected language (Requirement 3)
  const currentTopicsList =
    selectedLanguage === 'SQL'
      ? SQL_TOPICS_LIST
      : selectedLanguage === 'Python'
      ? PYTHON_TOPICS_LIST
      : ['All Topics', ...SQL_TOPICS_LIST.slice(1), ...PYTHON_TOPICS_LIST.slice(1)];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* Toast Notification */}
      {assignToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-xl text-sm font-semibold animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-5 h-5" />
          <span>{assignToast}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="px-8 py-5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span>Question Library</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Browse pre-generated technical questions, filter across skills, or generate custom problem sets with automatic validation.
          </p>
        </div>

        {/* AI Question Generator Button */}
        <button
          onClick={() => {
            setShowAiModal(true);
            setGenSuccessResult(null);
            setGenError('');
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-purple-200" />
          <span>AI Question Generator</span>
        </button>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* LEFT FILTER SIDEBAR (Requirements 1, 2, 3) */}
        <aside className="w-72 bg-white border-r border-slate-200 p-6 overflow-y-auto space-y-6 shrink-0 text-xs text-slate-700">
          {/* 1. Libraries */}
          <div className="space-y-2">
            <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Libraries</div>
            <label className="flex items-center gap-2 font-semibold cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
              <input
                type="radio"
                name="libRadio"
                checked={selectedLibrary === 'Question Library'}
                onChange={() => setSelectedLibrary('Question Library')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>Question Library</span>
            </label>
            <label className="flex items-center gap-2 font-semibold cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
              <input
                type="radio"
                name="libRadio"
                checked={selectedLibrary === 'My Library'}
                onChange={() => setSelectedLibrary('My Library')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>My Library (Custom)</span>
            </label>
          </div>

          {/* 2. Language / Skill Section (Requirement 3) */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Language / Skill</div>
            {(['ALL', 'SQL', 'Python'] as const).map((lang) => (
              <label key={lang} className="flex items-center gap-2 font-medium cursor-pointer p-1 rounded hover:bg-slate-50">
                <input
                  type="radio"
                  name="langFilter"
                  checked={selectedLanguage === lang}
                  onChange={() => {
                    setSelectedLanguage(lang);
                    setSelectedTopic('ALL');
                  }}
                  className="text-blue-600"
                />
                <span className={selectedLanguage === lang ? 'font-bold text-blue-600' : ''}>
                  {lang === 'ALL' ? 'All Skills' : lang}
                </span>
              </label>
            ))}
          </div>

          {/* 3. Dynamic Topic Filter based on Selected Language (Requirement 3) */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center justify-between">
              <span>Topic</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {selectedLanguage === 'ALL' ? 'All' : selectedLanguage}
              </span>
            </div>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {currentTopicsList.map((top) => (
                <option key={top} value={top.startsWith('All ') ? 'ALL' : top}>
                  {top}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Difficulty Filter */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Difficulty</div>
            {['ALL', 'EASY', 'MEDIUM', 'HARD'].map((diff) => (
              <label key={diff} className="flex items-center gap-2 font-medium cursor-pointer p-1 rounded hover:bg-slate-50">
                <input
                  type="radio"
                  name="diffFilter"
                  checked={selectedDifficulty === diff}
                  onChange={() => setSelectedDifficulty(diff)}
                  className="text-blue-600"
                />
                <span className={selectedDifficulty === diff ? 'font-bold text-blue-600' : ''}>
                  {diff === 'ALL' ? 'All Difficulties' : diff}
                </span>
              </label>
            ))}
          </div>

          {/* 5. Question Type Filter */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Question Type</div>
            {[
              { id: 'ALL', label: 'All Types' },
              { id: 'SQL_TECHNICAL', label: 'SQL Coding' },
              { id: 'PYTHON_TECHNICAL', label: 'Python Coding' },
              { id: 'MCQ', label: 'Multiple Choice' }
            ].map((t) => (
              <label key={t.id} className="flex items-center gap-2 font-medium cursor-pointer p-1 rounded hover:bg-slate-50">
                <input
                  type="radio"
                  name="typeFilter"
                  checked={selectedQuestionType === t.id}
                  onChange={() => setSelectedQuestionType(t.id)}
                  className="text-blue-600"
                />
                <span className={selectedQuestionType === t.id ? 'font-bold text-blue-600' : ''}>
                  {t.label}
                </span>
              </label>
            ))}
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT PANEL: Search & Question Cards */}
        <main className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Search Header Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-bold text-slate-800">
              {selectedLibrary}{' '}
              <span className="text-xs text-slate-400 font-normal">
                ({questions.length} questions)
              </span>
            </div>

            <div className="relative w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchQuestions();
                }}
                placeholder="Search by title, topic, or tags..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Question List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-xs font-semibold">Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No questions found</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Try selecting a different filter or generate custom questions with the AI Question Generator.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all space-y-3"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-sm font-bold text-slate-900">{q.title}</h3>
                        {q.uniqueness_score && q.uniqueness_score >= 90 && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            {q.uniqueness_score}% Unique
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {q.business_scenario || q.problem_statement}
                      </p>
                    </div>

                    {/* Meta Badges */}
                    <div className="flex items-center gap-2 shrink-0">
                      {q.question_type === 'MCQ' ? (
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md uppercase">
                          MCQ
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] font-bold rounded-md">
                          {q.code_language?.toUpperCase() || 'SQL'}
                        </span>
                      )}

                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                          q.difficulty === 'EASY'
                            ? 'bg-emerald-50 text-emerald-700'
                            : q.difficulty === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {q.difficulty}
                      </span>

                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-md font-mono">
                        {q.marks} pts
                      </span>
                    </div>
                  </div>

                  {/* Card Footer Actions (Requirement 2: View, Edit, Duplicate, Add to assessment) */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      {q.topic?.name && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                          {q.topic.name}
                        </span>
                      )}
                      {q.library_source === 'My Library' && (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-bold border border-purple-200">
                          My Library
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewQuestion(q)}
                        className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-semibold px-2.5 py-1 rounded hover:bg-slate-50 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      <button
                        onClick={() => setEditQuestion(q)}
                        className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-semibold px-2.5 py-1 rounded hover:bg-slate-50 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDuplicate(q.id)}
                        className="flex items-center gap-1 text-slate-600 hover:text-purple-600 font-semibold px-2.5 py-1 rounded hover:bg-purple-50 cursor-pointer"
                        title="Duplicate into My Library"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Duplicate</span>
                      </button>

                      <button
                        onClick={() => setQuestionToAssign(q)}
                        className="flex items-center gap-1 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to assessment</span>
                      </button>

                      {selectedLibrary === 'My Library' && (
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          title="Delete question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ===================================================================== */}
      {/* 1. SIMPLIFIED AI QUESTION GENERATOR MODAL (Requirements 4 - 12)       */}
      {/* ===================================================================== */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">AI Question Generator</h3>
                  <p className="text-[11px] text-slate-500">
                    Generate unique technical questions with automatic topic distribution and scoring.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Error Message */}
            {genError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{genError}</span>
              </div>
            )}

            {/* SUCCESS VIEW (Requirement 12) */}
            {genSuccessResult ? (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl space-y-2 text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm">
                    Successfully Generated & Saved {genSuccessResult.generated_count || genCount} Questions!
                  </h4>
                  <p className="text-xs text-emerald-700">
                    All questions were validated for uniqueness, assigned difficulty-based marks, and saved to{' '}
                    <strong>{selectedLibrary}</strong>.
                  </p>
                </div>

                {genSuccessResult.questions && genSuccessResult.questions.length > 0 && (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {genSuccessResult.questions.map((q: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
                      >
                        <div className="font-bold text-slate-800 text-xs truncate max-w-sm">{q.title}</div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono font-bold rounded text-[10px]">
                            {q.marks} pts
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-mono font-bold rounded text-[10px]">
                            {q.difficulty}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setGenSuccessResult(null);
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    Generate More
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAiModal(false);
                      fetchQuestions();
                    }}
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold hover:opacity-95 cursor-pointer shadow-sm"
                  >
                    View in Library
                  </button>
                </div>
              </div>
            ) : (
              /* SIMPLIFIED CONFIGURATION FORM (Requirement 4) */
              <form onSubmit={handleGenerateQuestions} className="space-y-4">
                {/* 1. Question Type */}
                <div>
                  <label className="font-bold text-slate-800 block mb-2">Question Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'TECHNICAL', label: 'Technical Coding' },
                      { id: 'MCQ', label: 'Multiple Choice (MCQ)' },
                      { id: 'BOTH', label: 'Both' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setGenQType(item.id as any)}
                        className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                          genQType === item.id
                            ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Language */}
                <div>
                  <label className="font-bold text-slate-800 block mb-2">Language</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'SQL', label: 'SQL (Structured Query Language)', icon: Database },
                      { id: 'Python', label: 'Python (Algorithms & Data)', icon: Code }
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setGenLanguage(item.id as any)}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border font-bold text-left transition-all cursor-pointer ${
                            genLanguage === item.id
                              ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Question Count & 4. Difficulty */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Question Count */}
                  <div>
                    <label className="font-bold text-slate-800 block mb-2">Question Count</label>
                    <div className="flex items-center gap-2">
                      {[1, 3, 5, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setGenCount(num)}
                          className={`flex-1 py-2 rounded-lg border font-bold text-center transition-all cursor-pointer ${
                            genCount === num
                              ? 'bg-purple-600 border-purple-600 text-white'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="font-bold text-slate-800 block mb-2">Difficulty</label>
                    <div className="flex items-center gap-2">
                      {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setGenDifficulty(diff)}
                          className={`flex-1 py-2 rounded-lg border font-bold text-center transition-all cursor-pointer ${
                            genDifficulty === diff
                              ? 'bg-purple-600 border-purple-600 text-white'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {diff.charAt(0) + diff.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Automation Notice (Requirements 5, 6, 11) */}
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1 text-purple-900">
                  <div className="font-bold flex items-center gap-1.5 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Automatic Topic Selection & Scoring</span>
                  </div>
                  <p className="text-[10px] text-purple-700 leading-relaxed">
                    The AI automatically distributes questions across diverse {genLanguage} topics and assigns marks
                    based on difficulty (Easy: 5–10 pts, Medium: 10–25 pts, Hard: 15–50 pts). Every question is verified
                    for structural uniqueness.
                  </p>
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAiModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-semibold hover:bg-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold hover:opacity-95 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {isGenerating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isGenerating ? 'Generating...' : 'Generate Questions'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. QUESTION PREVIEW MODAL (Requirement 2 & 8)                          */}
      {/* ===================================================================== */}
      {viewQuestion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{viewQuestion.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-slate-500 text-[11px]">
                    {viewQuestion.code_language?.toUpperCase() || 'SQL'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                    {viewQuestion.difficulty}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-[10px]">
                    {viewQuestion.marks} pts
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewQuestion(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-slate-700 leading-relaxed">
              {viewQuestion.business_scenario && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 uppercase text-[11px]">Business Scenario</span>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    {viewQuestion.business_scenario}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <span className="font-bold text-slate-900 uppercase text-[11px]">Problem Statement</span>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 whitespace-pre-line">
                  {viewQuestion.problem_statement}
                </div>
              </div>

              {viewQuestion.task_description && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 uppercase text-[11px]">Task Instructions</span>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 whitespace-pre-line">
                    {viewQuestion.task_description}
                  </div>
                </div>
              )}

              {/* Table Schema Description (Requirement 8) */}
              {viewQuestion.tables_schema_json && viewQuestion.tables_schema_json.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-900 uppercase text-[11px]">Table Description</span>
                  {viewQuestion.tables_schema_json.map((tbl: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 font-mono">
                      <span className="font-bold text-blue-600 text-[11px]">Table: {tbl.name}</span>
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-1">Column</th>
                            <th className="py-1">Type</th>
                            <th className="py-1">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tbl.columns?.map((c: any, cIdx: number) => (
                            <tr key={cIdx} className="border-b border-slate-100">
                              <td className="py-1 font-bold text-slate-800">{c.name}</td>
                              <td className="py-1 text-purple-600">{c.type}</td>
                              <td className="py-1 text-slate-500">{c.description || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}

              {/* Output Format (Requirement 8) */}
              {viewQuestion.output_columns_json && viewQuestion.output_columns_json.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-900 uppercase text-[11px]">Output Format</span>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-1">Output Column</th>
                          <th className="py-1">Type</th>
                          <th className="py-1">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewQuestion.output_columns_json.map((col: any, cIdx: number) => (
                          <tr key={cIdx} className="border-b border-slate-100">
                            <td className="py-1 font-bold text-slate-800">{col.name}</td>
                            <td className="py-1 text-purple-600">{col.type}</td>
                            <td className="py-1 text-slate-500">{col.description || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* MCQ Options */}
              {viewQuestion.mcq_options_json && viewQuestion.mcq_options_json.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-900 uppercase text-[11px]">Answer Choices</span>
                  <div className="space-y-1.5">
                    {viewQuestion.mcq_options_json.map((opt: any) => (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                          opt.id === viewQuestion.correct_answer
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px]">
                          {opt.id}
                        </span>
                        <span>{opt.text}</span>
                        {opt.id === viewQuestion.correct_answer && (
                          <span className="ml-auto text-[10px] text-emerald-600 uppercase font-black">
                            ✓ Correct Answer
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Constraints */}
              {viewQuestion.constraints && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 uppercase text-[11px]">Constraints</span>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px]">
                    {viewQuestion.constraints}
                  </div>
                </div>
              )}

              {/* Explanation */}
              {viewQuestion.explanation && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 uppercase text-[11px]">Explanation</span>
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200 text-slate-700 text-[11px]">
                    {viewQuestion.explanation}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setViewQuestion(null)}
                className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. ADD TO ASSESSMENT MODAL (Requirement 2 & 13)                        */}
      {/* ===================================================================== */}
      {questionToAssign && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Add Question to Assessment</span>
              </h3>
              <button
                onClick={() => setQuestionToAssign(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-slate-500">Target Question:</span>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-bold text-slate-900">
                {questionToAssign.title} ({questionToAssign.marks} pts)
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Select Assessment</label>
              <select
                value={targetAssessmentId}
                onChange={(e) => setTargetAssessmentId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800"
              >
                {assessments.map((ass) => (
                  <option key={ass.id} value={ass.id}>
                    {ass.title} ({ass.duration_minutes} mins)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => setQuestionToAssign(null)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAddToAssessment}
                disabled={addingToAssessment}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {addingToAssessment && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Add to Assessment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. EDIT QUESTION MODAL (Requirement 2)                                 */}
      {/* ===================================================================== */}
      {editQuestion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSaveQuestionEdit}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Edit Question</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditQuestion(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Title</label>
                <input
                  type="text"
                  value={editQuestion.title}
                  onChange={(e) => setEditQuestion({ ...editQuestion, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Difficulty</label>
                  <select
                    value={editQuestion.difficulty}
                    onChange={(e) => setEditQuestion({ ...editQuestion, difficulty: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Score / Marks</label>
                  <input
                    type="number"
                    value={editQuestion.marks}
                    onChange={(e) => setEditQuestion({ ...editQuestion, marks: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Business Scenario</label>
                <textarea
                  rows={2}
                  value={editQuestion.business_scenario || ''}
                  onChange={(e) => setEditQuestion({ ...editQuestion, business_scenario: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Problem Statement</label>
                <textarea
                  rows={3}
                  value={editQuestion.problem_statement}
                  onChange={(e) => setEditQuestion({ ...editQuestion, problem_statement: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono text-[11px]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Task Instructions</label>
                <textarea
                  rows={2}
                  value={editQuestion.task_description || ''}
                  onChange={(e) => setEditQuestion({ ...editQuestion, task_description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditQuestion(null)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {savingEdit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
