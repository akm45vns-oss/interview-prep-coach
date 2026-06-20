import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Download, ChevronRight, CheckCircle, AlertCircle,
  MessageSquare, Brain, Trophy, RotateCcw, Home, Sparkles, HelpCircle,
  Check, Lock, Activity
} from 'lucide-react'
import { interviewApi } from '@/api/interview'
import { useInterviewStore } from '@/store/interviewStore'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ScoreBadge, DifficultyBadge } from '@/components/ui/Badge'
import { ScoreBar } from '@/components/ui/ProgressBar'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

// ── Evaluation Card ────────────────────────────────────────────────────────
function EvaluationCard({ evaluation }) {
  if (!evaluation) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-5 space-y-4 border border-white/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.3)] relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-600" />
      <div className="flex items-center justify-between">
        <p className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2 pl-1.5">
          <Brain className="w-4 h-4 text-indigo-400" /> AI Diagnostic Feedback
        </p>
        <ScoreBadge score={evaluation.total_score} />
      </div>

      {/* Score Bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ScoreBar label="Correctness"    score={evaluation.correctness_score} />
        <ScoreBar label="Communication"  score={evaluation.communication_score} />
        <ScoreBar label="Relevance"      score={evaluation.relevance_score} />
      </div>

      {/* Feedback Text */}
      <p className="text-xs font-medium text-slate-300 leading-relaxed border-t border-white/[0.04] pt-3.5 pl-1.5">
        {evaluation.ai_evaluation}
      </p>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-1.5">
        {evaluation.strengths?.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Strengths
            </p>
            <ul className="space-y-1">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="text-xs text-slate-400 font-medium leading-relaxed flex items-start gap-1.5">
                  <span className="text-emerald-500/80 mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {evaluation.improvements?.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Growth Areas
            </p>
            <ul className="space-y-1">
              {evaluation.improvements.map((s, i) => (
                <li key={i} className="text-xs text-slate-400 font-medium leading-relaxed flex items-start gap-1.5">
                  <span className="text-amber-500/80 mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Ideal Answer Accordion */}
      <details className="group border-t border-white/[0.04] pt-3 pl-1.5">
        <summary className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest cursor-pointer hover:text-indigo-300 flex items-center gap-1 select-none">
          <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
          Reveal Suggested Reference Answer
        </summary>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2.5 text-xs text-slate-400 leading-relaxed bg-surface-900/60 rounded-xl p-3.5 border border-white/[0.03] font-medium"
        >
          {evaluation.ideal_answer}
        </motion.p>
      </details>
    </motion.div>
  )
}

// ── Session Summary ────────────────────────────────────────────────────────
function SessionSummaryView({ summary, sessionId, onRestart }) {
  const navigate = useNavigate()

  const handleExport = async () => {
    try {
      const blob = await interviewApi.exportPdf(sessionId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `interview_report_${sessionId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Performance PDF report downloaded!')
    } catch {
      toast.error('Failed to compile PDF report')
    }
  }

  return (
    <div className="space-y-6 animate-slide-up max-w-4xl mx-auto">
      {/* Complete Header Panel */}
      <Card className="border border-white/[0.04] shadow-[0_12px_40px_rgba(0,0,0,0.5)] p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />
        
        <div className="text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(99,102,241,0.45)]">
            <Trophy className="w-8 h-8 text-white animate-float" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Interview Evaluation Complete</h2>
            <p className="text-slate-400 text-sm mt-1.5 font-semibold">
              {summary.role} &middot; <DifficultyBadge difficulty={summary.difficulty} />
            </p>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto pt-2">
            {[
              { label: 'Overall Rating',       val: `${summary.avg_score.toFixed(1)}/10`, color: 'text-indigo-400' },
              { label: 'Technical Depth',      val: `${summary.avg_correctness.toFixed(1)}/10`, color: 'text-emerald-400' },
              { label: 'Communication Flow',  val: `${summary.avg_communication.toFixed(1)}/10`, color: 'text-purple-400' },
              { label: 'Query Relevance',      val: `${summary.avg_relevance.toFixed(1)}/10`, color: 'text-amber-400' },
            ].map(({ label, val, color }) => (
              <div key={label} className="glass-sm p-4 text-center border border-white/[0.03] shadow-md">
                <p className={`text-2xl font-black ${color} tracking-tight`}>{val}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Action Triggers */}
          <div className="flex flex-wrap justify-center gap-3 pt-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={handleExport} variant="secondary" icon={<Download className="w-4 h-4 text-slate-300" />}>
                Export PDF Report
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={onRestart} icon={<RotateCcw className="w-4 h-4 text-white" />}>
                Start New Practice
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="ghost" onClick={() => navigate('/dashboard')} icon={<Home className="w-4 h-4 text-slate-400" />}>
                Go to Dashboard
              </Button>
            </motion.div>
          </div>
        </div>
      </Card>

      {/* Structured Answer Review List */}
      <Card className="border border-white/[0.04]">
        <CardHeader className="pb-4 border-b border-white/[0.04]">
          <CardTitle>Detailed Answers Review</CardTitle>
          <p className="text-xs text-slate-500 mt-1">Review AI feedback and improvements for each question</p>
        </CardHeader>
        <div className="space-y-6 mt-6">
          {summary.attempts.map((attempt, i) => (
            <div key={attempt.attempt_id} className="space-y-3.5 border-b border-white/[0.04] pb-6 last:border-0 last:pb-0">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider">
                  Question {i + 1}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-surface-900/40 border border-white/[0.02]">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Your Submitted Answer</p>
                <p className="text-sm font-medium text-slate-200 mt-1.5 leading-relaxed italic">"{attempt.user_answer}"</p>
              </div>
              <EvaluationCard evaluation={attempt} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── Main Mock Interview Component ──────────────────────────────────────────
export default function MockInterviewPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const {
    session, currentIndex, answers, isEvaluating,
    setSession, setEvaluating, recordAnswer, setSummary, summary, reset
  } = useInterviewStore()

  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(!session)
  const textareaRef = useRef(null)
  const chatEndRef = useRef(null)

  useEffect(() => {
    if (!session || String(session.id) !== sessionId) {
      interviewApi.get(sessionId)
        .then(s => { setSession(s); setLoading(false) })
        .catch(() => { toast.error('Session not found'); navigate('/interview') })
    } else {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    // Scroll chat window to bottom when a new question/evaluation happens
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentIndex, answers])

  const questions = session?.questions ?? []
  const currentQuestion = questions[currentIndex]
  const currentEval = currentQuestion ? answers[currentQuestion.id] : null
  const isComplete = Object.keys(answers).length >= questions.length && questions.length > 0

  const handleSubmit = async () => {
    if (!answer.trim()) return toast.error('Please write your answer')
    if (!currentQuestion) return

    setEvaluating(true)
    try {
      const evaluation = await interviewApi.answer(sessionId, {
        question_id: currentQuestion.id,
        user_answer: answer.trim(),
      })
      recordAnswer(currentQuestion.id, evaluation)
      setAnswer('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setEvaluating(false)
    }
  }

  const handleViewSummary = async () => {
    try {
      const sum = await interviewApi.summary(sessionId)
      setSummary(sum)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleRestart = () => {
    reset()
    navigate('/interview')
  }

  if (loading) return <PageLoader text="Assembling mock session resources..." />
  if (summary)  return <SessionSummaryView summary={summary} sessionId={sessionId} onRestart={handleRestart} />

  return (
    <div className="space-y-6">
      {/* Top Telemetry Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">{session?.role} Mock Interview</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Active Simulation Session
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DifficultyBadge difficulty={session?.difficulty} />
          {isComplete && (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button size="sm" onClick={handleViewSummary} icon={<Trophy className="w-4 h-4 text-white" />}>
                View Summary Report
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Split Layout Frame */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side Pane - Questions checklist progress */}
        <div className="space-y-5">
          <Card className="border border-white/[0.04] p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/[0.04]">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Question Module Roadmap</span>
              <span className="text-[10px] font-bold text-slate-400">
                {Object.keys(answers).length}/{questions.length} Answered
              </span>
            </div>

            {/* Checklist timeline */}
            <div className="space-y-3">
              {questions.map((q, i) => {
                const isAnswered = !!answers[q.id]
                const isActive = i === currentIndex
                return (
                  <div
                    key={q.id}
                    className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition-all duration-300
                      ${isActive 
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' 
                        : isAnswered 
                          ? 'bg-surface-900/40 border-transparent text-slate-400' 
                          : 'bg-surface-900/20 border-transparent text-slate-600'
                      }`}
                  >
                    <div className="mt-0.5">
                      {isAnswered ? (
                        <div className="w-4.5 h-4.5 rounded-full bg-emerald-500/10 border border-emerald-500/35 flex items-center justify-center text-emerald-400">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      ) : isActive ? (
                        <div className="w-4.5 h-4.5 rounded-full bg-indigo-500/20 border border-indigo-500 flex items-center justify-center relative">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                        </div>
                      ) : (
                        <div className="w-4.5 h-4.5 rounded-full bg-surface-900 border border-white/5 flex items-center justify-center text-slate-700">
                          <Lock className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider leading-none">Question {i + 1}</p>
                      <p className="text-[11px] text-slate-500 truncate leading-snug mt-1">{q.question_text}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* General progress bar */}
            <div className="mt-5 space-y-1.5">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Quick Help Card */}
          <div className="glass p-5 border border-indigo-500/10 space-y-2.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Prep Assistant Tip
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              If evaluating a coding logic question, try describing your design choices, big-O time/space trade-offs, and structure before writing mock syntax blocks.
            </p>
          </div>
        </div>

        {/* Right Side Pane - Chat Box */}
        <div className="lg:col-span-2 flex flex-col glass border border-white/[0.04] shadow-[0_12px_40px_rgba(0,0,0,0.5)] rounded-3xl h-[600px] overflow-hidden">
          {/* Active Question Bar Header */}
          <div className="px-6 py-4 bg-surface-900/60 border-b border-white/[0.04] flex items-center gap-2 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Live Conversation Feed</span>
          </div>

          {/* Chat area scrollbox */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            {questions.slice(0, currentIndex + (currentEval ? 1 : 1)).map((q, i) => {
              const eval_ = answers[q.id]
              const isActive = i === currentIndex
              return (
                <div key={q.id} className="space-y-4">
                  {/* AI Question Bubble */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                      <Brain className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div className="chat-bubble-ai">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Question {i + 1}</span>
                        <span className="px-2 py-0.5 rounded bg-surface-700/60 border border-white/5 text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                          {q.category}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white leading-relaxed">{q.question_text}</p>
                    </div>
                  </div>

                  {/* User Answer Bubble */}
                  {eval_ && (
                    <div className="flex justify-end">
                      <div className="chat-bubble-user">
                        <p className="text-sm font-medium text-white/95 leading-relaxed">{eval_.user_answer}</p>
                      </div>
                    </div>
                  )}

                  {/* Evaluation Report */}
                  {eval_ && <EvaluationCard evaluation={eval_} />}

                  {/* Typing placeholder loader */}
                  {isActive && !eval_ && isEvaluating && (
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center flex-shrink-0 shadow-md">
                        <Brain className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div className="chat-bubble-ai max-w-[200px] flex items-center gap-2 justify-center py-4">
                        <div className="wave-bar" style={{ animationDelay: '0.1s' }} />
                        <div className="wave-bar" style={{ animationDelay: '0.2s' }} />
                        <div className="wave-bar" style={{ animationDelay: '0.3s' }} />
                        <span className="text-xs font-bold text-slate-500 ml-1">Analyzing answer...</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Form Input Footer */}
          <div className="p-4 bg-surface-900/60 border-t border-white/[0.04] flex-shrink-0">
            {currentQuestion && !answers[currentQuestion.id] && !isEvaluating ? (
              <div className="space-y-2">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <textarea
                      ref={textareaRef}
                      className="input-field resize-none h-20"
                      placeholder={`Draft your answer for Q${currentIndex + 1} here... (Ctrl+Enter to submit)`}
                      value={answer}
                      onChange={e => setAnswer(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && e.ctrlKey) handleSubmit()
                      }}
                      disabled={isEvaluating}
                    />
                  </div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      onClick={handleSubmit}
                      loading={isEvaluating}
                      size="lg"
                      className="h-[76px] px-6"
                      icon={<Send className="w-4.5 h-4.5 text-white" />}
                    >
                      Submit
                    </Button>
                  </motion.div>
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-bold text-slate-600">Tip: Write at least 2-3 detailed sentences for deep analysis.</span>
                  <span className="text-[10px] font-bold text-slate-600">Ctrl + Enter</span>
                </div>
              </div>
            ) : isComplete && !isEvaluating ? (
              <div className="flex items-center justify-between p-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <span className="text-xs font-bold text-indigo-300 pl-2">Session Complete! View your aggregate feedback score.</span>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button size="sm" onClick={handleViewSummary} icon={<Trophy className="w-4 h-4 text-white" />}>
                    View Summary Report
                  </Button>
                </motion.div>
              </div>
            ) : (
              <div className="py-3 text-center text-xs font-bold text-slate-600">
                Waiting for evaluation diagnostic analysis...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
