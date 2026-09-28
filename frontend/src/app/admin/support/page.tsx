'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Shield,
  Sparkles,
  Database,
  Mail,
  Search,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Layers,
  Award,
  Terminal,
  Clock,
  UserCheck,
  Lock,
  Cpu,
  FileSpreadsheet,
  X,
  ArrowRight
} from 'lucide-react';


export default function SupportPage() {
  // Global search term
  const [searchQuery, setSearchQuery] = useState('');

  // Active modal for the 4 core pillars
  const [activeModal, setActiveModal] = useState<
    'validation' | 'uniqueness' | 'sandbox' | 'invitations' | null
  >(null);

  // FAQ accordion active item
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // 10 Core FAQ Items
  const faqItems = [
    {
      q: 'Why was my generated question rejected?',
      a: 'A generated question is rejected if it fails any of the 11 validation pipeline stages. Common rejection reasons include: schema syntax errors in the DDL, seed data insertion constraints failure, reference SQL execution errors, output column discrepancies, public/hidden test case failures, weak test coverage (where a trivial "SELECT 1" yields identical output to the reference solution), or failing the 5-layer permanent uniqueness verification.',
      category: 'Question Validation'
    },
    {
      q: 'Why wasn\'t my question added to the library?',
      a: 'Questions only enter the Question Library if they pass all 11 automated validation stages with zero warnings and are not flagged as duplicates. If validation fails at any stage, the system discards the flawed draft and outputs a diagnostic error message explaining the exact stage that caused the failure.',
      category: 'Question Library'
    },
    {
      q: 'How does the system detect duplicate questions?',
      a: 'The platform utilizes a 5-Layer Permanent Uniqueness Engine that compares far more than visible text. It computes: (1) exact text SHA-256 hash, (2) canonical problem hash extracting abstract logical operations like JOIN, GROUP BY, HAVING, WINDOW, CTE, and ORDER BY, (3) SQL AST structure hash stripping literals and aliases, (4) table and column schema signatures, and (5) Jaccard n-gram semantic similarity. If the underlying logic is identical, it is rejected as a duplicate regardless of changed variable or column names.',
      category: 'Uniqueness'
    },
    {
      q: 'Can an archived question be generated again?',
      a: 'No. When a question is created, its mathematical fingerprints are stored permanently in the `question_fingerprints` table. Even if a question is archived or deleted from the active library, its uniqueness records remain permanently in the database, preventing identical questions from ever being regenerated.',
      category: 'Uniqueness'
    },
    {
      q: 'Why did a student\'s SQL query fail?',
      a: 'Student queries fail if they contain syntax errors, reference non-existent tables or columns, perform ambiguous joins, exceed the 5.0-second sandbox execution timeout, or attempt prohibited destructive commands (DROP, DELETE, UPDATE, INSERT, ALTER, TRUNCATE, GRANT). The sandbox returns engine-level error lines and friendly syntax tips to help candidates debug.',
      category: 'SQL Sandbox'
    },
    {
      q: 'Why can\'t a student see the solution?',
      a: 'To guarantee strict assessment integrity, official reference SQL, internal validation data, and hidden test-case inputs are completely stripped from candidate-facing API endpoints. Students only receive the business scenario, table schemas, public test cases, and their own execution feedback.',
      category: 'Security'
    },
    {
      q: 'How are technical-question marks calculated?',
      a: 'For AI-generated technical questions, the platform determines appropriate marks automatically (e.g., 10 marks for standard problems, adjusted by difficulty and complexity). Each question contains a suite of weighted test cases. When submitted, candidate code runs against all test cases, and earned marks equal the sum of weights of passed test cases.',
      category: 'Scoring'
    },
    {
      q: 'How are candidate scores calculated?',
      a: 'A candidate\'s assessment score is calculated by aggregating the earned marks across all questions in the assessment against the total maximum marks. The percentage score determines completion status and pass/fail thresholds, which are recorded in assessment reports.',
      category: 'Scoring'
    },
    {
      q: 'How does the invitation link work?',
      a: 'Administrators invite candidates by entering their email addresses. The system generates a cryptographic SHA-256 token linked to an assessment assignment and emails a secure access link ("/student/assessment?token=TOKEN_HASH"). Candidates can access the test only within the assessment start and end time window before token expiration.',
      category: 'Invitations'
    },
    {
      q: 'How do I download reports?',
      a: 'Administrators can navigate to the Reports section (/admin/reports), filter by date range, test type, or candidate search, and click "Download CSV". The system generates a comprehensive CSV containing candidate names, emails, assessment titles, invited/attempted dates, total scores, maximum scores, percentages, completion status, and integrity status.',
      category: 'Reports'
    }
  ];

  // Filter FAQ items by search query
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqItems;
    const q = searchQuery.toLowerCase();
    return faqItems.filter(
      (item) =>
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Determine if a section should be highlighted/visible based on search
  const isMatch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="min-h-full bg-[#f8fafc] text-slate-800 font-sans pb-16">
      {/* Top Header */}
      <header className="px-8 pt-6 pb-5 bg-white border-b border-slate-200 shrink-0 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center text-xs text-slate-500 gap-1.5 font-medium mb-1">
              <span>Agilisium Assessment Platform</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-800 font-semibold">Help Center</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Help & Platform Support</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Technical documentation, workflow guides, and administrator reference.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search help articles, SQL, proctoring, scoring..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-8 mt-8 space-y-10">
        {/* SECTION 1: FOUR CORE PILLARS (CLICKABLE CARDS) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Core Platform Architecture</h2>
              <p className="text-xs text-slate-500">
                Click any core subsystem card below to inspect its technical specifications, validation rules, and security controls.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
              Interactive System Pillars
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Question Validation Pipeline */}
            <div
              onClick={() => setActiveModal('validation')}
              className="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md rounded-xl p-5 space-y-3 cursor-pointer transition-all group relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5 text-indigo-600 font-bold text-base">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span>11-Stage Question Validation Pipeline</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every AI-generated question undergoes strict automated validation: JSON schema check, statement clarity, AST difficulty analysis, DDL execution, seed data insertion, reference SQL validation, expected output generation, public & hidden test executions, flawed query rejection, and permanent uniqueness verification.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-indigo-600">
                <span>View all 11 stages & rejection criteria</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Card 2: Permanent Question Uniqueness */}
            <div
              onClick={() => setActiveModal('uniqueness')}
              className="bg-white border border-slate-200 hover:border-violet-400 hover:shadow-md rounded-xl p-5 space-y-3 cursor-pointer transition-all group relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5 text-violet-600 font-bold text-base">
                  <div className="p-2 rounded-lg bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    <Shield className="w-5 h-5" />
                  </div>
                  <span>5-Layer Permanent Uniqueness Engine</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Guarantees that a question generated once is never regenerated. Compares underlying problem logic, SQL AST structure, schema signatures, and semantic overlap — not just visible text. Permanent uniqueness records persist even if questions are archived or deleted.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-violet-600">
                <span>Inspect 5 fingerprinting layers</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Card 3: Isolated SQL Sandbox & Execution */}
            <div
              onClick={() => setActiveModal('sandbox')}
              className="bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md rounded-xl p-5 space-y-3 cursor-pointer transition-all group relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5 text-emerald-600 font-bold text-base">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Database className="w-5 h-5" />
                  </div>
                  <span>Isolated SQL Sandbox & Execution</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Student SQL executes inside a sandboxed transaction environment with strict read-only enforcement (blocking DROP, DELETE, UPDATE, INSERT, ALTER, TRUNCATE, GRANT), 5.0-second execution timeouts, line-specific syntax error diagnostics, and weighted test-case evaluation.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-emerald-600">
                <span>View sandbox safety & query limits</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Card 4: Secure Candidate Invitation */}
            <div
              onClick={() => setActiveModal('invitations')}
              className="bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md rounded-xl p-5 space-y-3 cursor-pointer transition-all group relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5 text-amber-600 font-bold text-base">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <span>Secure Candidate Invitation & Access</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cryptographic SHA-256 token links ensure single-session candidate access restricted by scheduled test start/end times. Complete zero-knowledge boundary ensures reference SQL, official solutions, and hidden tests are never exposed.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-amber-600">
                <span>View token security & zero-knowledge design</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: HOW THE PLATFORM WORKS (WORKFLOW FLOWCHART) */}
        {isMatch('workflow how platform works flowchart') && (
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">How the Platform Works</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete end-to-end administrator workflow. Click any active phase to jump to that module.
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Full System Lifecycle
              </span>
            </div>

            {/* Interactive Step-by-Step Chain */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2">
              {[
                { step: '1', title: 'Admin Login', desc: 'Secure JWT role verification', link: '/admin/account' },
                { step: '2', title: 'Question Library', desc: 'Browse approved challenges', link: '/admin/library' },
                { step: '3', title: 'Generate Questions', desc: 'AI generation with marks', link: '/admin/library' },
                { step: '4', title: '11-Stage Validation', desc: 'AST, DDL & uniqueness check', link: '#validation-guide' },
                { step: '5', title: 'Create Assessment', desc: 'Configure duration & rules', link: '/admin/assessments' },
                { step: '6', title: 'Invite Candidates', desc: 'SHA-256 secure tokens', link: '/admin/assessments' },
                { step: '7', title: 'Reports & Scoring', desc: 'Live metrics & CSV export', link: '/admin/reports' },
              ].map((node, idx) => (
                <Link
                  key={node.step}
                  href={node.link}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-blue-50 hover:border-blue-200 transition-all text-center space-y-1 group block"
                >
                  <div className="w-6 h-6 mx-auto rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {node.step}
                  </div>
                  <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700">{node.title}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-2">{node.desc}</div>
                </Link>
              ))}
            </div>

            <div className="p-4 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-blue-900 leading-relaxed">
              <strong>Workflow Automation:</strong> When an assessment is published, candidate submissions are scored automatically against sandbox test suites. Violation events (such as tab switches or fullscreen exits) and code similarity metrics are logged immediately to populate live analytics dashboards.
            </div>
          </section>
        )}

        {/* SECTION 3: WORKFLOW GUIDES (ACCORDION CARDS) */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Administrator Workflow Guides</h2>
            <p className="text-xs text-slate-500">
              Detailed step-by-step procedures matching the actual Agilisium platform controls and user interfaces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Guide 1: Question Generation Guide */}
            {isMatch('question generation guide ai difficulty marks') && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Question Generation Guide</span>
                </div>
                <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p>
                    Administrators generate technical questions via <strong>AI Question Generator</strong> in the Library section.
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    <li><strong>Question Type:</strong> SQL Technical Challenge or Python Technical Challenge.</li>
                    <li><strong>Language:</strong> PostgreSQL, MySQL, SQLite, or Python.</li>
                    <li><strong>Question Count:</strong> Batch size between 1 and 10 questions.</li>
                    <li><strong>Difficulty:</strong> EASY, MEDIUM, or HARD.</li>
                    <li><strong>Automated Marks Allocation:</strong> The AI automatically calculates appropriate marks based on problem complexity (e.g. 10 marks standard). Administrators do not manually enter marks during generation.</li>
                  </ul>
                  <p className="text-[11px] text-slate-500 italic">
                    Every generated question must automatically pass the 11 validation stages and 5 uniqueness layers before being admitted to the Question Library.
                  </p>
                </div>
              </div>
            )}

            {/* Guide 2: Assessment Creation Guide */}
            {isMatch('assessment creation guide duration proctoring settings') && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                  <BookOpen className="w-4 h-4" />
                  <span>Assessment Creation Guide</span>
                </div>
                <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p>
                    Create rigorous candidate assessments in <strong>Assessments</strong>:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 text-slate-700">
                    <li>Click <strong>Create Assessment</strong> and enter title, job role, and duration (in minutes).</li>
                    <li>Select questions from the Question Library or generate fresh validated challenges.</li>
                    <li>Review question details, marks, schema tables, and test cases.</li>
                    <li>Configure proctoring rules (tab switch detection, fullscreen enforcement, webcam snapshots, code plagiarism threshold).</li>
                    <li>Save as <strong>DRAFT</strong> or <strong>PUBLISH</strong>, then bulk invite candidate emails.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Guide 3: Candidate Assessment Guide */}
            {isMatch('candidate assessment guide test taking schema errors') && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <Terminal className="w-4 h-4" />
                  <span>Candidate Assessment Portal Guide</span>
                </div>
                <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p>
                    What candidates experience upon opening their invitation token:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    <li>Candidate verifies their email and accesses the active test window.</li>
                    <li>View business scenario, task instructions, and interactive table schemas.</li>
                    <li>Write SQL or Python queries with full syntax highlighting.</li>
                    <li>Click <strong>Run Code</strong> to execute in the sandbox against public test cases.</li>
                    <li>View line-specific syntax errors or output table comparisons in real time.</li>
                    <li>Click <strong>Submit</strong> to record evaluation against both public and hidden test cases.</li>
                  </ul>
                  <p className="text-[11px] text-slate-500 italic">
                    Reference SQL, solutions, and hidden test inputs are strictly hidden from students.
                  </p>
                </div>
              </div>
            )}

            {/* Guide 4: Scoring & Test Cases Guide */}
            {isMatch('scoring test cases weights marks calculation') && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                  <Award className="w-4 h-4" />
                  <span>Scoring & Test-Case Architecture</span>
                </div>
                <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p>
                    Automated grading executes using deterministic test cases:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    <li><strong>Public Test Cases:</strong> Visible input and expected output tables for sanity verification.</li>
                    <li><strong>Hidden Test Cases:</strong> Edge cases (e.g. NULL handling, empty datasets, duplicate values, extreme salaries). Inputs and outputs are never shown to candidates.</li>
                    <li><strong>Weighted Scoring:</strong> Each test case has a configured weight. Final marks equal the sum of weights for all passed test cases.</li>
                    <li>System logs execution time and error diagnostics for administrator inspection.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Guide 5: Reports Guide */}
            {isMatch('reports guide candidate assessment csv export') && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-purple-600 font-bold text-sm">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Reports & Candidate Analysis Guide</span>
                </div>
                <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p>
                    All analytics are calculated in real time directly from database records:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    <li><strong>Hiring Funnel:</strong> Invited → Email opened → Test attempted → Shortlisted.</li>
                    <li><strong>Skill Map:</strong> Aggregated topic proficiency bars (Green ≥ 80%, Amber 60–79%, Red &lt; 60%).</li>
                    <li><strong>Candidate Matrix:</strong> Searchable candidate leaderboard by name, email, or student ID.</li>
                    <li><strong>Date Range Picker:</strong> Real-time filtering with validation preventing invalid ranges.</li>
                    <li><strong>Download CSV:</strong> Generates CSV with candidate names, emails, assessments, scores, completion status, and integrity status.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Guide 6: Proctoring & Integrity Guide */}
            {isMatch('proctoring integrity guide tab switch fullscreen plagiarism ip') && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                  <Shield className="w-4 h-4" />
                  <span>Proctoring & Assessment Security Guide</span>
                </div>
                <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p>
                    Implemented security controls configured per assessment:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    <li><strong>Tab Switch Detection (TAB_SWITCH):</strong> Automatically detects and logs when candidate minimizes the test or switches browser tabs.</li>
                    <li><strong>Fullscreen Enforcement (FULLSCREEN_EXIT):</strong> Monitors and logs browser fullscreen departures.</li>
                    <li><strong>Copy/Paste Prevention (COPY_PASTE):</strong> Restricts clipboard pasting into editor areas.</li>
                    <li><strong>Plagiarism Detection:</strong> Computes Jaccard 3-gram token similarity and sequence matching between candidate submissions. Flags submissions exceeding similarity thresholds (default 80%).</li>
                    <li><strong>IP Restriction:</strong> Whitelists allowed client IP addresses or CIDR blocks.</li>
                    <li><strong>Integrity Status:</strong> Evaluated as <em>Clean</em>, <em>Warnings</em>, or <em>Flagged</em>.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 4: FREQUENTLY ASKED QUESTIONS (FAQ) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Frequently Asked Questions</h2>
              <p className="text-xs text-slate-500">
                Detailed answers to common questions about platform behavior, validation, scoring, and security.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Showing {filteredFaqs.length} of {faqItems.length} questions
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200 shadow-xs overflow-hidden">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="transition-colors">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                        {faq.category}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{faq.q}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs text-slate-600 leading-relaxed bg-slate-50/50 border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredFaqs.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 space-y-1">
                <HelpCircle className="w-6 h-6 text-slate-300 mx-auto" />
                <p>No questions found matching &ldquo;{searchQuery}&rdquo;.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE MODALS FOR THE 4 CORE PILLARS */}
      {/* ========================================================================= */}

      {/* MODAL 1: QUESTION VALIDATION PIPELINE */}
      {activeModal === 'validation' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-base">
                <Sparkles className="w-5 h-5" />
                <span>11-Stage Question Validation Pipeline</span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                To maintain library quality, the backend enforces a rigorous <strong>11-stage automated validation pipeline</strong> before any AI-generated question is admitted:
              </p>

              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                {[
                  { num: 1, name: 'JSON & Schema Structural Validation', desc: 'Verifies presence of title, scenario, problem statement, task description, difficulty, job role, engine, DDL, seed data, and reference SQL.' },
                  { num: 2, name: 'Content & Terminology Validation', desc: 'Ensures problem statement and scenario exceed minimum descriptive length thresholds and contain accurate technical SQL terminology.' },
                  { num: 3, name: 'Difficulty AST Complexity Validation', desc: 'Inspects SQL AST syntax: rejects easy challenges if they contain advanced Window functions or nested CTE constructs.' },
                  { num: 4, name: 'DDL Schema Execution', desc: 'Executes schema DDL statements inside an isolated sandbox to confirm table definitions are valid.' },
                  { num: 5, name: 'Seed Data Insertion Validation', desc: 'Executes seed INSERT statements against created schema tables to ensure mock records comply with foreign keys and datatypes.' },
                  { num: 6, name: 'Reference SQL Validation', desc: 'Executes the official solution query against the seeded sandbox and verifies non-empty result rows.' },
                  { num: 7, name: 'Expected Output Validation', desc: 'Serializes and validates output columns and row counts for subsequent comparison.' },
                  { num: 8, name: 'Public Test Case Validation', desc: 'Executes all public test suite queries to ensure reference solution produces correct outputs.' },
                  { num: 9, name: 'Hidden Test Case Validation', desc: 'Executes hidden edge-case test suites (NULL handling, boundary values) to guarantee correctness.' },
                  { num: 10, name: 'Test Quality & Flawed Query Rejection', desc: 'Executes a flawed query (e.g. "SELECT 1 AS dummy_col;"). If a flawed query matches reference outputs, the question is rejected for weak test coverage!' },
                  { num: 11, name: 'Permanent Uniqueness Validation', desc: 'Verifies the question against all 5 layers of the permanent deduplication engine across all historical questions.' },
                ].map((st) => (
                  <div key={st.num} className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-100 text-xs">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {st.num}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">{st.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{st.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                <strong>Why did a question fail?</strong> If any single stage fails, the entire question is rejected, avoiding bad questions in the library. A detailed rejection reason detailing the failed stage is provided.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PERMANENT QUESTION UNIQUENESS */}
      {activeModal === 'uniqueness' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-violet-600 font-bold text-base">
                <Shield className="w-5 h-5" />
                <span>5-Layer Permanent Question Uniqueness</span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                A core project requirement is: <strong>A question that has already been generated must never be generated again.</strong> Two questions are duplicates if their underlying logic and structure are identical, even if names or numbers change!
              </p>

              <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg text-xs text-violet-950 space-y-1">
                <strong>Example of detected duplicates:</strong>
                <p className="italic">
                  &ldquo;Find the second highest salary from employees table...&rdquo; and &ldquo;Find the second highest salary where salary values are distinct...&rdquo; are flagged as duplicates because the underlying analytical logic is identical.
                </p>
              </div>

              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                {[
                  { layer: 'Layer 1', title: 'Exact Text SHA-256 Hash', desc: 'Strips punctuation, normalizes whitespace and lowercase casing to catch identical or lightly reformatted text.' },
                  { layer: 'Layer 2', title: 'Canonical Problem Fingerprint', desc: 'Extracts abstract logical operations (e.g. JOIN, CTE, WINDOW, GROUP BY, HAVING, ORDER BY, DISTINCT) coupled with difficulty to catch rephrased problems with identical requirements.' },
                  { layer: 'Layer 3', title: 'SQL AST Structural Hash', desc: 'Normalizes the reference SQL solution by stripping comments, literal string constants (\'XYZ\'), numbers (42), and table aliases (AS alias_name) to compare query structure.' },
                  { layer: 'Layer 4', title: 'Schema Composition Signature', desc: 'Hashes table and column name compositions to ensure questions testing identical database schemas with the same problem are recognized.' },
                  { layer: 'Layer 5', title: 'Jaccard Token Semantic Similarity', desc: 'Computes n-gram semantic token overlap between problem descriptions. Flagged if overlap exceeds threshold.' },
                ].map((l) => (
                  <div key={l.layer} className="p-2.5 bg-white rounded-lg border border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-700">
                        {l.layer}
                      </span>
                      <span className="font-bold text-slate-900">{l.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{l.desc}</p>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-[11px] text-slate-800">
                <strong>Permanent Record Retention:</strong> Fingerprints are stored in the <code className="text-violet-700 font-bold">question_fingerprints</code> table and are NEVER deleted or purged, even if a question is archived or removed from the active library.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ISOLATED SQL SANDBOX & EXECUTION */}
      {activeModal === 'sandbox' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-base">
                <Database className="w-5 h-5" />
                <span>Isolated SQL Sandbox & Execution Engine</span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                The platform executes student SQL submissions inside an isolated transaction sandbox. The student query can never affect the application&apos;s main database or modify system state.
              </p>

              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <div className="font-bold text-slate-900 text-xs pb-1">Enforced Execution Restrictions:</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white rounded border border-slate-100 space-y-0.5">
                    <span className="font-bold text-rose-600 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Blocked Commands
                    </span>
                    <p className="text-[11px] text-slate-500">
                      DROP, DELETE, UPDATE, INSERT, ALTER, TRUNCATE, GRANT, or multi-statement injection are strictly rejected. Only SELECT and WITH (CTEs) are permitted.
                    </p>
                  </div>

                  <div className="p-2 bg-white rounded border border-slate-100 space-y-0.5">
                    <span className="font-bold text-amber-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Execution Timeout
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Strict 5.0-second query execution timeout prevents infinite Cartesian loops or runaway queries.
                    </p>
                  </div>

                  <div className="p-2 bg-white rounded border border-slate-100 space-y-0.5">
                    <span className="font-bold text-blue-600 flex items-center gap-1">
                      <Terminal className="w-3.5 h-3.5" /> Line Syntax Diagnostics
                    </span>
                    <p className="text-[11px] text-slate-500">
                      When a syntax error occurs, the engine extracts the exact line number, column, and token to provide a helpful diagnostic tip.
                    </p>
                  </div>

                  <div className="p-2 bg-white rounded border border-slate-100 space-y-0.5">
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> Output Comparison
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Results are compared deterministically against expected outputs with type and ordering tolerance up to 100 preview rows.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-[11px] text-slate-800">
                <strong>Supported Database Engines:</strong> Candidates can run solutions in PostgreSQL, SQLite, or Python sandboxes depending on the assessment configuration.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: SECURE CANDIDATE INVITATIONS */}
      {activeModal === 'invitations' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-base">
                <Mail className="w-5 h-5" />
                <span>Candidate Invitation & Assessment Access Security</span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                Candidate access follows a strict zero-knowledge security workflow:
              </p>

              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <div className="p-2.5 bg-white rounded-lg border border-slate-100 text-xs space-y-1">
                  <div className="font-bold text-slate-900">1. Cryptographic Token Generation</div>
                  <p className="text-[11px] text-slate-500">
                    When an administrator invites candidates, the system generates a random 32-byte cryptographic token. The backend hashes it using SHA-256 and stores only the hash in the <code className="text-amber-700 font-bold">invitations</code> table.
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-100 text-xs space-y-1">
                  <div className="font-bold text-slate-900">2. Scheduled Access Enforcement</div>
                  <p className="text-[11px] text-slate-500">
                    Invitations enforce assessment start and end dates. Candidates cannot enter before the scheduled start time, and access closes automatically when the window expires.
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-100 text-xs space-y-1">
                  <div className="font-bold text-slate-900">3. Absolute Boundary Isolation (Zero Leakage)</div>
                  <p className="text-[11px] text-slate-500">
                    The student endpoints NEVER return: reference SQL solutions, explanations, hidden test cases, or other candidates&apos; submissions. All evaluation occurs entirely on the server.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
