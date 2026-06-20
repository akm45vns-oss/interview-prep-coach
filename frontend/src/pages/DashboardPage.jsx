import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Target, Trophy, MessageSquare, TrendingUp, ChevronRight,
  AlertTriangle, CheckCircle, Zap, Clock, BarChart3, Star, Compass
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
}

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  const colors = {
    brand:   'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    purple:  'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(139,92,246,0.15)]',
  }

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, scale: 1.02 }}
      className="glass p-6 flex flex-col justify-between h-40 border border-white/[0.04] shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-indigo-500/20 transition-all duration-300 relative overflow-hidden group"
    >
      {/* Background soft glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex items-start justify-between relative z-10">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5.5 h-5.5" />
        </div>
        {sub && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{sub}</span>}
      </div>

      <div className="relative z-10 space-y-1">
        <p className="text-3xl font-extrabold text-white tracking-tight leading-none">{value}</p>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{label}</p>
      </div>
    </motion.div>
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

  if (loading) return <PageLoader text="Loading dashboard analytics..." />

  const trendData = (stats?.improvement_trend || []).map((score, i) => ({
    session: `Session ${i + 1}`,
    score: score,
  }))

  const radarData = [
    { subject: 'Correctness', A: ((stats?.weak_areas?.find(w => w.category === 'Technical Knowledge') ? stats.weak_areas.find(w => w.category === 'Technical Knowledge').avg_score : stats?.strong_areas?.find(s => s.category === 'Technical Knowledge')?.avg_score) || 0) * 10 },
    { subject: 'Communication', A: ((stats?.weak_areas?.find(w => w.category === 'Communication') ? stats.weak_areas.find(w => w.category === 'Communication').avg_score : stats?.strong_areas?.find(s => s.category === 'Communication')?.avg_score) || 0) * 10 },
    { subject: 'Relevance', A: ((stats?.weak_areas?.find(w => w.category === 'Answer Relevance') ? stats.weak_areas.find(w => w.category === 'Answer Relevance').avg_score : stats?.strong_areas?.find(s => s.category === 'Answer Relevance')?.avg_score) || 0) * 10 },
  ]

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass p-3 border border-indigo-500/30 shadow-[0_8px_32px_rgba(99,102,241,0.2)]">
          <p className="text-xs font-bold text-slate-400">{label}</p>
          <p className="text-sm font-extrabold text-indigo-300 mt-1">
            Score: <span className="text-white">{payload[0].value.toFixed(1)}/10</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-500 mt-1.5 font-medium">Keep practicing to improve your skills and score.</p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button onClick={() => navigate('/interview')} icon={<Zap className="w-4 h-4 text-white" />}>
            Start Practice
          </Button>
        </motion.div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={MessageSquare} label="Sessions"    value={stats?.total_sessions ?? 0}     color="brand"   sub="Activity" />
        <StatCard icon={CheckCircle}   label="Completed"   value={stats?.completed_sessions ?? 0}  color="success" sub="Success" />
        <StatCard icon={Target}        label="Avg Score"   value={`${stats?.overall_avg_score?.toFixed(1) ?? '—'}/10`} color="warning" sub="Target" />
        <StatCard icon={Trophy}        label="Best Score"  value={`${stats?.best_score?.toFixed(1) ?? '—'}/10`}        color="purple"  sub="Trophy" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full border border-white/[0.04] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <CardHeader className="flex items-center justify-between pb-6">
              <div>
                <CardTitle>Score Improvement Trend</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Track your progress session over session</p>
              </div>
              <Badge variant="brand">Last {trendData.length} sessions</Badge>
            </CardHeader>
            {trendData.length > 0 ? (
              <div className="pr-4 pb-4">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="session" stroke="#475569" tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} dy={8} />
                    <YAxis domain={[0, 10]} stroke="#475569" tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} dx={-8} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(99,102,241,0.2)', strokeWidth: 1.5 }} />
                    <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#scoreColor)" dot={{ fill: '#6366f1', stroke: '#080812', strokeWidth: 2, r: 5 }} activeDot={{ r: 7, strokeWidth: 0, fill: '#8b5cf6' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-surface-900 border border-white/5 flex items-center justify-center mx-auto text-slate-600">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <p className="text-slate-500 text-sm font-semibold">Complete mock interviews to view your trend chart</p>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Skill Dimensions Radar Chart */}
        <motion.div variants={itemVariants}>
          <Card className="h-full border border-white/[0.04] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <CardHeader className="pb-6">
              <CardTitle>Skill Dimensions</CardTitle>
              <p className="text-xs text-slate-500 mt-1">Aggregate score across 3 dimensions</p>
            </CardHeader>
            <div className="flex items-center justify-center pb-4">
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="A" stroke="#8b5cf6" fill="#6366f1" fillOpacity={0.2} strokeWidth={2.5} dot={{ r: 4, fill: '#8b5cf6' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance & Strong/Weak categories */}
        <motion.div variants={itemVariants}>
          <Card className="h-full border border-white/[0.04] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <CardHeader className="pb-4">
              <CardTitle>Evaluation Dimension Details</CardTitle>
              <p className="text-xs text-slate-500 mt-1">Average dimension metrics</p>
            </CardHeader>
            <div className="space-y-6 p-2">
              {stats?.weak_areas?.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Focus Areas (Score &lt; 6.0)</span>
                  </div>
                  <div className="space-y-3.5">
                    {stats.weak_areas.map(w => (
                      <ScoreBar key={w.category} label={w.category} score={w.avg_score} />
                    ))}
                  </div>
                </div>
              )}
              {stats?.strong_areas?.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Strengths (Score &ge; 6.0)</span>
                  </div>
                  <div className="space-y-3.5">
                    {stats.strong_areas.map(s => (
                      <ScoreBar key={s.category} label={s.category} score={s.avg_score} />
                    ))}
                  </div>
                </div>
              )}
              {!stats?.weak_areas?.length && !stats?.strong_areas?.length && (
                <div className="py-12 text-center space-y-2">
                  <Compass className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-slate-500 text-sm font-semibold">Perform your first interview session to unlock skill breakdowns</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Recent Session History List */}
        <motion.div variants={itemVariants}>
          <Card className="h-full border border-white/[0.04] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <CardHeader className="flex items-center justify-between pb-4">
              <div>
                <CardTitle>Recent Session History</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Review your latest interview attempts</p>
              </div>
              <motion.button
                whileHover={{ x: 2 }}
                onClick={() => navigate('/interview')}
                className="btn-ghost text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
              >
                New Session <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
            </CardHeader>
            <div className="space-y-3 p-1">
              {stats?.recent_sessions?.length > 0 ? (
                stats.recent_sessions.map(sess => (
                  <motion.div
                    whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.02)' }}
                    key={sess.id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-surface-900/40 border border-white/[0.03] hover:border-indigo-500/10 transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(sess.status === 'completed' ? `/interview/${sess.id}/summary` : `/interview/${sess.id}`)}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm font-bold text-white truncate group-hover:text-indigo-400 transition-colors">{sess.role}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <DifficultyBadge difficulty={sess.difficulty} />
                        <span className="text-[11px] font-semibold text-slate-500">
                          {sess.answered}/{sess.total_questions} Questions Answered
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {sess.avg_score != null && <ScoreBadge score={sess.avg_score} />}
                      <StatusBadge status={sess.status} />
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-surface-900 border border-white/5 flex items-center justify-center mx-auto text-slate-600">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm font-semibold">No interview sessions found</p>
                    <p className="text-xs text-slate-600 mt-0.5">Start one to build your interview practice track record</p>
                  </div>
                  <Button size="sm" onClick={() => navigate('/interview')}>Start First Session</Button>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Suggested Focus Areas */}
      {stats?.skills_to_improve?.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border border-white/[0.04] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <CardHeader className="flex items-center justify-between pb-4">
              <div>
                <CardTitle>Recommended Study Topics</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Identified from weak skill matches and interview performance</p>
              </div>
              <motion.button
                whileHover={{ x: 2 }}
                onClick={() => navigate('/roadmap')}
                className="btn-ghost text-xs text-indigo-400 hover:text-indigo-300 font-bold"
              >
                Generate Detailed Roadmap &rarr;
              </motion.button>
            </CardHeader>
            <div className="flex flex-wrap gap-2.5 p-1">
              {stats.skills_to_improve.map(skill => (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  key={skill}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold shadow-[0_0_10px_rgba(245,158,11,0.05)] cursor-default"
                >
                  {skill}
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
