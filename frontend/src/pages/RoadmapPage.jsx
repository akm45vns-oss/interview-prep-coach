import React, { useState, useEffect } from 'react'
import {
  Map, Plus, Loader2, Calendar, BookOpen, Target, ExternalLink, ChevronDown
} from 'lucide-react'
import { dashboardApi } from '@/api/dashboard'
import { resumeApi } from '@/api/resume'
import { dashboardApi as dApi } from '@/api/dashboard'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input, { Select } from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import toast from 'react-hot-toast'

const RESOURCE_ICONS = { course: '🎓', book: '📚', tutorial: '💻', practice: '⚡' }

function PhaseCard({ phase, index }) {
  const [open, setOpen] = useState(index === 0)
  const colors = ['from-brand-500 to-purple-500', 'from-purple-500 to-pink-500', 'from-pink-500 to-rose-500']

  return (
    <div className="glass overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center flex-shrink-0 shadow-brand text-white font-bold`}>
          {phase.phase}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{phase.title}</p>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {phase.duration}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/[0.05] pt-4 animate-slide-up">
          {/* Topics */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Topics</p>
            <div className="flex flex-wrap gap-2">
              {phase.topics.map(t => (
                <span key={t} className="badge-brand text-xs">{t}</span>
              ))}
            </div>
          </div>

          {/* Resources */}
          {phase.resources?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Resources</p>
              <div className="space-y-2">
                {phase.resources.map((r, i) => (
                  <a
                    key={i}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-surface-700/40 hover:bg-surface-700/70 transition-colors group"
                  >
                    <span className="text-base">{RESOURCE_ICONS[r.type] ?? '🔗'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{r.title}</p>
                      <p className="text-xs text-slate-500 truncate">{r.url}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-brand-400 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Milestone */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20">
            <Target className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-brand-200">{phase.milestone}</p>
          </div>
        </div>
      )}
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

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Learning <span className="gradient-text">Roadmap</span>
          </h1>
          <p className="text-slate-500 mt-1">AI-generated personalized study plan for your target role</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Form */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-brand-400" />
                <CardTitle>Generate Roadmap</CardTitle>
              </div>
            </CardHeader>
            <div className="space-y-4">
              <Input
                label="Target Role"
                placeholder="e.g. Data Scientist"
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              />
              {resumes.length > 0 && (
                <Select
                  label="Resume (optional)"
                  value={form.resumeId}
                  onChange={e => setForm(p => ({ ...p, resumeId: e.target.value }))}
                >
                  <option value="">General roadmap</option>
                  {resumes.map(r => <option key={r.id} value={r.id}>{r.filename}</option>)}
                </Select>
              )}
              <Button
                onClick={handleGenerate}
                loading={generating}
                className="w-full"
                icon={<Plus className="w-4 h-4" />}
              >
                {generating ? 'Generating...' : 'Generate Roadmap'}
              </Button>
            </div>
          </Card>

          {/* Saved Roadmaps */}
          {roadmaps.length > 0 && (
            <Card>
              <CardTitle className="mb-3">Saved Roadmaps</CardTitle>
              <div className="space-y-2">
                {roadmaps.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setActive(r)}
                    className={`w-full p-3 rounded-xl text-left transition-all
                      ${active?.id === r.id
                        ? 'bg-brand-500/15 border border-brand-500/30'
                        : 'bg-surface-700/40 hover:bg-surface-700/60'
                      }`}
                  >
                    <p className="text-sm font-medium text-white">{r.role}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{r.total_duration}</p>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Roadmap Detail */}
        <div className="lg:col-span-2">
          {active ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="glass p-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{active.role}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-sm text-slate-400">Total: {active.total_duration}</span>
                    <span className="badge-brand">{active.phases?.length} phases</span>
                  </div>
                </div>
                <BookOpen className="w-8 h-8 text-brand-400/40" />
              </div>

              {/* Phases */}
              {active.phases?.map((phase, i) => (
                <PhaseCard key={phase.phase} phase={phase} index={i} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 glass rounded-2xl">
              {loading ? (
                <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
              ) : (
                <>
                  <Map className="w-12 h-12 text-slate-600 mb-3" />
                  <p className="text-slate-500 text-sm">Generate a roadmap to get started</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
