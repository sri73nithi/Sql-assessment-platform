'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import ApiClient from '@/services/api';
import {
  Play,
  Upload,
  ChevronLeft,
  ChevronRight,
  Database,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  Code2,
  FileText,
  BookOpen,
  Award,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  Terminal,
  BarChart3,
  Check,
  Zap,
  Shield,
  ShieldAlert,
  Camera,
  Mic,
  AlertTriangle,
  Maximize,
  Minimize,
  Video,
  EyeOff,
  CheckCircle,
  Tag,
  ListChecks,
  Table,
  Bookmark,
  BookmarkCheck,
  Info,
  ArrowLeft,
  PauseCircle,
  AlertCircle
} from 'lucide-react';

export const dynamicMode = 'force-dynamic';

// Dynamic Monaco Editor to prevent SSR hydration errors
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#121418] text-slate-500 font-mono text-xs">
      <span>Loading Code Editor...</span>
    </div>
  )
});

interface TestCase {
  id: string;
  name: string;
  test_type: string;
  weight: number;
  expected_output_json?: any;
  input_setup_sql?: string;
}

interface QuestionView {
  id: string;
  title: string;
  business_scenario: string;
  problem_statement: string;
  task_description: string;
  notes?: string;
  requirements?: string;
  difficulty: string;
  job_role: string;
  database_engine: string;
  tables_schema_json: any[];
  schema_ddl: string;
  seed_data_sql: string;
  marks: number;
  question_type: string; // 'SQL_TECHNICAL' | 'PYTHON_TECHNICAL' | 'MCQ'
  mcq_options_json?: Array<{ id: string; text: string }>;
  code_language?: string;
  function_signature?: string;
  input_format?: string;
  output_format?: string;
  output_columns_json?: Array<{ name: string; type: string; description: string }>;
  constraints?: string;
  example_input_json?: any;
  example_output_json?: any;
  example_explanation?: string;
  supported_databases_json?: string[];
  tags_json?: string[];
  public_test_cases: TestCase[];
}

// Dynamic Output Schema parser (Requirement 1 & 6)
function parseOutputFormatColumns(q: QuestionView | null): Array<{ name: string; type: string; description: string }> {
  if (!q) return [];

  // 1. Explicit output_columns_json from backend
  if (q.output_columns_json && Array.isArray(q.output_columns_json) && q.output_columns_json.length > 0) {
    return q.output_columns_json;
  }

  // 2. Parse structured output_format string
  if (q.output_format && typeof q.output_format === 'string') {
    const lines = q.output_format.split('\n');
    const colsLine = lines.find((l) => !l.toLowerCase().startsWith('ordered by:')) || lines[0];
    if (colsLine && colsLine.includes('(') && colsLine.includes(')')) {
      const parts = colsLine.split(/,\s*(?![^()]*\))/);
      const parsed: Array<{ name: string; type: string; description: string }> = [];

      for (const part of parts) {
        const match = part.match(/^\s*([a-zA-Z0-9_\s]+?)\s*\(([^)]+)\)(?:\s*[-:]\s*(.+))?/);
        if (match) {
          const colName = match[1].trim();
          const colType = match[2].trim().toUpperCase();
          const colDesc = match[3] ? match[3].trim() : `Result column representing ${colName.replace(/_/g, ' ')}`;
          parsed.push({ name: colName, type: colType, description: colDesc });
        }
      }
      if (parsed.length > 0) return parsed;
    }
  }

  // 3. Infer from example_output_json
  let sampleRows: any[] = [];
  if (Array.isArray(q.example_output_json) && q.example_output_json.length > 0) {
    sampleRows = q.example_output_json;
  } else if (typeof q.example_output_json === 'string') {
    try {
      const parsed = JSON.parse(q.example_output_json);
      if (Array.isArray(parsed) && parsed.length > 0) sampleRows = parsed;
    } catch {}
  }

  // 4. Fallback to public test case expected output
  if (sampleRows.length === 0 && q.public_test_cases?.[0]?.expected_output_json) {
    const tcExpected = q.public_test_cases[0].expected_output_json;
    if (Array.isArray(tcExpected) && tcExpected.length > 0) sampleRows = tcExpected;
  }

  if (sampleRows.length > 0 && typeof sampleRows[0] === 'object' && sampleRows[0] !== null) {
    const first = sampleRows[0];
    return Object.keys(first).map((key) => {
      const val = first[key];
      let inferredType = 'VARCHAR';
      if (typeof val === 'number') {
        inferredType = Number.isInteger(val) ? 'INT' : 'DECIMAL';
      } else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
        inferredType = 'DATE';
      } else if (typeof val === 'boolean') {
        inferredType = 'BOOLEAN';
      }
      return {
        name: key,
        type: inferredType,
        description: `Expected result column for ${key.replace(/_/g, ' ')}`
      };
    });
  }

  return [];
}

// Normalizes dataset into rows array for table rendering (Requirement 3)
function normalizeRows(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'object' && parsed !== null) return [parsed];
    } catch {
      return [];
    }
  }
  if (typeof data === 'object' && data !== null) return [data];
  return [];
}

function StudentAssessmentContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assessment, setAssessment] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [questions, setQuestions] = useState<QuestionView[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentQuestion = questions[currentIndex] || null;

  // Left panel view mode: 'problem' (authoritative problem description) | 'schema_only' (authoritative schema explorer)
  const [leftTab, setLeftTab] = useState<'problem' | 'schema_only'>('problem');

  // Bottom Console Active Tab: 'testcase' | 'testresult'
  const [consoleTab, setConsoleTab] = useState<'testcase' | 'testresult'>('testcase');
  const [activeTestCaseIdx, setActiveTestCaseIdx] = useState(0);

  // Candidate Code, MCQ state, dialect per question
  const [codeAnswers, setCodeAnswers] = useState<{ [key: string]: string }>({});
  const [mcqSelections, setMcqSelections] = useState<{ [key: string]: string }>({});
  const [selectedDatabases, setSelectedDatabases] = useState<{ [key: string]: string }>({});
  const [flaggedForReview, setFlaggedForReview] = useState<{ [key: string]: boolean }>({});

  // Question status pills tracking
  const [questionStatuses, setQuestionStatuses] = useState<{ [key: string]: string }>({});
  const [questionScores, setQuestionScores] = useState<{ [key: string]: { score: number; max_score: number } }>({});

  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResults, setRunResults] = useState<any | null>(null);
  const [submitResults, setSubmitResults] = useState<any | null>(null);

  // Modals
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
  const [showFinishConfirmModal, setShowFinishConfirmModal] = useState(false);
  const [isAssessmentFinished, setIsAssessmentFinished] = useState(false);
  const [finishResultData, setFinishResultData] = useState<any | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  // Proctoring Runtime States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const [violationsCount, setViolationsCount] = useState(0);
  const [showViolationWarningModal, setShowViolationWarningModal] = useState(false);
  const [violationWarningText, setViolationWarningText] = useState('');
  const [isAssessmentTerminated, setIsAssessmentTerminated] = useState(false);
  const [clipboardToast, setClipboardToast] = useState<string | null>(null);

  // Timer countdown
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Interruption & Re-enable state
  const [isInterrupted, setIsInterrupted] = useState(false);
  const [interruptionMessage, setInterruptionMessage] = useState<string>('');
  const [activeAttemptNumber, setActiveAttemptNumber] = useState<number>(1);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);

  // Candidate Feedback state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    overall_rating: 5,
    difficulty_rating: 3,
    question_quality_rating: 5,
    platform_rating: 5,
    technical_issues_encountered: false,
    technical_issues_desc: '',
    written_comments: ''
  });

  // Webcam stream
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid URL parameters. Missing assessment access token.');
      setLoading(false);
      return;
    }

    const validateToken = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await ApiClient.get<any>(`/api/invitations/validate/${token}`);
        setAssessment(res.assessment);
        setStudent(res.student);

        if (res.invitation?.status === 'COMPLETED') {
          setIsAssessmentFinished(true);
        }

        if (res.candidate_status === 'INTERRUPTED' && !res.is_re_enabled) {
          setIsInterrupted(true);
          setInterruptionMessage(res.interruption_reason || 'Your assessment was interrupted. Your progress has been securely saved.');
        } else {
          setIsInterrupted(false);
        }

        if (res.active_attempt_number) {
          setActiveAttemptNumber(res.active_attempt_number);
        }

        const qList: QuestionView[] = res.questions || [];
        setQuestions(qList);

        // Pre-fill starter code templates & server-restored drafts
        const initialCodes: { [key: string]: string } = {};
        const initialEngines: { [key: string]: string } = {};

        const serverDrafts = res.saved_progress?.drafts || {};
        const cacheKey = `candidate_codes_${token}`;
        const savedCache = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
        const cachedCodes = savedCache ? JSON.parse(savedCache) : {};

        qList.forEach((q) => {
          const defaultDb = (q.supported_databases_json && q.supported_databases_json.length > 0)
            ? q.supported_databases_json[0]
            : (q.database_engine || 'PostgreSQL');

          if (serverDrafts[q.id]?.database_engine) {
            initialEngines[q.id] = serverDrafts[q.id].database_engine;
          } else {
            initialEngines[q.id] = defaultDb;
          }

          if (serverDrafts[q.id]?.code !== undefined && serverDrafts[q.id]?.code !== null) {
            initialCodes[q.id] = serverDrafts[q.id].code;
          } else if (cachedCodes[q.id]) {
            initialCodes[q.id] = cachedCodes[q.id];
          } else if (q.question_type === 'PYTHON_TECHNICAL' || q.code_language === 'python') {
            initialCodes[q.id] = q.function_signature
              ? `# Python 3.12 Solution\n${q.function_signature}\n    # Write your solution below\n    pass\n`
              : `# Python 3.12 Solution\ndef solution():\n    # Write your solution below\n    pass\n`;
          } else if (q.question_type !== 'MCQ') {
            const firstTable = q.tables_schema_json?.[0]?.name || 'table_name';
            initialCodes[q.id] = `-- ${defaultDb} Solution\n-- Write your query below\nSELECT * \nFROM ${firstTable};`;
          }
        });

        setCodeAnswers(initialCodes);
        setSelectedDatabases(initialEngines);

        // Timer remaining seconds from backend active attempt or calculated duration
        if (typeof res.time_remaining_seconds === 'number' && res.time_remaining_seconds >= 0) {
          setTimeLeft(res.time_remaining_seconds);
        } else {
          const durationMins = res.assessment?.duration_minutes || 60;
          const startedAt = res.invitation?.started_at ? new Date(res.invitation.started_at).getTime() : Date.now();
          const expiresAt = startedAt + durationMins * 60 * 1000;
          const secondsRemaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
          setTimeLeft(secondsRemaining > 0 ? secondsRemaining : durationMins * 60);
        }

        // Proctoring config
        const proctoring = res.assessment?.proctoring_config || {};
        if (proctoring.fullscreen_required) {
          setShowFullscreenPrompt(true);
        }
        if (proctoring.webcam_required) {
          setupWebcam();
        }
      } catch (err: any) {
        setError(err.message || 'Failed to authenticate assessment token.');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  // Periodic autosave to backend every 15 seconds
  useEffect(() => {
    if (!token || isAssessmentFinished || isInterrupted || timeLeft === null || !currentQuestion) return;

    const autosaveTimer = setInterval(async () => {
      try {
        const payload = {
          active_question_id: currentQuestion.id,
          drafts: Object.keys(codeAnswers).reduce((acc: any, qId) => {
            acc[qId] = {
              code: codeAnswers[qId],
              database_engine: selectedDatabases[qId] || 'PostgreSQL'
            };
            return acc;
          }, {}),
          time_remaining_seconds: timeLeft
        };
        await ApiClient.post(`/api/invitations/save-progress/${token}`, payload);
      } catch (e) {}
    }, 15000);

    return () => clearInterval(autosaveTimer);
  }, [token, isAssessmentFinished, isInterrupted, timeLeft, currentQuestion, codeAnswers, selectedDatabases]);

  // Record interruption on unexpected window close or navigation
  useEffect(() => {
    if (!token || isAssessmentFinished || isInterrupted) return;

    const handleBeforeUnload = () => {
      try {
        const payload = JSON.stringify({
          reason: 'Candidate navigated away or closed browser window',
          drafts: Object.keys(codeAnswers).reduce((acc: any, qId) => {
            acc[qId] = {
              code: codeAnswers[qId],
              database_engine: selectedDatabases[qId] || 'PostgreSQL'
            };
            return acc;
          }, {}),
          time_remaining_seconds: timeLeft || 0
        });

        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/invitations/interrupt/${token}`;
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
        }
      } catch (e) {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [token, isAssessmentFinished, isInterrupted, timeLeft, codeAnswers, selectedDatabases]);

  // Candidate Pause & Exit Handler
  const handlePauseAndExit = async () => {
    if (!token) return;
    try {
      const payload = {
        reason: 'Candidate voluntarily paused and exited session',
        drafts: Object.keys(codeAnswers).reduce((acc: any, qId) => {
          acc[qId] = {
            code: codeAnswers[qId],
            database_engine: selectedDatabases[qId] || 'PostgreSQL'
          };
          return acc;
        }, {}),
        time_remaining_seconds: timeLeft || 0
      };
      await ApiClient.post(`/api/invitations/interrupt/${token}`, payload);
      setShowExitConfirmModal(false);
      setIsInterrupted(true);
      setInterruptionMessage('You have paused and exited your assessment. Your written code drafts and remaining duration are safely preserved.');
    } catch (err: any) {
      alert('Failed to pause assessment: ' + (err.message || err));
    }
  };

  // Webcam initializer
  const setupWebcam = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setCameraStream(stream);
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.warn('Webcam permission not granted:', err);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isAssessmentFinished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev && prev > 1) return prev - 1;
        handleFinishAssessment();
        return 0;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isAssessmentFinished]);

  // Violation Reporter
  const handleReportViolation = async (eventType: string, details: string) => {
    if (!token || isAssessmentTerminated || isAssessmentFinished) return;
    try {
      const res = await ApiClient.post<any>(`/api/invitations/proctoring-event/${token}`, {
        event_type: eventType,
        details: details
      });

      const newCount = violationsCount + 1;
      setViolationsCount(newCount);
      const maxViolations = assessment?.proctoring_config?.max_violations_allowed || 3;

      if (res?.terminate_assessment) {
        setIsAssessmentTerminated(true);
        setShowViolationWarningModal(true);
        setViolationWarningText('Maximum security violations reached. Your assessment has been automatically locked.');
        handleFinishAssessment();
      } else {
        setShowViolationWarningModal(true);
        setViolationWarningText(res?.warning_message || `Security Warning ${newCount} of ${maxViolations}: You have navigated away from the assessment window!`);
      }
    } catch (e) {
      console.error('Failed to report proctoring event:', e);
    }
  };

  // Fullscreen Enforcer
  const handleEnterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setShowFullscreenPrompt(false);
      setIsFullscreen(true);
    } catch (err) {
      setShowFullscreenPrompt(false);
    }
  };

  // Listen for Fullscreen Changes
  useEffect(() => {
    const proctoring = assessment?.proctoring_config || {};
    if (!proctoring.fullscreen_required) return;

    const onFullscreenChange = () => {
      const inFull = Boolean(document.fullscreenElement);
      setIsFullscreen(inFull);
      if (!inFull && !isAssessmentTerminated && !isAssessmentFinished) {
        handleReportViolation('FULLSCREEN_EXIT', 'Exited mandatory full-screen assessment window.');
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [assessment, isAssessmentTerminated, isAssessmentFinished, violationsCount]);

  // Listen for Tab Switching
  useEffect(() => {
    const proctoring = assessment?.proctoring_config || {};
    if (!proctoring.tab_switch_detection) return;

    const handleVisibility = () => {
      if (document.hidden && !isAssessmentTerminated && !isAssessmentFinished) {
        handleReportViolation('TAB_SWITCH', 'Switched browser tabs or minimized window.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [assessment, isAssessmentTerminated, isAssessmentFinished, violationsCount]);

  // Copy / Paste Restriction
  useEffect(() => {
    const proctoring = assessment?.proctoring_config || {};
    if (!proctoring.copy_paste_restricted) return;

    const blockEvent = (e: Event) => {
      e.preventDefault();
      setClipboardToast('🔒 Copy, cut, and paste are restricted by proctoring policy.');
      handleReportViolation('COPY_PASTE', 'Attempted unauthorized copy/paste action.');
      setTimeout(() => setClipboardToast(null), 3000);
    };

    window.addEventListener('copy', blockEvent);
    window.addEventListener('cut', blockEvent);
    window.addEventListener('paste', blockEvent);
    window.addEventListener('contextmenu', blockEvent);

    return () => {
      window.removeEventListener('copy', blockEvent);
      window.removeEventListener('cut', blockEvent);
      window.removeEventListener('paste', blockEvent);
      window.removeEventListener('contextmenu', blockEvent);
    };
  }, [assessment, isAssessmentTerminated]);

  const handleCodeChange = (newCode: string) => {
    if (!currentQuestion) return;
    setCodeAnswers((prev) => {
      const updated = { ...prev, [currentQuestion.id]: newCode };
      if (typeof window !== 'undefined' && token) {
        localStorage.setItem(`candidate_codes_${token}`, JSON.stringify(updated));
      }
      return updated;
    });

    if (!questionStatuses[currentQuestion.id] || questionStatuses[currentQuestion.id] === 'UNATTEMPTED') {
      setQuestionStatuses((prev) => ({
        ...prev,
        [currentQuestion.id]: 'DRAFT'
      }));
    }
  };

  const handleSelectMcqOption = (optId: string) => {
    if (!currentQuestion) return;
    setMcqSelections((prev) => ({
      ...prev,
      [currentQuestion.id]: optId
    }));
    setQuestionStatuses((prev) => ({
      ...prev,
      [currentQuestion.id]: 'DRAFT'
    }));
  };

  // Switch database dialect and dynamically adapt starter code template (Requirement 3)
  const handleDatabaseChange = (newDb: string) => {
    if (!currentQuestion) return;
    setSelectedDatabases((prev) => ({
      ...prev,
      [currentQuestion.id]: newDb
    }));

    const currentCode = codeAnswers[currentQuestion.id] || '';
    if (currentCode.startsWith('-- ') && currentCode.includes('Solution')) {
      const firstTable = currentQuestion.tables_schema_json?.[0]?.name || 'table_name';
      handleCodeChange(`-- ${newDb} Solution\n-- Write your query below\nSELECT * \nFROM ${firstTable};`);
    }
  };

  const handleResetCode = () => {
    if (!currentQuestion) return;
    if (currentQuestion.question_type === 'PYTHON_TECHNICAL') {
      handleCodeChange(currentQuestion.function_signature || '# Python 3.12 Solution\ndef solution():\n    pass\n');
    } else if (currentQuestion.question_type !== 'MCQ') {
      const dbEngine = selectedDatabases[currentQuestion.id] || currentQuestion.database_engine || 'PostgreSQL';
      const firstTable = currentQuestion.tables_schema_json?.[0]?.name || 'table_name';
      handleCodeChange(`-- ${dbEngine} Solution\n-- Write your query below\nSELECT * \nFROM ${firstTable};`);
    } else {
      const copy = { ...mcqSelections };
      delete copy[currentQuestion.id];
      setMcqSelections(copy);
    }
    setShowResetConfirmModal(false);
  };

  // Run Code
  const handleRunCode = async () => {
    if (!currentQuestion || !token) return;
    setIsRunning(true);
    setRunResults(null);
    setSubmitResults(null);
    setConsoleTab('testresult');

    try {
      const codeToSend = currentQuestion.question_type === 'MCQ'
        ? (mcqSelections[currentQuestion.id] || '')
        : (codeAnswers[currentQuestion.id] || '');

      const payload = {
        code: codeToSend,
        sql_query: codeToSend,
        database_engine: selectedDatabases[currentQuestion.id] || currentQuestion.database_engine || 'PostgreSQL'
      };

      const res = await ApiClient.post<any>(
        `/api/submissions/run-code/${token}/${currentQuestion.id}`,
        payload
      );

      setRunResults(res);
      setActiveTestCaseIdx(0);
    } catch (err: any) {
      setRunResults({
        success: false,
        message: err.message || 'Execution error encountered.',
        results: [
          {
            test_name: 'Execution Sandbox',
            passed: false,
            error: err.message || 'Execution failed',
            error_type: 'Execution Error'
          }
        ]
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Official Submit Code (Requirement 9)
  const handleSubmitCode = async () => {
    if (!currentQuestion || !token) return;
    setShowSubmitConfirmModal(false);
    setIsSubmitting(true);
    setSubmitResults(null);
    setConsoleTab('testresult');

    try {
      const codeToSend = currentQuestion.question_type === 'MCQ'
        ? (mcqSelections[currentQuestion.id] || '')
        : (codeAnswers[currentQuestion.id] || '');

      if (!codeToSend.trim()) {
        alert('Please enter your solution before submitting.');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        code: codeToSend,
        sql_query: codeToSend,
        database_engine: selectedDatabases[currentQuestion.id] || currentQuestion.database_engine || 'PostgreSQL'
      };

      const res = await ApiClient.post<any>(
        `/api/submissions/submit-code/${token}/${currentQuestion.id}`,
        payload
      );

      setSubmitResults(res);
      setRunResults({
        success: res.passed_count === res.total_count,
        message: `${res.passed_count}/${res.total_count} test cases passed. Score: ${res.score}/${res.max_score}`,
        results: res.results
      });

      const isAllPassed = res.passed_count === res.total_count && res.total_count > 0;
      const isPartial = res.passed_count > 0 && !isAllPassed;
      const statusKey = isAllPassed
        ? 'SUBMITTED_CORRECT'
        : isPartial
        ? 'SUBMITTED_PARTIAL'
        : 'SUBMITTED_WRONG';

      setQuestionStatuses((prev) => ({
        ...prev,
        [currentQuestion.id]: statusKey
      }));

      setQuestionScores((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          score: res.score,
          max_score: res.max_score
        }
      }));

      setActiveTestCaseIdx(0);
    } catch (err: any) {
      setRunResults({
        success: false,
        message: err.message || 'Submission evaluation error',
        results: [
          {
            test_name: 'Submission Evaluation',
            passed: false,
            error: err.message,
            error_type: 'Runtime Error'
          }
        ]
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Official Finish Assessment (Requirement 18)
  const handleFinishAssessment = async () => {
    if (!token) return;
    setIsFinishing(true);
    try {
      const res = await ApiClient.post<any>(`/api/submissions/finish/${token}`, {});
      setFinishResultData(res);
      setIsAssessmentFinished(true);
      setShowFinishConfirmModal(false);
    } catch (err: any) {
      alert('Failed to submit final assessment: ' + (err.message || err));
    } finally {
      setIsFinishing(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmittingFeedback(true);
    try {
      await ApiClient.post(`/api/submissions/feedback/${token}`, feedbackForm);
      setFeedbackSubmitted(true);
      setTimeout(() => {
        setShowFeedbackModal(false);
      }, 3000);
    } catch (err: any) {
      alert('Failed to submit feedback: ' + (err.message || err));
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const answeredCount = questions.filter(
    (q) => questionStatuses[q.id] && questionStatuses[q.id].startsWith('SUBMITTED')
  ).length;

  const flaggedCount = Object.values(flaggedForReview).filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0e1015] text-slate-400 gap-3 font-mono text-xs">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading Assessment Environment...</span>
      </div>
    );
  }

  if (error || !assessment || questions.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0e1015] p-6 font-sans">
        <div className="max-w-md w-full bg-[#16181d] border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <Lock className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-white">Access Denied</h2>
          <p className="text-xs text-slate-400">{error || 'Unable to access assessment.'}</p>
        </div>
      </div>
    );
  }

  // Completed / Finished Screen
  if (isAssessmentFinished) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0e1015] p-6 select-none font-sans">
        <div className="max-w-lg w-full bg-[#16181d] border border-[#282d38] rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-950/60 border border-emerald-500/80 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Assessment Submitted Successfully</h2>
            <p className="text-xs text-slate-400 mt-1">
              Thank you for completing the assessment, <strong className="text-slate-200">{student?.full_name || 'Candidate'}</strong>. Your responses have been saved and locked.
            </p>
          </div>

          <div className="bg-[#121418] border border-[#242832] rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Total Score</span>
              <span className="text-lg font-bold text-white font-mono">
                {finishResultData?.total_score ?? 'Submitted'} / {finishResultData?.max_score ?? '100'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Percentage</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">
                {finishResultData?.percentage ?? 100}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Questions</span>
              <span className="text-lg font-bold text-blue-400 font-mono">
                {finishResultData?.attempted_questions ?? answeredCount} / {questions.length}
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              Provide Candidate Feedback
            </button>
          </div>
        </div>

        {/* FEEDBACK MODAL */}
        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmitFeedback} className="bg-[#181a20] border border-[#2d323e] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left">
              <div className="flex items-center justify-between border-b border-[#282d38] pb-3">
                <h3 className="text-sm font-bold text-white">Assessment Feedback</h3>
                <button type="button" onClick={() => setShowFeedbackModal(false)} className="text-slate-400 text-lg cursor-pointer">×</button>
              </div>

              {feedbackSubmitted ? (
                <div className="p-4 bg-emerald-950/50 text-emerald-400 border border-emerald-800 rounded-lg text-center text-xs">
                  Thank you! Your feedback has been recorded.
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Overall Experience (1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={feedbackForm.overall_rating}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, overall_rating: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#121418] border border-[#282d38] rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Comments / Suggestions</label>
                    <textarea
                      rows={3}
                      value={feedbackForm.written_comments}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, written_comments: e.target.value })}
                      placeholder="Share your experience..."
                      className="w-full px-3 py-2 bg-[#121418] border border-[#282d38] rounded text-white resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowFeedbackModal(false)} className="px-3 py-1.5 bg-[#242832] rounded text-slate-300 cursor-pointer">
                      Close
                    </button>
                    <button type="submit" disabled={submittingFeedback} className="px-4 py-1.5 bg-blue-600 rounded text-white font-bold cursor-pointer">
                      Submit Feedback
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    );
  }

  // Interrupted / Exited Screen
  if (isInterrupted && !isAssessmentFinished) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0e1015] p-6 select-none font-sans">
        <div className="max-w-lg w-full bg-[#16181d] border border-[#282d38] rounded-2xl p-8 text-center space-y-6 shadow-2xl animate-in fade-in">
          <div className="w-16 h-16 bg-amber-950/60 border border-amber-500/80 rounded-full flex items-center justify-center mx-auto text-amber-400">
            <PauseCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Assessment Session Paused / Interrupted</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hello <strong className="text-slate-200">{student?.full_name || 'Candidate'}</strong>, your assessment attempt has been paused and your written code solutions have been safely saved on our servers.
            </p>
          </div>

          <div className="bg-[#121418] border border-amber-900/40 rounded-xl p-4 text-left text-xs space-y-2 text-slate-300">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Status: Interrupted / Access Paused</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              {interruptionMessage || 'The session was interrupted due to an unexpected browser closure, disconnection, or navigation away.'}
            </p>
            <div className="pt-2 border-t border-[#242832] flex items-center justify-between text-[11px] text-slate-400">
              <span>Remaining Duration: <strong>{timeLeft !== null ? formatTimer(timeLeft) : 'Saved'}</strong></span>
              <span>Attempt #{activeAttemptNumber}</span>
            </div>
          </div>

          <div className="p-4 bg-blue-950/30 border border-blue-800/40 rounded-xl text-left text-xs text-blue-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-blue-300">
              <Info className="w-4 h-4 text-blue-400" />
              <span>How to resume:</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-normal">
              Please contact your administrator or recruiter to re-enable your test access. Once re-enabled by the admin, click <strong>Check Status & Resume</strong> below to continue from where you left off.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setLoading(true);
                ApiClient.get<any>(`/api/invitations/validate/${token}`)
                  .then((res) => {
                    if (res.is_re_enabled || res.candidate_status === 'RETAKE_ENABLED' || res.candidate_status === 'IN_PROGRESS') {
                      setIsInterrupted(false);
                      setAssessment(res.assessment);
                      setStudent(res.student);
                      if (typeof res.time_remaining_seconds === 'number') {
                        setTimeLeft(res.time_remaining_seconds);
                      }
                      if (res.saved_progress?.drafts) {
                        setCodeAnswers((prev) => ({
                          ...prev,
                          ...Object.fromEntries(Object.entries(res.saved_progress.drafts).map(([k, v]: any) => [k, v.code]))
                        }));
                      }
                    } else {
                      alert('Your assessment attempt has not been re-enabled by the administrator yet. Please request re-enabling from your test administrator.');
                    }
                  })
                  .catch((err) => {
                    alert('Error checking status: ' + (err.message || err));
                  })
                  .finally(() => setLoading(false));
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Check Status & Resume</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Difficulty flags for layout density (Requirement 2)
  const isHard = currentQuestion.difficulty === 'HARD';
  const isMedium = currentQuestion.difficulty === 'MEDIUM';
  const isEasy = currentQuestion.difficulty === 'EASY';

  // Dynamic Output Format columns (Requirements 1 & 6)
  const outputColumns = parseOutputFormatColumns(currentQuestion);

  // Normalized Example Output rows (Requirement 3)
  const expectedOutputRows = normalizeRows(currentQuestion.example_output_json);
  const expectedOutputCols = expectedOutputRows.length > 0 ? Object.keys(expectedOutputRows[0]) : [];

  return (
    <div className="flex flex-col h-screen bg-[#0e1015] text-slate-200 overflow-hidden select-none font-sans">
      {/* Toast Alert */}
      {clipboardToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-rose-900 border border-rose-600 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-2xl animate-bounce">
          {clipboardToast}
        </div>
      )}

      {/* TOP HEADER */}
      <header className="h-14 border-b border-[#242832] bg-[#14161a] px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs shadow-sm">
            ⚡
          </div>
          <span className="font-bold text-white text-sm tracking-tight">{assessment.title}</span>
        </div>

        {/* Question Navigation Bar (Requirement 15) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 font-mono hidden md:inline">
            Question {currentIndex + 1} of {questions.length}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="p-1 rounded bg-[#20242e] text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Previous Question"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {questions.map((q, idx) => {
                const status = questionStatuses[q.id] || 'UNATTEMPTED';
                const isFlagged = flaggedForReview[q.id];
                let badgeColor = 'bg-[#1c202a] text-slate-400 border-[#2d323e]';
                if (status === 'SUBMITTED_CORRECT') {
                  badgeColor = 'bg-emerald-600 text-white border-emerald-500';
                } else if (status === 'SUBMITTED_PARTIAL') {
                  badgeColor = 'bg-amber-600 text-white border-amber-500';
                } else if (status === 'SUBMITTED_WRONG') {
                  badgeColor = 'bg-rose-600 text-white border-rose-500';
                } else if (status === 'DRAFT') {
                  badgeColor = 'bg-blue-600/40 text-blue-300 border-blue-500/60';
                }

                const isCurrent = currentIndex === idx;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative w-7 h-7 rounded-lg text-xs font-bold transition-all border flex items-center justify-center cursor-pointer ${badgeColor} ${
                      isCurrent ? 'ring-2 ring-blue-500 scale-105' : 'hover:border-slate-500'
                    }`}
                    title={`Question ${idx + 1}: ${q.title}`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-black" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIndex === questions.length - 1}
              className="p-1 rounded bg-[#20242e] text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Next Question"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right side: Attempt Indicator, Timer & Save/Finish Assessment */}
        <div className="flex items-center gap-3">
          {activeAttemptNumber > 1 && (
            <div className="px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-700/80 text-indigo-300 text-[11px] font-extrabold flex items-center gap-1">
              <span>Attempt #{activeAttemptNumber}</span>
            </div>
          )}

          {timeLeft !== null && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                timeLeft < 300
                  ? 'bg-rose-950/40 text-rose-400 border-rose-800 animate-pulse'
                  : 'bg-[#1a1e27] text-slate-300 border-[#282d38]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>{formatTimer(timeLeft)}</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            <span>Answered:</span>
            <strong className="text-white font-mono">
              {answeredCount} / {questions.length}
            </strong>
          </div>

          <button
            onClick={() => setShowExitConfirmModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#20242e] hover:bg-[#2a2f3d] text-slate-300 hover:text-white text-xs font-semibold border border-[#2d323e] transition-colors cursor-pointer"
            title="Safely pause and exit your assessment. Your code drafts will be preserved."
          >
            <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Save & Exit</span>
          </button>

          <button
            onClick={() => setShowFinishConfirmModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Finish Assessment</span>
          </button>
        </div>
      </header>

      {/* MAIN SPLIT WORKSPACE */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* ----------------------------------------------------------------------- */}
        {/* LEFT PANEL: Problem Description (Clean & Non-redundant)                 */}
        {/* ----------------------------------------------------------------------- */}
        <div className="w-1/2 flex flex-col border-r border-[#242832] bg-[#111317] min-h-0">
          {/* Subheader: Problem Description vs Authoritative Schema Quickview */}
          <div className="h-10 border-b border-[#242832] bg-[#16181d] px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLeftTab('problem')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  leftTab === 'problem'
                    ? 'bg-[#20242e] text-white border border-[#303644]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Problem Description</span>
              </button>

              {currentQuestion.tables_schema_json?.length > 0 && (
                <button
                  onClick={() => setLeftTab('schema_only')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    leftTab === 'schema_only'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-[#1c202a] text-slate-300 hover:text-white border border-[#2d323e]'
                  }`}
                  title="Open the complete authoritative database schema"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Schema Quickview</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-black/40 rounded-full text-slate-200 font-bold">
                    {currentQuestion.tables_schema_json.length}
                  </span>
                </button>
              )}
            </div>

            <button
              onClick={() =>
                setFlaggedForReview((prev) => ({
                  ...prev,
                  [currentQuestion.id]: !prev[currentQuestion.id]
                }))
              }
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-colors border cursor-pointer ${
                flaggedForReview[currentQuestion.id]
                  ? 'bg-amber-950/60 border-amber-600 text-amber-300'
                  : 'bg-[#1c202a] border-[#2d323e] text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{flaggedForReview[currentQuestion.id] ? 'Flagged' : 'Flag for review'}</span>
            </button>
          </div>

          {/* Left Panel Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-300 text-xs leading-relaxed select-text">
            {leftTab === 'schema_only' ? (
              /* ================================================================= */
              /* AUTHORITATIVE SCHEMA QUICKVIEW (Requirement 2 & 4)                */
              /* ================================================================= */
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#242832] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-400" />
                      Authoritative Database Schema
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Direct schema mapping for the active {selectedDatabases[currentQuestion.id] || currentQuestion.database_engine || 'PostgreSQL'} sandbox.
                    </p>
                  </div>
                  <button
                    onClick={() => setLeftTab('problem')}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <span>Back to Problem</span>
                    <ArrowLeft className="w-3 h-3 rotate-180" />
                  </button>
                </div>

                {currentQuestion.tables_schema_json?.map((table: any, tIdx: number) => (
                  <div key={tIdx} className="bg-[#17191f] border border-[#242832] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#242832] pb-2">
                      <span className="font-mono font-bold text-blue-400 text-xs flex items-center gap-1.5">
                        <Table className="w-3.5 h-3.5" />
                        Table: {table.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {table.columns?.length || 0} columns
                      </span>
                    </div>

                    {table.description && (
                      <p className="text-slate-400 text-xs italic">{table.description}</p>
                    )}

                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b border-[#242832] text-slate-400 bg-[#14161a]">
                            <th className="py-2 px-3 font-semibold">Column</th>
                            <th className="py-2 px-3 font-semibold">Type</th>
                            <th className="py-2 px-3 font-semibold">Description</th>
                            <th className="py-2 px-3 font-semibold">Key</th>
                          </tr>
                        </thead>
                        <tbody>
                          {table.columns?.map((col: any, cIdx: number) => (
                            <tr key={cIdx} className="border-b border-[#1c202a] hover:bg-[#20242e]/50">
                              <td className="py-2 px-3 text-slate-200 font-bold">{col.name}</td>
                              <td className="py-2 px-3 text-amber-400">{col.type}</td>
                              <td className="py-2 px-3 text-slate-400">{col.description || '-'}</td>
                              <td className="py-2 px-3">
                                {col.is_primary_key ? (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-amber-950 text-amber-400 border border-amber-800 rounded font-bold">
                                    PK
                                  </span>
                                ) : col.is_foreign_key ? (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-blue-950 text-blue-400 border border-blue-800 rounded font-bold">
                                    FK
                                  </span>
                                ) : (
                                  '-'
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* ================================================================= */
              /* CLEAN PROBLEM DESCRIPTION (Requirements 1, 2, 4)                  */
              /* ================================================================= */
              <div className="space-y-6">
                {/* 1. Header Badges & Title */}
                <div className="border-b border-[#242832] pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-slate-500 font-mono text-sm font-bold">#{currentIndex + 1}</span>
                    <h1 className="text-xl font-bold text-white tracking-tight">{currentQuestion.title}</h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isEasy
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                          : isHard
                          ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                          : 'bg-amber-950/80 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {currentQuestion.difficulty}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#242832] text-slate-300 border border-[#323846]">
                      {currentQuestion.question_type === 'MCQ'
                        ? 'Multiple Choice'
                        : currentQuestion.code_language === 'python'
                        ? 'Python'
                        : `SQL (${selectedDatabases[currentQuestion.id] || currentQuestion.database_engine || 'PostgreSQL'})`}
                    </span>

                    <span className="text-slate-400 text-[11px] font-mono">
                      Score: <strong className="text-slate-200">{currentQuestion.marks} pts</strong>
                    </span>

                    {currentQuestion.tags_json && currentQuestion.tags_json.length > 0 && (
                      <div className="flex items-center gap-1.5 ml-auto">
                        {currentQuestion.tags_json.slice(0, 3).map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 rounded bg-[#1c202a] text-slate-400 text-[10px] border border-[#2d323e] flex items-center gap-1"
                          >
                            <Tag className="w-2.5 h-2.5 text-slate-500" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Business Scenario (Only for Hard & Medium) */}
                {(isHard || isMedium) && currentQuestion.business_scenario && (
                  <div className="space-y-1.5">
                    <h2 className="font-bold text-slate-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Business Scenario
                    </h2>
                    <div className="p-3.5 bg-[#17191f] rounded-xl border border-[#242832] text-slate-300 leading-relaxed">
                      {currentQuestion.business_scenario}
                    </div>
                  </div>
                )}

                {/* 3. Problem Statement */}
                <div className="space-y-1.5">
                  <h2 className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">
                    Problem Statement
                  </h2>
                  <div className="p-3.5 bg-[#17191f] rounded-xl border border-[#242832] text-slate-200 leading-relaxed whitespace-pre-line text-[12px]">
                    {currentQuestion.problem_statement}
                  </div>
                </div>

                {/* 4. Task Instructions */}
                <div className="space-y-1.5">
                  <h2 className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">
                    Task Instructions
                  </h2>
                  <div className="p-3.5 bg-[#17191f] rounded-xl border border-[#242832] text-slate-300 leading-relaxed whitespace-pre-line">
                    {currentQuestion.task_description}
                  </div>
                </div>

                {/* 5. Concise Input Format — No Duplicate Full Table Schemas (Requirement 2) */}
                {currentQuestion.question_type !== 'MCQ' && currentQuestion.code_language !== 'python' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-slate-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-blue-400" />
                        Input Format
                      </h2>
                      {currentQuestion.tables_schema_json?.length > 0 && (
                        <button
                          onClick={() => setLeftTab('schema_only')}
                          className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-800/60 transition-colors cursor-pointer"
                        >
                          <span>Open Schema Quickview ({currentQuestion.tables_schema_json.length} Tables)</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="p-3.5 bg-[#17191f] rounded-xl border border-[#242832] text-slate-300 text-xs leading-relaxed space-y-2">
                      {currentQuestion.input_format ? (
                        <div className="whitespace-pre-line">{currentQuestion.input_format}</div>
                      ) : (
                        <div className="space-y-1">
                          {currentQuestion.tables_schema_json?.map((t: any) => (
                            <p key={t.name}>
                              • The <strong className="text-white font-mono">{t.name}</strong> table contains {t.description || 'information about entities'}.
                            </p>
                          ))}
                        </div>
                      )}

                      <div className="pt-2 border-t border-[#242832] text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>
                          Inspect column-level data types, primary keys, and relationships in the{' '}
                          <button
                            onClick={() => setLeftTab('schema_only')}
                            className="text-blue-400 font-bold underline cursor-pointer"
                          >
                            Schema Quickview
                          </button>{' '}
                          tab.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Proper Dynamic Output Format / Output Schema Table (Requirements 1 & 6) */}
                {outputColumns.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="font-bold text-slate-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Table className="w-3.5 h-3.5 text-emerald-400" />
                      Output Format
                    </h2>

                    <div className="bg-[#17191f] border border-[#242832] rounded-xl p-3.5 space-y-2">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left font-mono text-[11px] border-collapse">
                          <thead>
                            <tr className="border-b border-[#242832] text-slate-400 bg-[#13151a]">
                              <th className="py-2 px-3 font-semibold text-emerald-400">Column</th>
                              <th className="py-2 px-3 font-semibold text-amber-400">Type</th>
                              <th className="py-2 px-3 font-semibold text-slate-300">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {outputColumns.map((col: any, idx: number) => (
                              <tr key={idx} className="border-b border-[#1c202a] hover:bg-[#20242e]/40">
                                <td className="py-2 px-3 text-slate-200 font-bold">{col.name}</td>
                                <td className="py-2 px-3 text-amber-400">{col.type}</td>
                                <td className="py-2 px-3 text-slate-300">{col.description || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {currentQuestion.output_format && currentQuestion.output_format.toLowerCase().includes('order') && (
                        <div className="pt-2 border-t border-[#242832] text-[11px] font-mono text-slate-400">
                          {currentQuestion.output_format.split('\n').find((l: string) => l.toLowerCase().includes('order'))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 7. Example Input Data Tables (Requirements 3 & 5) */}
                {currentQuestion.example_input_json && (
                  <div className="space-y-2">
                    <h2 className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">
                      Example Input
                    </h2>
                    {Array.isArray(currentQuestion.example_input_json) ? (
                      currentQuestion.example_input_json.map((tblObj: any, tIdx: number) => {
                        const rows = normalizeRows(tblObj.data);
                        const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
                        return (
                          <div key={tIdx} className="bg-[#17191f] border border-[#242832] rounded-xl p-3 space-y-2">
                            <span className="text-xs font-mono font-bold text-blue-400">
                              Table: {tblObj.table || `Table #${tIdx + 1}`}
                            </span>
                            {rows.length > 0 && (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left font-mono text-[11px] border-collapse">
                                  <thead>
                                    <tr className="border-b border-[#242832] text-slate-400 bg-[#13151a]">
                                      {cols.map((colKey) => (
                                        <th key={colKey} className="py-1 px-2.5 font-semibold">
                                          {colKey}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {rows.map((row: any, rIdx: number) => (
                                      <tr key={rIdx} className="border-b border-[#1c202a]">
                                        {cols.map((colKey) => (
                                          <td key={colKey} className="py-1 px-2.5 text-slate-300">
                                            {String(row[colKey] ?? '')}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3.5 bg-[#17191f] border border-[#242832] rounded-xl font-mono text-[11px] text-sky-300">
                        {String(currentQuestion.example_input_json)}
                      </div>
                    )}
                  </div>
                )}

                {/* 8. Proper Expected Output Result Table — No Raw JSON (Requirement 3) */}
                {expectedOutputRows.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">
                      Expected Output
                    </h2>
                    <div className="bg-[#17191f] border border-[#242832] rounded-xl p-3.5 overflow-x-auto">
                      <table className="w-full text-left font-mono text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b border-[#242832] text-slate-400 bg-[#13151a]">
                            {expectedOutputCols.map((colKey) => (
                              <th key={colKey} className="py-1.5 px-2.5 font-semibold text-emerald-400">
                                {colKey}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {expectedOutputRows.map((row: any, rIdx: number) => (
                            <tr key={rIdx} className="border-b border-[#1c202a]">
                              {expectedOutputCols.map((colKey) => (
                                <td key={colKey} className="py-1.5 px-2.5 text-slate-200 font-bold">
                                  {String(row[colKey] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 9. Explanation (Hard & Medium only) */}
                {(isHard || isMedium) && currentQuestion.example_explanation && (
                  <div className="space-y-1.5">
                    <h2 className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">
                      Explanation
                    </h2>
                    <div className="p-3.5 bg-[#17191f] rounded-xl border border-[#242832] text-slate-300 leading-relaxed text-[11px]">
                      {currentQuestion.example_explanation}
                    </div>
                  </div>
                )}

                {/* 10. Constraints & Notes */}
                {currentQuestion.constraints && (
                  <div className="space-y-1.5">
                    <h2 className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">
                      Constraints
                    </h2>
                    <div className="p-3 bg-[#17191f] rounded-xl border border-[#242832] text-slate-300 font-mono text-[11px] whitespace-pre-line">
                      {currentQuestion.constraints}
                    </div>
                  </div>
                )}

                {currentQuestion.notes && (
                  <div className="space-y-1.5">
                    <h2 className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">
                      Notes
                    </h2>
                    <div className="p-3 bg-[#17191f] rounded-xl border border-[#242832] text-slate-300 text-[11px]">
                      {currentQuestion.notes}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT PANEL: Solution Area (Monaco Code Editor + Execution Results)     */}
        {/* ----------------------------------------------------------------------- */}
        <div className="w-1/2 flex flex-col bg-[#14161a] min-h-0">
          {currentQuestion.question_type === 'MCQ' ? (
            <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
              <div className="border-b border-[#282d38] pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-white text-sm">Multiple Choice Selection</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">Single Choice</span>
              </div>

              <div className="space-y-3">
                {currentQuestion.mcq_options_json?.map((opt) => {
                  const isSelected = mcqSelections[currentQuestion.id] === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectMcqOption(opt.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        isSelected
                          ? 'bg-blue-950/50 border-blue-500 text-white shadow-md'
                          : 'bg-[#17191f] border-[#242832] text-slate-300 hover:bg-[#20242e] hover:border-[#303644]'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                          isSelected
                            ? 'border-blue-400 bg-blue-600 text-white'
                            : 'border-slate-600 text-slate-400 bg-[#14161a]'
                        }`}
                      >
                        {opt.id}
                      </div>

                      <div className="flex-1 text-xs leading-relaxed font-medium">
                        {opt.text}
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-[#242832]">
                <div className="text-xs text-slate-400">
                  Selected:{' '}
                  <strong className="text-blue-400 font-mono">
                    {mcqSelections[currentQuestion.id] || 'None'}
                  </strong>
                </div>

                <button
                  onClick={() => setShowSubmitConfirmModal(true)}
                  disabled={isSubmitting || !mcqSelections[currentQuestion.id]}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold disabled:opacity-40 transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>Submit Answer</span>
                </button>
              </div>

              {submitResults && (
                <div
                  className={`p-4 rounded-xl border text-xs font-mono space-y-1 ${
                    submitResults.score > 0
                      ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-600/60 text-rose-300'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {submitResults.score > 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <span>
                      {submitResults.score > 0
                        ? `Correct Answer! Earned ${submitResults.score} / ${submitResults.max_score} pts`
                        : `Incorrect Option. Earned 0 / ${submitResults.max_score} pts`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Solution Editor Header: Working Multi-Database Selector (Requirement 3) */}
              <div className="h-10 bg-[#16181d] border-b border-[#242832] px-4 flex items-center justify-between shrink-0 text-xs">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-white">Solution Editor</span>

                  {currentQuestion.question_type !== 'PYTHON_TECHNICAL' && currentQuestion.code_language !== 'python' ? (
                    currentQuestion.supported_databases_json && currentQuestion.supported_databases_json.length > 1 ? (
                      <div className="flex items-center gap-1 ml-2 bg-[#20242e] border border-[#303644] rounded-md px-2 py-0.5">
                        <span className="text-slate-400 text-[11px]">Database:</span>
                        <select
                          value={selectedDatabases[currentQuestion.id] || currentQuestion.supported_databases_json[0]}
                          onChange={(e) => handleDatabaseChange(e.target.value)}
                          className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
                        >
                          {currentQuestion.supported_databases_json.map((dbName) => (
                            <option key={dbName} value={dbName} className="bg-[#14161a] text-white">
                              {dbName}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px] ml-1 bg-[#20242e] border border-[#303644] px-2 py-0.5 rounded">
                        Database: {currentQuestion.database_engine || 'PostgreSQL'}
                      </span>
                    )
                  ) : (
                    <span className="text-slate-400 font-mono text-[11px] ml-1 bg-[#20242e] border border-[#303644] px-2 py-0.5 rounded">
                      Language: Python 3.12
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowResetConfirmModal(true)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-[#20242e] hover:bg-[#282d38] border border-[#303644] transition-colors cursor-pointer"
                    title="Reset code to default template"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Monaco Code Editor */}
              <div className="flex-1 bg-[#121418] relative min-h-0">
                <MonacoEditor
                  height="100%"
                  language={currentQuestion.code_language === 'python' ? 'python' : 'sql'}
                  theme="vs-dark"
                  value={codeAnswers[currentQuestion.id] || ''}
                  onChange={(val) => handleCodeChange(val || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 4,
                    wordWrap: 'on'
                  }}
                />
              </div>

              {/* Console Action Bar */}
              <div className="h-10 bg-[#16181d] border-t border-b border-[#242832] px-3 flex items-center justify-between shrink-0 text-xs">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setConsoleTab('testcase')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      consoleTab === 'testcase'
                        ? 'bg-[#20242e] text-white border border-[#303644]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5 text-slate-400" />
                    <span>Test Cases ({currentQuestion.public_test_cases?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setConsoleTab('testresult')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      consoleTab === 'testresult'
                        ? 'bg-[#20242e] text-white border border-[#303644]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                    <span>
                      Results {(runResults || submitResults) && (
                        <span
                          className={`w-2 h-2 rounded-full inline-block ml-1 ${
                            (submitResults ? submitResults.passed_count === submitResults.total_count : runResults?.success)
                              ? 'bg-emerald-500'
                              : 'bg-rose-500'
                          }`}
                        />
                      )}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRunCode}
                    disabled={isRunning || isSubmitting}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#20242e] hover:bg-[#2a303d] border border-[#303644] text-slate-200 rounded-md font-semibold disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    {isRunning ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Play className="w-3 h-3 text-blue-400" />
                    )}
                    <span>Run Code</span>
                  </button>

                  <button
                    onClick={() => setShowSubmitConfirmModal(true)}
                    disabled={isSubmitting || isRunning}
                    className="flex items-center gap-1.5 px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-bold disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    {isSubmitting ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3" />
                    )}
                    <span>Submit</span>
                  </button>
                </div>
              </div>

              {/* Console Output Drawer: Output Tables / Syntax Error Line Box */}
              <div className="h-60 bg-[#111317] flex flex-col shrink-0 min-h-0 overflow-y-auto p-3.5 font-mono text-xs select-text">
                {consoleTab === 'testcase' && (
                  <div className="space-y-3">
                    {currentQuestion.public_test_cases && currentQuestion.public_test_cases.length > 0 ? (
                      <>
                        <div className="flex items-center gap-2">
                          {currentQuestion.public_test_cases.map((tc, idx) => (
                            <button
                              key={tc.id}
                              onClick={() => setActiveTestCaseIdx(idx)}
                              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                                activeTestCaseIdx === idx
                                  ? 'bg-blue-600 text-white font-bold'
                                  : 'bg-[#1a1e27] text-slate-400 hover:text-slate-200 border border-[#242832]'
                              }`}
                            >
                              Case {idx + 1}
                            </button>
                          ))}
                        </div>

                        {currentQuestion.public_test_cases[activeTestCaseIdx] && (
                          <div className="space-y-2 text-[11px]">
                            <div>
                              <span className="text-slate-500 block mb-1">Test Name:</span>
                              <span className="text-slate-300 font-bold">
                                {currentQuestion.public_test_cases[activeTestCaseIdx].name}
                              </span>
                            </div>

                            {/* Render Test Case Expected Output as Table (Requirement 3) */}
                            {(() => {
                              const tcExpectedRows = normalizeRows(currentQuestion.public_test_cases[activeTestCaseIdx].expected_output_json);
                              const tcCols = tcExpectedRows.length > 0 ? Object.keys(tcExpectedRows[0]) : [];

                              if (tcExpectedRows.length > 0) {
                                return (
                                  <div>
                                    <span className="text-slate-400 block mb-1 font-semibold">Expected Output Table:</span>
                                    <div className="overflow-x-auto bg-[#17191f] border border-[#242832] rounded">
                                      <table className="w-full text-left font-mono text-[11px] border-collapse">
                                        <thead>
                                          <tr className="border-b border-[#242832] text-slate-400 bg-[#14161a]">
                                            {tcCols.map((k) => (
                                              <th key={k} className="py-1 px-2.5 font-semibold text-emerald-400">{k}</th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {tcExpectedRows.map((row: any, rIdx: number) => (
                                            <tr key={rIdx} className="border-b border-[#1c202a]">
                                              {tcCols.map((k) => (
                                                <td key={k} className="py-1 px-2.5 text-slate-200">{String(row[k] ?? '')}</td>
                                              ))}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-slate-500 py-4 text-center">
                        No public sample test cases configured for this question.
                      </div>
                    )}
                  </div>
                )}

                {consoleTab === 'testresult' && (
                  <div className="space-y-3">
                    {/* Execution Summary Header Banner */}
                    {submitResults ? (
                      <div
                        className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                          submitResults.passed_count === submitResults.total_count
                            ? 'bg-emerald-950/40 border-emerald-600/70 text-emerald-300'
                            : 'bg-amber-950/40 border-amber-600/70 text-amber-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {submitResults.passed_count === submitResults.total_count ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                          )}
                          <span className="font-bold">
                            {submitResults.passed_count === submitResults.total_count
                              ? 'Accepted — All Test Cases Passed!'
                              : 'Partially Correct'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 font-mono">
                          <span>
                            Passed: <strong>{submitResults.passed_count} / {submitResults.total_count}</strong>
                          </span>
                          <span>
                            Score: <strong>{submitResults.score} / {submitResults.max_score} pts</strong>
                          </span>
                        </div>
                      </div>
                    ) : runResults ? (
                      <div
                        className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                          runResults.success
                            ? 'bg-emerald-950/40 border-emerald-600/70 text-emerald-300'
                            : 'bg-rose-950/40 border-rose-600/70 text-rose-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {runResults.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400" />
                          )}
                          <span className="font-bold">
                            {runResults.success ? 'All Public Test Cases Passed' : 'Test Execution Failed'}
                          </span>
                        </div>

                        <span className="text-[11px] font-mono text-slate-400">
                          {runResults.message}
                        </span>
                      </div>
                    ) : (
                      <div className="text-slate-500 py-6 text-center">
                        Click <strong className="text-slate-300">Run Code</strong> to test against public cases, or <strong className="text-emerald-400">Submit</strong> for full assessment evaluation.
                      </div>
                    )}

                    {/* Results Details / Structured Syntax Error Box / Output Tables */}
                    {(runResults || submitResults) && (
                      <div className="space-y-2">
                        {((submitResults?.results || runResults?.results) || []).map((r: any, idx: number) => {
                          const hasError = !r.passed && Boolean(r.error);
                          const activeEngine = selectedDatabases[currentQuestion.id] || currentQuestion.database_engine || 'PostgreSQL';

                          const actualRows = normalizeRows(r.actual_output);
                          const actualCols = actualRows.length > 0 ? Object.keys(actualRows[0]) : [];

                          const expectedRows = normalizeRows(r.expected_output);
                          const expectedCols = expectedRows.length > 0 ? Object.keys(expectedRows[0]) : [];

                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg border text-xs space-y-2 ${
                                r.passed
                                  ? 'bg-[#17191f] border-emerald-900/50'
                                  : 'bg-rose-950/30 border-rose-800/60'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-200">{r.test_name}</span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    r.passed
                                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                                  }`}
                                >
                                  {r.passed ? 'PASSED' : 'FAILED'}
                                </span>
                              </div>

                              {/* Structured Error Diagnostics Box */}
                              {hasError && (
                                <div className="space-y-1.5 pt-1">
                                  <div className="flex items-center gap-2 text-rose-400 font-bold text-[11px]">
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                    <span>{activeEngine} {r.error_type || 'Execution Error'}</span>
                                    {r.error_line && (
                                      <span className="bg-rose-900/90 border border-rose-600 text-white px-2 py-0.2 rounded text-[10px]">
                                        Line {r.error_line}{r.error_column ? `, Col ${r.error_column}` : ''}
                                      </span>
                                    )}
                                  </div>

                                  <div className="p-2.5 bg-[#121418] border border-rose-900/60 rounded text-rose-200 text-[11px] font-mono whitespace-pre-wrap">
                                    <div className="text-rose-300 font-bold mb-1">
                                      Message: {r.error}
                                    </div>
                                    {r.error_line && (
                                      <div className="text-slate-400 text-[10px] mt-1 pt-1 border-t border-rose-950">
                                        Check line {r.error_line} in your SQL editor for syntax validity or missing keyword clauses.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* HTML Output Tables (Requirement 3) */}
                              {!hasError && actualRows.length > 0 && (
                                <div className="space-y-2 pt-1 text-[11px]">
                                  <div>
                                    <span className="text-slate-400 block mb-1 font-semibold">Your Query Output:</span>
                                    <div className="overflow-x-auto bg-[#121418] rounded border border-[#242832]">
                                      <table className="w-full text-left font-mono text-[11px] border-collapse">
                                        <thead>
                                          <tr className="border-b border-[#242832] text-slate-400 bg-[#16181d]">
                                            {actualCols.map((k) => (
                                              <th key={k} className="py-1 px-2.5 font-semibold text-sky-400">{k}</th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {actualRows.slice(0, 10).map((row: any, rIdx: number) => (
                                            <tr key={rIdx} className="border-b border-[#1c202a]">
                                              {actualCols.map((k) => (
                                                <td key={k} className="py-1 px-2.5 text-slate-300">{String(row[k] ?? '')}</td>
                                              ))}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>

                                  {expectedRows.length > 0 && (
                                    <div>
                                      <span className="text-slate-400 block mb-1 font-semibold">Expected Output:</span>
                                      <div className="overflow-x-auto bg-[#121418] rounded border border-[#242832]">
                                        <table className="w-full text-left font-mono text-[11px] border-collapse">
                                          <thead>
                                            <tr className="border-b border-[#242832] text-slate-400 bg-[#16181d]">
                                              {expectedCols.map((k) => (
                                                <th key={k} className="py-1 px-2.5 font-semibold text-emerald-400">{k}</th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {expectedRows.slice(0, 10).map((row: any, rIdx: number) => (
                                              <tr key={rIdx} className="border-b border-[#1c202a]">
                                                {expectedCols.map((k) => (
                                                  <td key={k} className="py-1 px-2.5 text-slate-200 font-bold">{String(row[k] ?? '')}</td>
                                                ))}
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* WEBCAM FLOATING PREVIEW */}
      {hasCameraPermission && (
        <div className="fixed bottom-4 right-4 w-32 h-24 bg-black rounded-lg overflow-hidden border border-[#383838] shadow-2xl z-40">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <div className="absolute top-1 left-1 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>REC</span>
          </div>
        </div>
      )}

      {/* FULLSCREEN PROMPT MODAL */}
      {showFullscreenPrompt && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#181a20] border border-[#2d323e] rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <Maximize className="w-10 h-10 text-blue-500 mx-auto" />
            <h3 className="text-base font-bold text-white">Full-Screen Mode Required</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              This assessment requires mandatory full-screen mode for test integrity. Navigating away or exiting full-screen will be flagged as a security violation.
            </p>
            <button
              onClick={handleEnterFullscreen}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Enter Full Screen & Begin
            </button>
          </div>
        </div>
      )}

      {/* VIOLATION WARNING MODAL */}
      {showViolationWarningModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#181a20] border border-rose-600/80 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="text-base font-bold text-white">Security Integrity Notice</h3>
            <p className="text-xs text-rose-200 leading-relaxed">{violationWarningText}</p>
            {!isAssessmentTerminated && (
              <button
                onClick={() => setShowViolationWarningModal(false)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                I Understand & Acknowledge
              </button>
            )}
          </div>
        </div>
      )}

      {/* PAUSE & EXIT CONFIRMATION MODAL */}
      {showExitConfirmModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#181a20] border border-[#2d323e] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <PauseCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Pause & Exit Assessment?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your written SQL/Python solutions, drafted queries, and remaining time ({timeLeft !== null ? formatTimer(timeLeft) : '00:00'}) will be securely saved.
            </p>
            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-200 text-[11px] leading-normal">
              Your attempt status will be recorded as <strong>Interrupted / Paused</strong>. Your administrator will be able to re-enable your session so you can continue where you left off.
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#282d38]">
              <button
                onClick={() => setShowExitConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-[#20242e] hover:bg-[#2a303d] rounded-lg transition-colors cursor-pointer"
              >
                Cancel & Keep Working
              </button>
              <button
                onClick={handlePauseAndExit}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Save & Pause Session</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET CODE CONFIRMATION MODAL (Requirement 17) */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#181a20] border border-[#2d323e] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <RotateCcw className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Reset your code?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will remove your current code for this question and restore the initial template.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#282d38]">
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-[#20242e] hover:bg-[#2a303d] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResetCode}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT SOLUTION CONFIRMATION MODAL (Requirement 9) */}
      {showSubmitConfirmModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#181a20] border border-[#2d323e] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-blue-400">
              <Upload className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Submit solution?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your solution will be evaluated against all test cases and your score will be updated.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#282d38]">
              <button
                onClick={() => setShowSubmitConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-[#20242e] hover:bg-[#2a303d] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitCode}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Submit Solution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINISH ASSESSMENT CONFIRMATION MODAL (Requirement 18) */}
      {showFinishConfirmModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#181a20] border border-[#2d323e] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Finish Assessment?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to finish this assessment?
            </p>

            <div className="bg-[#121418] border border-[#242832] rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Total Questions:</span>
                <strong className="text-white">{questions.length}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Questions Answered:</span>
                <strong className="text-emerald-400 font-mono">
                  {answeredCount} of {questions.length}
                </strong>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Questions Unanswered:</span>
                <strong className="text-rose-400 font-mono">
                  {questions.length - answeredCount}
                </strong>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Flagged for Review:</span>
                <strong className="text-amber-400 font-mono">
                  {flaggedCount}
                </strong>
              </div>
              <div className="flex items-center justify-between text-slate-400 border-t border-[#242832] pt-1.5">
                <span>Time Remaining:</span>
                <strong className="text-blue-400 font-mono">
                  {timeLeft !== null ? formatTimer(timeLeft) : '00:00'}
                </strong>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              Warning: Once finished, the test will be submitted and your final score will be recorded.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#282d38]">
              <button
                onClick={() => setShowFinishConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-[#20242e] hover:bg-[#2a303d] rounded-lg transition-colors cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={handleFinishAssessment}
                disabled={isFinishing}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isFinishing ? 'Submitting...' : 'Finish Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentAssessmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#0e1015] text-slate-400 gap-2 font-mono text-xs">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading Candidate Assessment...</span>
        </div>
      }
    >
      <StudentAssessmentContent />
    </Suspense>
  );
}
