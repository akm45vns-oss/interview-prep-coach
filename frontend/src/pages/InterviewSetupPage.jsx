import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Briefcase, FileText, Zap, ChevronRight, MessageSquare, Flame } from 'lucide-react'
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
  { value: 'easy',   label: '🟢 Easy', desc: 'Conceptual fundamentals' },
  { value: 'medium', label: '🟡 Medium', desc: 'Practical & application' },
  { value: 'hard',   label: '🔴 Hard', desc: 'System design & deep scenarios' },
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

  const change = (field, val) => setForm(p => ({ ...p, [field]: val }))

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
    <div className="space-y-8 max-w-3xl mx-auto relative">
      {/* Background radial glow */}
      <div className="absolute top-[-10%] left-[20%] w-[60%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Configure <span className="gradient-text">Mock Interview</span>
        </h1>
        <p className="text-slate-500 mt-1.5 font-medium">Design your interview parameters and let AI build customized question modules.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border border-white/[0.04] shadow-[0_12px_40px_rgba(0,0,0,0.4)] p-8">
          <div className="space-y-7">
            {/* Target Role Input */}
            <div>
              <label className="input-label">Target Professional Role</label>
              <div className="relative">
                <input
                  list="roles-list"
                  className="input-field pl-11"
                  placeholder="e.g. Full Stack Engineer, Data Scientist"
                  value={form.role}
                  onChange={e => change('role', e.target.value)}
                />
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
              </div>
              <datalist id="roles-list">
                {ROLES.map(r => <option key={r} value={r} />)}
              </datalist>
              {/* Quick Role Suggestions */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest self-center mr-1">Quick Select:</span>
                {ROLES.slice(0, 4).map(r => (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    key={r}
                    type="button"
                    onClick={() => change('role', r)}
                    className="px-2.5 py-1 rounded-lg bg-surface-900 border border-white/5 hover:border-indigo-500/30 text-[11px] font-bold text-slate-400 hover:text-white transition-all"
                  >
                    {r}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Difficulty Selector */}
            <div>
              <label className="input-label">Target Difficulty</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {DIFFICULTIES.map(({ value, label, desc }) => {
                  const isSelected = form.difficulty === value
                  return (
                    <motion.button
                      whileHover={{ y: -2, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      key={value}
                      type="button"
                      onClick={() => change('difficulty', value)}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 h-24
                        ${isSelected
                          ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                          : 'bg-surface-900/40 border-white/[0.04] text-slate-400 hover:bg-surface-700/30 hover:border-white/10'
                        }`}
                    >
                      <span className="text-sm font-bold">{label}</span>
                      <span className="text-[11px] text-slate-500 mt-1 leading-snug">{desc}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Question Count Selector */}
            <div>
              <label className="input-label">Number of Interview Questions</label>
              <div className="flex gap-3">
                {[3, 5, 7, 10].map(n => {
                  const isSelected = form.numQuestions === n
                  return (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      key={n}
                      type="button"
                      onClick={() => change('numQuestions', n)}
                      className={`flex-1 py-3 rounded-2xl border text-sm font-bold transition-all duration-300
                        ${isSelected
                          ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                          : 'bg-surface-900/40 border-white/[0.04] text-slate-400 hover:bg-surface-700/30 hover:border-white/10'
                        }`}
                    >
                      {n} Qs
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Resume upload dropdown selection */}
            {resumes.length > 0 && (
              <Select
                label="Inject Resume Context (Tailors questions to your resume)"
                value={form.resumeId}
                onChange={e => change('resumeId', e.target.value)}
                icon={<FileText className="w-4 h-4 text-slate-500" />}
              >
                <option value="">Do not use resume context (Generate generic questions)</option>
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>{r.filename}</option>
                ))}
              </Select>
            )}

            {/* Telemetry Summary */}
            <div className="p-4 rounded-2xl bg-surface-900/50 border border-white/[0.03] space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Configuration Summary</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-3 py-1 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-bold shadow-[0_0_8px_rgba(99,102,241,0.05)]">
                  {form.role || 'Professional Role Unset'}
                </span>
                <DifficultyBadge difficulty={form.difficulty} />
                <span className="px-3 py-1 rounded-xl bg-surface-700/60 text-slate-300 border border-white/5 text-xs font-bold">
                  {form.numQuestions} Questions
                </span>
                {form.resumeId && (
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-bold">
                    Custom Resume context enabled
                  </span>
                )}
              </div>
            </div>

            {/* Action Trigger */}
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button onClick={handleStart} loading={loading} size="lg" className="w-full">
                <Zap className="w-5 h-5 text-white" />
                {loading ? 'Assembling Custom AI Module...' : 'Launch Simulation Session'}
              </Button>
            </motion.div>
          </div>
        </Card>
      </motion.div>

      {/* Pro Tips Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { emoji: '🎙️', title: 'Answer Naturally', desc: 'Express answers in comfortable, conversational sentences.' },
          { emoji: '⭐', title: 'Apply STAR Form', desc: 'Structure responses with Situation, Task, Action, and Result.' },
          { emoji: '💡', title: 'State Metrics', desc: 'Incorporate numeric outcomes, percentages, or engineering metrics.' },
        ].map((tip, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 + idx * 0.1 }}
            whileHover={{ y: -3 }}
            key={tip.title}
            className="glass-sm p-5 space-y-2 border border-white/[0.03] shadow-md"
          >
            <span className="text-2xl">{tip.emoji}</span>
            <p className="text-sm font-bold text-white leading-tight">{tip.title}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{tip.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
