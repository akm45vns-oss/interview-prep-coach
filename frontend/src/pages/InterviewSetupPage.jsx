import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Sliders, Hash, FileText, Zap, ChevronRight } from 'lucide-react'
import { interviewApi } from '@/api/interview'
import { resumeApi } from '@/api/resume'
import { useInterviewStore } from '@/store/interviewStore'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input, { Select } from '@/components/ui/Input'
import { DifficultyBadge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

const ROLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer',
  'Full Stack Developer', 'Data Scientist', 'Machine Learning Engineer',
  'DevOps Engineer', 'Data Analyst', 'Product Manager', 'Cloud Engineer',
]

const DIFFICULTIES = [
  { value: 'easy',   label: '🟢 Easy — Fundamentals & concepts' },
  { value: 'medium', label: '🟡 Medium — Practical knowledge' },
  { value: 'hard',   label: '🔴 Hard — Advanced & system design' },
]

export default function InterviewSetupPage() {
  const navigate = useNavigate()
  const setSession = useInterviewStore(s => s.setSession)
  const [resumes, setResumes] = useState([])
  const [form, setForm] = useState({
    role: '',
    difficulty: 'medium',
    numQuestions: 5,
    resumeId: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    resumeApi.list().then(setResumes).catch(() => {})
  }, [])

  const change = field => val => setForm(p => ({ ...p, [field]: val }))

  const handleStart = async () => {
    if (!form.role.trim()) return toast.error('Please enter or select a target role')
    setLoading(true)
    try {
      const session = await interviewApi.start({
        role: form.role,
        difficulty: form.difficulty,
        num_questions: parseInt(form.numQuestions),
        resume_id: form.resumeId ? parseInt(form.resumeId) : null,
      })
      setSession(session)
      toast.success('Interview session created!')
      navigate(`/interview/${session.id}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white">
          Start <span className="gradient-text">Mock Interview</span>
        </h1>
        <p className="text-slate-500 mt-1">Configure your session and let AI generate personalized questions</p>
      </div>

      <Card glow>
        <div className="space-y-6">
          {/* Role */}
          <div>
            <label className="input-label">Target Role *</label>
            <div className="relative">
              <input
                list="roles-list"
                className="input-field pl-10"
                placeholder="e.g. Machine Learning Engineer"
                value={form.role}
                onChange={e => change('role')(e.target.value)}
              />
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>
            <datalist id="roles-list">
              {ROLES.map(r => <option key={r} value={r} />)}
            </datalist>
          </div>

          {/* Difficulty */}
          <div>
            <label className="input-label">Difficulty Level</label>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTIES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => change('difficulty')(value)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all text-left
                    ${form.difficulty === value
                      ? 'bg-brand-500/20 border-brand-500/50 text-brand-300'
                      : 'bg-surface-700/40 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Num Questions */}
          <div>
            <label className="input-label">Number of Questions</label>
            <div className="flex gap-3">
              {[3, 5, 7, 10].map(n => (
                <button
                  key={n}
                  onClick={() => change('numQuestions')(n)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all
                    ${form.numQuestions === n
                      ? 'bg-brand-500/20 border-brand-500/50 text-brand-300'
                      : 'bg-surface-700/40 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Resume (optional) */}
          {resumes.length > 0 && (
            <Select
              label="Use Resume Context (optional)"
              value={form.resumeId}
              onChange={e => change('resumeId')(e.target.value)}
              icon={<FileText className="w-4 h-4" />}
            >
              <option value="">No resume — General questions</option>
              {resumes.map(r => (
                <option key={r.id} value={r.id}>{r.filename}</option>
              ))}
            </Select>
          )}

          {/* Summary */}
          <div className="glass-sm p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Session Summary</p>
            <div className="flex flex-wrap gap-3">
              <span className="badge-brand">{form.role || 'No role set'}</span>
              <DifficultyBadge difficulty={form.difficulty} />
              <span className="badge-gray">{form.numQuestions} questions</span>
              {form.resumeId && <span className="badge-success">Resume-tailored</span>}
            </div>
          </div>

          <Button onClick={handleStart} loading={loading} size="lg" className="w-full">
            <Zap className="w-5 h-5" />
            {loading ? 'Generating Questions...' : 'Start Interview Session'}
          </Button>
        </div>
      </Card>

      {/* Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: '🎙️', title: 'Speak Naturally', desc: 'Write as you would speak — natural language is scored better' },
          { icon: '⭐', title: 'Use STAR Method', desc: 'Situation, Task, Action, Result for behavioral questions' },
          { icon: '💡', title: 'Be Specific', desc: 'Use concrete examples from your experience for higher scores' },
        ].map(tip => (
          <div key={tip.title} className="glass-sm p-4 space-y-2">
            <span className="text-2xl">{tip.icon}</span>
            <p className="text-sm font-semibold text-white">{tip.title}</p>
            <p className="text-xs text-slate-500">{tip.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
