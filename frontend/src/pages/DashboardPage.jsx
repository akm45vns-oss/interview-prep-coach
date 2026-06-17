import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Target, Trophy, MessageSquare, TrendingUp, ChevronRight,
  AlertTriangle, CheckCircle, Zap, Clock, BarChart3
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import { dashboardApi } from '@/api/dashboard'
import { useAuthStore } from '@/store/authStore'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Badge, { StatusBadge, DifficultyBadge, ScoreBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { ScoreBar } from '@/components/ui/ProgressBar'

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  const colors = {
    brand:   'bg-brand-500/15 text-brand-400',
    success: 'bg-emerald-500/15 text-emerald-400',
    warning: 'bg-amber-500/15 text-amber-400',
    purple:  'bg-purple-500/15 text-purple-400',
  }
  return (
    <div className="stat-card animate-slide-up">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm font-medium text-white/80">{label}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.get()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader text="Loading dashboard..." />

  const trendData = (stats?.improvement_trend || []).map((score, i) => ({
    session: `S${i + 1}`,
    score: score,
  }))

  const radarData = [
    { subject: 'Correctness', A: ((stats?.weak_areas?.find(w => w.category === 'Technical Knowledge') ? stats.weak_areas.find(w => w.category === 'Technical Knowledge').avg_score : stats?.strong_areas?.find(s => s.category === 'Technical Knowledge')?.avg_score) || 0) * 10 },
    { subject: 'Communication', A: ((stats?.weak_areas?.find(w => w.category === 'Communication') ? stats.weak_areas.find(w => w.category === 'Communication').avg_score : stats?.strong_areas?.find(s => s.category === 'Communication')?.avg_score) || 0) * 10 },
    { subject: 'Relevance', A: ((stats?.weak_areas?.find(w => w.category === 'Answer Relevance') ? stats.weak_areas.find(w => w.category === 'Answer Relevance').avg_score : stats?.strong_areas?.find(s => s.category === 'Answer Relevance')?.avg_score) || 0) * 10 },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-500 mt-1">Here's your interview preparation progress</p>
        </div>
        <Button onClick={() => navigate('/interview')} icon={<Zap className="w-4 h-4" />}>
          Start Practice
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={MessageSquare} label="Total Sessions"  value={stats?.total_sessions ?? 0}     color="brand" />
        <StatCard icon={CheckCircle}   label="Completed"       value={stats?.completed_sessions ?? 0}  color="success" />
        <StatCard icon={Target}        label="Avg Score"       value={`${stats?.overall_avg_score?.toFixed(1) ?? '—'}/10`} color="warning" />
        <StatCard icon={Trophy}        label="Best Score"      value={`${stats?.best_score?.toFixed(1) ?? '—'}/10`}        color="purple" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Score Trend</CardTitle>
            <Badge variant="brand">Last {trendData.length} sessions</Badge>
          </CardHeader>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="session" stroke="#475569" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} stroke="#475569" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1e1c32', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', fontSize: 12 }}
                  labelStyle={{ color: '#a5b4fc' }}
                />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <div className="text-center space-y-2">
                <BarChart3 className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-slate-500 text-sm">Complete interviews to see your trend</p>
              </div>
            </div>
          )}
        </Card>

        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Skill Dimensions</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Score" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Weak Areas + Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Areas */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Areas</CardTitle>
          </CardHeader>
          <div className="space-y-6">
            {stats?.weak_areas?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Needs Work</span>
                </div>
                {stats.weak_areas.map(w => (
                  <ScoreBar key={w.category} label={w.category} score={w.avg_score} />
                ))}
              </div>
            )}
            {stats?.strong_areas?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Strengths</span>
                </div>
                {stats.strong_areas.map(s => (
                  <ScoreBar key={s.category} label={s.category} score={s.avg_score} />
                ))}
              </div>
            )}
            {!stats?.weak_areas?.length && !stats?.strong_areas?.length && (
              <p className="text-slate-500 text-sm text-center py-6">Complete an interview to see your analysis</p>
            )}
          </div>
        </Card>

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <button onClick={() => navigate('/interview')} className="btn-ghost text-xs">
              New session <ChevronRight className="w-3 h-3" />
            </button>
          </CardHeader>
          <div className="space-y-3">
            {stats?.recent_sessions?.length > 0 ? (
              stats.recent_sessions.map(sess => (
                <div key={sess.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-700/40 hover:bg-surface-700/60 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{sess.role}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <DifficultyBadge difficulty={sess.difficulty} />
                      <span className="text-xs text-slate-500">{sess.answered}/{sess.total_questions} answered</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    {sess.avg_score != null && <ScoreBadge score={sess.avg_score} />}
                    <StatusBadge status={sess.status} />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 space-y-3">
                <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-slate-500 text-sm">No sessions yet</p>
                <Button size="sm" onClick={() => navigate('/interview')}>Start your first interview</Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Skills to Improve */}
      {stats?.skills_to_improve?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Focus Areas</CardTitle>
            <button onClick={() => navigate('/roadmap')} className="btn-ghost text-xs text-brand-400">
              Get roadmap →
            </button>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            {stats.skills_to_improve.map(skill => (
              <div key={skill} className="badge-warning">{skill}</div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
