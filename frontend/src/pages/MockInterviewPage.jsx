import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Send, Download, ChevronRight, CheckCircle, AlertCircle,
  MessageSquare, Brain, Trophy, RotateCcw, Home
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
    <div className="glass-sm p-5 space-y-4 animate-slide-up border-l-2 border-brand-500">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white flex items-center gap-2">
          <Brain className="w-4 h-4 text-brand-400" /> AI Evaluation
        </p>
        <ScoreBadge score={evaluation.total_score} />
      </div>

      {/* Score bars */}
      <div className="grid grid-cols-3 gap-4">
        <ScoreBar label="Correctness"    score={evaluation.correctness_score} />
        <ScoreBar label="Communication"  score={evaluation.communication_score} />
        <ScoreBar label="Relevance"      score={evaluation.relevance_score} />
      </div>

      {/* Feedback */}
      <p className="text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-3">
        {evaluation.ai_evaluation}
      </p>

      {/* Strengths / Improvements */}
      <div className="grid grid-cols-2 gap-4">
        {evaluation.strengths?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Strengths
            </p>
            <ul className="space-y-1">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="text-xs text-slate-400">• {s}</li>
              ))}
            </ul>
          </div>
        )}
        {evaluation.improvements?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Improve
            </p>
            <ul className="space-y-1">
              {evaluation.improvements.map((s, i) => (
                <li key={i} className="text-xs text-slate-400">• {s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Ideal Answer */}
      <details className="group">
        <summary className="text-xs font-semibold text-brand-400 cursor-pointer hover:text-brand-300 flex items-center gap-1">
          <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
          View Ideal Answer
        </summary>
        <p className="mt-2 text-xs text-slate-400 leading-relaxed bg-surface-900/50 rounded-lg p-3">
          {evaluation.ideal_answer}
        </p>
      </details>
    </div>
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
      toast.success('Report downloaded!')
    } catch {
      toast.error('Failed to generate PDF')
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <Card glow>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-brand flex items-center justify-center mx-auto shadow-brand-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Interview Complete!</h2>
            <p className="text-slate-400 text-sm mt-1">{summary.role} · <DifficultyBadge difficulty={summary.difficulty} /></p>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Overall',       val: `${summary.avg_score.toFixed(1)}/10` },
              { label: 'Correctness',   val: `${summary.avg_correctness.toFixed(1)}/10` },
              { label: 'Communication', val: `${summary.avg_communication.toFixed(1)}/10` },
              { label: 'Relevance',     val: `${summary.avg_relevance.toFixed(1)}/10` },
            ].map(({ label, val }) => (
              <div key={label} className="glass-sm p-3 text-center">
                <p className="text-xl font-bold text-white">{val}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-3">
            <Button onClick={handleExport} variant="secondary" icon={<Download className="w-4 h-4" />}>
              Download PDF
            </Button>
            <Button onClick={onRestart} icon={<RotateCcw className="w-4 h-4" />}>
              New Interview
            </Button>
            <Button variant="ghost" onClick={() => navigate('/dashboard')} icon={<Home className="w-4 h-4" />}>
              Dashboard
            </Button>
          </div>
        </div>
      </Card>

      {/* Per-question review */}
      <Card>
        <CardTitle className="mb-4">Answer Review</CardTitle>
        <div className="space-y-5">
          {summary.attempts.map((attempt, i) => (
            <div key={attempt.attempt_id} className="space-y-2 border-b border-white/5 pb-5 last:border-0 last:pb-0">
              <p className="text-xs font-semibold text-brand-400 uppercase">Q{i + 1}</p>
              <p className="text-sm font-medium text-white">{attempt.user_answer.substring(0, 100)}...</p>
              <EvaluationCard evaluation={attempt} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────
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

  useEffect(() => {
    if (!session || String(session.id) !== sessionId) {
      interviewApi.get(sessionId)
        .then(s => { setSession(s); setLoading(false) })
        .catch(() => { toast.error('Session not found'); navigate('/interview') })
    } else {
      setLoading(false)
    }
  }, [sessionId])

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

      // Auto-scroll
      setTimeout(() => textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
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

  if (loading) return <PageLoader text="Loading session..." />
  if (summary)  return <SessionSummaryView summary={summary} sessionId={sessionId} onRestart={handleRestart} />

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{session?.role}</h1>
          <p className="text-sm text-slate-500">
            Question {Math.min(currentIndex + 1, questions.length)} of {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DifficultyBadge difficulty={session?.difficulty} />
          {isComplete && (
            <Button size="sm" onClick={handleViewSummary} icon={<Trophy className="w-4 h-4" />}>
              View Results
            </Button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="glass p-4">
        <div className="flex gap-2">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className={`flex-1 h-2 rounded-full transition-all duration-500 ${
                answers[q.id] ? 'bg-brand-500' :
                i === currentIndex ? 'bg-brand-500/40' :
                'bg-surface-600'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {Object.keys(answers).length} of {questions.length} answered
        </p>
      </div>

      {/* Chat flow */}
      <div className="space-y-4">
        {questions.slice(0, currentIndex + (currentEval ? 1 : 1)).map((q, i) => {
          const eval_ = answers[q.id]
          const isActive = i === currentIndex
          return (
            <div key={q.id} className="space-y-3">
              {/* Question bubble */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center flex-shrink-0 shadow-brand">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="chat-bubble-ai">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-brand-300">Q{i + 1}</span>
                    <span className="badge-gray text-xs">{q.category}</span>
                  </div>
                  <p className="text-sm text-white leading-relaxed">{q.question_text}</p>
                </div>
              </div>

              {/* User answer bubble */}
              {eval_ && (
                <div className="flex justify-end">
                  <div className="chat-bubble-user">
                    <p className="text-sm text-white/90 leading-relaxed">{eval_.user_answer}</p>
                  </div>
                </div>
              )}

              {/* Evaluation */}
              {eval_ && <EvaluationCard evaluation={eval_} />}

              {/* Answer input (only for current unanswered question) */}
              {isActive && !eval_ && (
                <div className="flex gap-3 items-end" ref={textareaRef}>
                  <div className="flex-1">
                    <textarea
                      className="input-field resize-none"
                      rows={5}
                      placeholder="Type your answer here... Be detailed and specific."
                      value={answer}
                      onChange={e => setAnswer(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && e.ctrlKey) handleSubmit()
                      }}
                      disabled={isEvaluating}
                    />
                    <p className="text-xs text-slate-600 mt-1">Ctrl+Enter to submit</p>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    loading={isEvaluating}
                    size="lg"
                    className="flex-shrink-0"
                    icon={<Send className="w-4 h-4" />}
                  >
                    {isEvaluating ? 'Evaluating...' : 'Submit'}
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Completion CTA */}
      {isComplete && (
        <Card glow className="text-center py-8">
          <Trophy className="w-12 h-12 text-brand-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">All questions answered!</h3>
          <p className="text-slate-500 text-sm mb-4">Ready to see your full performance report?</p>
          <Button onClick={handleViewSummary} size="lg">
            View Results & Score
          </Button>
        </Card>
      )}
    </div>
  )
}
