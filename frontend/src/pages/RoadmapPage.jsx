import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Map, Plus, Loader2, Calendar, BookOpen, Target, ExternalLink, ChevronDown, CheckSquare, Square
} from 'lucide-react'
import { dashboardApi } from '@/api/dashboard'
import { resumeApi } from '@/api/resume'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input, { Select } from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import toast from 'react-hot-toast'

const RESOURCE_ICONS = { course: '🎓', book: '📚', tutorial: '💻', practice: '⚡' }

function PhaseCard({ phase, index }) {
  const [open, setOpen] = useState(index === 0)
  const colors = ['from-indigo-500 to-purple-500', 'from-purple-500 to-pink-500', 'from-pink-500 to-rose-500']
  const [completed, setCompleted] = useState(false)

  return (
    <div className="glass border border-white/[0.04] shadow-md relative overflow-hidden group">
      {/* Connector line overlay for vertical timeline visual */}
      <div className="absolute top-0 left-8 w-[2px] h-full bg-white/[0.03] -z-10 pointer-events-none" />

      <div className="w-full flex items-center gap-4 p-5 hover:bg-white/[0.02] transition-colors relative z-10">
        {/* Toggle Checkbox */}
        <button
          onClick={() => setCompleted(c => !c)}
          className="w-8 h-8 rounded-xl bg-surface-900 border border-white/5 flex items-center justify-center text-slate-500 hover:text-indigo-400 hover:border-indigo-500/30 transition-all flex-shrink-0"
        >
          {completed ? (
            <CheckSquare className="w-4 h-4 text-emerald-400" />
          ) : (
            <Square className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Phase Header Node */}
        <button
          onClick={() => setOpen(o => !o)}
          className="flex-1 flex items-center gap-4 text-left"
        >
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.25)] text-white font-black text-sm`}>
            P{index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold truncate leading-tight ${completed ? 'line-through text-slate-500' : 'text-white'}`}>
              {phase.title}
            </p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1.5 flex items-center gap-1.5 leading-none">
              <Calendar className="w-3.5 h-3.5" /> {phase.duration}
            </p>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${open ? 'rotate-180 text-indigo-400' : ''}`} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6 border-t border-white/[0.04] pt-5 space-y-5 bg-surface-950/20">
              {/* Topics Grid */}
              <div className="pl-12">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Key Study Topics</p>
                <div className="flex flex-wrap gap-2">
                  {phase.topics.map(t => (
                    <span key={t} className="px-3 py-1 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold shadow-[0_0_8px_rgba(99,102,241,0.05)]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Study Resources */}
              {phase.resources?.length > 0 && (
                <div className="pl-12">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Recommended Study Material</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {phase.resources.map((r, i) => (
                      <motion.a
                        whileHover={{ scale: 1.01, x: 2 }}
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface-900/60 hover:bg-surface-700/60 border border-white/[0.02] hover:border-indigo-500/10 transition-all duration-300 group"
                      >
                        <span className="text-xl flex-shrink-0 bg-surface-950 w-9 h-9 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-indigo-500/20 transition-colors">
                          {RESOURCE_ICONS[r.type] ?? '🔗'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate leading-tight group-hover:text-indigo-400 transition-colors">{r.title}</p>
                          <p className="text-[9px] font-semibold text-slate-500 truncate mt-1 leading-none">{r.url}</p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors mr-1" />
                      </motion.a>
                    ))}
                  </div>
                </div>
              )}

              {/* Phase Milestone */}
              <div className="pl-12 pt-1">
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.05)]">
                  <Target className="w-4.5 h-4.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Phase Milestone</p>
                    <p className="text-xs text-slate-300 leading-relaxed font-semibold mt-1">{phase.milestone}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function RoadmapPage() {
  const [roadmaps, setRoadmaps] = useState([])
  const [resumes, setResumes] = useState([])
  const [active, setActive] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ role: '', resumeId: '' })

  useEffect(() => {
    Promise.all([dashboardApi.getRoadmaps(), resumeApi.list()])
      .then(([maps, res]) => {
        setRoadmaps(maps)
        setResumes(res)
        if (maps.length) setActive(maps[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleGenerate = async () => {
    if (!form.role.trim()) return toast.error('Enter a target role')
    setGenerating(true)
    try {
      const roadmap = await dashboardApi.generateRoadmap({
        role: form.role,
        resume_id: form.resumeId ? parseInt(form.resumeId) : null,
        weak_areas: [],
      })
      setRoadmaps(prev => [roadmap, ...prev])
      setActive(roadmap)
      toast.success('Learning roadmap generated!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return <PageLoader text="Loading preparation roadmaps..." />

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Background glow shadow */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Learning <span className="gradient-text">Roadmap</span>
        </h1>
        <p className="text-slate-500 mt-1.5 font-medium font-semibold">Generate structured, phased study milestones customized for target roles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Generator & Saved List) */}
        <div className="space-y-5">
          <Card className="border border-white/[0.04] shadow-lg">
            <CardHeader className="pb-4 border-b border-white/[0.04]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Map className="w-4.5 h-4.5" />
                </div>
                <CardTitle className="text-sm">Roadmap Creator</CardTitle>
              </div>
            </CardHeader>
            <div className="space-y-4 mt-4">
              <Input
                label="Target Role Name"
                placeholder="e.g. DevOps Engineer, Frontend Developer"
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              />
              {resumes.length > 0 && (
                <Select
                  label="Target Resume context"
                  value={form.resumeId}
                  onChange={e => setForm(p => ({ ...p, resumeId: e.target.value }))}
                >
                  <option value="">General roadmap (Standard guidelines)</option>
                  {resumes.map(r => <option key={r.id} value={r.id}>{r.filename}</option>)}
                </Select>
              )}
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  onClick={handleGenerate}
                  loading={generating}
                  className="w-full"
                  icon={<Plus className="w-4 h-4 text-white" />}
                >
                  {generating ? 'Generating milestones...' : 'Compile roadmap'}
                </Button>
              </motion.div>
            </div>
          </Card>

          {/* Saved Roadmaps list */}
          {roadmaps.length > 0 && (
            <Card className="border border-white/[0.04] shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Historical Roadmaps</CardTitle>
              </CardHeader>
              <div className="space-y-2 mt-2">
                {roadmaps.map(r => (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    key={r.id}
                    onClick={() => setActive(r)}
                    className={`w-full p-3.5 rounded-2xl border transition-all text-left
                      ${active?.id === r.id
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                        : 'bg-surface-900/40 border-transparent hover:bg-surface-700/40 text-slate-300'
                      }`}
                  >
                    <p className="text-xs font-bold leading-tight truncate">{r.role}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 leading-none">Duration: {r.total_duration}</p>
                  </motion.button>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column (Roadmap Details timeline list) */}
        <div className="lg:col-span-2">
          {active ? (
            <div className="space-y-5">
              {/* Target Header Banner */}
              <div className="glass p-6 border border-white/[0.04] flex items-center justify-between shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/0 pointer-events-none" />
                <div className="relative z-10 min-w-0 pr-4">
                  <h2 className="text-xl font-extrabold text-white truncate leading-tight">{active.role} Plan</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-400">Total Study: {active.total_duration}</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 text-[10px] font-bold uppercase tracking-wider leading-none">
                      {active.phases?.length} Phases
                    </span>
                  </div>
                </div>
                <BookOpen className="w-10 h-10 text-indigo-400/20 flex-shrink-0 animate-float" />
              </div>

              {/* Timeline Nodes */}
              <div className="space-y-4 relative">
                {active.phases?.map((phase, i) => (
                  <PhaseCard key={phase.phase} phase={phase} index={i} />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 glass border border-white/[0.04] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-center p-8">
              {generating ? (
                <div className="space-y-3">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                  <p className="text-slate-500 text-xs font-semibold">Creating personalized educational milestones...</p>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-surface-900 border border-white/5 flex items-center justify-center text-slate-600 mb-4">
                    <Map className="w-7 h-7" />
                  </div>
                  <p className="text-white font-bold text-base">No Roadmap Generated</p>
                  <p className="text-slate-500 text-xs mt-1.5 max-w-xs">Enter a target role on the left panel to compile a specialized, multi-phase curriculum study roadmap.</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
