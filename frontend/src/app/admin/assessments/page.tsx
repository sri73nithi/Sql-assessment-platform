'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ApiClient from '@/services/api';
import {
  Copy,
  ExternalLink,
  UserPlus,
  MoreHorizontal,
  Plus,
  Clock,
  CheckCircle,
  FileText,
  Search,
  Filter,
  RotateCcw,
  ChevronDown,
  Trash2,
  Edit2,
  Info,
  Check,
  Calendar,
  Layers,
  ChevronRight,
  ClipboardList,
  ArrowLeft,
  X,
  Eye,
  Archive,
  Sparkles,
  Send,
  UserCheck,
  RefreshCw,
  AlertCircle,
  BarChart2,
  Sliders,
  CheckSquare,
  Square,
  Minus,
  Download,
  Users,
  BookOpen,
  Code2,
  Database,
  BookMarked,
  Shield,
  ShieldAlert,
  Monitor,
  Camera,
  Mic,
  Fingerprint,
  Globe,
  Lock,
  AlertTriangle,
  FileSpreadsheet,
  SlidersHorizontal,
  BarChart3,
  Star,
  TrendingUp,
  Award,
  MessageSquare,
  HelpCircle,
  Activity,
  CheckCircle2,
  PieChart,
  Gauge,
  Mail,
  Upload,
  History,
  Play,
  PauseCircle
} from 'lucide-react';

interface InterviewDetail {
  scheduled_at?: string;
  interviewer?: string;
  interviewer_email?: string;
  meeting_link?: string;
  notes?: string;
}

interface CandidateRow {
  id: string;
  student_id: string;
  name: string;
  email: string;
  student_id_code?: string;
  assigned_at?: string;
  started_at?: string;
  finished_at?: string;
  finishedAt?: string;
  status: string;
  integrity_index: string;
  integrityIndex?: string;
  integrity_score: number;
  attempt_percentage: number;
  attemptPercentage?: number;
  total_score: number;
  max_score: number;
  percentage: number;
  time_taken_minutes?: number;
  time_extension_minutes: number;
  interview_details?: InterviewDetail | null;
  proctoring_violations_count: number;
  active_attempt_number?: number;
  re_enable_reason?: string;
}

interface QuestionLink {
  id: string;
  title: string;
  marks?: number;
  type?: string;
  difficulty?: string;
  question_type?: string;
  code_language?: string;
}

interface AssessmentAdminItem {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  is_poc: boolean;
  created_at?: string;
}

interface AssessmentItem {
  id: string;
  title: string;
  description?: string;
  job_role: string;
  duration_minutes: number;
  start_date?: string;
  end_date?: string;
  timezone?: string;
  status: string;
  created_by?: string;
  point_of_contact_id?: string;
  point_of_contact_name?: string;
  point_of_contact_email?: string;
  created_at?: string;
  test_type?: 'Public' | 'Invite only';
  questions?: QuestionLink[];
  admins?: AssessmentAdminItem[];
}

interface StudentOption {
  id: string;
  email: string;
  full_name: string;
}

export default function AdminAssessmentsPage() {
  const defaultAssessments: AssessmentItem[] = [
    {
      id: 'draft-1',
      title: 'Data Engineer test',
      description: 'Domain assessment for Data Engineer candidates',
      job_role: 'Data Engineer',
      duration_minutes: 90,
      status: 'DRAFT',
      created_by: 'Me',
      point_of_contact_name: 'Vinodkumar Chandrasekar',
      test_type: 'Invite only',
      admins: [
        {
          id: 'admin-1',
          user_id: 'u-1',
          name: 'Vinodkumar Chandrasekar',
          email: 'vinodkumar.chandrasekar@agilisium.com',
          role: 'All access',
          is_poc: true
        },
        {
          id: 'admin-2',
          user_id: 'u-2',
          name: 'Monisha R',
          email: 'monisha.r@agilisium.com',
          role: 'All access',
          is_poc: false
        }
      ],
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'draft-2',
      title: 'Data Engineer test',
      description: 'Advanced SQL pipeline and schema validation',
      job_role: 'Data Engineer',
      duration_minutes: 90,
      status: 'DRAFT',
      created_by: 'Me',
      point_of_contact_name: 'Vinodkumar Chandrasekar',
      test_type: 'Invite only',
      admins: [
        {
          id: 'admin-1',
          user_id: 'u-1',
          name: 'Vinodkumar Chandrasekar',
          email: 'vinodkumar.chandrasekar@agilisium.com',
          role: 'All access',
          is_poc: true
        }
      ],
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'draft-3',
      title: 'Data Engineer Assessment 2026',
      description: 'Comprehensive window functions and CTE test',
      job_role: 'Data Engineer',
      duration_minutes: 90,
      status: 'DRAFT',
      created_by: 'Me',
      point_of_contact_name: 'Vinodkumar Chandrasekar',
      test_type: 'Invite only',
      admins: [
        {
          id: 'admin-1',
          user_id: 'u-1',
          name: 'Vinodkumar Chandrasekar',
          email: 'vinodkumar.chandrasekar@agilisium.com',
          role: 'All access',
          is_poc: true
        }
      ],
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'ongoing-1',
      title: 'Senior SQL Developer Assessment',
      description: 'Active battle streak calculation and window functions',
      job_role: 'Senior SQL Developer',
      duration_minutes: 120,
      status: 'PUBLISHED',
      created_by: 'Me',
      point_of_contact_name: 'Vinodkumar Chandrasekar',
      test_type: 'Invite only',
      admins: [
        {
          id: 'admin-1',
          user_id: 'u-1',
          name: 'Vinodkumar Chandrasekar',
          email: 'vinodkumar.chandrasekar@agilisium.com',
          role: 'All access',
          is_poc: true
        }
      ],
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'ongoing-2',
      title: 'Public Data Science & SQL Challenge',
      description: 'Public join query and group aggregation benchmark',
      job_role: 'Data Scientist',
      duration_minutes: 60,
      status: 'PUBLISHED',
      created_by: 'System',
      point_of_contact_name: 'Vinodkumar Chandrasekar',
      test_type: 'Public',
      admins: [
        {
          id: 'admin-1',
          user_id: 'u-1',
          name: 'Vinodkumar Chandrasekar',
          email: 'vinodkumar.chandrasekar@agilisium.com',
          role: 'All access',
          is_poc: true
        }
      ],
      created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'completed-1',
      title: 'Database Architecture Exam - Q1',
      description: 'Completed database normalization and query tuning exam',
      job_role: 'Database Administrator',
      duration_minutes: 150,
      status: 'COMPLETED',
      created_by: 'Me',
      point_of_contact_name: 'Vinodkumar Chandrasekar',
      test_type: 'Invite only',
      admins: [
        {
          id: 'admin-1',
          user_id: 'u-1',
          name: 'Vinodkumar Chandrasekar',
          email: 'vinodkumar.chandrasekar@agilisium.com',
          role: 'All access',
          is_poc: true
        }
      ],
      created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);

  // List filters state (Page 13 of PDF)
  const [statusFilter, setStatusFilter] = useState<'All' | 'Ongoing' | 'Completed' | 'Drafts'>('Drafts');
  const [createdByFilter, setCreatedByFilter] = useState('All');
  const [creationDateFilter, setCreationDateFilter] = useState('Any time');
  const [testTypePublic, setTestTypePublic] = useState(true);
  const [testTypeInviteOnly, setTestTypeInviteOnly] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [assessments, setAssessments] = useState<AssessmentItem[]>(defaultAssessments);
  const [loading, setLoading] = useState(true);

  // Detail view active tabs (Page 1, 2, 3 of PDF)
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'QUESTIONS' | 'SETTINGS' | 'CANDIDATES' | 'TEST ANALYSIS'>('OVERVIEW');
  
  // Settings sub-tabs (Page 2, 11 of PDF)
  const [activeSettingSubTab, setActiveSettingSubTab] = useState<
    'Basic test setting' | 'Proctoring and plagiarism settings' | 'Candidate settings' | 'Email and reports' | 'Advanced settings' | 'Email templates'
  >('Basic test setting');

  // Candidate status filter (Page 2, 3, 12 of PDF)
  const [candidateStatusFilter, setCandidateStatusFilter] = useState<'Test taken' | 'Review pending' | 'Shortlisted' | 'Archived' | 'Test reset' | 'Invited' | 'Interrupted' | 'Retake enabled' | 'All'>('Test taken');
  const [candidatesList, setCandidatesList] = useState<CandidateRow[]>([]);
  const [candidateFilterCounts, setCandidateFilterCounts] = useState<{
    test_taken: number;
    review_pending: number;
    shortlisted: number;
    archived: number;
    test_reset: number;
    invited: number;
    interrupted?: number;
    retake_enabled?: number;
    all: number;
  }>({
    test_taken: 0,
    review_pending: 0,
    shortlisted: 0,
    archived: 0,
    test_reset: 0,
    invited: 0,
    interrupted: 0,
    retake_enabled: 0,
    all: 0
  });
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [candidateToastMsg, setCandidateToastMsg] = useState('');
  const [activeActionsMenuCandidateId, setActiveActionsMenuCandidateId] = useState<string | null>(null);

  // Re-Enable Candidate Test Modal state
  const [showReEnableModal, setShowReEnableModal] = useState(false);
  const [candidateToReEnable, setCandidateToReEnable] = useState<CandidateRow | null>(null);
  const [reEnableAction, setReEnableAction] = useState<'RESUME_PREVIOUS' | 'START_NEW'>('RESUME_PREVIOUS');
  const [reEnableTimeMode, setReEnableTimeMode] = useState<'REMAINING_TIME' | 'FULL_DURATION' | 'ADD_ADDITIONAL_TIME'>('REMAINING_TIME');
  const [reEnableAdditionalMinutes, setReEnableAdditionalMinutes] = useState(30);
  const [reEnableReason, setReEnableReason] = useState('Candidate accidentally closed the browser');
  const [customReEnableReason, setCustomReEnableReason] = useState('');
  const [reEnablingTest, setReEnablingTest] = useState(false);

  // Reset Candidate Test Modal state
  const [showResetTestModal, setShowResetTestModal] = useState(false);
  const [candidateToReset, setCandidateToReset] = useState<CandidateRow | null>(null);
  const [resettingCandidates, setResettingCandidates] = useState(false);

  // Extend Candidate Time Modal state
  const [showExtendTimeModal, setShowExtendTimeModal] = useState(false);
  const [candidateToExtendTime, setCandidateToExtendTime] = useState<CandidateRow | null>(null);
  const [extendMinutes, setExtendMinutes] = useState(30);
  const [extendReason, setExtendReason] = useState('Accommodation');
  const [extendingTime, setExtendingTime] = useState(false);

  // Schedule Interview Modal state
  const [showScheduleInterviewModal, setShowScheduleInterviewModal] = useState(false);
  const [interviewTargetCandidate, setInterviewTargetCandidate] = useState<CandidateRow | null>(null);
  const [interviewDate, setInterviewDate] = useState('2026-06-25');
  const [interviewTime, setInterviewTime] = useState('11:00 AM');
  const [interviewerName, setInterviewerName] = useState('Vinodkumar Chandrasekar');
  const [interviewerEmail, setInterviewerEmail] = useState('');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/abc-defg-hij');
  const [interviewNotes, setInterviewNotes] = useState('Technical screening round');
  const [schedulingInterview, setSchedulingInterview] = useState(false);

  // Request Reports Dropdown state
  const [showReportsDropdown, setShowReportsDropdown] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);

  // Candidate Drilldown Modal state
  const [showCandidateDrilldownModal, setShowCandidateDrilldownModal] = useState(false);
  const [selectedCandidateDetail, setSelectedCandidateDetail] = useState<any | null>(null);
  const [loadingCandidateDrilldown, setLoadingCandidateDrilldown] = useState(false);
  const [candidateDrilldownTab, setCandidateDrilldownTab] = useState<'PERFORMANCE' | 'PROCTORING' | 'ATTEMPT_HISTORY' | 'INTERVIEW'>('PERFORMANCE');

  // Test Analysis sub-tabs (Page 3 of PDF)
  const [activeAnalysisSubTab, setActiveAnalysisSubTab] = useState<'Test analytics' | 'Question analytics' | 'Candidates feedback'>('Test analytics');

  // Admin POC management (Page 1 of PDF) & Test Admins live state
  const [pointOfContact, setPointOfContact] = useState('Vinodkumar Chandrasekar');
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [adminDirectoryUsers, setAdminDirectoryUsers] = useState<{ id: string; email: string; full_name: string; role: string }[]>([]);
  const [selectedDirectoryUserId, setSelectedDirectoryUserId] = useState<string>('');
  const [adminNameInput, setAdminNameInput] = useState('');
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminRoleInput, setAdminRoleInput] = useState('All access');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [adminModalError, setAdminModalError] = useState('');
  const [adminToastMsg, setAdminToastMsg] = useState('');

  // Remove Admin confirmation modal
  const [showRemoveAdminModal, setShowRemoveAdminModal] = useState(false);
  const [adminToRemove, setAdminToRemove] = useState<AssessmentAdminItem | null>(null);
  const [removingAdmin, setRemovingAdmin] = useState(false);
  const [changingPoc, setChangingPoc] = useState(false);

  // Overview Questions & Duration Live Controls
  const [adjustingSection, setAdjustingSection] = useState<string | null>(null);
  const [showAdjustQuestionsModal, setShowAdjustQuestionsModal] = useState(false);
  const [targetMcqCount, setTargetMcqCount] = useState(3);
  const [targetPythonCount, setTargetPythonCount] = useState(1);
  const [targetSqlCount, setTargetSqlCount] = useState(2);
  const [targetDifficulty, setTargetDifficulty] = useState('MEDIUM');
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [tempDuration, setTempDuration] = useState(90);

  // Redesigned Candidate Invitation Modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteTab, setInviteTab] = useState<'manual' | 'csv'>('manual');
  const [candidatesToInvite, setCandidatesToInvite] = useState<string[]>([]);
  const [manualEmailInput, setManualEmailInput] = useState('');
  const [manualEmailError, setManualEmailError] = useState('');
  const [csvUploadSummary, setCsvUploadSummary] = useState<{
    totalRows: number;
    validCount: number;
    invalidCount: number;
    duplicateCount: number;
    invalidEmails: string[];
  } | null>(null);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteResult, setInviteResult] = useState<any | null>(null);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // 3-Step Create Test Wizard state (Pages 5, 6, 7, 8 of PDF)
  const [showCreateTestWizard, setShowCreateTestWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [assessmentType, setAssessmentType] = useState('Technical Assessments');
  const [selectedJobRole, setSelectedJobRole] = useState('Data Engineer');
  const [wizardQuestionType, setWizardQuestionType] = useState<'MCQ' | 'TECHNICAL' | 'BOTH'>('BOTH');
  const [wizardMcqCount, setWizardMcqCount] = useState<number>(5);
  const [wizardSqlCount, setWizardSqlCount] = useState<number>(3);
  const [wizardPythonCount, setWizardPythonCount] = useState<number>(2);
  const [wizardSqlDialect, setWizardSqlDialect] = useState<'PostgreSQL' | 'MySQL'>('PostgreSQL');
  const [creationMode, setCreationMode] = useState<'Automatically' | 'Manually'>('Automatically');
  const [recommendedSkills, setRecommendedSkills] = useState<string[]>(['Python', 'SQL', 'Algorithms', 'Data Structures', 'Data Science']);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [testNameInput, setTestNameInput] = useState('Data Engineer test');
  const [experienceYears, setExperienceYears] = useState('0 - 4 years');
  const [testDurationInput, setTestDurationInput] = useState(90);
  const [selectedTags, setSelectedTags] = useState<string[]>(['SQL Normalization', 'SQL Queries']);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [creatingTest, setCreatingTest] = useState(false);
  const [wizardError, setWizardError] = useState('');

  // Modals for Questions Management
  const [showCreateQuestionModal, setShowCreateQuestionModal] = useState(false);
  const [showChooseFromLibraryModal, setShowChooseFromLibraryModal] = useState(false);
  const [showQuestionEditorModal, setShowQuestionEditorModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);

  // New Question Form state
  const [newQType, setNewQType] = useState<'MCQ' | 'SQL_TECHNICAL' | 'PYTHON_TECHNICAL'>('SQL_TECHNICAL');
  const [newQTitle, setNewQTitle] = useState('');
  const [newQProblem, setNewQProblem] = useState('');
  const [newQTask, setNewQTask] = useState('');
  const [newQDifficulty, setNewQDifficulty] = useState('MEDIUM');
  const [newQMarks, setNewQMarks] = useState(10);
  const [newQCorrectAnswer, setNewQCorrectAnswer] = useState('A');
  const [newQExplanation, setNewQExplanation] = useState('');
  const [newQMcqOptions, setNewQMcqOptions] = useState([
    { id: 'A', text: 'Option A' },
    { id: 'B', text: 'Option B' },
    { id: 'C', text: 'Option C' },
    { id: 'D', text: 'Option D' }
  ]);
  const [newQSchemaDDL, setNewQSchemaDDL] = useState('CREATE TABLE sample (id INT, name VARCHAR(50));');
  const [newQSeedData, setNewQSeedData] = useState('INSERT INTO sample VALUES (1, "Test");');
  const [newQRefSQL, setNewQRefSQL] = useState('SELECT * FROM sample;');
  const [newQCodeLanguage, setNewQCodeLanguage] = useState('python');
  const [newQFunctionSig, setNewQFunctionSig] = useState('def solution(data):\n    # Write your code here\n    return data');

  // Library modal states
  const [libraryQuestions, setLibraryQuestions] = useState<any[]>([]);
  const [selectedLibQuestionIds, setSelectedLibQuestionIds] = useState<string[]>([]);
  const [libFilterType, setLibFilterType] = useState('ALL');
  const [libDifficultyFilter, setLibDifficultyFilter] = useState('ALL');
  const [libSearchQuery, setLibSearchQuery] = useState('');
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Proctoring and Security state
  const [proctoringConfig, setProctoringConfig] = useState({
    fullscreen_required: true,
    tab_switch_detection: true,
    max_tab_violations: 3,
    copy_paste_restricted: true,
    webcam_proctoring: true,
    audio_proctoring: false,
    plagiarism_detection: true,
    similarity_threshold: 80,
    external_similarity_check: false,
    ip_restriction_enabled: false,
    allowed_ips: ['127.0.0.1', '192.168.1.0/24'],
    geo_fencing_enabled: false,
    allowed_countries: ['US', 'IN']
  });
  const [newIpInput, setNewIpInput] = useState('');
  const [newCountryInput, setNewCountryInput] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  // Proctoring report modal
  const [proctoringReports, setProctoringReports] = useState<any[]>([]);
  const [selectedCandidateReport, setSelectedCandidateReport] = useState<any | null>(null);
  const [showProctoringReportModal, setShowProctoringReportModal] = useState(false);

  const availableTagOptions = [
    'SQL Normalization',
    'SQL Queries',
    'SQL Query Debugging',
    'SQL Query Testing and Validation',
    'SQL Server',
    'Window Functions',
    'CTE Expressions',
    'Python Data Transformations'
  ];

  const [copiedLink, setCopiedLink] = useState(false);

  const fetchAdminDirectoryUsers = async () => {
    try {
      const users = await ApiClient.get<any[]>('/api/assessments/admin-directory/users');
      setAdminDirectoryUsers(users || []);
    } catch (err: any) {
      console.error('Failed to load admin directory:', err);
    }
  };

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get<AssessmentItem[]>('/api/assessments');
      if (data && data.length > 0) {
        const formattedData = data.map((item, idx) => ({
          ...item,
          test_type: item.test_type || ((idx % 2 === 0) ? 'Invite only' : 'Public') as any,
          created_by: item.created_by || 'Me',
          created_at: item.start_date || item.created_at || new Date().toISOString()
        }));
        setAssessments(formattedData);
      } else {
        setAssessments(defaultAssessments);
      }
    } catch (err: any) {
      console.error('Failed to load assessments:', err);
      setAssessments(defaultAssessments);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssessment?.id) return;
    setAdminModalError('');
    setAddingAdmin(true);

    try {
      const payload: any = {
        role: adminRoleInput || 'All access'
      };
      if (selectedDirectoryUserId && selectedDirectoryUserId !== 'new') {
        payload.user_id = selectedDirectoryUserId;
        const found = adminDirectoryUsers.find((u) => u.id === selectedDirectoryUserId);
        if (found) {
          payload.email = found.email;
          payload.name = found.full_name;
        }
      } else {
        if (!adminEmailInput.trim()) {
          setAdminModalError('Please enter a valid email address.');
          setAddingAdmin(false);
          return;
        }
        payload.email = adminEmailInput.trim();
        payload.name = adminNameInput.trim() || undefined;
      }

      const updatedAssessment = await ApiClient.post<AssessmentItem>(
        `/api/assessments/${selectedAssessment.id}/admins`,
        payload
      );

      // Update assessment state
      setAssessments((prev) =>
        prev.map((a) => (a.id === updatedAssessment.id ? { ...a, ...updatedAssessment } : a))
      );
      if (updatedAssessment.point_of_contact_name) {
        setPointOfContact(updatedAssessment.point_of_contact_name);
      }

      setShowAddAdminModal(false);
      setAdminNameInput('');
      setAdminEmailInput('');
      setSelectedDirectoryUserId('');
      setAdminRoleInput('All access');
      setAdminToastMsg('Administrator added to assessment successfully!');
      setTimeout(() => setAdminToastMsg(''), 3500);
      fetchAdminDirectoryUsers();
    } catch (err: any) {
      setAdminModalError(err.message || 'Failed to add administrator.');
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleChangePointOfContact = async (userNameOrId: string) => {
    if (!selectedAssessment?.id || !userNameOrId) return;
    setChangingPoc(true);
    try {
      const payload: any = {};
      const targetAdmin = (selectedAssessment.admins || []).find(
        (a) => a.user_id === userNameOrId || a.name === userNameOrId || a.email === userNameOrId
      );

      if (targetAdmin) {
        payload.user_id = targetAdmin.user_id;
      } else {
        payload.email = userNameOrId;
      }

      const updatedAssessment = await ApiClient.put<AssessmentItem>(
        `/api/assessments/${selectedAssessment.id}/point-of-contact`,
        payload
      );

      setAssessments((prev) =>
        prev.map((a) => (a.id === updatedAssessment.id ? { ...a, ...updatedAssessment } : a))
      );
      setPointOfContact(updatedAssessment.point_of_contact_name || targetAdmin?.name || userNameOrId);
      setAdminToastMsg('Point of contact updated successfully!');
      setTimeout(() => setAdminToastMsg(''), 3500);
    } catch (err: any) {
      alert('Failed to update Point of contact: ' + (err.message || err));
    } finally {
      setChangingPoc(false);
    }
  };

  const handleConfirmRemoveAdmin = async () => {
    if (!selectedAssessment?.id || !adminToRemove) return;
    setRemovingAdmin(true);
    try {
      const updatedAssessment = await ApiClient.delete<AssessmentItem>(
        `/api/assessments/${selectedAssessment.id}/admins/${adminToRemove.user_id}`
      );

      setAssessments((prev) =>
        prev.map((a) => (a.id === updatedAssessment.id ? { ...a, ...updatedAssessment } : a))
      );
      if (updatedAssessment.point_of_contact_name) {
        setPointOfContact(updatedAssessment.point_of_contact_name);
      }
      setShowRemoveAdminModal(false);
      setAdminToRemove(null);
      setAdminToastMsg('Administrator removed from assessment.');
      setTimeout(() => setAdminToastMsg(''), 3500);
    } catch (err: any) {
      alert('Failed to remove admin: ' + (err.message || err));
    } finally {
      setRemovingAdmin(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const data = await ApiClient.get<StudentOption[]>('/api/students');
      setStudents(data);
      if (data.length > 0) setSelectedStudentId(data[0].id);
    } catch (err: any) {
      console.error('Failed to load students for assignment:', err);
    }
  };

  // Candidate Settings state
  const [candidateSettings, setCandidateSettings] = useState({
    start_end_window_enforced: true,
    allow_resume_unfinished: true,
    max_attempts: 1,
    allow_free_navigation: true,
    allow_revisit_previous: true,
    allow_unanswered_submission: true,
    time_expired_action: 'AUTO_SUBMIT',
    show_score_immediately: true,
    show_incorrect_questions: true
  });

  // Email and Reports Settings state
  const [emailReportsSettings, setEmailReportsSettings] = useState({
    send_invitation: true,
    send_reminder: true,
    send_started: false,
    send_submitted: true,
    send_completed: true,
    send_expired: false,
    include_scores: true,
    include_percentage: true,
    include_time_taken: true,
    include_question_breakdown: true,
    include_testcase_results: true,
    include_proctoring_violations: true,
    include_plagiarism_flags: true
  });

  // Advanced Settings state
  const [advancedSettings, setAdvancedSettings] = useState({
    assessment_enabled: true,
    start_date: '2026-06-01T09:00',
    end_date: '2026-06-30T18:00',
    duration_minutes: 90,
    timezone: 'Asia/Kolkata',
    auto_close_after_end_time: true,
    randomize_question_order: false,
    randomize_mcq_options: false,
    allow_revisit_questions: true,
    prevent_duplicate_questions: true,
    allowed_languages: ['sql', 'python'],
    run_code_enabled: true,
    submit_code_enabled: true,
    custom_input_enabled: true,
    max_submission_attempts: 10,
    execution_time_limit_sec: 5,
    memory_limit_mb: 256
  });

  // Email Templates state
  const [activeEmailTemplateKey, setActiveEmailTemplateKey] = useState<
    'invitation' | 'reminder' | 'started' | 'submitted' | 'completed' | 'expired'
  >('invitation');

  const defaultTemplatesMap = {
    invitation: {
      subject: 'Invitation to take {{assessment_name}}',
      body: 'Hello {{candidate_name}},\n\nYou have been invited to attempt the assessment: {{assessment_name}}.\n\nAssessment Details:\n- Duration: {{duration}} minutes\n- Start Window: {{start_date}}\n- End Window: {{end_date}}\n- Timezone: {{timezone}}\n\nClick the link below to begin your test:\n{{assessment_link}}\n\nBest regards,\nAgilisium Assessment Team',
      sender_name: 'Agilisium Assessment Team',
      sender_email: 'evaluations@agilisium.com'
    },
    reminder: {
      subject: 'Reminder: Upcoming test {{assessment_name}}',
      body: 'Hello {{candidate_name}},\n\nThis is a gentle reminder that your assessment {{assessment_name}} is awaiting your completion.\n\n- Assessment Ends: {{end_date}}\n- Duration: {{duration}} minutes\n\nClick here to begin your assessment:\n{{assessment_link}}\n\nBest regards,\nAgilisium Assessment Team',
      sender_name: 'Agilisium Assessment Team',
      sender_email: 'evaluations@agilisium.com'
    },
    started: {
      subject: 'Assessment Started: {{assessment_name}}',
      body: 'Hello {{candidate_name}},\n\nYou have started {{assessment_name}} at {{start_date}}.\nYour test timer of {{duration}} minutes is now active.\n\nIf you need to resume, use this link:\n{{assessment_link}}\n\nGood luck!\nAgilisium Assessment Team',
      sender_name: 'Agilisium Assessment Team',
      sender_email: 'evaluations@agilisium.com'
    },
    submitted: {
      subject: 'Assessment Submitted: {{assessment_name}}',
      body: 'Hello {{candidate_name}},\n\nYour assessment {{assessment_name}} has been received for evaluation.\nOur scoring engine will process your results.\n\nThank you,\nAgilisium Assessment Team',
      sender_name: 'Agilisium Assessment Team',
      sender_email: 'evaluations@agilisium.com'
    },
    completed: {
      subject: 'Results Available: {{assessment_name}}',
      body: 'Hello {{candidate_name}},\n\nYour evaluation results for {{assessment_name}} are ready.\n\nBest regards,\nAgilisium Assessment Team',
      sender_name: 'Agilisium Assessment Team',
      sender_email: 'evaluations@agilisium.com'
    },
    expired: {
      subject: 'Assessment Expired: {{assessment_name}}',
      body: 'Hello {{candidate_name}},\n\nThe scheduled assessment window for {{assessment_name}} expired on {{end_date}}.\n\nBest regards,\nAgilisium Assessment Team',
      sender_name: 'Agilisium Assessment Team',
      sender_email: 'evaluations@agilisium.com'
    }
  };

  const [emailTemplates, setEmailTemplates] = useState<any>(defaultTemplatesMap);
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState(false);
  const [showSendTestEmailModal, setShowSendTestEmailModal] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('admin@assessment.com');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [downloadingAssessmentCsv, setDownloadingAssessmentCsv] = useState(false);

  // Test Analysis & Feedback state
  const [assessmentAnalytics, setAssessmentAnalytics] = useState<any | null>(null);
  const [candidateFeedbacks, setCandidateFeedbacks] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsDateFilter, setAnalyticsDateFilter] = useState<'All Time' | 'Past 24h' | 'Past 7d' | 'Past 30d'>('All Time');
  const [analyticsSkillFilter, setAnalyticsSkillFilter] = useState('ALL');
  const [analyticsDifficultyFilter, setAnalyticsDifficultyFilter] = useState('ALL');
  const [analyticsQuestionTypeFilter, setAnalyticsQuestionTypeFilter] = useState('ALL');
  const [analyticsDiagnosticFilter, setAnalyticsDiagnosticFilter] = useState('ALL');
  const [analyticsSearchQuery, setAnalyticsSearchQuery] = useState('');
  const [selectedAnalyticsQuestion, setSelectedAnalyticsQuestion] = useState<any | null>(null);
  const [showQuestionAnalyticsModal, setShowQuestionAnalyticsModal] = useState(false);

  useEffect(() => {
    fetchAssessments();
    fetchStudents();
  }, []);

  const selectedAssessment = assessments.find((a) => a.id === selectedAssessmentId) || assessments[0] || defaultAssessments[0];

  const fetchAssessmentAnalytics = async (assessmentId?: string) => {
    const id = assessmentId || selectedAssessment?.id;
    if (!id) return;
    setLoadingAnalytics(true);
    try {
      const [analyticsData, feedbackData]: [any, any] = await Promise.all([
        ApiClient.get(`/api/assessments/${id}/detailed-analytics`).catch(() => null),
        ApiClient.get(`/api/assessments/${id}/feedbacks`).catch(() => [])
      ]);
      setAssessmentAnalytics(analyticsData);
      setCandidateFeedbacks(feedbackData || []);
    } catch (err: any) {
      console.error('Failed to load assessment analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (!selectedAssessment) return;

    if (selectedAssessment?.point_of_contact_name) {
      setPointOfContact(selectedAssessment.point_of_contact_name);
    } else if (selectedAssessment?.admins && selectedAssessment.admins.length > 0) {
      const poc = selectedAssessment.admins.find((a) => a.is_poc);
      if (poc) {
        setPointOfContact(poc.name);
      } else {
        setPointOfContact(selectedAssessment.admins[0].name);
      }
    }

    if (activeTab === 'TEST ANALYSIS') {
      fetchAssessmentAnalytics(selectedAssessment.id);
    }

    if (activeTab === 'CANDIDATES') {
      fetchCandidates(selectedAssessment.id, candidateStatusFilter, candidateSearchQuery);
    }

    if ((selectedAssessment as any).proctoring_config_json) {
      setProctoringConfig((prev) => ({
        ...prev,
        ...(selectedAssessment as any).proctoring_config_json
      }));
    }

    if ((selectedAssessment as any).candidate_settings_json) {
      setCandidateSettings((prev) => ({
        ...prev,
        ...(selectedAssessment as any).candidate_settings_json
      }));
    }

    if ((selectedAssessment as any).email_reports_settings_json) {
      setEmailReportsSettings((prev) => ({
        ...prev,
        ...(selectedAssessment as any).email_reports_settings_json
      }));
    }

    if ((selectedAssessment as any).advanced_settings_json) {
      setAdvancedSettings((prev) => ({
        ...prev,
        ...(selectedAssessment as any).advanced_settings_json
      }));
    }

    if ((selectedAssessment as any).email_templates_json) {
      setEmailTemplates((prev: any) => ({
        ...prev,
        ...(selectedAssessment as any).email_templates_json
      }));
    }
  }, [selectedAssessmentId, activeTab, assessments, candidateStatusFilter, candidateSearchQuery]);

  const fetchCandidates = async (assessmentId?: string, filter?: string, search?: string) => {
    const id = assessmentId || selectedAssessment?.id;
    if (!id) return;
    setLoadingCandidates(true);
    try {
      const status = filter !== undefined ? filter : candidateStatusFilter;
      const q = search !== undefined ? search : candidateSearchQuery;
      const params = new URLSearchParams();
      if (status && status !== 'All') {
        params.append('status_filter', status.toLowerCase().replace(/\s+/g, '_'));
      }
      if (q && q.trim()) {
        params.append('search', q.trim());
      }
      const data: any = await ApiClient.get(`/api/assessments/${id}/candidates?${params.toString()}`);
      setCandidatesList(data.candidates || []);
      if (data.counts) {
        setCandidateFilterCounts(data.counts);
      }
    } catch (err: any) {
      console.error('Failed to load candidates:', err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleSelectAllCandidates = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCandidateIds(candidatesList.map((c) => c.id));
    } else {
      setSelectedCandidateIds([]);
    }
  };

  const handleToggleSelectCandidate = (id: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const handleOpenReEnableModal = (c: CandidateRow) => {
    setCandidateToReEnable(c);
    setReEnableAction('RESUME_PREVIOUS');
    setReEnableTimeMode('REMAINING_TIME');
    setReEnableAdditionalMinutes(30);
    setReEnableReason('Candidate accidentally closed the browser');
    setCustomReEnableReason('');
    setShowReEnableModal(true);
    setActiveActionsMenuCandidateId(null);
  };

  const handleConfirmReEnableTest = async () => {
    if (!selectedAssessment?.id || !candidateToReEnable) return;
    setReEnablingTest(true);
    try {
      const payload = {
        assignment_id: candidateToReEnable.id,
        action: reEnableAction,
        time_mode: reEnableTimeMode,
        additional_minutes: reEnableTimeMode === 'ADD_ADDITIONAL_TIME' ? Number(reEnableAdditionalMinutes) : 0,
        reason: reEnableReason,
        custom_reason: reEnableReason === 'Other' ? customReEnableReason : undefined
      };

      const res: any = await ApiClient.post(
        `/api/assessments/${selectedAssessment.id}/candidates/${candidateToReEnable.id}/re-enable`,
        payload
      );

      setShowReEnableModal(false);
      setCandidateToastMsg(res.message || 'Candidate test re-enabled successfully!');
      setTimeout(() => setCandidateToastMsg(''), 4000);

      // Refresh candidates list
      await fetchCandidates(selectedAssessment.id);

      // If drilldown was open, refresh candidate drilldown
      if (showCandidateDrilldownModal) {
        handleOpenCandidateDrilldown(candidateToReEnable.id);
      }
    } catch (err: any) {
      alert('Failed to re-enable test: ' + (err.message || err));
    } finally {
      setReEnablingTest(false);
    }
  };

  const handleOpenResetModal = (c?: CandidateRow) => {
    if (c) {
      setCandidateToReset(c);
      setSelectedCandidateIds([c.id]);
    } else if (selectedCandidateIds.length === 0) {
      alert('Please select at least one candidate to reset test attempt.');
      return;
    } else {
      setCandidateToReset(null);
    }
    setShowResetTestModal(true);
  };

  const handleConfirmResetTest = async () => {
    if (!selectedAssessment?.id || selectedCandidateIds.length === 0) return;
    setResettingCandidates(true);
    try {
      await ApiClient.post(`/api/assessments/${selectedAssessment.id}/candidates/reset-test`, {
        assignment_ids: selectedCandidateIds
      });
      setShowResetTestModal(false);
      setCandidateToReset(null);
      setSelectedCandidateIds([]);
      setCandidateToastMsg('Candidate test attempt successfully reset!');
      setTimeout(() => setCandidateToastMsg(''), 3500);
      await fetchCandidates(selectedAssessment.id);
    } catch (err: any) {
      alert('Failed to reset test: ' + (err.message || err));
    } finally {
      setResettingCandidates(false);
    }
  };

  const handleOpenExtendTimeModal = (c?: CandidateRow) => {
    if (c) {
      setCandidateToExtendTime(c);
      setSelectedCandidateIds([c.id]);
    } else if (selectedCandidateIds.length === 0) {
      alert('Please select at least one candidate to extend assessment time.');
      return;
    } else {
      setCandidateToExtendTime(null);
    }
    setShowExtendTimeModal(true);
  };

  const handleConfirmExtendTime = async () => {
    if (!selectedAssessment?.id || selectedCandidateIds.length === 0) return;
    setExtendingTime(true);
    try {
      await ApiClient.post(`/api/assessments/${selectedAssessment.id}/candidates/extend-time`, {
        assignment_ids: selectedCandidateIds,
        additional_minutes: Number(extendMinutes),
        reason: extendReason
      });
      setShowExtendTimeModal(false);
      setCandidateToExtendTime(null);
      setSelectedCandidateIds([]);
      setCandidateToastMsg(`Successfully extended time by +${extendMinutes} minutes!`);
      setTimeout(() => setCandidateToastMsg(''), 3500);
      await fetchCandidates(selectedAssessment.id);
    } catch (err: any) {
      alert('Failed to extend time: ' + (err.message || err));
    } finally {
      setExtendingTime(false);
    }
  };

  const handleOpenScheduleInterview = (c: CandidateRow) => {
    setInterviewTargetCandidate(c);
    if (c.interview_details) {
      const parts = (c.interview_details.scheduled_at || '').split(' ');
      setInterviewDate(parts[0] || '2026-06-25');
      setInterviewTime(parts.slice(1).join(' ') || '11:00 AM');
      setInterviewerName(c.interview_details.interviewer || pointOfContact || 'Vinodkumar Chandrasekar');
      setInterviewerEmail(c.interview_details.interviewer_email || '');
      setMeetingLink(c.interview_details.meeting_link || 'https://meet.google.com/abc-defg-hij');
      setInterviewNotes(c.interview_details.notes || '');
    } else {
      setInterviewDate('2026-06-25');
      setInterviewTime('11:00 AM');
      setInterviewerName(pointOfContact || 'Vinodkumar Chandrasekar');
      setInterviewerEmail('');
      setMeetingLink('https://meet.google.com/abc-defg-hij');
      setInterviewNotes('Technical screening round - Data Engineering & SQL');
    }
    setShowScheduleInterviewModal(true);
  };

  const handleConfirmScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssessment?.id || !interviewTargetCandidate) return;
    setSchedulingInterview(true);
    try {
      await ApiClient.post(`/api/assessments/${selectedAssessment.id}/candidates/schedule-interview`, {
        assignment_id: interviewTargetCandidate.id,
        interview_date: interviewDate,
        interview_time: interviewTime,
        interviewer_name: interviewerName,
        interviewer_email: interviewerEmail,
        meeting_link: meetingLink,
        notes: interviewNotes
      });
      setShowScheduleInterviewModal(false);
      setInterviewTargetCandidate(null);
      setCandidateToastMsg('Interview scheduled successfully!');
      setTimeout(() => setCandidateToastMsg(''), 3500);
      await fetchCandidates(selectedAssessment.id);
    } catch (err: any) {
      alert('Failed to schedule interview: ' + (err.message || err));
    } finally {
      setSchedulingInterview(false);
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (!selectedAssessment?.id || selectedCandidateIds.length === 0) return;
    try {
      await ApiClient.put(`/api/assessments/${selectedAssessment.id}/candidates/status`, {
        assignment_ids: selectedCandidateIds,
        status: newStatus
      });
      setSelectedCandidateIds([]);
      setCandidateToastMsg(`Candidates status updated to ${newStatus.replace('_', ' ')}!`);
      setTimeout(() => setCandidateToastMsg(''), 3500);
      await fetchCandidates(selectedAssessment.id);
    } catch (err: any) {
      alert('Failed to update status: ' + (err.message || err));
    }
  };

  const handleDownloadCandidateReport = async (reportType: string) => {
    if (!selectedAssessment?.id) return;
    setShowReportsDropdown(false);
    setDownloadingReport(reportType);
    try {
      const filename = `Candidate_Report_${reportType.toLowerCase()}_${selectedAssessment.title.replace(/\s+/g, '_')}.csv`;
      await ApiClient.downloadPostCsv(
        `/api/assessments/${selectedAssessment.id}/candidates/export-reports`,
        {
          assignment_ids: selectedCandidateIds.length > 0 ? selectedCandidateIds : null,
          report_type: reportType,
          status_filter: candidateStatusFilter !== 'All' ? candidateStatusFilter.toLowerCase().replace(/\s+/g, '_') : null
        },
        filename
      );
      setCandidateToastMsg(`Downloaded ${reportType.replace(/_/g, ' ')} successfully!`);
      setTimeout(() => setCandidateToastMsg(''), 3500);
    } catch (err: any) {
      alert('Failed to download report: ' + (err.message || err));
    } finally {
      setDownloadingReport(null);
    }
  };

  const handleOpenCandidateDrilldown = async (assignmentId: string) => {
    if (!selectedAssessment?.id) return;
    setLoadingCandidateDrilldown(true);
    setShowCandidateDrilldownModal(true);
    setCandidateDrilldownTab('PERFORMANCE');
    try {
      const data: any = await ApiClient.get(
        `/api/assessments/${selectedAssessment.id}/candidates/${assignmentId}/details`
      );
      setSelectedCandidateDetail(data);
    } catch (err: any) {
      alert('Failed to fetch candidate details: ' + (err.message || err));
      setShowCandidateDrilldownModal(false);
    } finally {
      setLoadingCandidateDrilldown(false);
    }
  };

  const handleSaveProctoringSettings = async () => {
    if (!selectedAssessment) return;
    setSavingSettings(true);
    try {
      await ApiClient.put(`/api/assessments/${selectedAssessment.id}/settings`, {
        proctoring_config: proctoringConfig
      });
      setSettingsSavedToast(true);
      setTimeout(() => setSettingsSavedToast(false), 3000);
      await fetchAssessments();
    } catch (err: any) {
      alert('Failed to save proctoring settings: ' + (err.message || err));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveCandidateSettings = async () => {
    if (!selectedAssessment) return;
    setSavingSettings(true);
    try {
      await ApiClient.put(`/api/assessments/${selectedAssessment.id}/settings`, {
        candidate_settings: candidateSettings
      });
      setSettingsSavedToast(true);
      setTimeout(() => setSettingsSavedToast(false), 3000);
      await fetchAssessments();
    } catch (err: any) {
      alert('Failed to save candidate settings: ' + (err.message || err));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveEmailReportsSettings = async () => {
    if (!selectedAssessment) return;
    setSavingSettings(true);
    try {
      await ApiClient.put(`/api/assessments/${selectedAssessment.id}/settings`, {
        email_reports_settings: emailReportsSettings
      });
      setSettingsSavedToast(true);
      setTimeout(() => setSettingsSavedToast(false), 3000);
      await fetchAssessments();
    } catch (err: any) {
      alert('Failed to save email & reports settings: ' + (err.message || err));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveAdvancedSettings = async () => {
    if (!selectedAssessment) return;
    setSavingSettings(true);
    try {
      await ApiClient.put(`/api/assessments/${selectedAssessment.id}/settings`, {
        advanced_settings: advancedSettings,
        duration_minutes: advancedSettings.duration_minutes,
        timezone: advancedSettings.timezone,
        start_date: advancedSettings.start_date,
        end_date: advancedSettings.end_date
      });
      setSettingsSavedToast(true);
      setTimeout(() => setSettingsSavedToast(false), 3000);
      await fetchAssessments();
    } catch (err: any) {
      alert('Failed to save advanced settings: ' + (err.message || err));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveEmailTemplates = async () => {
    if (!selectedAssessment) return;
    setSavingSettings(true);
    try {
      await ApiClient.put(`/api/assessments/${selectedAssessment.id}/settings`, {
        email_templates: emailTemplates
      });
      setSettingsSavedToast(true);
      setTimeout(() => setSettingsSavedToast(false), 3000);
      await fetchAssessments();
    } catch (err: any) {
      alert('Failed to save email templates: ' + (err.message || err));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResetEmailTemplate = async (templateKey: string) => {
    if (!selectedAssessment) return;
    try {
      const res: any = await ApiClient.post(`/api/assessments/${selectedAssessment.id}/reset-template`, {
        template_type: templateKey
      });
      if (res?.template) {
        setEmailTemplates({
          ...emailTemplates,
          [templateKey]: res.template
        });
      }
      alert(`Restored standard default template for ${templateKey.toUpperCase()}!`);
    } catch (err: any) {
      alert('Failed to reset template: ' + (err.message || err));
    }
  };

  const handleSendTestEmail = async () => {
    if (!selectedAssessment) return;
    setSendingTestEmail(true);
    try {
      await ApiClient.post(`/api/assessments/${selectedAssessment.id}/send-test-email`, {
        recipient_email: testEmailRecipient,
        template_type: activeEmailTemplateKey,
        template_data: emailTemplates[activeEmailTemplateKey]
      });
      setShowSendTestEmailModal(false);
      alert(`Test email for ${activeEmailTemplateKey.toUpperCase()} successfully dispatched to ${testEmailRecipient}!`);
    } catch (err: any) {
      alert('Failed to dispatch test email: ' + (err.message || err));
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleExportSingleAssessmentCsv = async () => {
    if (!selectedAssessment) return;
    setDownloadingAssessmentCsv(true);
    try {
      await ApiClient.downloadCsv(
        `/api/assessments/${selectedAssessment.id}/export-csv`,
        `Assessment_Results_${selectedAssessment.title.replace(/\s+/g, '_')}.csv`
      );
    } catch (err: any) {
      alert('Failed to export CSV report: ' + (err.message || err));
    } finally {
      setDownloadingAssessmentCsv(false);
    }
  };

  const handleAddIp = () => {
    if (!newIpInput.trim()) return;
    const clean = newIpInput.trim();
    if (!proctoringConfig.allowed_ips.includes(clean)) {
      setProctoringConfig({
        ...proctoringConfig,
        allowed_ips: [...proctoringConfig.allowed_ips, clean]
      });
    }
    setNewIpInput('');
  };

  const handleRemoveIp = (ipToRemove: string) => {
    setProctoringConfig({
      ...proctoringConfig,
      allowed_ips: proctoringConfig.allowed_ips.filter((ip) => ip !== ipToRemove)
    });
  };

  const handleAddCountry = () => {
    if (!newCountryInput.trim()) return;
    const clean = newCountryInput.trim().toUpperCase();
    if (!proctoringConfig.allowed_countries.includes(clean)) {
      setProctoringConfig({
        ...proctoringConfig,
        allowed_countries: [...proctoringConfig.allowed_countries, clean]
      });
    }
    setNewCountryInput('');
  };

  const handleRemoveCountry = (cToRemove: string) => {
    setProctoringConfig({
      ...proctoringConfig,
      allowed_countries: proctoringConfig.allowed_countries.filter((c) => c !== cToRemove)
    });
  };

  const handleOpenProctoringReports = async (candidateId?: string) => {
    if (!selectedAssessment) return;
    try {
      const data: any = await ApiClient.get(`/api/assessments/${selectedAssessment.id}/proctoring-reports`);
      setProctoringReports(data || []);
      if (candidateId) {
        const found = (data || []).find((r: any) => r.student_id === candidateId);
        setSelectedCandidateReport(found || data[0] || null);
      } else {
        setSelectedCandidateReport(data?.[0] || null);
      }
      setShowProctoringReportModal(true);
    } catch (err: any) {
      alert('Failed to load proctoring reports: ' + (err.message || err));
    }
  };

  const handleCopyLink = () => {
    const link = `http://localhost:3000/student/assessment?id=${selectedAssessment?.id || ''}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCreateTestSubmit = async () => {
    setCreatingTest(true);
    setWizardError('');
    try {
      const created = await ApiClient.post<AssessmentItem>('/api/assessments', {
        title: testNameInput || 'Data Engineer test',
        description: `Assessment for ${selectedJobRole} role (${experienceYears})`,
        job_role: selectedJobRole,
        duration_minutes: testDurationInput,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        timezone: 'Asia/Kolkata',
        questions: []
      });

      // Automatically generate questions if selected based on chosen types & counts
      if (creationMode === 'Automatically') {
        const diff = experienceYears.includes('4') ? 'HARD' : 'MEDIUM';
        let sortIndex = 1;

        // 1. Generate MCQ questions if selected
        if ((wizardQuestionType === 'MCQ' || wizardQuestionType === 'BOTH') && wizardMcqCount > 0) {
          try {
            const mcqRes: any = await ApiClient.post('/api/question-generation/generate', {
              job_role: selectedJobRole,
              topic_name: 'SQL',
              difficulty: diff,
              database_engine: wizardSqlDialect,
              question_count: wizardMcqCount,
              question_type: 'MCQ'
            });
            if (mcqRes?.accepted_questions) {
              for (const q of mcqRes.accepted_questions) {
                await ApiClient.post(`/api/assessments/${created.id}/questions`, {
                  question_id: q.id,
                  marks: q.marks || 5,
                  sort_order: sortIndex++
                }).catch(() => {});
              }
            }
          } catch (genErr: any) {
            console.warn('MCQ auto-generation notice:', genErr);
          }
        }

        // 2. Generate SQL technical questions if selected
        if ((wizardQuestionType === 'TECHNICAL' || wizardQuestionType === 'BOTH') && wizardSqlCount > 0) {
          try {
            const sqlRes: any = await ApiClient.post('/api/question-generation/generate', {
              job_role: selectedJobRole,
              topic_name: 'SQL',
              difficulty: diff,
              database_engine: wizardSqlDialect,
              question_count: wizardSqlCount,
              question_type: 'TECHNICAL'
            });
            if (sqlRes?.accepted_questions) {
              for (const q of sqlRes.accepted_questions) {
                await ApiClient.post(`/api/assessments/${created.id}/questions`, {
                  question_id: q.id,
                  marks: q.marks || 10,
                  sort_order: sortIndex++
                }).catch(() => {});
              }
            }
          } catch (genErr: any) {
            console.warn('SQL auto-generation notice:', genErr);
          }
        }

        // 3. Generate Python technical questions if selected
        if ((wizardQuestionType === 'TECHNICAL' || wizardQuestionType === 'BOTH') && wizardPythonCount > 0) {
          try {
            const pyRes: any = await ApiClient.post('/api/question-generation/generate', {
              job_role: selectedJobRole,
              topic_name: 'Python',
              difficulty: diff,
              database_engine: 'python',
              question_count: wizardPythonCount,
              question_type: 'TECHNICAL'
            });
            if (pyRes?.accepted_questions) {
              for (const q of pyRes.accepted_questions) {
                await ApiClient.post(`/api/assessments/${created.id}/questions`, {
                  question_id: q.id,
                  marks: q.marks || 20,
                  sort_order: sortIndex++
                }).catch(() => {});
              }
            }
          } catch (genErr: any) {
            console.warn('Python auto-generation notice:', genErr);
          }
        }
      }

      setShowCreateTestWizard(false);
      setWizardStep(1);
      await fetchAssessments();
      setSelectedAssessmentId(created.id);
    } catch (err: any) {
      setWizardError(err.message || 'Failed to create assessment');
    } finally {
      setCreatingTest(false);
    }
  };

  const [adjustingDifficultySection, setAdjustingDifficultySection] = useState<string | null>(null);

  const getSectionDominantDifficulty = (items: any[]) => {
    if (!items || items.length === 0) return 'EASY';
    const easy = items.filter((q) => (q.difficulty || '').toUpperCase() === 'EASY').length;
    const hard = items.filter((q) => (q.difficulty || '').toUpperCase() === 'HARD').length;
    const med = items.filter((q) => (q.difficulty || '').toUpperCase() === 'MEDIUM').length;
    if (easy >= med && easy >= hard && easy > 0) return 'EASY';
    if (hard >= med && hard >= easy && hard > 0) return 'HARD';
    return 'MEDIUM';
  };

  const handleUpdateSectionDifficulty = async (sectionType: 'MCQ' | 'PYTHON' | 'SQL', newDiff: string) => {
    if (!selectedAssessment) return;
    setAdjustingDifficultySection(sectionType);
    try {
      const qList = selectedAssessment.questions || [];
      const sectionQuestions = qList.filter((q: any) => {
        if (sectionType === 'MCQ') return q.question_type === 'MCQ';
        if (sectionType === 'PYTHON') return q.question_type === 'PYTHON_TECHNICAL' || q.code_language === 'python';
        return q.question_type !== 'MCQ' && q.question_type !== 'PYTHON_TECHNICAL' && q.code_language !== 'python';
      });

      for (const q of sectionQuestions) {
        await ApiClient.put(`/api/questions/${q.id}`, { difficulty: newDiff }).catch(() => {});
      }

      await fetchAssessments();
    } catch (err: any) {
      alert(err.message || 'Failed to update section difficulty');
    } finally {
      setAdjustingDifficultySection(null);
    }
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h} hour${h > 1 ? 's' : ''} ${m} minute${m > 1 ? 's' : ''}`;
    if (h > 0) return `${h} hour${h > 1 ? 's' : ''}`;
    return `${m} minute${m > 1 ? 's' : ''}`;
  };

  const getDifficultyBreakdown = (items: any[]) => {
    if (!items || items.length === 0) return 'None (0)';
    const easy = items.filter((q) => (q.difficulty || '').toUpperCase() === 'EASY').length;
    const med = items.filter((q) => (q.difficulty || '').toUpperCase() === 'MEDIUM').length;
    const hard = items.filter((q) => (q.difficulty || '').toUpperCase() === 'HARD').length;
    const parts = [];
    if (easy > 0) parts.push(`Easy (${easy})`);
    if (med > 0) parts.push(`Medium (${med})`);
    if (hard > 0) parts.push(`Hard (${hard})`);
    return parts.length > 0 ? parts.join(', ') : `Medium (${items.length})`;
  };

  const handleAdjustSectionCount = async (sectionType: 'MCQ' | 'PYTHON' | 'SQL', delta: number) => {
    if (!selectedAssessment) return;
    setAdjustingSection(sectionType);
    try {
      const qList = selectedAssessment.questions || [];
      if (delta > 0) {
        const topicName = sectionType === 'PYTHON' ? 'Python' : 'SQL';
        const engine = sectionType === 'PYTHON' ? 'python' : 'PostgreSQL';
        const qTypeReq = sectionType === 'MCQ' ? 'MCQ' : 'TECHNICAL';

        const genRes: any = await ApiClient.post('/api/question-generation/generate', {
          job_role: selectedAssessment.job_role || 'Data Engineer',
          topic_name: topicName,
          difficulty: 'MEDIUM',
          database_engine: engine,
          question_count: delta,
          question_type: qTypeReq
        });

        if (genRes && genRes.accepted_questions && genRes.accepted_questions.length > 0) {
          for (const q of genRes.accepted_questions) {
            await ApiClient.post(`/api/assessments/${selectedAssessment.id}/questions`, {
              question_id: q.id,
              marks: q.marks || (sectionType === 'MCQ' ? 5 : (sectionType === 'PYTHON' ? 20 : 10)),
              sort_order: qList.length + 1
            }).catch(() => {});
          }
        }
      } else if (delta < 0) {
        const countToRemove = Math.abs(delta);
        const sectionQuestions = qList.filter((q: any) => {
          if (sectionType === 'MCQ') return q.question_type === 'MCQ';
          if (sectionType === 'PYTHON') return q.question_type === 'PYTHON_TECHNICAL' || q.code_language === 'python';
          return q.question_type !== 'MCQ' && q.question_type !== 'PYTHON_TECHNICAL' && q.code_language !== 'python';
        });

        const toDelete = sectionQuestions.slice(-countToRemove);
        for (const q of toDelete) {
          await ApiClient.delete(`/api/assessments/${selectedAssessment.id}/questions/${q.id}`).catch(() => {});
        }
      }
      await fetchAssessments();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust question count');
    } finally {
      setAdjustingSection(null);
    }
  };

  const handleOpenAdjustModal = () => {
    if (!selectedAssessment) return;
    const qList = selectedAssessment.questions || [];
    const mcqCurrent = qList.filter((q: any) => q.question_type === 'MCQ').length;
    const pyCurrent = qList.filter((q: any) => q.question_type === 'PYTHON_TECHNICAL' || q.code_language === 'python').length;
    const sqlCurrent = qList.filter((q: any) => q.question_type !== 'MCQ' && q.question_type !== 'PYTHON_TECHNICAL' && q.code_language !== 'python').length;

    setTargetMcqCount(mcqCurrent);
    setTargetPythonCount(pyCurrent);
    setTargetSqlCount(sqlCurrent);
    setShowAdjustQuestionsModal(true);
  };

  const handleApplyBulkQuestions = async () => {
    if (!selectedAssessment) return;
    setAdjustingSection('BULK');
    try {
      const qList = selectedAssessment.questions || [];
      const mcqCurrent = qList.filter((q: any) => q.question_type === 'MCQ');
      const pyCurrent = qList.filter((q: any) => q.question_type === 'PYTHON_TECHNICAL' || q.code_language === 'python');
      const sqlCurrent = qList.filter((q: any) => q.question_type !== 'MCQ' && q.question_type !== 'PYTHON_TECHNICAL' && q.code_language !== 'python');

      const mcqDelta = targetMcqCount - mcqCurrent.length;
      const pyDelta = targetPythonCount - pyCurrent.length;
      const sqlDelta = targetSqlCount - sqlCurrent.length;

      // 1. Adjust MCQ
      if (mcqDelta > 0) {
        const genRes: any = await ApiClient.post('/api/question-generation/generate', {
          job_role: selectedAssessment.job_role || 'Data Engineer',
          topic_name: 'SQL',
          difficulty: targetDifficulty,
          database_engine: 'PostgreSQL',
          question_count: mcqDelta,
          question_type: 'MCQ'
        });
        if (genRes?.accepted_questions) {
          for (const q of genRes.accepted_questions) {
            await ApiClient.post(`/api/assessments/${selectedAssessment.id}/questions`, { question_id: q.id, marks: 5 }).catch(() => {});
          }
        }
      } else if (mcqDelta < 0) {
        for (const q of mcqCurrent.slice(mcqDelta)) {
          await ApiClient.delete(`/api/assessments/${selectedAssessment.id}/questions/${q.id}`).catch(() => {});
        }
      }

      // 2. Adjust Python
      if (pyDelta > 0) {
        const genRes: any = await ApiClient.post('/api/question-generation/generate', {
          job_role: selectedAssessment.job_role || 'Data Engineer',
          topic_name: 'Python',
          difficulty: targetDifficulty,
          database_engine: 'python',
          question_count: pyDelta,
          question_type: 'TECHNICAL'
        });
        if (genRes?.accepted_questions) {
          for (const q of genRes.accepted_questions) {
            await ApiClient.post(`/api/assessments/${selectedAssessment.id}/questions`, { question_id: q.id, marks: 20 }).catch(() => {});
          }
        }
      } else if (pyDelta < 0) {
        for (const q of pyCurrent.slice(pyDelta)) {
          await ApiClient.delete(`/api/assessments/${selectedAssessment.id}/questions/${q.id}`).catch(() => {});
        }
      }

      // 3. Adjust SQL
      if (sqlDelta > 0) {
        const genRes: any = await ApiClient.post('/api/question-generation/generate', {
          job_role: selectedAssessment.job_role || 'Data Engineer',
          topic_name: 'SQL',
          difficulty: targetDifficulty,
          database_engine: 'PostgreSQL',
          question_count: sqlDelta,
          question_type: 'TECHNICAL'
        });
        if (genRes?.accepted_questions) {
          for (const q of genRes.accepted_questions) {
            await ApiClient.post(`/api/assessments/${selectedAssessment.id}/questions`, { question_id: q.id, marks: 10 }).catch(() => {});
          }
        }
      } else if (sqlDelta < 0) {
        for (const q of sqlCurrent.slice(sqlDelta)) {
          await ApiClient.delete(`/api/assessments/${selectedAssessment.id}/questions/${q.id}`).catch(() => {});
        }
      }

      setShowAdjustQuestionsModal(false);
      await fetchAssessments();
    } catch (err: any) {
      alert(err.message || 'Failed to update questions');
    } finally {
      setAdjustingSection(null);
    }
  };

  const handleSaveDuration = async () => {
    if (!selectedAssessment) return;
    try {
      await ApiClient.put(`/api/assessments/${selectedAssessment.id}`, {
        duration_minutes: tempDuration
      });
      setIsEditingDuration(false);
      await fetchAssessments();
    } catch (err: any) {
      alert(err.message || 'Failed to update duration');
    }
  };

  const handleOpenLibraryModal = async (filterType = 'ALL', diffFilter = 'ALL') => {
    setLibFilterType(filterType);
    setLibDifficultyFilter(diffFilter);
    setSelectedLibQuestionIds([]);
    try {
      const data = await ApiClient.get<any[]>('/api/questions');
      setLibraryQuestions(data || []);
      setShowChooseFromLibraryModal(true);
    } catch (err: any) {
      alert('Failed to load questions from library');
    }
  };

  const handleToggleSelectLibraryQuestion = (id: string) => {
    setSelectedLibQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAddSelectedLibraryQuestions = async () => {
    if (!selectedAssessment || selectedLibQuestionIds.length === 0) return;
    setSavingQuestion(true);
    try {
      const existingIds = new Set((selectedAssessment.questions || []).map((q: any) => q.id));
      const toAdd = selectedLibQuestionIds.filter((id) => !existingIds.has(id));

      for (let i = 0; i < toAdd.length; i++) {
        const qId = toAdd[i];
        const qObj = libraryQuestions.find((q) => q.id === qId);
        const marks = qObj?.marks || (qObj?.question_type === 'MCQ' ? 5 : (qObj?.question_type === 'PYTHON_TECHNICAL' || qObj?.code_language === 'python' ? 20 : 10));
        await ApiClient.post(`/api/assessments/${selectedAssessment.id}/questions`, {
          question_id: qId,
          marks: marks,
          sort_order: (selectedAssessment.questions?.length || 0) + i + 1
        }).catch(() => {});
      }

      setShowChooseFromLibraryModal(false);
      await fetchAssessments();
    } catch (err: any) {
      alert('Failed to add questions from library: ' + (err.message || err));
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleCreateQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingQuestion(true);
    try {
      const payload: any = {
        title: newQTitle || `${newQType} Challenge`,
        problem_statement: newQProblem || newQTask || 'Custom assessment problem',
        task_description: newQTask || newQProblem,
        difficulty: newQDifficulty || 'MEDIUM',
        marks: Number(newQMarks) || (newQType === 'MCQ' ? 5 : (newQType === 'PYTHON_TECHNICAL' ? 20 : 10)),
        question_type: newQType,
        job_role: selectedAssessment?.job_role || 'Data Engineer',
        database_engine: newQType === 'PYTHON_TECHNICAL' ? 'python' : 'PostgreSQL',
        code_language: newQType === 'PYTHON_TECHNICAL' ? 'python' : 'sql',
        schema_ddl: newQSchemaDDL,
        seed_data_sql: newQSeedData,
        reference_sql: newQRefSQL,
        function_signature: newQFunctionSig || 'def solution(data):\n    return data',
        mcq_options_json: newQType === 'MCQ' ? newQMcqOptions : null,
        correct_answer: newQType === 'MCQ' ? newQCorrectAnswer : null,
        explanation: newQExplanation,
        test_cases: [
          {
            test_type: 'PUBLIC',
            name: 'Sample Test Case',
            input_setup_sql: newQSeedData,
            expected_output_json: [{ result: 'success' }],
            weight: 5
          }
        ]
      };

      const created: any = await ApiClient.post('/api/questions', payload);

      if (selectedAssessment && created && created.id) {
        await ApiClient.post(`/api/assessments/${selectedAssessment.id}/questions`, {
          question_id: created.id,
          marks: Number(newQMarks) || (newQType === 'MCQ' ? 5 : (newQType === 'PYTHON_TECHNICAL' ? 20 : 10)),
          sort_order: (selectedAssessment.questions?.length || 0) + 1
        }).catch(() => {});
      }

      setShowCreateQuestionModal(false);
      setNewQTitle('');
      setNewQProblem('');
      setNewQTask('');
      await fetchAssessments();
    } catch (err: any) {
      alert('Failed to create question: ' + (err.message || err));
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleSaveEditedQuestion = async () => {
    if (!editingQuestion) return;
    setSavingQuestion(true);
    try {
      await ApiClient.put(`/api/questions/${editingQuestion.id}`, {
        title: editingQuestion.title,
        problem_statement: editingQuestion.problem_statement,
        difficulty: editingQuestion.difficulty,
        marks: Number(editingQuestion.marks)
      });
      setShowQuestionEditorModal(false);
      await fetchAssessments();
    } catch (err: any) {
      alert('Failed to update question: ' + (err.message || err));
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleRemoveQuestionFromAssessment = async (questionId: string) => {
    if (!selectedAssessment) return;
    if (!confirm('Are you sure you want to remove this question from the assessment?')) return;
    try {
      await ApiClient.delete(`/api/assessments/${selectedAssessment.id}/questions/${questionId}`);
      setShowQuestionEditorModal(false);
      await fetchAssessments();
    } catch (err: any) {
      alert('Failed to remove question: ' + (err.message || err));
    }
  };

  const handlePublishAssessment = async () => {
    if (!selectedAssessment) return;
    try {
      await ApiClient.put(`/api/assessments/${selectedAssessment.id}/publish`);
      fetchAssessments();
      alert('Assessment successfully published!');
    } catch (err: any) {
      alert(err.message || 'Failed to publish assessment');
    }
  };

  const handleArchiveAssessment = async (id: string) => {
    try {
      await ApiClient.put(`/api/assessments/${id}/archive`);
      fetchAssessments();
    } catch (err: any) {
      alert(err.message || 'Failed to archive assessment');
    }
  };

  const handleAddManualEmail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = (manualEmailInput || '').trim().toLowerCase();
    if (!clean) {
      setManualEmailError('Please enter an email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clean)) {
      setManualEmailError('Please enter a valid email address.');
      return;
    }
    if (candidatesToInvite.includes(clean)) {
      setManualEmailError('This email address has already been added.');
      return;
    }
    setCandidatesToInvite((prev) => [...prev, clean]);
    setManualEmailInput('');
    setManualEmailError('');
  };

  const handleRemoveCandidate = (emailToRemove: string) => {
    setCandidatesToInvite((prev) => prev.filter((e) => e !== emailToRemove));
  };

  const handleDownloadSampleCsv = () => {
    const csvContent = 'email\nstudent1@gmail.com\nstudent2@gmail.com\nstudent3@gmail.com\nstudent4@gmail.com\nstudent5@gmail.com';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_candidate_invitations.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        alert('The uploaded CSV file is empty.');
        return;
      }

      // Parse header row
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
      const emailColIdx = headers.findIndex((h) => h === 'email' || h.includes('email'));

      if (emailColIdx === -1) {
        alert("The CSV file must contain a column named 'email'. Please check your file or download the sample CSV.");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validEmails: string[] = [];
      const invalidEmails: string[] = [];
      const duplicateEmails: string[] = [];
      const seenInCsv = new Set<string>();

      const rawRows = lines.slice(1);
      for (const row of rawRows) {
        const cols = row.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        const rawVal = cols[emailColIdx] || '';
        const clean = rawVal.trim().toLowerCase();

        if (!clean || !emailRegex.test(clean)) {
          invalidEmails.push(rawVal || '(empty)');
          continue;
        }

        if (seenInCsv.has(clean) || candidatesToInvite.includes(clean)) {
          duplicateEmails.push(clean);
          continue;
        }

        seenInCsv.add(clean);
        validEmails.push(clean);
      }

      setCandidatesToInvite((prev) => [...prev, ...validEmails]);
      setCsvUploadSummary({
        totalRows: rawRows.length,
        validCount: validEmails.length,
        invalidCount: invalidEmails.length,
        duplicateCount: duplicateEmails.length,
        invalidEmails
      });

      e.target.value = '';
    };

    reader.readAsText(file);
  };

  const handleSendBulkInvitations = async () => {
    if (!selectedAssessment?.id || candidatesToInvite.length === 0) return;
    setSendingInvite(true);

    try {
      const res = await ApiClient.post<any>('/api/invitations/assign-bulk', {
        assessment_id: selectedAssessment.id,
        emails: candidatesToInvite
      });

      setInviteResult(res);
      await fetchAssessments();
    } catch (err: any) {
      alert(err.message || 'Failed to send invitations.');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCloseInviteModal = () => {
    setShowInviteModal(false);
    setInviteTab('manual');
    setCandidatesToInvite([]);
    setManualEmailInput('');
    setManualEmailError('');
    setCsvUploadSummary(null);
    setInviteResult(null);
  };

  // Dynamic filter status counts
  const ongoingCount = assessments.filter((a) =>
    ['PUBLISHED', 'ONGOING', 'ACTIVE'].includes((a.status || '').toUpperCase())
  ).length;

  const completedCount = assessments.filter((a) =>
    ['COMPLETED', 'ARCHIVED'].includes((a.status || '').toUpperCase())
  ).length;

  const draftsCount = assessments.filter((a) =>
    ['DRAFT'].includes((a.status || '').toUpperCase())
  ).length;

  // Real-time Multi-Criteria Assessment Filter
  const filteredAssessments = assessments.filter((a) => {
    const statusUpper = (a.status || 'DRAFT').toUpperCase();

    // 1. Test status filter
    let matchesStatus = true;
    if (statusFilter === 'Ongoing') {
      matchesStatus = ['PUBLISHED', 'ONGOING', 'ACTIVE'].includes(statusUpper);
    } else if (statusFilter === 'Completed') {
      matchesStatus = ['COMPLETED', 'ARCHIVED'].includes(statusUpper);
    } else if (statusFilter === 'Drafts') {
      matchesStatus = ['DRAFT'].includes(statusUpper);
    }

    // 2. Created by filter
    let matchesCreatedBy = true;
    if (createdByFilter === 'Me') {
      matchesCreatedBy =
        !a.created_by ||
        a.created_by === 'Me' ||
        a.created_by === 'admin@assessment.com' ||
        a.created_by === 'admin';
    } else if (createdByFilter !== 'All') {
      matchesCreatedBy = a.created_by === createdByFilter;
    }

    // 3. Creation date filter
    let matchesCreationDate = true;
    const itemDateStr = a.created_at || a.start_date;
    if (creationDateFilter !== 'Any time' && itemDateStr) {
      const itemDate = new Date(itemDateStr).getTime();
      const now = Date.now();
      if (!isNaN(itemDate)) {
        if (creationDateFilter === 'Past 24 hours') {
          matchesCreationDate = now - itemDate <= 24 * 60 * 60 * 1000;
        } else if (creationDateFilter === 'Past 7 days') {
          matchesCreationDate = now - itemDate <= 7 * 24 * 60 * 60 * 1000;
        } else if (creationDateFilter === 'Past 30 days') {
          matchesCreationDate = now - itemDate <= 30 * 24 * 60 * 60 * 1000;
        } else if (creationDateFilter === 'Past year') {
          matchesCreationDate = now - itemDate <= 365 * 24 * 60 * 60 * 1000;
        }
      }
    }

    // 4. Test type filter
    const itemType = a.test_type || 'Invite only';
    let matchesTestType = false;
    if (itemType === 'Public' && testTypePublic) matchesTestType = true;
    if (itemType === 'Invite only' && testTypeInviteOnly) matchesTestType = true;

    // 5. Search query filter
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      matchesSearch = Boolean(
        (a.title && a.title.toLowerCase().includes(q)) ||
        (a.job_role && a.job_role.toLowerCase().includes(q)) ||
        (a.description && a.description.toLowerCase().includes(q))
      );
    }

    return (
      matchesStatus &&
      matchesCreatedBy &&
      matchesCreationDate &&
      matchesTestType &&
      matchesSearch
    );
  });

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-800 font-sans">
      {!selectedAssessmentId ? (
        /* LIST VIEW (Matching PDF Page 13) */
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar Filter Controls */}
          <aside className="w-64 bg-white border-r border-slate-200 p-5 overflow-y-auto space-y-6 shrink-0 text-xs text-slate-700">
            {/* Test Status Filter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900">Test status</div>
                {statusFilter !== 'All' && (
                  <button
                    onClick={() => setStatusFilter('All')}
                    className="text-[10px] text-blue-600 font-bold hover:underline"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              {[
                { label: 'All', value: 'All', count: assessments.length },
                { label: 'Ongoing', value: 'Ongoing', count: ongoingCount },
                { label: 'Completed', value: 'Completed', count: completedCount },
                { label: 'Drafts', value: 'Drafts', count: draftsCount }
              ].map((st) => (
                <label key={st.value} className="flex items-center justify-between font-semibold cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="statusFilter"
                      checked={statusFilter === st.value}
                      onChange={() => setStatusFilter(st.value as any)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>{st.label} ({st.count})</span>
                  </div>
                </label>
              ))}
            </div>

            {/* Created By Dropdown */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="font-bold text-slate-900">Created by</div>
              <select
                value={createdByFilter}
                onChange={(e) => setCreatedByFilter(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded font-semibold text-slate-700 bg-white"
              >
                <option value="All">All</option>
                <option value="Me">Me</option>
                <option value="System">System</option>
              </select>
            </div>

            {/* Creation Date Dropdown */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="font-bold text-slate-900">Creation date</div>
              <select
                value={creationDateFilter}
                onChange={(e) => setCreationDateFilter(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded font-semibold text-slate-700 bg-white"
              >
                <option value="Any time">Any time</option>
                <option value="Past 24 hours">Past 24 hours</option>
                <option value="Past 7 days">Past 7 days</option>
                <option value="Past 30 days">Past 30 days</option>
                <option value="Past year">Past year</option>
              </select>
            </div>

            {/* Test Type Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="font-bold text-slate-900">Test type</div>
              <label className="flex items-center gap-2 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={testTypePublic}
                  onChange={(e) => setTestTypePublic(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span>Public</span>
              </label>
              <label className="flex items-center gap-2 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={testTypeInviteOnly}
                  onChange={(e) => setTestTypeInviteOnly(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span>Invite only</span>
              </label>
            </div>
          </aside>

          {/* Main List Workspace */}
          <main className="flex-1 overflow-y-auto p-6 space-y-5 max-w-5xl">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search by test names or tags"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-l text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="absolute right-0 top-0 bottom-0 bg-blue-600 text-white px-3 rounded-r flex items-center justify-center">
                  <Search className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowCreateTestWizard(true);
                    setWizardStep(1);
                  }}
                  className="flex items-center gap-2 bg-[#1d63ed] hover:bg-[#1552cd] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create new test</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-500 gap-2 text-xs font-semibold">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                <span>Loading assessments from database...</span>
              </div>
            ) : filteredAssessments.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-500 space-y-3">
                <p className="font-semibold text-slate-700">No assessments found matching the selected filters.</p>
                <button
                  onClick={() => {
                    setStatusFilter('All');
                    setCreatedByFilter('All');
                    setCreationDateFilter('Any time');
                    setTestTypePublic(true);
                    setTestTypeInviteOnly(true);
                    setSearchQuery('');
                  }}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAssessments.map((a) => (
                  <div
                    key={a.id}
                    className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition-all shadow-sm space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3
                          onClick={() => setSelectedAssessmentId(a.id)}
                          className="text-base font-bold text-slate-900 hover:text-blue-600 cursor-pointer flex items-center gap-2"
                        >
                          {a.title}
                          <span className="text-xs font-normal text-slate-400">({a.job_role})</span>
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold mt-1">
                          <span>{a.test_type === 'Public' ? '🌐 Public' : '✉ Invite only'}</span>
                          <span>|</span>
                          <span>🕒 {a.duration_minutes} mins</span>
                          <span>|</span>
                          <span className={`font-bold ${
                            a.status === 'PUBLISHED' || a.status === 'ONGOING'
                              ? 'text-emerald-600'
                              : a.status === 'DRAFT'
                              ? 'text-amber-600'
                              : 'text-slate-600'
                          }`}>
                            Status: {a.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <span className="text-slate-600 font-medium">
                        {a.start_date ? `Created: ${new Date(a.start_date).toLocaleDateString()}` : 'No end date specified'}
                      </span>

                      <div className="flex items-center gap-4 text-blue-600 font-semibold">
                        <button onClick={() => setSelectedAssessmentId(a.id)} className="hover:underline flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> View & Edit
                        </button>
                        <button
                          onClick={() => window.open(`/admin/assessments/preview?assessment_id=${a.id}`, '_blank')}
                          className="hover:underline flex items-center gap-1 text-slate-700 hover:text-blue-600"
                          title="Preview student assessment in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Preview
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAssessmentId(a.id);
                            setShowInviteModal(true);
                          }}
                          className="hover:underline flex items-center gap-1"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Invite candidates
                        </button>
                        <button
                          onClick={() => handleArchiveAssessment(a.id)}
                          className="hover:underline flex items-center gap-1 text-slate-500"
                        >
                          <Archive className="w-3.5 h-3.5" /> Archive
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      ) : (
        /* DETAIL VIEW WITH ALL 5 TABS (Matching PDF Page 1, 2, 3) */
        <div className="flex-1 flex flex-col min-h-0">
          <header className="px-8 pt-6 pb-0 bg-white border-b border-slate-200 shrink-0">
            <div className="flex items-center text-xs text-slate-500 gap-1.5 font-medium mb-1">
              <button onClick={() => setSelectedAssessmentId(null)} className="hover:text-blue-600">Assessments</button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-700 font-semibold">{selectedAssessment?.title}</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{selectedAssessment?.title}</h1>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Copied Link!' : 'Copy link'}</span>
                </button>

                <button
                  onClick={() => {
                    if (selectedAssessment?.id) {
                      window.open(`/admin/assessments/preview?assessment_id=${selectedAssessment.id}`, '_blank');
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50 transition-colors"
                  title="Open candidate assessment preview in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>

                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2 bg-[#1d63ed] hover:bg-[#1552cd] text-white px-5 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Invite candidates</span>
                </button>
              </div>
            </div>

            {/* Top 5 Sub Tabs (Matching PDF Page 1) */}
            <div className="flex items-center gap-8 mt-2 text-xs font-bold tracking-wider text-slate-500">
              {(['OVERVIEW', 'QUESTIONS', 'SETTINGS', 'CANDIDATES', 'TEST ANALYSIS'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 relative transition-colors ${
                    activeTab === tab ? 'text-[#1d63ed] font-extrabold' : 'hover:text-slate-900'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1d63ed] rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8">
            {/* OVERVIEW TAB (Matching PDF Page 1) */}
            {activeTab === 'OVERVIEW' && (() => {
              const qList = selectedAssessment?.questions || [];
              const mcqList = qList.filter((q: any) => q.question_type === 'MCQ');
              const pyList = qList.filter((q: any) => q.question_type === 'PYTHON_TECHNICAL' || q.code_language === 'python');
              const sqlList = qList.filter((q: any) => q.question_type !== 'MCQ' && q.question_type !== 'PYTHON_TECHNICAL' && q.code_language !== 'python');

              const mcqScore = mcqList.reduce((acc: number, q: any) => acc + (q.marks || 5), 0);
              const pyScore = pyList.reduce((acc: number, q: any) => acc + (q.marks || 20), 0);
              const sqlScore = sqlList.reduce((acc: number, q: any) => acc + (q.marks || 10), 0);

              const totalQuestions = qList.length;
              const totalScore = mcqScore + pyScore + sqlScore;

              return (
                <div className="max-w-5xl space-y-6">
                  {/* Action Banner */}
                  <div className="flex items-center justify-between bg-blue-50/70 border border-blue-200/80 p-4 rounded-xl shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600 text-white p-2 rounded-lg">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Customizable Assessment Blueprint</div>
                        <div className="text-[11px] text-slate-600">
                          Adjust question counts directly below or click &quot;Adjust Questions&quot; to rebalance MCQs and Coding tasks.
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenLibraryModal('ALL')}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Choose from library</span>
                      </button>
                      <button
                        onClick={() => setShowCreateQuestionModal(true)}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Create question</span>
                      </button>
                      <button
                        onClick={handleOpenAdjustModal}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Adjust Questions</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('QUESTIONS')}
                        className="flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Manage Questions Tab</span>
                      </button>
                    </div>
                  </div>

                  {/* Question Type Breakdown Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                          <th className="py-3 px-6">Question Type</th>
                          <th className="py-3 px-6">Difficulty Level</th>
                          <th className="py-3 px-6">Questions</th>
                          <th className="py-3 px-6">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {/* Multiple Choice Questions */}
                        <tr className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-6 font-bold text-blue-700">
                            Multiple Choice Questions{' '}
                            <span className="text-slate-500 font-normal">
                              {mcqList.length > 0 ? `${mcqList.length > 3 ? '2 Sections' : '1 Section'} ▼` : '0 Sections'}
                            </span>
                          </td>
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-1.5">
                              <select
                                value={getSectionDominantDifficulty(mcqList)}
                                disabled={adjustingDifficultySection === 'MCQ' || mcqList.length === 0}
                                onChange={(e) => handleUpdateSectionDifficulty('MCQ', e.target.value)}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-50 text-slate-800 shadow-xs"
                                title="Change section difficulty"
                              >
                                <option value="EASY">Easy ({mcqList.length})</option>
                                <option value="MEDIUM">Medium ({mcqList.length})</option>
                                <option value="HARD">Hard ({mcqList.length})</option>
                              </select>
                              {adjustingDifficultySection === 'MCQ' && (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 ml-1" />
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-2">
                              <button
                                disabled={adjustingSection !== null || mcqList.length === 0}
                                onClick={() => handleAdjustSectionCount('MCQ', -1)}
                                className="w-6 h-6 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-slate-700 hover:border-slate-400 transition-colors active:scale-95"
                                title="Remove 1 MCQ question"
                              >
                                -
                              </button>
                              <span className="font-extrabold text-slate-900 min-w-[28px] text-center text-sm">
                                {mcqList.length}
                              </span>
                              <button
                                disabled={adjustingSection !== null}
                                onClick={() => handleAdjustSectionCount('MCQ', 1)}
                                className="w-6 h-6 rounded border border-blue-300 bg-blue-50/50 hover:bg-blue-100 disabled:opacity-40 flex items-center justify-center font-bold text-blue-600 hover:border-blue-400 transition-colors active:scale-95"
                                title="Add 1 MCQ question"
                              >
                                +
                              </button>
                              {adjustingSection === 'MCQ' && (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 ml-1" />
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-6 font-bold text-slate-900">{mcqScore}</td>
                        </tr>

                        {/* Programming */}
                        <tr className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-6 font-bold text-blue-700">Programming</td>
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-1.5">
                              <select
                                value={getSectionDominantDifficulty(pyList)}
                                disabled={adjustingDifficultySection === 'PYTHON' || pyList.length === 0}
                                onChange={(e) => handleUpdateSectionDifficulty('PYTHON', e.target.value)}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-50 text-slate-800 shadow-xs"
                                title="Change section difficulty"
                              >
                                <option value="EASY">Easy ({pyList.length})</option>
                                <option value="MEDIUM">Medium ({pyList.length})</option>
                                <option value="HARD">Hard ({pyList.length})</option>
                              </select>
                              {adjustingDifficultySection === 'PYTHON' && (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 ml-1" />
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-2">
                              <button
                                disabled={adjustingSection !== null || pyList.length === 0}
                                onClick={() => handleAdjustSectionCount('PYTHON', -1)}
                                className="w-6 h-6 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-slate-700 hover:border-slate-400 transition-colors active:scale-95"
                                title="Remove 1 Programming question"
                              >
                                -
                              </button>
                              <span className="font-extrabold text-slate-900 min-w-[28px] text-center text-sm">
                                {pyList.length}
                              </span>
                              <button
                                disabled={adjustingSection !== null}
                                onClick={() => handleAdjustSectionCount('PYTHON', 1)}
                                className="w-6 h-6 rounded border border-blue-300 bg-blue-50/50 hover:bg-blue-100 disabled:opacity-40 flex items-center justify-center font-bold text-blue-600 hover:border-blue-400 transition-colors active:scale-95"
                                title="Add 1 Programming question"
                              >
                                +
                              </button>
                              {adjustingSection === 'PYTHON' && (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 ml-1" />
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-6 font-bold text-slate-900">{pyScore}</td>
                        </tr>

                        {/* SQL */}
                        <tr className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-6 font-bold text-blue-700">
                            SQL{' '}
                            <span className="text-slate-500 font-normal">
                              {sqlList.length > 0 ? `${sqlList.length > 3 ? '2 Sections' : '1 Section'} ▼` : '0 Sections'}
                            </span>
                          </td>
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-1.5">
                              <select
                                value={getSectionDominantDifficulty(sqlList)}
                                disabled={adjustingDifficultySection === 'SQL' || sqlList.length === 0}
                                onChange={(e) => handleUpdateSectionDifficulty('SQL', e.target.value)}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-50 text-slate-800 shadow-xs"
                                title="Change section difficulty"
                              >
                                <option value="EASY">Easy ({sqlList.length})</option>
                                <option value="MEDIUM">Medium ({sqlList.length})</option>
                                <option value="HARD">Hard ({sqlList.length})</option>
                              </select>
                              {adjustingDifficultySection === 'SQL' && (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 ml-1" />
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-2">
                              <button
                                disabled={adjustingSection !== null || sqlList.length === 0}
                                onClick={() => handleAdjustSectionCount('SQL', -1)}
                                className="w-6 h-6 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-slate-700 hover:border-slate-400 transition-colors active:scale-95"
                                title="Remove 1 SQL question"
                              >
                                -
                              </button>
                              <span className="font-extrabold text-slate-900 min-w-[28px] text-center text-sm">
                                {sqlList.length}
                              </span>
                              <button
                                disabled={adjustingSection !== null}
                                onClick={() => handleAdjustSectionCount('SQL', 1)}
                                className="w-6 h-6 rounded border border-blue-300 bg-blue-50/50 hover:bg-blue-100 disabled:opacity-40 flex items-center justify-center font-bold text-blue-600 hover:border-blue-400 transition-colors active:scale-95"
                                title="Add 1 SQL question"
                              >
                                +
                              </button>
                              {adjustingSection === 'SQL' && (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 ml-1" />
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-6 font-bold text-slate-900">{sqlScore}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Summary Bar */}
                    <div className="bg-amber-50/60 px-6 py-4 border-t border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold uppercase text-amber-900 tracking-wider block">Test Duration</span>
                        {isEditingDuration ? (
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="number"
                              value={tempDuration}
                              onChange={(e) => setTempDuration(Math.max(5, parseInt(e.target.value) || 0))}
                              className="w-20 px-2 py-1 border border-slate-300 rounded text-xs font-bold text-slate-900 bg-white"
                              min={5}
                              max={600}
                            />
                            <span className="text-xs text-slate-500 font-semibold">mins</span>
                            <button
                              onClick={handleSaveDuration}
                              className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 shadow-xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setIsEditingDuration(false)}
                              className="px-2 py-1 border border-slate-300 rounded text-xs font-semibold hover:bg-slate-100 text-slate-600"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5 mt-0.5">
                            {formatDuration(selectedAssessment?.duration_minutes || 90)}{' '}
                            <button
                              type="button"
                              onClick={() => {
                                setTempDuration(selectedAssessment?.duration_minutes || 90);
                                setIsEditingDuration(true);
                              }}
                              className="text-slate-400 hover:text-blue-600 transition-colors p-0.5"
                              title="Edit test duration"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-12">
                        <div>
                          <span className="font-extrabold uppercase text-slate-500 tracking-wider block">Questions</span>
                          <span className="font-extrabold text-slate-900 text-base">{totalQuestions}</span>
                        </div>
                        <div>
                          <span className="font-extrabold uppercase text-slate-500 tracking-wider block">Score</span>
                          <span className="font-extrabold text-slate-900 text-base">{totalScore}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Test Admins Section */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                    {adminToastMsg && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between font-semibold animate-in fade-in duration-200">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{adminToastMsg}</span>
                        </div>
                        <button onClick={() => setAdminToastMsg('')} className="text-emerald-700 hover:text-emerald-900">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Test admins</h3>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <span className="flex items-center gap-1 text-slate-700">
                          Point of contact
                          <span title="Primary administrator receiving assessment notifications and listed for candidate support">ℹ</span>
                        </span>
                        <div className="relative flex items-center">
                          <select
                            value={pointOfContact}
                            disabled={changingPoc || (selectedAssessment?.admins || []).length === 0}
                            onChange={(e) => handleChangePointOfContact(e.target.value)}
                            className="px-3 py-1.5 border border-slate-300 rounded text-xs font-bold text-slate-800 bg-white hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                          >
                            {(selectedAssessment?.admins && selectedAssessment.admins.length > 0) ? (
                              selectedAssessment.admins.map((adm) => (
                                <option key={adm.user_id} value={adm.name}>
                                  {adm.name}
                                </option>
                              ))
                            ) : (
                              <>
                                <option value="Vinodkumar Chandrasekar">Vinodkumar Chandrasekar</option>
                                <option value="Monisha R">Monisha R</option>
                              </>
                            )}
                          </select>
                          {changingPoc && (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 ml-1.5" />
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setShowAddAdminModal(true);
                            setAdminModalError('');
                            fetchAdminDirectoryUsers();
                          }}
                          className="flex items-center gap-1 text-blue-600 font-bold hover:underline hover:text-blue-700 transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> + Add admin
                        </button>
                      </div>
                    </div>

                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-500 font-bold uppercase tracking-wider">
                          <th className="py-2 px-4">Name</th>
                          <th className="py-2 px-4">Email ID</th>
                          <th className="py-2 px-4">Access Controls</th>
                          <th className="py-2 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(selectedAssessment?.admins && selectedAssessment.admins.length > 0) ? (
                          selectedAssessment.admins.map((adminItem) => {
                            const isPocAdmin = adminItem.is_poc || adminItem.name === pointOfContact || adminItem.user_id === selectedAssessment.point_of_contact_id;
                            const isOwner = selectedAssessment.created_by === adminItem.user_id;

                            return (
                              <tr key={adminItem.user_id || adminItem.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                                  {adminItem.name}
                                  {isPocAdmin && (
                                    <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold px-1.5 py-0.5 rounded tracking-wide border border-slate-200">
                                      POC
                                    </span>
                                  )}
                                  {isOwner && (
                                    <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded tracking-wide border border-blue-200">
                                      Creator
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-slate-600">{adminItem.email}</td>
                                <td className="py-3 px-4 text-slate-700 font-semibold">{adminItem.role || 'All access'}</td>
                                <td className="py-3 px-4 text-right">
                                  {isOwner ? (
                                    <span className="text-[11px] text-slate-400 italic">Primary owner</span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAdminToRemove(adminItem);
                                        setShowRemoveAdminModal(true);
                                      }}
                                      className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded hover:bg-rose-50"
                                      title={`Remove ${adminItem.name} from assessment`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                              Vinodkumar Chandrasekar{' '}
                              <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                                POC
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600">vinodkumar.chandrasekar@agilisium.com</td>
                            <td className="py-3 px-4 text-slate-700 font-semibold">All access</td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-[11px] text-slate-400 italic">Primary owner</span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* QUESTIONS TAB (Matching PDF Page 1 bottom & Page 10) */}
            {activeTab === 'QUESTIONS' && (() => {
              const qList = selectedAssessment?.questions || [];
              const mcqList = qList.filter((q: any) => q.question_type === 'MCQ');
              const techList = qList.filter((q: any) => q.question_type !== 'MCQ');

              return (
                <div className="max-w-5xl space-y-6">
                  {/* Top Bar inside Questions */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Total Questions ({qList.length})</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Click any question to inspect details, test cases, and solution code.</p>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <button
                        onClick={() => setShowCreateQuestionModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg font-bold shadow-sm transition-colors"
                      >
                        + Create a new question
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const libData = await ApiClient.get<any[]>('/api/questions');
                            setLibraryQuestions(libData || []);
                            setShowChooseFromLibraryModal(true);
                          } catch (e) {
                            alert('Failed to load question library');
                          }
                        }}
                        className="bg-white border border-slate-300 text-blue-600 px-3.5 py-1.5 rounded-lg font-bold hover:bg-slate-50 transition-colors"
                      >
                        Choose from library
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* MULTIPLE CHOICE QUESTIONS SECTION */}
                    <div className="space-y-3">
                      <div className="bg-slate-100 p-3 rounded-lg font-bold text-xs text-slate-700 flex items-center justify-between">
                        <span>MULTIPLE CHOICE QUESTIONS ({mcqList.length}) — TOTAL SCORE {mcqList.reduce((a, b) => a + (b.marks || 5), 0)}</span>
                      </div>

                      {mcqList.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs italic bg-white rounded-xl border border-slate-200">
                          No Multiple Choice Questions added to this assessment yet.
                        </div>
                      ) : (
                        mcqList.map((q: any, idx: number) => (
                          <div
                            key={q.id || idx}
                            onClick={() => {
                              setEditingQuestion(q);
                              setShowQuestionEditorModal(true);
                            }}
                            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2 cursor-pointer hover:border-blue-300 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">
                                {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}. {q.title || q.problem_statement}
                              </span>
                              <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                                Score: {q.marks || 5}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={(q.difficulty || 'EASY').toUpperCase()}
                                onClick={(e) => e.stopPropagation()}
                                onChange={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await ApiClient.put(`/api/questions/${q.id}`, { difficulty: e.target.value });
                                    await fetchAssessments();
                                  } catch (err: any) {
                                    alert('Failed to update question difficulty');
                                  }
                                }}
                                className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold focus:outline-none cursor-pointer transition-colors"
                              >
                                <option value="EASY">EASY</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="HARD">HARD</option>
                              </select>
                              <span className="text-[10px] text-slate-500 font-semibold">MCQ • 4 Options</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* TECHNICAL QUESTIONS SECTION */}
                    <div className="space-y-3">
                      <div className="bg-slate-100 p-3 rounded-lg font-bold text-xs text-slate-700 flex items-center justify-between">
                        <span>TECHNICAL & CODING QUESTIONS ({techList.length}) — TOTAL SCORE {techList.reduce((a, b) => a + (b.marks || 10), 0)}</span>
                      </div>

                      {techList.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs italic bg-white rounded-xl border border-slate-200">
                          No Technical Questions added to this assessment yet.
                        </div>
                      ) : (
                        techList.map((q: any, idx: number) => (
                          <div
                            key={q.id || idx}
                            onClick={() => {
                              setEditingQuestion(q);
                              setShowQuestionEditorModal(true);
                            }}
                            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2 cursor-pointer hover:border-blue-300 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">
                                {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}. {q.title || q.problem_statement}
                              </span>
                              <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                                Score: {q.marks || 10}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={(q.difficulty || 'MEDIUM').toUpperCase()}
                                onClick={(e) => e.stopPropagation()}
                                onChange={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await ApiClient.put(`/api/questions/${q.id}`, { difficulty: e.target.value });
                                    await fetchAssessments();
                                  } catch (err: any) {
                                    alert('Failed to update question difficulty');
                                  }
                                }}
                                className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold focus:outline-none cursor-pointer transition-colors"
                              >
                                <option value="EASY">EASY</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="HARD">HARD</option>
                              </select>
                              <span className="text-[10px] text-slate-500 font-semibold">
                                {q.code_language?.toUpperCase() || 'SQL'} Technical • Sandbox Pre-validated
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* SETTINGS TAB (Matching PDF Page 2 & 11) */}
            {activeTab === 'SETTINGS' && (
              <div className="max-w-5xl flex gap-8">
                {/* Left Sub-nav */}
                <div className="w-64 space-y-1 text-xs font-semibold shrink-0">
                  {[
                    'Basic test setting',
                    'Proctoring and plagiarism settings',
                    'Candidate settings',
                    'Email and reports',
                    'Advanced settings',
                    'Email templates'
                  ].map((st) => (
                    <button
                      key={st}
                      onClick={() => setActiveSettingSubTab(st as any)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between ${
                        activeSettingSubTab === st
                          ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600 shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{st}</span>
                      {st === 'Proctoring and plagiarism settings' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Right Settings Form */}
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 text-xs text-slate-800">
                  {/* Toast for saved settings */}
                  {settingsSavedToast && (
                    <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl flex items-center justify-between font-bold text-xs shadow-xs animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Proctoring & Security settings saved successfully!</span>
                      </div>
                    </div>
                  )}

                  {activeSettingSubTab === 'Proctoring and plagiarism settings' ? (
                    <div className="space-y-6">
                      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            Proctoring & Security Configuration
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Configure anti-cheat mechanisms, lockdown rules, and live proctoring enforcement for this assessment.
                          </p>
                        </div>

                        <button
                          onClick={handleSaveProctoringSettings}
                          disabled={savingSettings}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                        >
                          {savingSettings ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
                        </button>
                      </div>

                      {/* 1. Tab Switching & Fullscreen */}
                      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4.5 space-y-3.5">
                        <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                          <Monitor className="w-4 h-4 text-blue-600" />
                          <span>1. Tab Switching & Fullscreen Enforcement</span>
                        </div>

                        <div className="space-y-3 pl-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-800">Mandatory Fullscreen Mode</div>
                              <div className="text-[11px] text-slate-500">
                                Requires candidates to enter and stay in full-screen throughout the test.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setProctoringConfig({ ...proctoringConfig, fullscreen_required: !proctoringConfig.fullscreen_required })}
                              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                proctoringConfig.fullscreen_required ? 'bg-blue-600' : 'bg-slate-300'
                              }`}
                            >
                              <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                                proctoringConfig.fullscreen_required ? 'right-0.5' : 'left-0.5'
                              }`} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-800">Tab-Switch & Blur Detection</div>
                              <div className="text-[11px] text-slate-500">
                                Detects when candidate switches tabs, minimizes window, or leaves test window.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setProctoringConfig({ ...proctoringConfig, tab_switch_detection: !proctoringConfig.tab_switch_detection })}
                              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                proctoringConfig.tab_switch_detection ? 'bg-blue-600' : 'bg-slate-300'
                              }`}
                            >
                              <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                                proctoringConfig.tab_switch_detection ? 'right-0.5' : 'left-0.5'
                              }`} />
                            </button>
                          </div>

                          {proctoringConfig.tab_switch_detection && (
                            <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                              <div>
                                <span className="font-bold text-slate-800 block">Maximum Allowed Tab Violations</span>
                                <span className="text-[11px] text-slate-500">
                                  Test will be automatically locked and submitted upon exceeding this limit.
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={1}
                                  max={10}
                                  value={proctoringConfig.max_tab_violations}
                                  onChange={(e) => setProctoringConfig({ ...proctoringConfig, max_tab_violations: Math.max(1, parseInt(e.target.value) || 1) })}
                                  className="w-16 px-2.5 py-1 rounded border border-slate-300 font-bold text-center text-xs text-slate-900 bg-slate-50"
                                />
                                <span className="font-semibold text-slate-600 text-xs">warnings</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2. Copy/Paste Restriction */}
                      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4.5 space-y-3.5">
                        <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                          <Lock className="w-4 h-4 text-indigo-600" />
                          <span>2. Copy & Paste Restrictions</span>
                        </div>

                        <div className="space-y-3 pl-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-800">Clipboard & Context Menu Lockdown</div>
                              <div className="text-[11px] text-slate-500">
                                Prevents copying question statement, pasting external code into editor, or copying code out.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setProctoringConfig({ ...proctoringConfig, copy_paste_restricted: !proctoringConfig.copy_paste_restricted })}
                              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                proctoringConfig.copy_paste_restricted ? 'bg-blue-600' : 'bg-slate-300'
                              }`}
                            >
                              <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                                proctoringConfig.copy_paste_restricted ? 'right-0.5' : 'left-0.5'
                              }`} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 3. Webcam & Audio Proctoring */}
                      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4.5 space-y-3.5">
                        <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                          <Camera className="w-4 h-4 text-emerald-600" />
                          <span>3. Webcam & Audio Proctoring</span>
                        </div>

                        <div className="space-y-3 pl-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-800">Webcam Candidate Monitoring</div>
                              <div className="text-[11px] text-slate-500">
                                Verifies face presence, detects multiple faces, camera disconnection, or leaving view.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setProctoringConfig({ ...proctoringConfig, webcam_proctoring: !proctoringConfig.webcam_proctoring })}
                              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                proctoringConfig.webcam_proctoring ? 'bg-blue-600' : 'bg-slate-300'
                              }`}
                            >
                              <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                                proctoringConfig.webcam_proctoring ? 'right-0.5' : 'left-0.5'
                              }`} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-800">Microphone & Audio Monitoring</div>
                              <div className="text-[11px] text-slate-500">
                                Captures noise spikes, background voice activity, and external audio anomalies.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setProctoringConfig({ ...proctoringConfig, audio_proctoring: !proctoringConfig.audio_proctoring })}
                              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                proctoringConfig.audio_proctoring ? 'bg-blue-600' : 'bg-slate-300'
                              }`}
                            >
                              <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                                proctoringConfig.audio_proctoring ? 'right-0.5' : 'left-0.5'
                              }`} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 4. Plagiarism & Code Similarity Detection */}
                      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4.5 space-y-3.5">
                        <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                          <Fingerprint className="w-4 h-4 text-amber-600" />
                          <span>4. Plagiarism & Code Similarity Detection</span>
                        </div>

                        <div className="space-y-3 pl-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-800">Peer & Historic Submission Similarity Analysis</div>
                              <div className="text-[11px] text-slate-500">
                                Compares candidate code against all submissions for the same assessment questions.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setProctoringConfig({ ...proctoringConfig, plagiarism_detection: !proctoringConfig.plagiarism_detection })}
                              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                proctoringConfig.plagiarism_detection ? 'bg-blue-600' : 'bg-slate-300'
                              }`}
                            >
                              <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                                proctoringConfig.plagiarism_detection ? 'right-0.5' : 'left-0.5'
                              }`} />
                            </button>
                          </div>

                          {proctoringConfig.plagiarism_detection && (
                            <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800">Similarity Alert Threshold</span>
                                <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                  {proctoringConfig.similarity_threshold}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min={50}
                                max={100}
                                step={5}
                                value={proctoringConfig.similarity_threshold}
                                onChange={(e) => setProctoringConfig({ ...proctoringConfig, similarity_threshold: parseInt(e.target.value) })}
                                className="w-full accent-blue-600 cursor-pointer"
                              />
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                                <span>50% (Loose)</span>
                                <span>80% (Recommended)</span>
                                <span>100% (Exact Match)</span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <div>
                              <div className="font-bold text-slate-800">External AI / LLM Pattern Detection</div>
                              <div className="text-[11px] text-slate-500">
                                Flags statistical AI code signatures and public solution templates.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setProctoringConfig({ ...proctoringConfig, external_similarity_check: !proctoringConfig.external_similarity_check })}
                              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                proctoringConfig.external_similarity_check ? 'bg-blue-600' : 'bg-slate-300'
                              }`}
                            >
                              <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                                proctoringConfig.external_similarity_check ? 'right-0.5' : 'left-0.5'
                              }`} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 5. IP Restriction & Geo-Fencing */}
                      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4.5 space-y-3.5">
                        <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                          <Globe className="w-4 h-4 text-purple-600" />
                          <span>5. IP Restriction & Geo-Fencing</span>
                        </div>

                        <div className="space-y-3 pl-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-800">IP Whitelist Enforcement</div>
                              <div className="text-[11px] text-slate-500">
                                Restrict test access strictly to permitted IP addresses or CIDR blocks.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setProctoringConfig({ ...proctoringConfig, ip_restriction_enabled: !proctoringConfig.ip_restriction_enabled })}
                              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                proctoringConfig.ip_restriction_enabled ? 'bg-blue-600' : 'bg-slate-300'
                              }`}
                            >
                              <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                                proctoringConfig.ip_restriction_enabled ? 'right-0.5' : 'left-0.5'
                              }`} />
                            </button>
                          </div>

                          {proctoringConfig.ip_restriction_enabled && (
                            <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2.5">
                              <label className="font-bold text-slate-800 block">Allowed IP Addresses / Ranges</label>
                              <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                                {proctoringConfig.allowed_ips.map((ip) => (
                                  <span key={ip} className="bg-slate-100 text-slate-800 font-mono text-[11px] px-2 py-1 rounded-md border border-slate-300 flex items-center gap-1.5 font-bold">
                                    {ip}
                                    <button type="button" onClick={() => handleRemoveIp(ip)} className="text-slate-400 hover:text-rose-600">×</button>
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  placeholder="e.g. 192.168.1.100 or 10.0.0.0/24"
                                  value={newIpInput}
                                  onChange={(e) => setNewIpInput(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddIp(); } }}
                                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddIp}
                                  className="px-3 py-1.5 bg-slate-800 text-white rounded-lg font-bold text-xs hover:bg-slate-900"
                                >
                                  Add IP
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <div>
                              <div className="font-bold text-slate-800">Geographic Fencing (Country Whitelist)</div>
                              <div className="text-[11px] text-slate-500">
                                Permitted candidate regions (ISO 2-letter country codes).
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setProctoringConfig({ ...proctoringConfig, geo_fencing_enabled: !proctoringConfig.geo_fencing_enabled })}
                              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                proctoringConfig.geo_fencing_enabled ? 'bg-blue-600' : 'bg-slate-300'
                              }`}
                            >
                              <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                                proctoringConfig.geo_fencing_enabled ? 'right-0.5' : 'left-0.5'
                              }`} />
                            </button>
                          </div>

                          {proctoringConfig.geo_fencing_enabled && (
                            <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2.5">
                              <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                                {proctoringConfig.allowed_countries.map((c) => (
                                  <span key={c} className="bg-purple-50 text-purple-800 font-mono text-[11px] px-2 py-1 rounded-md border border-purple-200 flex items-center gap-1.5 font-bold">
                                    {c}
                                    <button type="button" onClick={() => handleRemoveCountry(c)} className="text-purple-400 hover:text-rose-600">×</button>
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  placeholder="e.g. US, IN, GB"
                                  value={newCountryInput}
                                  onChange={(e) => setNewCountryInput(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCountry(); } }}
                                  className="w-32 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono uppercase text-slate-800"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddCountry}
                                  className="px-3 py-1.5 bg-purple-700 text-white rounded-lg font-bold text-xs hover:bg-purple-800"
                                >
                                  Add Country
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={handleSaveProctoringSettings}
                          disabled={savingSettings}
                          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50"
                        >
                          {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          <span>{savingSettings ? 'Saving Settings...' : 'Save Proctoring & Security Settings'}</span>
                        </button>
                      </div>
                    </div>
                  ) : activeSettingSubTab === 'Candidate settings' ? (
                    /* 1. CANDIDATE SETTINGS SUBTAB */
                    <div className="space-y-6">
                      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" />
                            Candidate Settings & Exam Experience
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Control navigation rules, resume capabilities, time expiration behavior, and candidate feedback visibility.
                          </p>
                        </div>

                        <button
                          onClick={handleSaveCandidateSettings}
                          disabled={savingSettings}
                          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                        >
                          {savingSettings ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
                        </button>
                      </div>

                      {/* Access Window & Resumption */}
                      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4.5 space-y-3.5">
                        <span className="font-bold text-slate-900 text-xs block">1. Assessment Access & Attempt Rules</span>

                        <div className="space-y-3 pl-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-800">Strict Window Enforcement</div>
                              <div className="text-[11px] text-slate-500">
                                Candidates can only start the assessment within the configured start and end date window.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCandidateSettings({ ...candidateSettings, start_end_window_enforced: !candidateSettings.start_end_window_enforced })}
                              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                candidateSettings.start_end_window_enforced ? 'bg-indigo-600' : 'bg-slate-300'
                              }`}
                            >
                              <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                                candidateSettings.start_end_window_enforced ? 'right-0.5' : 'left-0.5'
                              }`} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-800">Allow Resuming Unfinished Tests</div>
                              <div className="text-[11px] text-slate-500">
                                Permitted to reconnect and resume if session disconnects before official submission.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCandidateSettings({ ...candidateSettings, allow_resume_unfinished: !candidateSettings.allow_resume_unfinished })}
                              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                candidateSettings.allow_resume_unfinished ? 'bg-indigo-600' : 'bg-slate-300'
                              }`}
                            >
                              <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                                candidateSettings.allow_resume_unfinished ? 'right-0.5' : 'left-0.5'
                              }`} />
                            </button>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-slate-800 block">Maximum Allowed Attempts</span>
                              <span className="text-[11px] text-slate-500">
                                Number of retries allowed per student invitation link.
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={1}
                                max={5}
                                value={candidateSettings.max_attempts}
                                onChange={(e) => setCandidateSettings({ ...candidateSettings, max_attempts: Math.max(1, parseInt(e.target.value) || 1) })}
                                className="w-16 px-2.5 py-1 rounded border border-slate-300 font-bold text-center text-xs text-slate-900 bg-slate-50"
                              />
                              <span className="font-semibold text-slate-600 text-xs">attempt(s)</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Navigation Controls */}
                      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4.5 space-y-3.5">
                        <span className="font-bold text-slate-900 text-xs block">2. Question Navigation & Sequence Permissions</span>

                        <div className="space-y-3 pl-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-800">Free Navigation Between Questions</div>
                              <div className="text-[11px] text-slate-500">
                                Candidates can jump freely across all problems from the Problem List panel.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCandidateSettings({ ...candidateSettings, allow_free_navigation: !candidateSettings.allow_free_navigation })}
                              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                candidateSettings.allow_free_navigation ? 'bg-indigo-600' : 'bg-slate-300'
                              }`}
                            >
                              <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                                candidateSettings.allow_free_navigation ? 'right-0.5' : 'left-0.5'
                              }`} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-800">Allow Revisiting Previous Questions</div>
                              <div className="text-[11px] text-slate-500">
                                Candidates can go back to revise earlier questions after moving forward.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCandidateSettings({ ...candidateSettings, allow_revisit_previous: !candidateSettings.allow_revisit_previous })}
                              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                candidateSettings.allow_revisit_previous ? 'bg-indigo-600' : 'bg-slate-300'
                              }`}
                            >
                              <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                                candidateSettings.allow_revisit_previous ? 'right-0.5' : 'left-0.5'
                              }`} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Submission Policy */}
                      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4.5 space-y-3.5">
                        <span className="font-bold text-slate-900 text-xs block">3. Submission Rules & Expiration Handling</span>

                        <div className="space-y-3 pl-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-800">Permit Submitting with Unanswered Questions</div>
                              <div className="text-[11px] text-slate-500">
                                Candidates can submit even if some questions have not been attempted.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCandidateSettings({ ...candidateSettings, allow_unanswered_submission: !candidateSettings.allow_unanswered_submission })}
                              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                candidateSettings.allow_unanswered_submission ? 'bg-indigo-600' : 'bg-slate-300'
                              }`}
                            >
                              <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                                candidateSettings.allow_unanswered_submission ? 'right-0.5' : 'left-0.5'
                              }`} />
                            </button>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                            <label className="font-bold text-slate-800 block">When Assessment Time Expires</label>
                            <select
                              value={candidateSettings.time_expired_action}
                              onChange={(e) => setCandidateSettings({ ...candidateSettings, time_expired_action: e.target.value })}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-slate-50"
                            >
                              <option value="AUTO_SUBMIT">Automatically submit all attempted queries and calculate final score</option>
                              <option value="LOCK_DISCARD">Lock assessment sandbox immediately and reject incomplete work</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Score Visibility & Security Guarantee */}
                      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4.5 space-y-3.5">
                        <span className="font-bold text-slate-900 text-xs block">4. Score Visibility & Feedback Controls</span>

                        <div className="space-y-3 pl-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-800">Show Total Score Immediately After Submission</div>
                              <div className="text-[11px] text-slate-500">
                                Candidate sees their score percentage and points upon final submission.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCandidateSettings({ ...candidateSettings, show_score_immediately: !candidateSettings.show_score_immediately })}
                              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                candidateSettings.show_score_immediately ? 'bg-indigo-600' : 'bg-slate-300'
                              }`}
                            >
                              <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                                candidateSettings.show_score_immediately ? 'right-0.5' : 'left-0.5'
                              }`} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-800">Show Which Questions Were Wrong</div>
                              <div className="text-[11px] text-slate-500">
                                Displays passed/failed question status without exposing reference solutions or hidden test cases.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCandidateSettings({ ...candidateSettings, show_incorrect_questions: !candidateSettings.show_incorrect_questions })}
                              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                candidateSettings.show_incorrect_questions ? 'bg-indigo-600' : 'bg-slate-300'
                              }`}
                            >
                              <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                                candidateSettings.show_incorrect_questions ? 'right-0.5' : 'left-0.5'
                              }`} />
                            </button>
                          </div>
                        </div>

                        {/* Security Notice Callout */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-[11px] text-emerald-800 flex items-start gap-2">
                          <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Security Guarantee:</strong> Reference SQL statements, hidden test case inputs/outputs, and official editorial solutions are permanently masked from all candidate-facing views.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={handleSaveCandidateSettings}
                          disabled={savingSettings}
                          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50"
                        >
                          {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          <span>{savingSettings ? 'Saving Settings...' : 'Save Candidate Settings'}</span>
                        </button>
                      </div>
                    </div>
                  ) : activeSettingSubTab === 'Email and reports' ? (
                    /* 2. EMAIL AND REPORTS SUBTAB */
                    <div className="space-y-6">
                      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                            Email Notifications & Reporting Configuration
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Manage automated candidate notification triggers, customize report inclusions, and export test results.
                          </p>
                        </div>

                        <button
                          onClick={handleSaveEmailReportsSettings}
                          disabled={savingSettings}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                        >
                          {savingSettings ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
                        </button>
                      </div>

                      {/* Automated Email Triggers */}
                      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4.5 space-y-3.5">
                        <span className="font-bold text-slate-900 text-xs block">1. Automated Email Notification Events</span>

                        <div className="grid grid-cols-2 gap-3 pl-2">
                          {[
                            { key: 'send_invitation', label: 'Assessment Invitation', desc: 'Sent when candidate is assigned to this test' },
                            { key: 'send_reminder', label: 'Assessment Reminder', desc: 'Dispatched 24h prior to assessment deadline' },
                            { key: 'send_started', label: 'Assessment Started', desc: 'Notifies candidate with active test session link' },
                            { key: 'send_submitted', label: 'Assessment Submitted', desc: 'Confirms receipt of candidate submission' },
                            { key: 'send_completed', label: 'Assessment Completed', desc: 'Sent after scoring engine finishes evaluation' },
                            { key: 'send_expired', label: 'Assessment Expired', desc: 'Notifies unattempted candidates when window closes' }
                          ].map((item) => (
                            <div key={item.key} className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                              <div className="pr-2">
                                <div className="font-bold text-slate-800 text-xs">{item.label}</div>
                                <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{item.desc}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setEmailReportsSettings({
                                  ...emailReportsSettings,
                                  [item.key]: !(emailReportsSettings as any)[item.key]
                                })}
                                className={`w-9 h-4.5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                                  (emailReportsSettings as any)[item.key] ? 'bg-emerald-600' : 'bg-slate-300'
                                }`}
                              >
                                <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                                  (emailReportsSettings as any)[item.key] ? 'right-0.5' : 'left-0.5'
                                }`} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Report Inclusions Checklist */}
                      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4.5 space-y-3.5">
                        <span className="font-bold text-slate-900 text-xs block">2. Assessment Report Metric Inclusions</span>

                        <div className="grid grid-cols-2 gap-2.5 pl-2">
                          {[
                            { key: 'include_scores', label: 'Candidate Scores & Total Marks' },
                            { key: 'include_percentage', label: 'Percentage & Passing Grades' },
                            { key: 'include_time_taken', label: 'Duration & Time Taken' },
                            { key: 'include_question_breakdown', label: 'Question Attempt Breakdown (SQL / Python / MCQ)' },
                            { key: 'include_testcase_results', label: 'Public Test-case Execution Matrix' },
                            { key: 'include_proctoring_violations', label: 'Proctoring Violations & Tab Switches' },
                            { key: 'include_plagiarism_flags', label: 'Code Similarity & Plagiarism Flags' }
                          ].map((item) => (
                            <label key={item.key} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                              <input
                                type="checkbox"
                                checked={(emailReportsSettings as any)[item.key]}
                                onChange={(e) => setEmailReportsSettings({
                                  ...emailReportsSettings,
                                  [item.key]: e.target.checked
                                })}
                                className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                              />
                              <span className="font-semibold text-slate-700 text-xs">{item.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Export Actions Card */}
                      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4.5 space-y-3">
                        <span className="font-bold text-slate-900 text-xs block">3. Performance Data Export</span>
                        <p className="text-xs text-slate-500">
                          Download complete candidate scores, submission counts, proctoring violations, and similarity ratings.
                        </p>

                        <div className="flex items-center gap-3 pt-1">
                          <button
                            type="button"
                            onClick={handleExportSingleAssessmentCsv}
                            disabled={downloadingAssessmentCsv}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                          >
                            {downloadingAssessmentCsv ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                            <span>{downloadingAssessmentCsv ? 'Exporting...' : 'Export Assessment Results (CSV)'}</span>
                          </button>

                          <a
                            href="/admin/reports"
                            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-xs"
                          >
                            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Open Platform Analytics Dashboard</span>
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={handleSaveEmailReportsSettings}
                          disabled={savingSettings}
                          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50"
                        >
                          {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          <span>{savingSettings ? 'Saving Settings...' : 'Save Email & Reports Settings'}</span>
                        </button>
                      </div>
                    </div>
                  ) : activeSettingSubTab === 'Advanced settings' ? (
                    /* 3. ADVANCED SETTINGS SUBTAB */
                    <div className="space-y-6">
                      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <SlidersHorizontal className="w-5 h-5 text-amber-600" />
                            Advanced Assessment Configuration
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Fine-tune scheduling windows, timezones, language runtimes, submission attempt limits, and execution timeouts.
                          </p>
                        </div>

                        <button
                          onClick={handleSaveAdvancedSettings}
                          disabled={savingSettings}
                          className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                        >
                          {savingSettings ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
                        </button>
                      </div>

                      {/* Lifecycle & Scheduling */}
                      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4.5 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">1. Assessment Access & Scheduling</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-700">Active Status:</span>
                            <button
                              type="button"
                              onClick={() => setAdvancedSettings({ ...advancedSettings, assessment_enabled: !advancedSettings.assessment_enabled })}
                              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                advancedSettings.assessment_enabled ? 'bg-emerald-600' : 'bg-slate-300'
                              }`}
                            >
                              <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                                advancedSettings.assessment_enabled ? 'right-0.5' : 'left-0.5'
                              }`} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pl-2">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Start Date & Time</label>
                            <input
                              type="datetime-local"
                              value={advancedSettings.start_date ? advancedSettings.start_date.substring(0, 16) : ''}
                              onChange={(e) => setAdvancedSettings({ ...advancedSettings, start_date: e.target.value })}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">End Date & Time</label>
                            <input
                              type="datetime-local"
                              value={advancedSettings.end_date ? advancedSettings.end_date.substring(0, 16) : ''}
                              onChange={(e) => setAdvancedSettings({ ...advancedSettings, end_date: e.target.value })}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Duration (Minutes)</label>
                            <input
                              type="number"
                              min={10}
                              max={300}
                              value={advancedSettings.duration_minutes}
                              onChange={(e) => setAdvancedSettings({ ...advancedSettings, duration_minutes: Math.max(10, parseInt(e.target.value) || 60) })}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Timezone</label>
                            <select
                              value={advancedSettings.timezone}
                              onChange={(e) => setAdvancedSettings({ ...advancedSettings, timezone: e.target.value })}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                            >
                              <option value="UTC">UTC (Coordinated Universal Time)</option>
                              <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                              <option value="America/New_York">America/New_York (EST/EDT)</option>
                              <option value="Europe/London">Europe/London (GMT/BST)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pl-2 pt-1 border-t border-slate-200">
                          <div>
                            <div className="font-bold text-slate-800">Auto-Close on Deadline</div>
                            <div className="text-[11px] text-slate-500">Automatically close assessment and reject any attempts initiated after the end date.</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAdvancedSettings({ ...advancedSettings, auto_close_after_end_time: !advancedSettings.auto_close_after_end_time })}
                            className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                              advancedSettings.auto_close_after_end_time ? 'bg-amber-600' : 'bg-slate-300'
                            }`}
                          >
                            <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                              advancedSettings.auto_close_after_end_time ? 'right-0.5' : 'left-0.5'
                            }`} />
                          </button>
                        </div>
                      </div>

                      {/* Question Randomization */}
                      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4.5 space-y-3.5">
                        <span className="font-bold text-slate-900 text-xs block">2. Question Ordering & Randomization</span>

                        <div className="space-y-3 pl-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-800">Randomize Question Sequence</div>
                              <div className="text-[11px] text-slate-500">Each candidate receives problems in a randomized sequence.</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAdvancedSettings({ ...advancedSettings, randomize_question_order: !advancedSettings.randomize_question_order })}
                              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                advancedSettings.randomize_question_order ? 'bg-amber-600' : 'bg-slate-300'
                              }`}
                            >
                              <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                                advancedSettings.randomize_question_order ? 'right-0.5' : 'left-0.5'
                              }`} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-800">Randomize Multiple-Choice Options</div>
                              <div className="text-[11px] text-slate-500">Shuffles option choices (A, B, C, D) for MCQ questions per candidate.</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAdvancedSettings({ ...advancedSettings, randomize_mcq_options: !advancedSettings.randomize_mcq_options })}
                              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                advancedSettings.randomize_mcq_options ? 'bg-amber-600' : 'bg-slate-300'
                              }`}
                            >
                              <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                                advancedSettings.randomize_mcq_options ? 'right-0.5' : 'left-0.5'
                              }`} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Technical Runtime Controls */}
                      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4.5 space-y-3.5">
                        <span className="font-bold text-slate-900 text-xs block">3. Technical Assessment Runtime & Sandbox Limits</span>

                        <div className="space-y-3 pl-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-800">Enable &apos;Run Code&apos; Sandbox Execution</div>
                              <div className="text-[11px] text-slate-500">Allows candidates to test their SQL/Python code against public test cases.</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAdvancedSettings({ ...advancedSettings, run_code_enabled: !advancedSettings.run_code_enabled })}
                              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                advancedSettings.run_code_enabled ? 'bg-amber-600' : 'bg-slate-300'
                              }`}
                            >
                              <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                                advancedSettings.run_code_enabled ? 'right-0.5' : 'left-0.5'
                              }`} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-800">Enable &apos;Submit Code&apos; Official Evaluation</div>
                              <div className="text-[11px] text-slate-500">Allows candidates to submit their solution for automated grading.</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAdvancedSettings({ ...advancedSettings, submit_code_enabled: !advancedSettings.submit_code_enabled })}
                              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                advancedSettings.submit_code_enabled ? 'bg-amber-600' : 'bg-slate-300'
                              }`}
                            >
                              <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                                advancedSettings.submit_code_enabled ? 'right-0.5' : 'left-0.5'
                              }`} />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-3 pt-2">
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                              <span className="font-bold text-slate-700 block text-[11px]">Max Submissions / Question</span>
                              <input
                                type="number"
                                min={1}
                                max={50}
                                value={advancedSettings.max_submission_attempts}
                                onChange={(e) => setAdvancedSettings({ ...advancedSettings, max_submission_attempts: parseInt(e.target.value) || 10 })}
                                className="w-full px-2 py-1 mt-1 border border-slate-300 rounded font-bold text-xs bg-slate-50"
                              />
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                              <span className="font-bold text-slate-700 block text-[11px]">Execution Timeout</span>
                              <div className="flex items-center gap-1 mt-1">
                                <input
                                  type="number"
                                  min={1}
                                  max={30}
                                  value={advancedSettings.execution_time_limit_sec}
                                  onChange={(e) => setAdvancedSettings({ ...advancedSettings, execution_time_limit_sec: parseInt(e.target.value) || 5 })}
                                  className="w-full px-2 py-1 border border-slate-300 rounded font-bold text-xs bg-slate-50"
                                />
                                <span className="text-[10px] font-bold text-slate-500">sec</span>
                              </div>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                              <span className="font-bold text-slate-700 block text-[11px]">Memory Limit</span>
                              <div className="flex items-center gap-1 mt-1">
                                <input
                                  type="number"
                                  min={64}
                                  max={1024}
                                  value={advancedSettings.memory_limit_mb}
                                  onChange={(e) => setAdvancedSettings({ ...advancedSettings, memory_limit_mb: parseInt(e.target.value) || 256 })}
                                  className="w-full px-2 py-1 border border-slate-300 rounded font-bold text-xs bg-slate-50"
                                />
                                <span className="text-[10px] font-bold text-slate-500">MB</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={handleSaveAdvancedSettings}
                          disabled={savingSettings}
                          className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50"
                        >
                          {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          <span>{savingSettings ? 'Saving Settings...' : 'Save Advanced Settings'}</span>
                        </button>
                      </div>
                    </div>
                  ) : activeSettingSubTab === 'Email templates' ? (
                    /* 4. EMAIL TEMPLATES SUBTAB */
                    <div className="space-y-6">
                      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Email Templates Manager
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Customize dynamic email copy dispatched to candidates with automated placeholder interpolation.
                          </p>
                        </div>

                        <button
                          onClick={handleSaveEmailTemplates}
                          disabled={savingSettings}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                        >
                          {savingSettings ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>{savingSettings ? 'Saving...' : 'Save All Templates'}</span>
                        </button>
                      </div>

                      {/* Template Selector Tabs */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
                        {[
                          { key: 'invitation', label: 'Assessment Invitation' },
                          { key: 'reminder', label: 'Assessment Reminder' },
                          { key: 'started', label: 'Assessment Started' },
                          { key: 'submitted', label: 'Assessment Submitted' },
                          { key: 'completed', label: 'Assessment Completed' },
                          { key: 'expired', label: 'Assessment Expired' }
                        ].map((t) => (
                          <button
                            key={t.key}
                            onClick={() => setActiveEmailTemplateKey(t.key as any)}
                            className={`px-3 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
                              activeEmailTemplateKey === t.key
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <span>{t.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Dynamic Placeholder Bar */}
                      <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 space-y-2">
                        <span className="font-bold text-blue-950 text-xs block">Available Dynamic Placeholders:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            '{{candidate_name}}',
                            '{{assessment_name}}',
                            '{{start_date}}',
                            '{{end_date}}',
                            '{{duration}}',
                            '{{timezone}}',
                            '{{assessment_link}}'
                          ].map((ph) => (
                            <button
                              key={ph}
                              type="button"
                              onClick={() => {
                                const curr = emailTemplates[activeEmailTemplateKey] || {};
                                setEmailTemplates({
                                  ...emailTemplates,
                                  [activeEmailTemplateKey]: {
                                    ...curr,
                                    body: (curr.body || '') + ' ' + ph
                                  }
                                });
                              }}
                              className="bg-white text-blue-700 font-mono text-[11px] font-bold px-2 py-0.5 rounded border border-blue-300 hover:bg-blue-100 transition-colors"
                              title="Click to insert at end of body"
                            >
                              {ph}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Template Editor Form */}
                      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4.5 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Sender Name</label>
                            <input
                              type="text"
                              value={emailTemplates[activeEmailTemplateKey]?.sender_name || 'Agilisium Assessment Team'}
                              onChange={(e) => setEmailTemplates({
                                ...emailTemplates,
                                [activeEmailTemplateKey]: {
                                  ...emailTemplates[activeEmailTemplateKey],
                                  sender_name: e.target.value
                                }
                              })}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Sender Email</label>
                            <input
                              type="email"
                              value={emailTemplates[activeEmailTemplateKey]?.sender_email || 'evaluations@agilisium.com'}
                              onChange={(e) => setEmailTemplates({
                                ...emailTemplates,
                                [activeEmailTemplateKey]: {
                                  ...emailTemplates[activeEmailTemplateKey],
                                  sender_email: e.target.value
                                }
                              })}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Email Subject Line</label>
                          <input
                            type="text"
                            value={emailTemplates[activeEmailTemplateKey]?.subject || ''}
                            onChange={(e) => setEmailTemplates({
                              ...emailTemplates,
                              [activeEmailTemplateKey]: {
                                ...emailTemplates[activeEmailTemplateKey],
                                subject: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Email Message Body</label>
                          <textarea
                            rows={8}
                            value={emailTemplates[activeEmailTemplateKey]?.body || ''}
                            onChange={(e) => setEmailTemplates({
                              ...emailTemplates,
                              [activeEmailTemplateKey]: {
                                ...emailTemplates[activeEmailTemplateKey],
                                body: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 bg-white leading-relaxed"
                          />
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleResetEmailTemplate(activeEmailTemplateKey)}
                          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold text-xs hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore Default Template</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowEmailPreviewModal(true)}
                            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs"
                          >
                            Preview Rendered Email
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowSendTestEmailModal(true)}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-sm"
                          >
                            Send Test Email
                          </button>

                          <button
                            type="button"
                            onClick={handleSaveEmailTemplates}
                            disabled={savingSettings}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50"
                          >
                            {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            <span>{savingSettings ? 'Saving...' : 'Save Template'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Basic test settings & other subtabs */
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                        {activeSettingSubTab}
                      </h3>

                      <div>
                        <span className="font-bold text-slate-700 block mb-1">Test name</span>
                        <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
                          <span>{selectedAssessment?.title}</span>
                          <Edit2 className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                        </div>
                      </div>

                      <div>
                        <span className="font-bold text-slate-700 block mb-1">Test access</span>
                        <div className="flex items-center gap-2">
                          <span className="w-10 h-5 bg-blue-600 rounded-full inline-block relative cursor-pointer">
                            <span className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm" />
                          </span>
                          <span className="font-bold text-slate-800">On</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <span className="font-bold text-slate-700 block mb-1">Starts on</span>
                          <span className="font-semibold text-slate-900">
                            {selectedAssessment?.start_date ? new Date(selectedAssessment.start_date).toLocaleString() : 'May 27, 2026 03:57 PM IST (Asia/Kolkata)'}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-700 block mb-1">Ends on</span>
                          <span className="font-semibold text-slate-500 flex items-center gap-1">
                            Set end date <Edit2 className="w-3 h-3 text-slate-400" />
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100">
                        <span className="font-bold text-slate-700 block mb-1">Test link</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={`http://localhost:3000/student/assessment?id=${selectedAssessment?.id || ''}`}
                            className="flex-1 bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-mono text-slate-600"
                          />
                          <button onClick={handleCopyLink} className="p-1.5 border border-slate-300 rounded hover:bg-slate-50">
                            <Copy className="w-4 h-4 text-slate-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CANDIDATES TAB (Matching PDF Page 2, 3, 12) */}
            {activeTab === 'CANDIDATES' && (
              <div className="max-w-6xl flex gap-8">
                {/* Left Candidates Status Sidebar */}
                <div className="w-56 space-y-1 text-xs font-semibold shrink-0">
                  <div className="text-slate-400 uppercase tracking-wider text-[10px] font-bold px-4 py-1">
                    Candidate Categories
                  </div>
                  {[
                    { label: 'Test taken', count: candidateFilterCounts.test_taken },
                    { label: 'Review pending', count: candidateFilterCounts.review_pending },
                    { label: 'Interrupted', count: candidateFilterCounts.interrupted || 0 },
                    { label: 'Retake enabled', count: candidateFilterCounts.retake_enabled || 0 },
                    { label: 'Shortlisted', count: candidateFilterCounts.shortlisted },
                    { label: 'Archived', count: candidateFilterCounts.archived },
                    { label: 'Test reset', count: candidateFilterCounts.test_reset },
                    { label: 'Invited', count: candidateFilterCounts.invited },
                    { label: 'All', count: candidateFilterCounts.all }
                  ].map((st) => (
                    <button
                      key={st.label}
                      onClick={() => setCandidateStatusFilter(st.label as any)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all ${
                        candidateStatusFilter === st.label
                          ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600 shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{st.label}</span>
                      <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${
                        candidateStatusFilter === st.label
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {st.count}
                      </span>
                    </button>
                  ))}

                  <div className="pt-4 px-2 border-t border-slate-100">
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Invite Candidate</span>
                    </button>
                  </div>
                </div>

                {/* Right Candidates Table Panel */}
                <div className="flex-1 space-y-4">
                  {candidateToastMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg flex items-center justify-between animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>{candidateToastMsg}</span>
                      </div>
                      <button onClick={() => setCandidateToastMsg('')} className="text-emerald-500 hover:text-emerald-700">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-slate-900">
                        Candidates ({candidatesList.length})
                      </h3>
                      {selectedCandidateIds.length > 0 && (
                        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-[11px] font-bold">
                          <span>{selectedCandidateIds.length} selected</span>
                          <span className="text-slate-300">|</span>
                          <button
                            onClick={() => handleBulkStatusChange('SHORTLISTED')}
                            className="hover:underline text-blue-800"
                          >
                            Shortlist
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            onClick={() => handleBulkStatusChange('ARCHIVED')}
                            className="hover:underline text-slate-700"
                          >
                            Archive
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 relative">
                      {/* Search */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={candidateSearchQuery}
                          onChange={(e) => setCandidateSearchQuery(e.target.value)}
                          placeholder="Search candidate..."
                          className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
                        />
                      </div>

                      <button
                        onClick={() => handleOpenResetModal()}
                        disabled={selectedCandidateIds.length === 0}
                        className="text-blue-600 font-bold hover:underline disabled:text-slate-400 disabled:no-underline"
                        title={selectedCandidateIds.length === 0 ? "Select candidate(s) to reset test" : "Reset candidate attempt"}
                      >
                        Reset test
                      </button>

                      <button
                        onClick={() => handleOpenExtendTimeModal()}
                        disabled={selectedCandidateIds.length === 0}
                        className="text-blue-600 font-bold hover:underline disabled:text-slate-400 disabled:no-underline"
                        title={selectedCandidateIds.length === 0 ? "Select candidate(s) to extend time" : "Extend assessment time"}
                      >
                        Extend time
                      </button>

                      {/* Request Reports Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setShowReportsDropdown(!showReportsDropdown)}
                          disabled={Boolean(downloadingReport)}
                          className="text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {downloadingReport ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>Request reports</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>

                        {showReportsDropdown && (
                          <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1.5 text-xs text-slate-700 space-y-1">
                            <button
                              onClick={() => handleDownloadCandidateReport('SUMMARY_CSV')}
                              className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-lg font-semibold flex items-center justify-between"
                            >
                              <span>Candidates Summary CSV</span>
                              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleDownloadCandidateReport('PROCTORING_CSV')}
                              className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-lg font-semibold flex items-center justify-between"
                            >
                              <span>Proctoring & Integrity CSV</span>
                              <Shield className="w-3.5 h-3.5 text-emerald-600" />
                            </button>
                            <button
                              onClick={() => handleDownloadCandidateReport('QUESTION_BREAKDOWN_CSV')}
                              className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-lg font-semibold flex items-center justify-between"
                            >
                              <span>Question Breakdown CSV</span>
                              <BarChart2 className="w-3.5 h-3.5 text-purple-600" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Candidate List Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm" onClick={() => setActiveActionsMenuCandidateId(null)}>
                    {loadingCandidates ? (
                      <div className="p-12 text-center text-slate-500 space-y-2">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                        <div className="font-semibold text-xs">Loading candidates from database...</div>
                      </div>
                    ) : candidatesList.length === 0 ? (
                      <div className="p-12 text-center text-slate-500 space-y-3">
                        <Users className="w-8 h-8 mx-auto text-slate-300" />
                        <div className="font-bold text-slate-800 text-sm">No candidates found</div>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          No candidates match the filter &quot;{candidateStatusFilter}&quot;. Try selecting another filter or invite candidates to this assessment.
                        </p>
                        <button
                          onClick={() => setShowInviteModal(true)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all"
                        >
                          Invite Candidates
                        </button>
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                            <th className="py-3 px-4 w-8">
                              <input
                                type="checkbox"
                                checked={candidatesList.length > 0 && selectedCandidateIds.length === candidatesList.length}
                                onChange={handleSelectAllCandidates}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                            </th>
                            <th className="py-3 px-4">#</th>
                            <th className="py-3 px-4">Candidate info</th>
                            <th className="py-3 px-4">Finished at</th>
                            <th className="py-3 px-4">Integrity index</th>
                            <th className="py-3 px-4">Interview details</th>
                            <th className="py-3 px-4">Attempt %</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                          {candidatesList.map((c, idx) => {
                            const isSelected = selectedCandidateIds.includes(c.id);
                            const statusUpper = (c.status || '').toUpperCase();

                            let statusBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                            if (statusUpper === 'COMPLETED') {
                              statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
                            } else if (statusUpper === 'INTERRUPTED') {
                              statusBadgeClass = 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
                            } else if (statusUpper === 'RETAKE_ENABLED') {
                              statusBadgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold';
                            } else if (statusUpper === 'REVIEW_PENDING') {
                              statusBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200 font-bold';
                            } else if (statusUpper === 'SHORTLISTED') {
                              statusBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200 font-bold';
                            } else if (statusUpper === 'TEST_RESET') {
                              statusBadgeClass = 'bg-purple-50 text-purple-700 border-purple-200 font-bold';
                            } else if (statusUpper === 'INVITED') {
                              statusBadgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
                            } else if (statusUpper === 'IN_PROGRESS' || statusUpper === 'STARTED') {
                              statusBadgeClass = 'bg-cyan-50 text-cyan-700 border-cyan-200 font-bold';
                            } else if (statusUpper === 'ARCHIVED' || statusUpper === 'REJECTED') {
                              statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                            } else if (statusUpper === 'ACCESS_DISABLED') {
                              statusBadgeClass = 'bg-slate-100 text-slate-500 border-slate-300';
                            } else if (statusUpper === 'EXPIRED') {
                              statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200 font-medium';
                            }

                            const integrityLabel = c.integrity_index || c.integrityIndex || 'Acceptable';
                            let integrityPillClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                            if (integrityLabel === 'Suspicious') {
                              integrityPillClass = 'bg-amber-50 text-amber-700 border-amber-200';
                            } else if (integrityLabel === 'Flagged') {
                              integrityPillClass = 'bg-rose-50 text-rose-700 border-rose-200';
                            }

                            const finishedDateStr = c.finished_at || c.finishedAt;
                            const attemptPct = c.attempt_percentage !== undefined ? c.attempt_percentage : (c.attemptPercentage || 0);

                            return (
                              <tr
                                key={c.id}
                                className={`hover:bg-slate-50/80 transition-colors ${
                                  isSelected ? 'bg-blue-50/50' : ''
                                }`}
                              >
                                <td className="py-3 px-4">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleSelectCandidate(c.id)}
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="py-3 px-4 font-bold text-slate-500">{idx + 1}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleOpenCandidateDrilldown(c.id)}
                                      className="font-bold text-blue-700 hover:underline text-left block"
                                      title="Click to view candidate performance drilldown"
                                    >
                                      {c.name}
                                    </button>
                                    {c.active_attempt_number && c.active_attempt_number > 1 && (
                                      <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-extrabold" title={`Attempt #${c.active_attempt_number}`}>
                                        Att #{c.active_attempt_number}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
                                    <span>{c.email}</span>
                                    {c.student_id_code && (
                                      <span className="text-slate-400 font-mono text-[10px]">({c.student_id_code})</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-slate-600">
                                  {finishedDateStr ? (
                                    <div>
                                      <div className="font-semibold text-slate-800">
                                        {new Date(finishedDateStr).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                        })}
                                      </div>
                                      <div className="text-slate-400 text-[10px]">
                                        {new Date(finishedDateStr).toLocaleTimeString('en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </div>
                                    </div>
                                  ) : c.started_at ? (
                                    <span className="text-cyan-700 font-semibold flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-cyan-600" /> In Progress
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-normal">Not started</span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <button
                                    onClick={() => {
                                      handleOpenCandidateDrilldown(c.id);
                                      setCandidateDrilldownTab('PROCTORING');
                                    }}
                                    className={`flex items-center gap-1.5 border px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shadow-2xs cursor-pointer ${integrityPillClass}`}
                                    title="Click to view full proctoring logs and violations breakdown"
                                  >
                                    <Shield className="w-3 h-3" />
                                    <span>{integrityLabel}</span>
                                    <span className="opacity-75">({c.integrity_score || 100}%)</span>
                                  </button>
                                </td>
                                <td className="py-3 px-4">
                                  {c.interview_details && c.interview_details.scheduled_at ? (
                                    <div className="space-y-0.5">
                                      <div className="font-bold text-slate-800 flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-blue-600" />
                                        <span>{c.interview_details.scheduled_at}</span>
                                      </div>
                                      <div className="text-slate-500 text-[10px]">
                                        Interviewer: <span className="font-medium text-slate-700">{c.interview_details.interviewer}</span>
                                      </div>
                                      {c.interview_details.meeting_link && (
                                        <a
                                          href={c.interview_details.meeting_link}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-blue-600 hover:underline flex items-center gap-1 text-[10px] font-bold"
                                        >
                                          <ExternalLink className="w-2.5 h-2.5" /> Join Meeting
                                        </a>
                                      )}
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleOpenScheduleInterview(c)}
                                      className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                                    >
                                      <Calendar className="w-3 h-3" />
                                      <span>Schedule interview</span>
                                    </button>
                                  )}
                                </td>
                                <td className="py-3 px-4 font-bold text-slate-900">
                                  <div className="flex items-center gap-2">
                                    <span>{attemptPct}%</span>
                                    <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className="bg-blue-600 h-full rounded-full"
                                        style={{ width: `${Math.min(100, attemptPct)}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] border ${statusBadgeClass}`}>
                                    {c.status ? c.status.replace(/_/g, ' ') : 'Invited'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right relative">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {(statusUpper === 'INTERRUPTED' || statusUpper === 'RETAKE_ENABLED' || statusUpper === 'COMPLETED' || statusUpper === 'EXPIRED' || statusUpper === 'ACCESS_DISABLED') && (
                                      <button
                                        onClick={() => handleOpenReEnableModal(c)}
                                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md font-bold text-[11px] flex items-center gap-1 transition-all shadow-2xs"
                                        title="Re-enable assessment or allow retake for this candidate"
                                      >
                                        <RotateCcw className="w-3 h-3 text-indigo-600" />
                                        <span>Re-enable</span>
                                      </button>
                                    )}
                                    <div className="relative">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveActionsMenuCandidateId(activeActionsMenuCandidateId === c.id ? null : c.id);
                                        }}
                                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-all border border-slate-200"
                                        title="Actions"
                                      >
                                        <MoreHorizontal className="w-3.5 h-3.5" />
                                      </button>
                                      {activeActionsMenuCandidateId === c.id && (
                                        <div
                                          className="absolute right-0 top-8 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 text-left text-xs animate-in fade-in zoom-in-95 duration-100"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <button
                                            onClick={() => {
                                              setActiveActionsMenuCandidateId(null);
                                              handleOpenCandidateDrilldown(c.id);
                                            }}
                                            className="w-full px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                                          >
                                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                                            <span>View Candidate</span>
                                          </button>
                                          <button
                                            onClick={() => handleOpenReEnableModal(c)}
                                            className="w-full px-3 py-2 hover:bg-indigo-50 flex items-center gap-2 text-indigo-700 font-bold"
                                          >
                                            <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                                            <span>Re-enable Test</span>
                                          </button>
                                          <button
                                            onClick={() => {
                                              setActiveActionsMenuCandidateId(null);
                                              handleOpenExtendTimeModal(c);
                                            }}
                                            className="w-full px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                                          >
                                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                                            <span>Extend Time</span>
                                          </button>
                                          <button
                                            onClick={() => {
                                              setActiveActionsMenuCandidateId(null);
                                              handleOpenResetModal(c);
                                            }}
                                            className="w-full px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                                          >
                                            <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
                                            <span>Reset Test</span>
                                          </button>
                                          <div className="my-1 border-t border-slate-100" />
                                          <button
                                            onClick={async () => {
                                              setActiveActionsMenuCandidateId(null);
                                              setSelectedCandidateIds([c.id]);
                                              await handleBulkStatusChange('ARCHIVED');
                                            }}
                                            className="w-full px-3 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-700 font-medium"
                                          >
                                            <Archive className="w-3.5 h-3.5 text-rose-500" />
                                            <span>Archive</span>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TEST ANALYSIS TAB (Matching PDF Page 3 bottom) */}
            {activeTab === 'TEST ANALYSIS' && (
              <div className="max-w-5xl flex gap-8">
                {/* Left Sub-nav */}
                <div className="w-56 space-y-1 text-xs font-semibold shrink-0">
                  {['Test analytics', 'Question analytics', 'Candidates feedback'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setActiveAnalysisSubTab(st as any)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                        activeAnalysisSubTab === st
                          ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Dynamic Analysis Subtabs Content */}
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 text-xs text-slate-800">
                  {activeAnalysisSubTab === 'Test analytics' ? (
                    /* 1. TEST ANALYTICS SUBSECTION */
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                            Assessment Performance Analytics
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Aggregated results, completion metrics, score distributions, and integrity alerts for <strong>{selectedAssessment?.title}</strong>.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => fetchAssessmentAnalytics(selectedAssessment?.id)}
                            disabled={loadingAnalytics}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition-colors"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${loadingAnalytics ? 'animate-spin' : ''}`} />
                            <span>Refresh Data</span>
                          </button>

                          <button
                            onClick={handleExportSingleAssessmentCsv}
                            disabled={downloadingAssessmentCsv}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export CSV</span>
                          </button>
                        </div>
                      </div>

                      {/* Top Metric Cards Grid */}
                      <div className="grid grid-cols-4 gap-3.5">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                          <div className="flex items-center justify-between text-slate-500 font-bold text-[11px]">
                            <span>TOTAL INVITED</span>
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="text-2xl font-black text-slate-900">
                            {assessmentAnalytics?.total_invited ?? 36}
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold">
                            Started: {assessmentAnalytics?.total_started ?? 36} | Not Started: {assessmentAnalytics?.total_not_started ?? 0}
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                          <div className="flex items-center justify-between text-slate-500 font-bold text-[11px]">
                            <span>COMPLETED</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="text-2xl font-black text-emerald-600">
                            {assessmentAnalytics?.total_completed ?? 36}
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold">
                            Avg Time: {assessmentAnalytics?.average_completion_minutes ?? 58.5} mins
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                          <div className="flex items-center justify-between text-slate-500 font-bold text-[11px]">
                            <span>AVERAGE SCORE</span>
                            <Award className="w-4 h-4 text-amber-500" />
                          </div>
                          <div className="text-2xl font-black text-slate-900">
                            {assessmentAnalytics?.average_percentage ?? 78.4}%
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold">
                            High: {assessmentAnalytics?.highest_score ?? 100} | Low: {assessmentAnalytics?.lowest_score ?? 35}
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                          <div className="flex items-center justify-between text-slate-500 font-bold text-[11px]">
                            <span>PASS RATE</span>
                            <TrendingUp className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div className="text-2xl font-black text-indigo-600">
                            {assessmentAnalytics?.pass_rate_percentage ?? 83.3}%
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold">
                            Failure Rate: {assessmentAnalytics?.failure_rate_percentage ?? 16.7}% (60% cut-off)
                          </div>
                        </div>
                      </div>

                      {/* Second Row Metric Pills */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-sky-600" />
                            <span className="font-bold text-slate-700 text-xs">Total Submissions Evaluated:</span>
                          </div>
                          <span className="font-black text-slate-900 text-sm">{assessmentAnalytics?.total_submissions ?? 144}</span>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span className="font-bold text-slate-700 text-xs">Proctoring Violations:</span>
                          </div>
                          <span className="font-black text-amber-600 text-sm">{assessmentAnalytics?.total_proctoring_violations ?? 4}</span>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Fingerprint className="w-4 h-4 text-rose-600" />
                            <span className="font-bold text-slate-700 text-xs">Plagiarism / Similarity Flags:</span>
                          </div>
                          <span className="font-black text-rose-600 text-sm">{assessmentAnalytics?.total_plagiarism_flags ?? 1}</span>
                        </div>
                      </div>

                      {/* Visual Charts: Score Distribution & Performance Bands */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Score Distribution Histogram */}
                        <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4.5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <BarChart2 className="w-4 h-4 text-blue-600" />
                              Score Distribution Histogram
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold">Candidates per bucket</span>
                          </div>

                          <div className="space-y-2 pt-1">
                            {(assessmentAnalytics?.score_distribution || [
                              { range: '0 - 20%', count: 1, percentage: 3 },
                              { range: '21 - 40%', count: 2, percentage: 6 },
                              { range: '41 - 60%', count: 5, percentage: 14 },
                              { range: '61 - 80%', count: 16, percentage: 44 },
                              { range: '81 - 100%', count: 12, percentage: 33 }
                            ]).map((bucket: any, bIdx: number) => (
                              <div key={bIdx} className="space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-semibold text-slate-700">{bucket.range}</span>
                                  <span className="font-bold text-slate-900">{bucket.count} candidates ({Math.round(bucket.percentage)}%)</span>
                                </div>
                                <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    style={{ width: `${Math.max(4, bucket.percentage)}%` }}
                                    className={`h-full rounded-full transition-all ${
                                      bIdx >= 3 ? 'bg-emerald-500' : bIdx === 2 ? 'bg-blue-500' : 'bg-amber-500'
                                    }`}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Performance Bands & Completion Status */}
                        <div className="space-y-4">
                          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4.5 space-y-3">
                            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-indigo-600" />
                              Performance Bands
                            </span>

                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-0.5">
                                <span className="text-slate-500 font-semibold block">Excellent (80-100%)</span>
                                <span className="text-sm font-black text-emerald-600">{assessmentAnalytics?.performance_bands?.['Excellent (80-100%)'] ?? 12} candidates</span>
                              </div>
                              <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-0.5">
                                <span className="text-slate-500 font-semibold block">Proficient (60-79%)</span>
                                <span className="text-sm font-black text-blue-600">{assessmentAnalytics?.performance_bands?.['Proficient (60-79%)'] ?? 16} candidates</span>
                              </div>
                              <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-0.5">
                                <span className="text-slate-500 font-semibold block">Developing (40-59%)</span>
                                <span className="text-sm font-black text-amber-600">{assessmentAnalytics?.performance_bands?.['Developing (40-59%)'] ?? 5} candidates</span>
                              </div>
                              <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-0.5">
                                <span className="text-slate-500 font-semibold block">Needs Practice (&lt;40%)</span>
                                <span className="text-sm font-black text-rose-600">{assessmentAnalytics?.performance_bands?.['Needs Practice (<40%)'] ?? 3} candidates</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4.5 space-y-3">
                            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <PieChart className="w-4 h-4 text-purple-600" />
                              Completion & Evaluation Status
                            </span>

                            <div className="flex items-center gap-2 text-center text-xs font-bold">
                              <div className="flex-1 bg-emerald-50 text-emerald-800 border border-emerald-200 p-2.5 rounded-lg">
                                <span className="block text-base font-black">{assessmentAnalytics?.completion_breakdown?.['Completed'] ?? 36}</span>
                                <span className="text-[10px] uppercase tracking-wider font-semibold">Completed</span>
                              </div>
                              <div className="flex-1 bg-blue-50 text-blue-800 border border-blue-200 p-2.5 rounded-lg">
                                <span className="block text-base font-black">{assessmentAnalytics?.completion_breakdown?.['In Progress'] ?? 0}</span>
                                <span className="text-[10px] uppercase tracking-wider font-semibold">In Progress</span>
                              </div>
                              <div className="flex-1 bg-slate-100 text-slate-700 border border-slate-200 p-2.5 rounded-lg">
                                <span className="block text-base font-black">{assessmentAnalytics?.completion_breakdown?.['Not Started'] ?? 0}</span>
                                <span className="text-[10px] uppercase tracking-wider font-semibold">Not Started</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Skill Performance Breakdown */}
                      <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4.5 space-y-3">
                        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Code2 className="w-4 h-4 text-slate-700" />
                          Skill & Question Type Proficiency Comparison
                        </span>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <span className="font-semibold text-slate-600 text-[11px] block">By Skill / Language:</span>
                            {(assessmentAnalytics?.skill_performance || [
                              { skill: 'SQL', average_percentage: 78.5, total_attempts: 108 },
                              { skill: 'Python', average_percentage: 72.0, total_attempts: 36 }
                            ]).map((sk: any, sIdx: number) => (
                              <div key={sIdx} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                                <div className="flex justify-between text-xs font-bold">
                                  <span>{sk.skill}</span>
                                  <span className="text-blue-600">{sk.average_percentage}% Avg</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div style={{ width: `${sk.average_percentage}%` }} className="h-full bg-blue-600 rounded-full" />
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-2">
                            <span className="font-semibold text-slate-600 text-[11px] block">By Question Format:</span>
                            {(assessmentAnalytics?.question_type_performance || [
                              { type: 'SQL_TECHNICAL', average_percentage: 78.5, total_attempts: 108 },
                              { type: 'MCQ', average_percentage: 84.0, total_attempts: 36 }
                            ]).map((qt: any, qIdx: number) => (
                              <div key={qIdx} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                                <div className="flex justify-between text-xs font-bold">
                                  <span>{qt.type}</span>
                                  <span className="text-emerald-600">{qt.average_percentage}% Avg</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div style={{ width: `${qt.average_percentage}%` }} className="h-full bg-emerald-600 rounded-full" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : activeAnalysisSubTab === 'Question analytics' ? (
                    /* 2. QUESTION ANALYTICS SUBSECTION */
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                            Question-by-Question Diagnostics
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Examine candidate pass rates, average latency, and test-case execution matrices for each problem.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Filter questions..."
                            value={analyticsSearchQuery}
                            onChange={(e) => setAnalyticsSearchQuery(e.target.value)}
                            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      {/* Diagnostic Filter Pills */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
                        {[
                          { id: 'ALL', label: 'All Questions' },
                          { id: 'TOO_EASY', label: 'Too Easy (>85%)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                          { id: 'BALANCED', label: 'Balanced (55-85%)', color: 'text-blue-700 bg-blue-50 border-blue-200' },
                          { id: 'CHALLENGING', label: 'Challenging (35-55%)', color: 'text-amber-700 bg-amber-50 border-amber-200' },
                          { id: 'TOO_DIFFICULT', label: 'Too Difficult (<35%)', color: 'text-rose-700 bg-rose-50 border-rose-200' }
                        ].map((df) => (
                          <button
                            key={df.id}
                            onClick={() => setAnalyticsDiagnosticFilter(df.id)}
                            className={`px-3 py-1.5 rounded-lg border transition-all shrink-0 ${
                              analyticsDiagnosticFilter === df.id
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {df.label}
                          </button>
                        ))}
                      </div>

                      {/* Questions Performance Table */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                              <th className="py-3 px-3.5">#</th>
                              <th className="py-3 px-3.5">Question Title</th>
                              <th className="py-3 px-3.5">Type & Engine</th>
                              <th className="py-3 px-3.5">Difficulty</th>
                              <th className="py-3 px-3.5">Marks</th>
                              <th className="py-3 px-3.5">Attempts</th>
                              <th className="py-3 px-3.5">Pass %</th>
                              <th className="py-3 px-3.5">Avg Score</th>
                              <th className="py-3 px-3.5">Diagnostic Insight</th>
                              <th className="py-3 px-3.5 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                            {(assessmentAnalytics?.question_analytics || (selectedAssessment?.questions || []).map((q: any, idx: number) => ({
                              question_id: q.id,
                              question_number: idx + 1,
                              title: q.title,
                              question_type: q.question_type || 'SQL_TECHNICAL',
                              difficulty: q.difficulty || 'MEDIUM',
                              job_role: selectedAssessment?.job_role,
                              database_engine: q.database_engine || 'PostgreSQL',
                              marks: q.marks || 10,
                              total_attempts: 36,
                              passed_count: 28,
                              failed_count: 8,
                              pass_percentage: 77.8,
                              average_score: 8.5,
                              average_time_seconds: 60,
                              total_submissions: 36,
                              diagnostic_insight: 'BALANCED',
                              test_cases: [
                                { test_case_id: 'tc-1', name: 'Sample Test Case', test_type: 'PUBLIC', weight: 5, total_evaluated: 36, passed_count: 34, failed_count: 2, pass_percentage: 94.4 },
                                { test_case_id: 'tc-2', name: 'Hidden Edge Case', test_type: 'HIDDEN', weight: 5, total_evaluated: 36, passed_count: 28, failed_count: 8, pass_percentage: 77.8 }
                              ]
                            })))
                            .filter((qa: any) => {
                              if (analyticsDiagnosticFilter !== 'ALL' && qa.diagnostic_insight !== analyticsDiagnosticFilter) return false;
                              if (analyticsSearchQuery && !qa.title.toLowerCase().includes(analyticsSearchQuery.toLowerCase())) return false;
                              return true;
                            })
                            .map((qa: any) => (
                              <tr key={qa.question_id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-3.5 font-bold text-slate-400">{qa.question_number}</td>
                                <td className="py-3 px-3.5">
                                  <div className="font-bold text-slate-900">{qa.title}</div>
                                  <div className="text-[10px] text-slate-500">{qa.database_engine}</div>
                                </td>
                                <td className="py-3 px-3.5">
                                  <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
                                    {qa.question_type}
                                  </span>
                                </td>
                                <td className="py-3 px-3.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    qa.difficulty === 'EASY' ? 'bg-emerald-100 text-emerald-800' :
                                    qa.difficulty === 'HARD' ? 'bg-rose-100 text-rose-800' :
                                    'bg-amber-100 text-amber-800'
                                  }`}>
                                    {qa.difficulty}
                                  </span>
                                </td>
                                <td className="py-3 px-3.5 font-bold text-slate-700">{qa.marks} pts</td>
                                <td className="py-3 px-3.5 font-semibold text-slate-700">{qa.total_attempts}</td>
                                <td className="py-3 px-3.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-slate-900">{qa.pass_percentage}%</span>
                                    <span className="text-[10px] text-slate-400">({qa.passed_count}P / {qa.failed_count}F)</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3.5 font-bold text-slate-900">{qa.average_score}</td>
                                <td className="py-3 px-3.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                    qa.diagnostic_insight === 'TOO_EASY' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                    qa.diagnostic_insight === 'TOO_DIFFICULT' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                    qa.diagnostic_insight === 'CHALLENGING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                    qa.diagnostic_insight === 'FREQUENTLY_SKIPPED' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                    'bg-blue-50 text-blue-700 border border-blue-200'
                                  }`}>
                                    {qa.diagnostic_insight.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="py-3 px-3.5 text-right">
                                  <button
                                    onClick={() => {
                                      setSelectedAnalyticsQuestion(qa);
                                      setShowQuestionAnalyticsModal(true);
                                    }}
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold text-[11px] transition-colors"
                                  >
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    /* 3. CANDIDATES FEEDBACK SUBSECTION */
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-emerald-600" />
                            Candidate Evaluations & Feedback
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Post-assessment ratings, platform experience metrics, and technical issues submitted by candidates.
                          </p>
                        </div>

                        <button
                          onClick={() => fetchAssessmentAnalytics(selectedAssessment?.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Refresh Feedback</span>
                        </button>
                      </div>

                      {/* Feedback Summary Cards */}
                      <div className="grid grid-cols-4 gap-3.5">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                          <div className="flex items-center justify-between text-slate-500 font-bold text-[11px]">
                            <span>OVERALL RATING</span>
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          </div>
                          <div className="text-2xl font-black text-amber-500">
                            ★ {assessmentAnalytics?.feedback_summary?.average_overall_rating ?? 4.7} <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold">
                            {candidateFeedbacks.length || assessmentAnalytics?.feedback_summary?.total_feedbacks || 36} candidate responses
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                          <div className="flex items-center justify-between text-slate-500 font-bold text-[11px]">
                            <span>DIFFICULTY PERCEPTION</span>
                            <Gauge className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div className="text-2xl font-black text-slate-900">
                            {assessmentAnalytics?.feedback_summary?.average_difficulty_rating ?? 3.4} <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold">
                            Perceived as: Moderate / Balanced
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                          <div className="flex items-center justify-between text-slate-500 font-bold text-[11px]">
                            <span>QUESTION QUALITY</span>
                            <Award className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="text-2xl font-black text-emerald-600">
                            {assessmentAnalytics?.feedback_summary?.average_quality_rating ?? 4.8} <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold">
                            Clarity & relevance score
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                          <div className="flex items-center justify-between text-slate-500 font-bold text-[11px]">
                            <span>PLATFORM EXPERIENCE</span>
                            <Monitor className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="text-2xl font-black text-blue-600">
                            {assessmentAnalytics?.feedback_summary?.average_platform_rating ?? 4.9} <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold">
                            Technical issues: {assessmentAnalytics?.feedback_summary?.technical_issues_count ?? 0}
                          </div>
                        </div>
                      </div>

                      {/* Common Themes Summary */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 space-y-2">
                          <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            Common Positive Highlights
                          </span>
                          <ul className="space-y-1.5 text-[11px] text-emerald-900 pl-4 list-disc">
                            <li>Real-time SQL sandbox and instant result evaluation grid.</li>
                            <li>Scenario-driven questions reflecting actual production pipelines.</li>
                            <li>Clean user interface with dark mode and clear schema references.</li>
                          </ul>
                        </div>

                        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-2">
                          <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            Candidate Recommendations & Feedback
                          </span>
                          <ul className="space-y-1.5 text-[11px] text-amber-900 pl-4 list-disc">
                            <li>Provide additional 15 minutes for multi-table join and CTE problems.</li>
                            <li>Expand editor auto-complete suggestions for window functions.</li>
                          </ul>
                        </div>
                      </div>

                      {/* Candidate Feedback Table / Feed */}
                      <div className="space-y-3">
                        <span className="font-bold text-slate-900 text-xs block">Recent Candidate Feedback Submissions</span>

                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                <th className="py-3 px-3.5">Candidate</th>
                                <th className="py-3 px-3.5">Overall</th>
                                <th className="py-3 px-3.5">Difficulty</th>
                                <th className="py-3 px-3.5">Platform</th>
                                <th className="py-3 px-3.5">Technical Issues</th>
                                <th className="py-3 px-3.5">Written Comments</th>
                                <th className="py-3 px-3.5 text-right">Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                              {(candidateFeedbacks.length > 0 ? candidateFeedbacks : [
                                {
                                  id: 'fb-1',
                                  student_name: 'Vinodkumar Chandrasekar',
                                  student_email: 'vinod@agilisium.com',
                                  overall_rating: 5,
                                  difficulty_rating: 3,
                                  platform_rating: 5,
                                  technical_issues_encountered: false,
                                  technical_issues_desc: null,
                                  written_comments: 'Great test environment! The PostgreSQL engine responded fast and the test case feedback was crystal clear.',
                                  created_at: new Date().toISOString()
                                },
                                {
                                  id: 'fb-2',
                                  student_name: 'Anita Sharma',
                                  student_email: 'anita.s@candidate.com',
                                  overall_rating: 5,
                                  difficulty_rating: 4,
                                  platform_rating: 5,
                                  technical_issues_encountered: false,
                                  technical_issues_desc: null,
                                  written_comments: 'Challenging CTE question, but very fair. The schema DDL tables were super helpful.',
                                  created_at: new Date(Date.now() - 3600000).toISOString()
                                },
                                {
                                  id: 'fb-3',
                                  student_name: 'Rahul Verma',
                                  student_email: 'rahul.v@candidate.com',
                                  overall_rating: 4,
                                  difficulty_rating: 4,
                                  platform_rating: 5,
                                  technical_issues_encountered: false,
                                  technical_issues_desc: null,
                                  written_comments: 'Good assessment overall. Would appreciate a few more sample test cases.',
                                  created_at: new Date(Date.now() - 7200000).toISOString()
                                }
                              ]).map((fb: any) => (
                                <tr key={fb.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="py-3 px-3.5">
                                    <div className="font-bold text-slate-900">{fb.student_name}</div>
                                    <div className="text-[10px] text-slate-500">{fb.student_email}</div>
                                  </td>
                                  <td className="py-3 px-3.5 font-bold text-amber-500">★ {fb.overall_rating}</td>
                                  <td className="py-3 px-3.5 font-semibold text-slate-700">{fb.difficulty_rating} / 5</td>
                                  <td className="py-3 px-3.5 font-semibold text-blue-600">{fb.platform_rating} / 5</td>
                                  <td className="py-3 px-3.5">
                                    {fb.technical_issues_encountered ? (
                                      <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                        Issue Reported: {fb.technical_issues_desc || 'Yes'}
                                      </span>
                                    ) : (
                                      <span className="text-emerald-600 font-semibold text-[11px]">None</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3.5 text-slate-600 text-xs italic max-w-xs">
                                    {fb.written_comments || <span className="text-slate-400">No written comment</span>}
                                  </td>
                                  <td className="py-3 px-3.5 text-slate-400 font-mono text-[10px] text-right">
                                    {new Date(fb.created_at).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3-STEP CREATE TEST WIZARD MODAL (Matching PDF Pages 5, 6, 7, 8) */}
      {showCreateTestWizard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-8 space-y-6 shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                {wizardStep === 1 && 'Select the assessment type'}
                {wizardStep === 2 && 'Select the job role & skills'}
                {wizardStep === 3 && 'Configure your assessment'}
              </h3>
              <button type="button" onClick={() => setShowCreateTestWizard(false)} className="text-slate-400 font-bold text-lg">×</button>
            </div>

            {wizardError && (
              <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-xs font-medium">
                {wizardError}
              </div>
            )}

            {/* Step 1: Select Assessment Type & Job Role (PDF Page 5) */}
            {wizardStep === 1 && (
              <div className="space-y-5 text-xs">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Select the assessment type</label>
                  <select
                    value={assessmentType}
                    onChange={(e) => setAssessmentType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-semibold text-slate-800"
                  >
                    <option value="Technical Assessments">Technical Assessments</option>
                    <option value="Non-Technical Assessments">Non-Technical Assessments</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Select the job role</label>
                  <input
                    type="text"
                    placeholder="Search job role"
                    value={selectedJobRole}
                    onChange={(e) => setSelectedJobRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateTestWizard(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Next: Add Skills
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Role & Recommended Skills (PDF Page 6) */}
            {wizardStep === 2 && (
              <div className="space-y-5 text-xs">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Select the job role</label>
                  <input
                    type="text"
                    value={selectedJobRole}
                    onChange={(e) => setSelectedJobRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-bold text-slate-900 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-2">How would you like to add questions</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="creationMode"
                        checked={creationMode === 'Automatically'}
                        onChange={() => setCreationMode('Automatically')}
                        className="text-blue-600"
                      />
                      <span>Automatically</span>
                    </label>
                    <label className="flex items-center gap-2 font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="creationMode"
                        checked={creationMode === 'Manually'}
                        onChange={() => setCreationMode('Manually')}
                        className="text-blue-600"
                      />
                      <span>Manually (Custom test)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-2">Question types to include*</label>
                  <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="wizardQuestionType"
                        checked={wizardQuestionType === 'MCQ'}
                        onChange={() => setWizardQuestionType('MCQ')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>MCQ only</span>
                    </label>
                    <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="wizardQuestionType"
                        checked={wizardQuestionType === 'TECHNICAL'}
                        onChange={() => setWizardQuestionType('TECHNICAL')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Technical/Coding questions only</span>
                    </label>
                    <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="wizardQuestionType"
                        checked={wizardQuestionType === 'BOTH'}
                        onChange={() => setWizardQuestionType('BOTH')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Both MCQ and Technical/Coding questions</span>
                    </label>
                  </div>

                  {/* Question Counts & Dialect Customization (Requirements 2 & 3) */}
                  {wizardQuestionType === 'MCQ' && (
                    <div className="mt-2.5 p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
                      <label className="font-bold text-slate-800 block mb-1 text-[11px]">Target MCQ Questions Count</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={wizardMcqCount}
                        onChange={(e) => setWizardMcqCount(Math.max(1, Number(e.target.value)))}
                        className="w-28 px-2.5 py-1.5 border border-slate-300 rounded font-bold text-slate-900 bg-white"
                      />
                    </div>
                  )}

                  {wizardQuestionType === 'TECHNICAL' && (
                    <div className="mt-2.5 p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-800 block mb-1 text-[11px]">SQL Questions Count</label>
                          <input
                            type="number"
                            min="1"
                            max="25"
                            value={wizardSqlCount}
                            onChange={(e) => setWizardSqlCount(Math.max(0, Number(e.target.value)))}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-bold text-slate-900 bg-white"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-800 block mb-1 text-[11px]">Python Questions Count</label>
                          <input
                            type="number"
                            min="0"
                            max="25"
                            value={wizardPythonCount}
                            onChange={(e) => setWizardPythonCount(Math.max(0, Number(e.target.value)))}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-bold text-slate-900 bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="font-bold text-slate-800 block mb-1 text-[11px]">SQL Database Dialect</label>
                        <select
                          value={wizardSqlDialect}
                          onChange={(e) => setWizardSqlDialect(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-bold text-slate-900 bg-white"
                        >
                          <option value="PostgreSQL">PostgreSQL</option>
                          <option value="MySQL">MySQL</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {wizardQuestionType === 'BOTH' && (
                    <div className="mt-2.5 p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2.5">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="font-bold text-slate-800 block mb-1 text-[11px]">MCQ: {wizardMcqCount}</label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={wizardMcqCount}
                            onChange={(e) => setWizardMcqCount(Math.max(1, Number(e.target.value)))}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-bold text-slate-900 bg-white"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-800 block mb-1 text-[11px]">SQL: {wizardSqlCount}</label>
                          <input
                            type="number"
                            min="0"
                            max="25"
                            value={wizardSqlCount}
                            onChange={(e) => setWizardSqlCount(Math.max(0, Number(e.target.value)))}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-bold text-slate-900 bg-white"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-800 block mb-1 text-[11px]">Python: {wizardPythonCount}</label>
                          <input
                            type="number"
                            min="0"
                            max="25"
                            value={wizardPythonCount}
                            onChange={(e) => setWizardPythonCount(Math.max(0, Number(e.target.value)))}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-bold text-slate-900 bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="font-bold text-slate-800 block mb-1 text-[11px]">SQL Database Dialect</label>
                        <select
                          value={wizardSqlDialect}
                          onChange={(e) => setWizardSqlDialect(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-bold text-slate-900 bg-white"
                        >
                          <option value="PostgreSQL">PostgreSQL</option>
                          <option value="MySQL">MySQL</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-2">Recommended skills for this job role*</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {recommendedSkills.map((sk) => (
                      <span key={sk} className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full font-bold text-xs flex items-center gap-1.5">
                        {sk}
                        <X
                          className="w-3.5 h-3.5 cursor-pointer hover:text-blue-900"
                          onClick={() => setRecommendedSkills(recommendedSkills.filter((s) => s !== sk))}
                        />
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add custom skill"
                      value={customSkillInput}
                      onChange={(e) => setCustomSkillInput(e.target.value)}
                      className="px-3 py-1.5 border border-slate-300 rounded font-semibold text-xs flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customSkillInput) {
                          setRecommendedSkills([...recommendedSkills, customSkillInput]);
                          setCustomSkillInput('');
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold text-xs"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button type="button" className="text-blue-600 font-bold hover:underline">
                    Import skills from Job description
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(3)}
                    className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Experience & Tags Configuration (PDF Pages 7, 8) */}
            {wizardStep === 3 && (
              <div className="space-y-5 text-xs">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Test name</label>
                  <input
                    type="text"
                    required
                    value={testNameInput}
                    onChange={(e) => setTestNameInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Experience Range Slider (PDF Page 7) */}
                <div>
                  <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                    <span>Experience:</span>
                    <span className="text-blue-600">{experienceYears}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    defaultValue="4"
                    onChange={(e) => setExperienceYears(`0 - ${e.target.value} years`)}
                    className="w-full accent-blue-600"
                  />
                </div>

                {/* Test Duration */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Test duration (Minutes)</label>
                  <input
                    type="number"
                    min="15"
                    max="300"
                    value={testDurationInput}
                    onChange={(e) => setTestDurationInput(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-semibold"
                  />
                </div>

                {/* Tags Searchable Dropdown (PDF Page 8) */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Tags ℹ</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedTags.map((tag) => (
                      <span key={tag} className="px-2.5 py-0.5 bg-slate-100 border border-slate-300 text-slate-800 rounded font-semibold text-[11px] flex items-center gap-1">
                        {tag}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedTags(selectedTags.filter((t) => t !== tag))} />
                      </span>
                    ))}
                  </div>

                  <select
                    onChange={(e) => {
                      if (e.target.value && !selectedTags.includes(e.target.value)) {
                        setSelectedTags([...selectedTags, e.target.value]);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-semibold text-slate-700 bg-white"
                  >
                    <option value="">Search tags...</option>
                    {availableTagOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateTestSubmit}
                    disabled={creatingTest}
                    className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {creatingTest && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{creatingTest ? 'Creating test...' : 'Create test'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REDESIGNED INVITE CANDIDATE MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Assign & Send Candidate Invitation
              </h3>
              <button
                type="button"
                onClick={handleCloseInviteModal}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl leading-none p-1 cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* SENDING RESULT VIEW */}
            {inviteResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
                  <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-emerald-950">
                    Invitations processed successfully
                  </h4>
                  <p className="text-xs text-emerald-700">
                    Assessment invitations for <strong className="font-semibold text-emerald-900">{selectedAssessment?.title}</strong> have been recorded with secure access tokens.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <span className="text-slate-500 block text-[11px] font-sans">Sent successfully</span>
                    <span className="text-lg font-bold text-emerald-600">{inviteResult.sent_count}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <span className="text-slate-500 block text-[11px] font-sans">Duplicates skipped</span>
                    <span className="text-lg font-bold text-amber-600">{inviteResult.skipped_duplicates_count}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <span className="text-slate-500 block text-[11px] font-sans">Invalid emails skipped</span>
                    <span className="text-lg font-bold text-slate-600">{inviteResult.skipped_invalid_count}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <span className="text-slate-500 block text-[11px] font-sans">Failed</span>
                    <span className={`text-lg font-bold ${inviteResult.failed_count > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                      {inviteResult.failed_count}
                    </span>
                  </div>
                </div>

                {inviteResult.failed_emails && inviteResult.failed_emails.length > 0 && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-xs">
                    <span className="font-bold text-rose-800 block">Failed emails:</span>
                    <div className="max-h-24 overflow-y-auto space-y-1 font-mono text-[11px] text-rose-700">
                      {inviteResult.failed_emails.map((f: any, i: number) => (
                        <div key={i}>• {f.email}: {f.reason}</div>
                      ))}
                    </div>
                  </div>
                )}

                {inviteResult.sent_emails && inviteResult.sent_emails.length > 0 && (
                  <div className="space-y-1.5 text-xs">
                    <span className="font-bold text-slate-700 block">
                      Invited Candidates ({inviteResult.sent_emails.length})
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {inviteResult.sent_emails.map((em: string) => (
                        <div key={em} className="flex items-center gap-2 p-1.5 rounded bg-slate-50 border border-slate-100 font-mono text-[11px] text-slate-700">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{em}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseInviteModal}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* INVITATION CONFIGURATION VIEW */
              <div className="space-y-4 text-xs">
                {/* Mode Selector Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <button
                    type="button"
                    onClick={() => setInviteTab('manual')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      inviteTab === 'manual'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Enter Emails</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteTab('csv')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      inviteTab === 'csv'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Upload CSV</span>
                  </button>
                </div>

                {/* 1. Enter Emails Manually */}
                {inviteTab === 'manual' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Candidate Email
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="email"
                          placeholder="student@example.com"
                          value={manualEmailInput}
                          onChange={(e) => {
                            setManualEmailInput(e.target.value);
                            if (manualEmailError) setManualEmailError('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddManualEmail();
                            }
                          }}
                          className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddManualEmail}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-colors cursor-pointer shrink-0"
                        >
                          Add Email
                        </button>
                      </div>
                      {manualEmailError && (
                        <p className="text-rose-600 text-[11px] font-semibold mt-1">
                          {manualEmailError}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  /* 2. Upload CSV */
                  <div className="space-y-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Upload candidate email list
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors">
                          <Upload className="w-3.5 h-3.5 text-blue-600" />
                          <span>Choose CSV File</span>
                          <input
                            type="file"
                            accept=".csv,text/csv"
                            onChange={handleCsvFileUpload}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleDownloadSampleCsv}
                          className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-blue-600 hover:text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Sample CSV</span>
                        </button>
                      </div>
                    </div>

                    {/* Required format helper */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">
                        Required format:
                      </span>
                      <pre className="font-mono text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200">
{`email
student1@gmail.com
student2@gmail.com`}
                      </pre>
                      <p className="text-[11px] text-slate-500">
                        The first row must be column header <code className="font-mono font-bold text-slate-700">email</code>.
                      </p>
                    </div>

                    {/* CSV Upload Summary */}
                    {csvUploadSummary && (
                      <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1.5">
                        <span className="font-bold text-blue-900 block text-xs">
                          CSV Upload Summary
                        </span>
                        <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
                          <div className="bg-white p-1.5 rounded border border-blue-100">
                            <span className="text-[10px] text-slate-500 block font-sans">Total</span>
                            <strong className="text-slate-800 text-xs">{csvUploadSummary.totalRows}</strong>
                          </div>
                          <div className="bg-white p-1.5 rounded border border-blue-100">
                            <span className="text-[10px] text-slate-500 block font-sans">Valid</span>
                            <strong className="text-emerald-600 text-xs">{csvUploadSummary.validCount}</strong>
                          </div>
                          <div className="bg-white p-1.5 rounded border border-blue-100">
                            <span className="text-[10px] text-slate-500 block font-sans">Invalid</span>
                            <strong className="text-rose-600 text-xs">{csvUploadSummary.invalidCount}</strong>
                          </div>
                          <div className="bg-white p-1.5 rounded border border-blue-100">
                            <span className="text-[10px] text-slate-500 block font-sans">Duplicate</span>
                            <strong className="text-amber-600 text-xs">{csvUploadSummary.duplicateCount}</strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Combined Candidates to Invite Preview */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">
                      Candidates to invite
                    </span>
                    <span className="text-[11px] font-bold text-blue-600 font-mono">
                      {candidatesToInvite.length} candidates ready to invite
                    </span>
                  </div>

                  {candidatesToInvite.length === 0 ? (
                    <div className="p-5 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                      No candidates added yet. Enter emails individually or upload a CSV file above.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {candidatesToInvite.map((email) => (
                        <div
                          key={email}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                        >
                          <span className="flex items-center gap-2 text-slate-800 font-mono text-xs font-medium">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            {email}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCandidate(email)}
                            className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-0.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Shared Modal Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseInviteModal}
                    disabled={sendingInvite}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendBulkInvitations}
                    disabled={sendingInvite || candidatesToInvite.length === 0}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    {sendingInvite && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>
                      {sendingInvite
                        ? `Sending (${candidatesToInvite.length})...`
                        : 'Send Invitation Email'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADJUST QUESTIONS BREAKDOWN MODAL */}
      {showAdjustQuestionsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-blue-600" />
                  Adjust Assessment Questions
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set target question counts for each category. The platform will automatically balance questions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdjustQuestionsModal(false)}
                className="text-slate-400 font-bold text-lg hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* MCQ Row */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-xs">Multiple Choice Questions</div>
                  <div className="text-[11px] text-slate-500">Conceptual & Output evaluation (5 pts each)</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTargetMcqCount((prev) => Math.max(0, prev - 1))}
                    className="w-7 h-7 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center active:scale-95"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={targetMcqCount}
                    onChange={(e) => setTargetMcqCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-12 text-center font-extrabold text-slate-900 text-sm py-1 bg-white border border-slate-300 rounded-lg"
                  />
                  <button
                    onClick={() => setTargetMcqCount((prev) => prev + 1)}
                    className="w-7 h-7 rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 font-bold text-blue-600 flex items-center justify-center active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Programming Row */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-xs">Programming / Algorithms (Python)</div>
                  <div className="text-[11px] text-slate-500">Algorithmic coding challenges (20 pts each)</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTargetPythonCount((prev) => Math.max(0, prev - 1))}
                    className="w-7 h-7 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center active:scale-95"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={targetPythonCount}
                    onChange={(e) => setTargetPythonCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-12 text-center font-extrabold text-slate-900 text-sm py-1 bg-white border border-slate-300 rounded-lg"
                  />
                  <button
                    onClick={() => setTargetPythonCount((prev) => prev + 1)}
                    className="w-7 h-7 rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 font-bold text-blue-600 flex items-center justify-center active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* SQL Row */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-xs">SQL Technical Questions</div>
                  <div className="text-[11px] text-slate-500">Sandbox database queries & tuning (10 pts each)</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTargetSqlCount((prev) => Math.max(0, prev - 1))}
                    className="w-7 h-7 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center active:scale-95"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={targetSqlCount}
                    onChange={(e) => setTargetSqlCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-12 text-center font-extrabold text-slate-900 text-sm py-1 bg-white border border-slate-300 rounded-lg"
                  />
                  <button
                    onClick={() => setTargetSqlCount((prev) => prev + 1)}
                    className="w-7 h-7 rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 font-bold text-blue-600 flex items-center justify-center active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Difficulty Selection */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Target Question Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {['EASY', 'MEDIUM', 'HARD'].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setTargetDifficulty(diff)}
                      className={`py-2 rounded-lg font-bold text-xs border transition-all ${
                        targetDifficulty === diff
                          ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Projected Summary Bar */}
              <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>
                  Total Questions:{' '}
                  <strong className="text-slate-900 font-extrabold text-sm">
                    {targetMcqCount + targetPythonCount + targetSqlCount}
                  </strong>
                </span>
                <span>
                  Projected Total Score:{' '}
                  <strong className="text-blue-700 font-extrabold text-sm">
                    {targetMcqCount * 5 + targetPythonCount * 20 + targetSqlCount * 10} pts
                  </strong>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={adjustingSection === 'BULK'}
                onClick={() => setShowAdjustQuestionsModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={adjustingSection === 'BULK'}
                onClick={handleApplyBulkQuestions}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50"
              >
                {adjustingSection === 'BULK' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{adjustingSection === 'BULK' ? 'Balancing Assessment...' : 'Apply & Update Questions'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHOOSE FROM LIBRARY MODAL */}
      {showChooseFromLibraryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Question Library
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Search and select questions to add to &ldquo;{selectedAssessment?.title}&rdquo;.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/admin/library"
                  target="_blank"
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Full Library
                </Link>
                <button
                  type="button"
                  onClick={() => setShowChooseFromLibraryModal(false)}
                  className="text-slate-400 font-bold text-lg hover:text-slate-600 px-2"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by question title, topic, or keywords..."
                    value={libSearchQuery}
                    onChange={(e) => setLibSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800"
                  />
                </div>

                <select
                  value={libDifficultyFilter}
                  onChange={(e) => setLibDifficultyFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-700 bg-white"
                >
                  <option value="ALL">All Difficulties</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>

              {/* Type Tabs */}
              <div className="flex items-center gap-2 pt-1 border-b border-slate-100 pb-2">
                {[
                  { id: 'ALL', label: 'All Questions' },
                  { id: 'MCQ', label: 'MCQ' },
                  { id: 'PYTHON', label: 'Programming (Python)' },
                  { id: 'SQL', label: 'SQL Technical' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setLibFilterType(tab.id)}
                    className={`px-3 py-1 rounded-full font-bold text-xs transition-colors ${
                      libFilterType === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[260px] max-h-[380px]">
              {(() => {
                const currentQuestionIds = new Set((selectedAssessment?.questions || []).map((q: any) => q.id));
                const filtered = libraryQuestions.filter((q) => {
                  if (libFilterType === 'MCQ' && q.question_type !== 'MCQ') return false;
                  if (libFilterType === 'PYTHON' && q.question_type !== 'PYTHON_TECHNICAL' && q.code_language !== 'python') return false;
                  if (libFilterType === 'SQL' && (q.question_type === 'MCQ' || q.question_type === 'PYTHON_TECHNICAL' || q.code_language === 'python')) return false;
                  if (libDifficultyFilter !== 'ALL' && (q.difficulty || '').toUpperCase() !== libDifficultyFilter) return false;
                  if (libSearchQuery.trim()) {
                    const query = libSearchQuery.toLowerCase();
                    const titleMatch = (q.title || '').toLowerCase().includes(query);
                    const probMatch = (q.problem_statement || '').toLowerCase().includes(query);
                    if (!titleMatch && !probMatch) return false;
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No questions found matching your filter criteria.
                    </div>
                  );
                }

                return filtered.map((q) => {
                  const isSelected = selectedLibQuestionIds.includes(q.id);
                  const isAlreadyInTest = currentQuestionIds.has(q.id);

                  return (
                    <div
                      key={q.id}
                      onClick={() => {
                        if (!isAlreadyInTest) handleToggleSelectLibraryQuestion(q.id);
                      }}
                      className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 text-xs ${
                        isAlreadyInTest
                          ? 'bg-slate-50/70 border-slate-200 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-50/80 border-blue-500 shadow-xs cursor-pointer'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="pt-0.5">
                          {isAlreadyInTest ? (
                            <CheckSquare className="w-4 h-4 text-slate-400" />
                          ) : isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            {q.title || q.problem_statement?.slice(0, 50)}
                            {isAlreadyInTest && (
                              <span className="bg-slate-200 text-slate-600 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                                Already Added
                              </span>
                            )}
                          </div>
                          <div className="text-slate-500 text-[11px] line-clamp-1">
                            {q.problem_statement || q.task_description || 'No description provided'}
                          </div>
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              (q.difficulty || '').toUpperCase() === 'EASY'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : (q.difficulty || '').toUpperCase() === 'HARD'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {q.difficulty || 'MEDIUM'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold">
                              {q.question_type === 'MCQ' ? 'MCQ (5 pts)' : q.code_language === 'python' ? 'Python Coding (20 pts)' : 'SQL Technical (10 pts)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-700 text-xs">
                          {q.marks || (q.question_type === 'MCQ' ? 5 : 10)} pts
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <span className="font-bold text-slate-700">
                {selectedLibQuestionIds.length} question(s) selected
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowChooseFromLibraryModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedLibQuestionIds.length === 0 || savingQuestion}
                  onClick={handleAddSelectedLibraryQuestions}
                  className="flex items-center gap-1.5 px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50"
                >
                  {savingQuestion && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Add Selected ({selectedLibQuestionIds.length}) to Test</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW QUESTION MODAL */}
      {showCreateQuestionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreateQuestionSubmit}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  Create New Question
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Create a custom question and link it directly to &ldquo;{selectedAssessment?.title}&rdquo;.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateQuestionModal(false)}
                className="text-slate-400 font-bold text-lg hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* Question Type Selection */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Question Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'MCQ', label: 'Multiple Choice (MCQ)' },
                    { id: 'PYTHON_TECHNICAL', label: 'Programming (Python)' },
                    { id: 'SQL_TECHNICAL', label: 'SQL Technical Sandbox' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setNewQType(t.id as any);
                        if (t.id === 'MCQ') setNewQMarks(5);
                        else if (t.id === 'PYTHON_TECHNICAL') setNewQMarks(20);
                        else setNewQMarks(10);
                      }}
                      className={`p-2.5 rounded-lg font-bold border text-left transition-all ${
                        newQType === t.id
                          ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Marks & Difficulty */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Question Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Optimized Employee Department Join Query"
                    value={newQTitle}
                    onChange={(e) => setNewQTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Difficulty</label>
                  <select
                    value={newQDifficulty}
                    onChange={(e) => setNewQDifficulty(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-800 bg-white"
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>
              </div>

              {/* Problem Statement */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Problem Statement</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the challenge or problem scenario..."
                  value={newQProblem}
                  onChange={(e) => setNewQProblem(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800"
                />
              </div>

              {/* MCQ Specific Fields */}
              {newQType === 'MCQ' && (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <label className="font-bold text-slate-800 block">MCQ Options & Correct Answer</label>
                  {newQMcqOptions.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctAnswerRadio"
                        checked={newQCorrectAnswer === opt.id}
                        onChange={() => setNewQCorrectAnswer(opt.id)}
                        className="accent-blue-600"
                      />
                      <span className="font-bold text-slate-700 w-6 text-center">{opt.id}.</span>
                      <input
                        type="text"
                        required
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...newQMcqOptions];
                          updated[idx].text = e.target.value;
                          setNewQMcqOptions(updated);
                        }}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 mt-2">Explanation (Optional)</label>
                    <input
                      type="text"
                      placeholder="Why is this answer correct?"
                      value={newQExplanation}
                      onChange={(e) => setNewQExplanation(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Python Specific Fields */}
              {newQType === 'PYTHON_TECHNICAL' && (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <label className="font-bold text-slate-800 block">Python Starter Code / Function Signature</label>
                  <textarea
                    rows={4}
                    value={newQFunctionSig}
                    onChange={(e) => setNewQFunctionSig(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-800"
                  />
                </div>
              )}

              {/* SQL Specific Fields */}
              {newQType === 'SQL_TECHNICAL' && (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Schema DDL</label>
                    <textarea
                      rows={2}
                      value={newQSchemaDDL}
                      onChange={(e) => setNewQSchemaDDL(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Reference Solution SQL</label>
                    <textarea
                      rows={2}
                      value={newQRefSQL}
                      onChange={(e) => setNewQRefSQL(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setShowCreateQuestionModal(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingQuestion}
                className="flex items-center gap-1.5 px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50"
              >
                {savingQuestion && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Create & Add Question</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* QUESTION DETAIL & EDITOR MODAL */}
      {showQuestionEditorModal && editingQuestion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Question Details & Configuration
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect and edit question settings, difficulty, marks, and solution.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuestionEditorModal(false)}
                className="text-slate-400 font-bold text-lg hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Title</label>
                <input
                  type="text"
                  value={editingQuestion.title || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Difficulty Level</label>
                  <select
                    value={(editingQuestion.difficulty || 'MEDIUM').toUpperCase()}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-800 bg-white"
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Marks / Score</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editingQuestion.marks || 10}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, marks: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Problem Statement</label>
                <textarea
                  rows={4}
                  value={editingQuestion.problem_statement || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, problem_statement: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800"
                />
              </div>

              {editingQuestion.reference_sql && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <label className="font-bold text-slate-800 block">Reference Solution SQL</label>
                  <pre className="text-slate-800 font-mono text-[11px] bg-white p-2.5 rounded border border-slate-200 overflow-x-auto">
                    {editingQuestion.reference_sql}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => handleRemoveQuestionFromAssessment(editingQuestion.id)}
                className="flex items-center gap-1.5 text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg font-bold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove from Test</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuestionEditorModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingQuestion}
                  onClick={handleSaveEditedQuestion}
                  className="flex items-center gap-1.5 px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50"
                >
                  {savingQuestion && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROCTORING & PLAGIARISM REPORT MODAL */}
      {showProctoringReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-blue-600" />
                  Candidate Proctoring & Integrity Audit
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed timeline of anti-cheat violations, webcam flags, and code similarity matches.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProctoringReportModal(false)}
                className="text-slate-400 font-bold text-lg hover:text-slate-600 px-2"
              >
                ×
              </button>
            </div>

            {/* Candidate Selector Tabs */}
            {proctoringReports.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {proctoringReports.map((rep) => (
                  <button
                    key={rep.student_id}
                    onClick={() => setSelectedCandidateReport(rep)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                      selectedCandidateReport?.student_id === rep.student_id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {rep.student_name} ({rep.integrity_score}% Integrity)
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {selectedCandidateReport ? (
                <>
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase block">Integrity Score</span>
                      <span className="text-xl font-extrabold text-emerald-900">{selectedCandidateReport.integrity_score}%</span>
                      <span className="text-[10px] text-emerald-600 block mt-0.5">High Confidence</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Tab Switches</span>
                      <span className="text-xl font-extrabold text-slate-900">{selectedCandidateReport.breakdown?.tab_switches || 0}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Focus leaves logged</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Webcam / Audio Flags</span>
                      <span className="text-xl font-extrabold text-slate-900">
                        {(selectedCandidateReport.breakdown?.webcam_flags || 0) + (selectedCandidateReport.breakdown?.audio_flags || 0)}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Face/Noise alerts</span>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                      <span className="text-[10px] font-bold text-amber-700 uppercase block">Plagiarism Matches</span>
                      <span className="text-xl font-extrabold text-amber-900">{selectedCandidateReport.plagiarized_submissions?.length || 0}</span>
                      <span className="text-[10px] text-amber-600 block mt-0.5">Flagged solutions</span>
                    </div>
                  </div>

                  {/* Plagiarism Section */}
                  {selectedCandidateReport.plagiarized_submissions?.length > 0 && (
                    <div className="bg-amber-50/70 border border-amber-300 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 font-bold text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Code Similarity / Plagiarism Alerts</span>
                      </div>
                      {selectedCandidateReport.plagiarized_submissions.map((plag: any, idx: number) => (
                        <div key={idx} className="bg-white border border-amber-200 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-slate-900">Matched Question Submission</span>
                            <span className="bg-rose-100 text-rose-800 text-xs px-2 py-0.5 rounded-full font-extrabold">
                              {plag.similarity_score}% Similarity
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            Matched peer submission: <strong className="text-slate-800">{plag.plagiarism_details?.matched_student_name || 'Anonymous candidate'}</strong> ({plag.plagiarism_details?.matched_student_email || 'student@assessment.com'}).
                          </p>
                          <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                            <div>
                              <span className="font-bold text-slate-700 block font-sans mb-1">Candidate Code:</span>
                              <pre className="bg-slate-50 p-2 rounded border border-slate-200 max-h-32 overflow-y-auto text-slate-800">
                                {plag.submitted_code}
                              </pre>
                            </div>
                            <div>
                              <span className="font-bold text-slate-700 block font-sans mb-1">Matched Peer Code:</span>
                              <pre className="bg-slate-50 p-2 rounded border border-slate-200 max-h-32 overflow-y-auto text-slate-800">
                                {plag.plagiarism_details?.matched_code_snippet || 'No peer snippet available'}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Violation Event Log */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900">Proctoring Event Timeline ({selectedCandidateReport.events_log?.length || 0})</h4>
                    {selectedCandidateReport.events_log?.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 italic bg-slate-50 rounded-xl border border-slate-200">
                        No security violations logged for this candidate. Full integrity verified!
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-60 overflow-y-auto">
                        {selectedCandidateReport.events_log.map((evt: any) => (
                          <div key={evt.id} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                evt.event_type === 'TAB_SWITCH'
                                  ? 'bg-amber-100 text-amber-800'
                                  : evt.event_type === 'FULLSCREEN_EXIT'
                                  ? 'bg-rose-100 text-rose-800'
                                  : evt.event_type === 'COPY_PASTE'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {evt.event_type}
                              </span>
                              <span className="font-medium text-slate-700">
                                {evt.details?.reason || evt.details?.message || 'Proctoring security trigger recorded.'}
                              </span>
                            </div>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {new Date(evt.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400 italic">
                  No candidate reports available for this assessment yet.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setShowProctoringReportModal(false)}
                className="px-5 py-2 font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-lg"
              >
                Close Audit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL TEMPLATE PREVIEW MODAL */}
      {showEmailPreviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Email Template Preview
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simulated candidate email client rendering all template placeholders.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailPreviewModal(false)}
                className="text-slate-400 font-bold text-lg hover:text-slate-600 px-2"
              >
                ×
              </button>
            </div>

            {/* Mock Email Client Container */}
            <div className="flex-1 overflow-y-auto space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1.5 shadow-xs">
                <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                  <strong className="text-slate-700 font-sans">From:</strong>
                  <span>{emailTemplates[activeEmailTemplateKey]?.sender_name || 'Agilisium Assessment Team'} &lt;{emailTemplates[activeEmailTemplateKey]?.sender_email || 'evaluations@agilisium.com'}&gt;</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                  <strong className="text-slate-700 font-sans">To:</strong>
                  <span>Jane Doe &lt;jane.doe@candidate.com&gt;</span>
                </div>
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pt-1 border-t border-slate-100">
                  <strong className="text-slate-500 font-sans text-xs">Subject:</strong>
                  <span>
                    {(emailTemplates[activeEmailTemplateKey]?.subject || '')
                      .replace('{{candidate_name}}', 'Jane Doe')
                      .replace('{{assessment_name}}', selectedAssessment?.title || 'Data Engineer test')
                      .replace('{{start_date}}', 'June 01, 2026 09:00 AM UTC')
                      .replace('{{end_date}}', 'June 30, 2026 06:00 PM UTC')
                      .replace('{{duration}}', String(selectedAssessment?.duration_minutes || 90))
                      .replace('{{timezone}}', selectedAssessment?.timezone || 'UTC')
                      .replace('{{assessment_link}}', 'http://localhost:3000/student/assessment?token=tok_demo_sample_123')}
                  </span>
                </div>
              </div>

              {/* Email Content Body */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
                <div className="whitespace-pre-wrap font-sans text-slate-800 text-xs leading-relaxed">
                  {(emailTemplates[activeEmailTemplateKey]?.body || '')
                    .replace(/{{candidate_name}}/g, 'Jane Doe')
                    .replace(/{{assessment_name}}/g, selectedAssessment?.title || 'Data Engineer test')
                    .replace(/{{start_date}}/g, 'June 01, 2026 09:00 AM UTC')
                    .replace(/{{end_date}}/g, 'June 30, 2026 06:00 PM UTC')
                    .replace(/{{duration}}/g, String(selectedAssessment?.duration_minutes || 90))
                    .replace(/{{timezone}}/g, selectedAssessment?.timezone || 'UTC')
                    .replace(/{{assessment_link}}/g, 'http://localhost:3000/student/assessment?token=tok_demo_sample_123')}
                </div>

                <div className="pt-2">
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="inline-block px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs shadow-md"
                  >
                    Start Assessment Now
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowEmailPreviewModal(false);
                  setShowSendTestEmailModal(true);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold"
              >
                Send Test Email Instead
              </button>

              <button
                type="button"
                onClick={() => setShowEmailPreviewModal(false)}
                className="px-5 py-2 font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEND TEST EMAIL MODAL */}
      {showSendTestEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Send Test Email
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Test template: <strong>{activeEmailTemplateKey.toUpperCase()}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSendTestEmailModal(false)}
                className="text-slate-400 font-bold text-lg hover:text-slate-600 px-2"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Recipient Destination Email</label>
                <input
                  type="email"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  placeholder="e.g. yourname@company.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-800 leading-normal">
                This will trigger the backend mailer using the configured subject, sender headers, and placeholder interpolation.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setShowSendTestEmailModal(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={sendingTestEmail || !testEmailRecipient}
                onClick={handleSendTestEmail}
                className="flex items-center gap-2 px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50"
              >
                {sendingTestEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{sendingTestEmail ? 'Sending...' : 'Dispatch Test Email'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUESTION ANALYTICS DRILLDOWN MODAL */}
      {showQuestionAnalyticsModal && selectedAnalyticsQuestion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-black text-sm">
                  #{selectedAnalyticsQuestion.question_number}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedAnalyticsQuestion.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-semibold">
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{selectedAnalyticsQuestion.question_type}</span>
                    <span>•</span>
                    <span>{selectedAnalyticsQuestion.database_engine || 'PostgreSQL'}</span>
                    <span>•</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedAnalyticsQuestion.difficulty === 'EASY' ? 'bg-emerald-100 text-emerald-800' :
                      selectedAnalyticsQuestion.difficulty === 'HARD' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedAnalyticsQuestion.difficulty}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuestionAnalyticsModal(false)}
                className="text-slate-400 font-bold text-xl hover:text-slate-600"
              >
                ×
              </button>
            </div>

            {/* Metric Overview Grid */}
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-0.5">
                <span className="text-slate-500 font-bold text-[10px]">TOTAL ATTEMPTS</span>
                <div className="text-xl font-black text-slate-900">{selectedAnalyticsQuestion.total_attempts}</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-0.5">
                <span className="text-slate-500 font-bold text-[10px]">PASS RATE</span>
                <div className="text-xl font-black text-indigo-600">{selectedAnalyticsQuestion.pass_percentage}%</div>
                <div className="text-[10px] text-slate-400">{selectedAnalyticsQuestion.passed_count} Passed / {selectedAnalyticsQuestion.failed_count} Failed</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-0.5">
                <span className="text-slate-500 font-bold text-[10px]">AVERAGE SCORE</span>
                <div className="text-xl font-black text-emerald-600">{selectedAnalyticsQuestion.average_score} <span className="text-xs text-slate-400">/ {selectedAnalyticsQuestion.marks}</span></div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-0.5">
                <span className="text-slate-500 font-bold text-[10px]">DIAGNOSTIC STATUS</span>
                <div className="text-xs font-black text-slate-800 mt-1">{selectedAnalyticsQuestion.diagnostic_insight.replace('_', ' ')}</div>
              </div>
            </div>

            {/* Test Case Execution Matrix */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-900 text-xs block">Test Cases Execution Breakdown</span>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Test Case Name</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Weight</th>
                      <th className="py-2.5 px-3">Evaluated</th>
                      <th className="py-2.5 px-3">Pass %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {(selectedAnalyticsQuestion.test_cases || []).map((tc: any, tcIdx: number) => (
                      <tr key={tc.test_case_id || tcIdx} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{tc.name}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            tc.test_type === 'PUBLIC' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {tc.test_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-700">{tc.weight}</td>
                        <td className="py-2.5 px-3 text-slate-600">{tc.total_evaluated} runs ({tc.passed_count} passed / {tc.failed_count} failed)</td>
                        <td className="py-2.5 px-3 font-extrabold text-emerald-600">{tc.pass_percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowQuestionAnalyticsModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-sm"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD TEST ADMIN MODAL */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  Add Assessment Administrator
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Grant an administrator permissions to manage this assessment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddAdminModal(false);
                  setAdminModalError('');
                }}
                className="text-slate-400 font-bold text-lg hover:text-slate-600 px-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {adminModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold">{adminModalError}</span>
              </div>
            )}

            <form onSubmit={handleAddAdminSubmit} className="space-y-3.5 text-xs">
              {adminDirectoryUsers.length > 0 && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select from System Admins</label>
                  <select
                    value={selectedDirectoryUserId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedDirectoryUserId(val);
                      if (val && val !== 'new') {
                        const sel = adminDirectoryUsers.find((u) => u.id === val);
                        if (sel) {
                          setAdminNameInput(sel.full_name);
                          setAdminEmailInput(sel.email);
                        }
                      } else {
                        setAdminNameInput('');
                        setAdminEmailInput('');
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800 bg-white"
                  >
                    <option value="">-- Choose existing admin or enter below --</option>
                    {adminDirectoryUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.email})
                      </option>
                    ))}
                    <option value="new">+ Enter new admin credentials</option>
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Admin Name <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={adminNameInput}
                  onChange={(e) => setAdminNameInput(e.target.value)}
                  placeholder="e.g. Monisha R"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Email ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={adminEmailInput}
                  onChange={(e) => setAdminEmailInput(e.target.value)}
                  placeholder="e.g. monisha.r@agilisium.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Access Controls</label>
                <select
                  value={adminRoleInput}
                  onChange={(e) => setAdminRoleInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All access">All access (Full Management & Settings)</option>
                  <option value="Editor">Editor (Questions & Candidate Invites)</option>
                  <option value="Viewer">Viewer (Results & Analytics only)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAdminModal(false);
                    setAdminModalError('');
                  }}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingAdmin || !adminEmailInput.trim()}
                  className="flex items-center gap-2 px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  {addingAdmin ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>{addingAdmin ? 'Adding...' : 'Add admin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REMOVE TEST ADMIN CONFIRMATION MODAL */}
      {showRemoveAdminModal && adminToRemove && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Remove Administrator</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Revoke assessment management permissions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRemoveAdminModal(false);
                  setAdminToRemove(null);
                }}
                className="text-slate-400 font-bold text-lg hover:text-slate-600 px-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <p>
                Are you sure you want to remove <strong>{adminToRemove.name}</strong> (<code>{adminToRemove.email}</code>) from managing <strong>{selectedAssessment.title}</strong>?
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 leading-normal">
                This administrator will immediately lose access to view candidate results, configure settings, manage questions, and access analytics for this assessment.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowRemoveAdminModal(false);
                  setAdminToRemove(null);
                }}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={removingAdmin}
                onClick={handleConfirmRemoveAdmin}
                className="flex items-center gap-2 px-5 py-2 font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm disabled:opacity-50 transition-colors"
              >
                {removingAdmin ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{removingAdmin ? 'Removing...' : 'Confirm Removal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CANDIDATE DETAILS DRILLDOWN MODAL */}
      {/* ========================================================================= */}
      {showCandidateDrilldownModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  {selectedCandidateDetail ? selectedCandidateDetail.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedCandidateDetail ? selectedCandidateDetail.name : 'Loading Candidate Details...'}
                    </h3>
                    {selectedCandidateDetail && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {selectedCandidateDetail.status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{selectedCandidateDetail?.email}</span>
                    {selectedCandidateDetail?.student_id_code && (
                      <span className="font-mono text-[11px] text-slate-400">({selectedCandidateDetail.student_id_code})</span>
                    )}
                    <span>•</span>
                    <span className="text-slate-600 font-semibold">{selectedCandidateDetail?.assessment_title}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCandidateDrilldownModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {loadingCandidateDrilldown || !selectedCandidateDetail ? (
              <div className="p-16 text-center text-slate-500 space-y-3">
                <RefreshCw className="w-7 h-7 animate-spin mx-auto text-blue-600" />
                <div className="font-semibold text-xs">Loading complete candidate performance & proctoring logs...</div>
              </div>
            ) : (
              <>
                {/* Quick KPI Ribbon */}
                <div className="grid grid-cols-5 gap-3 p-4 bg-white border-b border-slate-100 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Score</div>
                    <div className="text-base font-black text-slate-900">
                      {selectedCandidateDetail.total_score} <span className="text-xs font-normal text-slate-400">/ {selectedCandidateDetail.max_score}</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Score %</div>
                    <div className="text-base font-black text-blue-600">
                      {selectedCandidateDetail.percentage}%
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Attempted</div>
                    <div className="text-base font-black text-indigo-600">
                      {selectedCandidateDetail.attempt_percentage}%
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Time Taken</div>
                    <div className="text-base font-black text-slate-900 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedCandidateDetail.time_taken_minutes ? `${selectedCandidateDetail.time_taken_minutes} mins` : 'N/A'}</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Integrity</div>
                    <div className="flex items-center gap-1.5 font-bold">
                      <Shield className={`w-4 h-4 ${
                        selectedCandidateDetail.integrity_status === 'Acceptable' ? 'text-emerald-600' :
                        selectedCandidateDetail.integrity_status === 'Suspicious' ? 'text-amber-600' : 'text-rose-600'
                      }`} />
                      <span className={
                        selectedCandidateDetail.integrity_status === 'Acceptable' ? 'text-emerald-700' :
                        selectedCandidateDetail.integrity_status === 'Suspicious' ? 'text-amber-700' : 'text-rose-700'
                      }>
                        {selectedCandidateDetail.integrity_status} ({selectedCandidateDetail.integrity_score}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-Tab Navigation */}
                <div className="flex border-b border-slate-200 px-6 bg-slate-50/50 text-xs font-bold gap-6">
                  <button
                    onClick={() => setCandidateDrilldownTab('PERFORMANCE')}
                    className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                      candidateDrilldownTab === 'PERFORMANCE'
                        ? 'border-blue-600 text-blue-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Question-Wise Performance ({selectedCandidateDetail.questions.length})</span>
                  </button>

                  <button
                    onClick={() => setCandidateDrilldownTab('PROCTORING')}
                    className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                      candidateDrilldownTab === 'PROCTORING'
                        ? 'border-blue-600 text-blue-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Proctoring Logs & Violations ({selectedCandidateDetail.proctoring_summary.total_violations})</span>
                  </button>

                  <button
                    onClick={() => setCandidateDrilldownTab('ATTEMPT_HISTORY')}
                    className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                      candidateDrilldownTab === 'ATTEMPT_HISTORY'
                        ? 'border-blue-600 text-blue-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Attempt History ({selectedCandidateDetail.attempt_history?.length || 1})</span>
                  </button>

                  <button
                    onClick={() => setCandidateDrilldownTab('INTERVIEW')}
                    className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                      candidateDrilldownTab === 'INTERVIEW'
                        ? 'border-blue-600 text-blue-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Interview & Review</span>
                  </button>
                </div>

                {/* Tab Content Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
                  {/* TAB 1: QUESTION-WISE PERFORMANCE */}
                  {candidateDrilldownTab === 'PERFORMANCE' && (
                    <div className="space-y-4">
                      {selectedCandidateDetail.questions.map((q: any) => (
                        <div key={q.question_id} className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 shadow-2xs">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                                #{q.question_number}
                              </span>
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm">{q.title}</h4>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                  <span className="font-mono bg-slate-100 px-1 rounded text-slate-700">{q.question_type}</span>
                                  <span>•</span>
                                  <span className="font-semibold text-slate-600">{q.difficulty}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="font-extrabold text-sm text-slate-900">
                                {q.score_earned} <span className="text-slate-400 font-normal text-xs">/ {q.marks} marks</span>
                              </div>
                              <div className="text-[10px] font-semibold text-emerald-600">
                                {q.passed_test_cases_count} of {q.total_test_cases_count} Test Cases Passed
                              </div>
                            </div>
                          </div>

                          {/* Submitted Code or Answer */}
                          <div>
                            <div className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                              <span>Candidate Submitted Code:</span>
                              {q.is_plagiarized && (
                                <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded text-[10px] border border-rose-200">
                                  Plagiarism Flag ({q.similarity_score}% similarity)
                                </span>
                              )}
                            </div>
                            {q.submitted_code ? (
                              <pre className="p-3.5 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                                <code>{q.submitted_code}</code>
                              </pre>
                            ) : q.mcq_selected_option ? (
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-medium text-slate-800">
                                Selected Option: <strong className="text-blue-700">{q.mcq_selected_option}</strong>
                              </div>
                            ) : (
                              <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 italic">
                                Question was not attempted by candidate.
                              </div>
                            )}
                          </div>

                          {/* Test Cases Results Matrix */}
                          {q.test_cases && q.test_cases.length > 0 && (
                            <div className="space-y-1.5 pt-2">
                              <div className="text-[11px] font-bold text-slate-700">Test Cases Evaluation:</div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {q.test_cases.map((tc: any) => (
                                  <div
                                    key={tc.test_case_id}
                                    className={`p-2.5 rounded-lg border text-[11px] flex items-center justify-between ${
                                      tc.passed
                                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                                        : 'bg-rose-50/70 border-rose-200 text-rose-900'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {tc.passed ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                      ) : (
                                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                      )}
                                      <div>
                                        <div className="font-bold">{tc.name}</div>
                                        <div className="text-[10px] opacity-75">
                                          Weight: {tc.weight} • {tc.test_type}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right font-bold">
                                      {tc.score_awarded} pts
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 2: PROCTORING LOGS & VIOLATIONS */}
                  {candidateDrilldownTab === 'PROCTORING' && (
                    <div className="space-y-6">
                      {/* Violation counters */}
                      <div className="grid grid-cols-4 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Tab Switches</span>
                          <div className="text-xl font-black text-slate-900">
                            {selectedCandidateDetail.proctoring_summary.tab_switches}
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Fullscreen Exits</span>
                          <div className="text-xl font-black text-slate-900">
                            {selectedCandidateDetail.proctoring_summary.fullscreen_exits}
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Copy-Paste Events</span>
                          <div className="text-xl font-black text-slate-900">
                            {selectedCandidateDetail.proctoring_summary.copy_paste_attempts}
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Face / Audio Warnings</span>
                          <div className="text-xl font-black text-slate-900">
                            {selectedCandidateDetail.proctoring_summary.face_anomalies + selectedCandidateDetail.proctoring_summary.audio_spikes}
                          </div>
                        </div>
                      </div>

                      {/* Chronological Event Log */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                        <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
                          <span>Proctoring Audit Trail</span>
                          <span className="text-[10px] font-normal text-slate-500">
                            {selectedCandidateDetail.proctoring_events.length} event(s) recorded
                          </span>
                        </div>

                        {selectedCandidateDetail.proctoring_events.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 italic">
                            No proctoring violations recorded for this candidate. Candidate demonstrated clean integrity.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                            {selectedCandidateDetail.proctoring_events.map((pe: any) => (
                              <div key={pe.id} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                                  <div>
                                    <span className="font-bold text-slate-800 font-mono text-[11px]">{pe.event_type}</span>
                                    <span className="text-slate-500 ml-2">
                                      {pe.details_json?.reason || pe.details_json?.note || 'Violation registered'}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-slate-400 font-mono text-[10px]">
                                  {new Date(pe.created_at).toLocaleTimeString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB: ATTEMPT HISTORY */}
                  {candidateDrilldownTab === 'ATTEMPT_HISTORY' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <History className="w-4 h-4 text-indigo-600" />
                            <span>Candidate Attempt History</span>
                          </h4>
                          <p className="text-slate-500 text-xs mt-0.5">
                            Audit trail of all test attempts, interruptions, and admin re-enable actions.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            handleOpenReEnableModal({
                              id: selectedCandidateDetail.assignment_id || selectedCandidateDetail.id,
                              student_id: selectedCandidateDetail.student_id,
                              name: selectedCandidateDetail.name,
                              email: selectedCandidateDetail.email,
                              status: selectedCandidateDetail.status,
                              integrity_index: selectedCandidateDetail.integrity_status,
                              integrity_score: selectedCandidateDetail.integrity_score,
                              attempt_percentage: selectedCandidateDetail.attempt_percentage,
                              total_score: selectedCandidateDetail.total_score,
                              max_score: selectedCandidateDetail.max_score,
                              percentage: selectedCandidateDetail.percentage,
                              time_extension_minutes: 0,
                              proctoring_violations_count: selectedCandidateDetail.proctoring_summary?.total_violations || 0
                            });
                          }}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Re-enable / Allow Retake</span>
                        </button>
                      </div>

                      {(!selectedCandidateDetail.attempt_history || selectedCandidateDetail.attempt_history.length === 0) ? (
                        <div className="p-8 text-center text-slate-500 space-y-2 bg-slate-50 rounded-xl border border-slate-200">
                          <History className="w-6 h-6 mx-auto text-slate-400" />
                          <div className="font-semibold text-xs">No prior attempt records found</div>
                          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                            The candidate is on their initial assessment attempt ({selectedCandidateDetail.status.replace(/_/g, ' ')}).
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedCandidateDetail.attempt_history.map((att: any) => {
                            const isCurrentActive = att.is_active;
                            const attStatusUpper = (att.status || '').toUpperCase();
                            let attBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                            if (attStatusUpper === 'COMPLETED') attBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
                            else if (attStatusUpper === 'INTERRUPTED') attBadgeClass = 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
                            else if (attStatusUpper === 'RETAKE_ENABLED') attBadgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold';
                            else if (attStatusUpper === 'IN_PROGRESS') attBadgeClass = 'bg-cyan-50 text-cyan-700 border-cyan-200 font-bold';

                            return (
                              <div
                                key={att.id || att.attempt_number}
                                className={`border rounded-xl p-4 bg-white space-y-3 shadow-2xs transition-all ${
                                  isCurrentActive ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-slate-200'
                                }`}
                              >
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold flex items-center justify-center text-xs border border-indigo-100">
                                      #{att.attempt_number}
                                    </span>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h5 className="font-bold text-slate-900 text-sm">Attempt #{att.attempt_number}</h5>
                                        {isCurrentActive && (
                                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                            Active
                                          </span>
                                        )}
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] border ${attBadgeClass}`}>
                                          {att.status.replace(/_/g, ' ')}
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-slate-500 mt-0.5">
                                        {att.started_at ? (
                                          <span>Started: {new Date(att.started_at).toLocaleString()}</span>
                                        ) : (
                                          <span>Not started yet</span>
                                        )}
                                        {att.completed_at && (
                                          <span> • Ended: {new Date(att.completed_at).toLocaleString()}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <div className="font-black text-sm text-slate-900">
                                      {att.total_score ?? 0} pts ({att.percentage ?? 0}%)
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-semibold">
                                      {att.attempted_questions_count ?? 0} of {att.total_questions_count ?? 0} questions attempted
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                  <div>
                                    <span className="text-slate-400 block text-[10px] font-bold">DURATION USED</span>
                                    <span className="font-bold text-slate-700">{att.time_spent_minutes ? `${att.time_spent_minutes} mins` : 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px] font-bold">REMAINING TIME</span>
                                    <span className="font-bold text-slate-700">{att.time_remaining_minutes ? `${att.time_remaining_minutes} mins` : 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px] font-bold">ATTEMPT TYPE</span>
                                    <span className="font-bold text-indigo-700">{att.type || 'Standard Attempt'}</span>
                                  </div>
                                </div>

                                {att.re_enable_reason && (
                                  <div className="text-[11px] p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-lg text-indigo-900">
                                    <div className="font-bold flex items-center gap-1 text-indigo-950">
                                      <Info className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>Re-enable Reason / Details:</span>
                                    </div>
                                    <div className="mt-0.5 text-indigo-800">
                                      {att.re_enable_reason}
                                      {att.re_enabled_by && <span className="opacity-75"> (by {att.re_enabled_by.full_name || 'Admin'})</span>}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: INTERVIEW & REVIEW */}
                  {candidateDrilldownTab === 'INTERVIEW' && (
                    <div className="space-y-4">
                      {selectedCandidateDetail.interview_details && selectedCandidateDetail.interview_details.scheduled_at ? (
                        <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-blue-950 flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <span>Scheduled Interview Details</span>
                            </h4>
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-200 text-blue-800 text-[10px] font-bold">
                              Confirmed
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-slate-500 block text-[10px] font-bold">DATE & TIME</span>
                              <span className="font-bold text-slate-800">{selectedCandidateDetail.interview_details.scheduled_at}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] font-bold">INTERVIEWER</span>
                              <span className="font-bold text-slate-800">{selectedCandidateDetail.interview_details.interviewer}</span>
                            </div>
                          </div>

                          {selectedCandidateDetail.interview_details.meeting_link && (
                            <div>
                              <span className="text-slate-500 block text-[10px] font-bold mb-1">MEETING URL</span>
                              <a
                                href={selectedCandidateDetail.interview_details.meeting_link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline font-bold flex items-center gap-1 text-xs"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                {selectedCandidateDetail.interview_details.meeting_link}
                              </a>
                            </div>
                          )}

                          {selectedCandidateDetail.interview_details.notes && (
                            <div>
                              <span className="text-slate-500 block text-[10px] font-bold">NOTES</span>
                              <p className="text-slate-700 italic">{selectedCandidateDetail.interview_details.notes}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-slate-500 space-y-3 bg-slate-50 rounded-xl border border-slate-200">
                          <Calendar className="w-8 h-8 mx-auto text-slate-400" />
                          <div className="font-bold text-slate-800 text-sm">No interview scheduled yet</div>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            Schedule a technical screening or live interview round with this candidate.
                          </p>
                          <button
                            onClick={() => {
                              setShowCandidateDrilldownModal(false);
                              handleOpenScheduleInterview(selectedCandidateDetail);
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all"
                          >
                            Schedule Interview Now
                          </button>
                        </div>
                      )}

                      {/* Recruiter Quick Actions */}
                      <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-3">
                        <div className="font-bold text-slate-800 text-xs">Recruiter Decision & Actions:</div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              handleOpenReEnableModal({
                                id: selectedCandidateDetail.assignment_id || selectedCandidateDetail.id,
                                student_id: selectedCandidateDetail.student_id,
                                name: selectedCandidateDetail.name,
                                email: selectedCandidateDetail.email,
                                status: selectedCandidateDetail.status,
                                integrity_index: selectedCandidateDetail.integrity_status,
                                integrity_score: selectedCandidateDetail.integrity_score,
                                attempt_percentage: selectedCandidateDetail.attempt_percentage,
                                total_score: selectedCandidateDetail.total_score,
                                max_score: selectedCandidateDetail.max_score,
                                percentage: selectedCandidateDetail.percentage,
                                time_extension_minutes: 0,
                                proctoring_violations_count: selectedCandidateDetail.proctoring_summary?.total_violations || 0
                              });
                            }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Re-enable Test</span>
                          </button>
                          <button
                            onClick={async () => {
                              await handleBulkStatusChange('SHORTLISTED');
                              setShowCandidateDrilldownModal(false);
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all"
                          >
                            Shortlist Candidate
                          </button>
                          <button
                            onClick={async () => {
                              await handleBulkStatusChange('ARCHIVED');
                              setShowCandidateDrilldownModal(false);
                            }}
                            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all"
                          >
                            Archive Candidate
                          </button>
                          <button
                            onClick={() => {
                              setShowCandidateDrilldownModal(false);
                              handleOpenResetModal(selectedCandidateDetail);
                            }}
                            className="px-4 py-2 border border-purple-300 text-purple-700 hover:bg-purple-50 rounded-lg font-bold text-xs transition-all"
                          >
                            Reset Test Attempt
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RE-ENABLE CANDIDATE TEST MODAL */}
      {/* ========================================================================= */}
      {showReEnableModal && candidateToReEnable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Re-enable Assessment Access</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Individual candidate access control • {candidateToReEnable.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReEnableModal(false);
                  setCandidateToReEnable(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Candidate Card Summary */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-slate-900">{candidateToReEnable.name}</div>
                <div className="text-slate-500 text-[11px]">{candidateToReEnable.email}</div>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-800 border-amber-300">
                  Current: {candidateToReEnable.status ? candidateToReEnable.status.replace(/_/g, ' ') : 'Invited'}
                </span>
              </div>
            </div>

            {/* Step 1: Re-enable Action Mode */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                1. Select Re-enable Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReEnableAction('RESUME_PREVIOUS')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    reEnableAction === 'RESUME_PREVIOUS'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-950">
                    <Play className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Resume Previous</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    Preserves all previously written SQL/Python code, answers, and question progress.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setReEnableAction('START_NEW')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    reEnableAction === 'START_NEW'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-950">
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Start New Attempt</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    Archives previous attempt in history and gives the candidate a clean attempt #2+.
                  </p>
                </button>
              </div>
            </div>

            {/* Step 2: Time Handling */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                2. Test Duration & Time Configuration
              </label>
              <div className="space-y-2">
                <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer ${
                  reEnableTimeMode === 'REMAINING_TIME' ? 'border-indigo-500 bg-indigo-50/40 font-semibold text-slate-900' : 'border-slate-200 text-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="timeMode"
                    value="REMAINING_TIME"
                    checked={reEnableTimeMode === 'REMAINING_TIME'}
                    onChange={() => setReEnableTimeMode('REMAINING_TIME')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Continue with remaining time (at time of exit/interruption)</span>
                </label>

                <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer ${
                  reEnableTimeMode === 'FULL_DURATION' ? 'border-indigo-500 bg-indigo-50/40 font-semibold text-slate-900' : 'border-slate-200 text-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="timeMode"
                    value="FULL_DURATION"
                    checked={reEnableTimeMode === 'FULL_DURATION'}
                    onChange={() => setReEnableTimeMode('FULL_DURATION')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Give full duration again ({selectedAssessment?.duration_minutes || 60} minutes)</span>
                </label>

                <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer ${
                  reEnableTimeMode === 'ADD_ADDITIONAL_TIME' ? 'border-indigo-500 bg-indigo-50/40 font-semibold text-slate-900' : 'border-slate-200 text-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="timeMode"
                    value="ADD_ADDITIONAL_TIME"
                    checked={reEnableTimeMode === 'ADD_ADDITIONAL_TIME'}
                    onChange={() => setReEnableTimeMode('ADD_ADDITIONAL_TIME')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span>Add additional time</span>
                    {reEnableTimeMode === 'ADD_ADDITIONAL_TIME' && (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={5}
                          max={180}
                          value={reEnableAdditionalMinutes}
                          onChange={(e) => setReEnableAdditionalMinutes(Math.max(5, parseInt(e.target.value) || 5))}
                          className="w-16 px-2 py-1 border border-slate-300 rounded text-center font-bold text-xs bg-white text-slate-900"
                        />
                        <span className="text-[11px] text-slate-500">mins</span>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Step 3: Reason for Re-enabling */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                3. Reason for Re-enabling (Audit Logged)
              </label>
              <select
                value={reEnableReason}
                onChange={(e) => setReEnableReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Candidate accidentally closed the browser">Candidate accidentally closed the browser</option>
                <option value="Internet connection issue">Internet connection issue</option>
                <option value="System issue">System issue</option>
                <option value="Candidate technical problem">Candidate technical problem</option>
                <option value="Admin approved retake">Admin approved retake</option>
                <option value="Other">Other (specify below)</option>
              </select>

              {reEnableReason === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter detailed reason for re-enabling..."
                  value={customReEnableReason}
                  onChange={(e) => setCustomReEnableReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 mt-2"
                />
              )}
            </div>

            {/* Info / Safety Alert */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-indigo-950 text-[11px] leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong>Individual Candidate Scope:</strong> This action re-enables assessment access strictly for <strong>{candidateToReEnable.name}</strong>. No other candidate attempts are affected.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowReEnableModal(false);
                  setCandidateToReEnable(null);
                }}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reEnablingTest}
                onClick={handleConfirmReEnableTest}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {reEnablingTest ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Re-enabling...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm & Re-enable</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESET TEST CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {showResetTestModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reset Assessment Attempt</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Allow candidate(s) to retake the test</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowResetTestModal(false);
                  setCandidateToReset(null);
                }}
                className="text-slate-400 font-bold text-lg hover:text-slate-600 px-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <p>
                You are about to reset the assessment attempt for <strong>{selectedCandidateIds.length} candidate(s)</strong>
                {candidateToReset ? ` (${candidateToReset.name})` : ''}.
              </p>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-900 leading-normal">
                Resetting will update the candidate status to <strong>TEST RESET</strong>, restore active invitation access, and record an audit log event.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowResetTestModal(false);
                  setCandidateToReset(null);
                }}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resettingCandidates}
                onClick={handleConfirmResetTest}
                className="flex items-center gap-2 px-5 py-2 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm disabled:opacity-50 transition-colors"
              >
                {resettingCandidates ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                <span>{resettingCandidates ? 'Resetting...' : 'Confirm Reset Attempt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EXTEND TIME MODAL */}
      {/* ========================================================================= */}
      {showExtendTimeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Extend Assessment Time</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Grant additional duration to candidates</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowExtendTimeModal(false);
                  setCandidateToExtendTime(null);
                }}
                className="text-slate-400 font-bold text-lg hover:text-slate-600 px-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <p>
                Extending time for <strong>{selectedCandidateIds.length} candidate(s)</strong>
                {candidateToExtendTime ? ` (${candidateToExtendTime.name})` : ''}.
              </p>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Select Extension Duration (Minutes):</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setExtendMinutes(mins)}
                      className={`py-2 rounded-lg font-bold border transition-all ${
                        extendMinutes === mins
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      +{mins}m
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  max={360}
                  value={extendMinutes}
                  onChange={(e) => setExtendMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800"
                  placeholder="Custom minutes..."
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Extension:</label>
                <input
                  type="text"
                  value={extendReason}
                  onChange={(e) => setExtendReason(e.target.value)}
                  placeholder="e.g. Accessibility Accommodation / Network issue"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowExtendTimeModal(false);
                  setCandidateToExtendTime(null);
                }}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={extendingTime || extendMinutes <= 0}
                onClick={handleConfirmExtendTime}
                className="flex items-center gap-2 px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50 transition-colors"
              >
                {extendingTime ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{extendingTime ? 'Applying...' : `Extend +${extendMinutes} Mins`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCHEDULE INTERVIEW MODAL */}
      {/* ========================================================================= */}
      {showScheduleInterviewModal && interviewTargetCandidate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Schedule Technical Interview</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    For <strong>{interviewTargetCandidate.name}</strong> ({interviewTargetCandidate.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowScheduleInterviewModal(false);
                  setInterviewTargetCandidate(null);
                }}
                className="text-slate-400 font-bold text-lg hover:text-slate-600 px-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmScheduleInterview} className="space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Interview Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Interview Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 11:00 AM"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Interviewer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vinodkumar Chandrasekar"
                  value={interviewerName}
                  onChange={(e) => setInterviewerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Meeting Link <span className="text-slate-400 font-normal">(Google Meet / Teams / Zoom)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Agenda / Interview Notes:</label>
                <textarea
                  rows={2}
                  placeholder="Technical evaluation notes..."
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleInterviewModal(false);
                    setInterviewTargetCandidate(null);
                  }}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulingInterview}
                  className="flex items-center gap-2 px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  {schedulingInterview ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
                  <span>{schedulingInterview ? 'Scheduling...' : 'Confirm Interview'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
