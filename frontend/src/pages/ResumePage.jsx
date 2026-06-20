import React, { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, CheckCircle, AlertTriangle, Target,
  Loader2, Briefcase, Star, TrendingUp, Sparkles, HelpCircle
} from 'lucide-react'
import { resumeApi } from '@/api/resume'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input, { Textarea } from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import ProgressBar from '@/components/ui/ProgressBar'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

function SkillTag({ skill, variant = 'gray' }) {
  const styles = {
    success: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]',
    danger: 'bg-rose-500/10 text-rose-300 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.05)]',
    gray: 'bg-surface-700/60 text-slate-300 border border-white/5',
  }
  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${styles[variant]}`}
    >
      {skill}
    </motion.span>
  )
}

function ATSResult({ result }) {
  if (!result) return null
  const { score, matched_skills, missing_skills, suggestions, summary } = result

  // Animated Count hook/effect simulation
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    let start = 0
    const end = Math.round(score)
    if (start === end) return setDisplayScore(end)

    const duration = 1200
    const stepTime = Math.abs(Math.floor(duration / end))
    
    const timer = setInterval(() => {
      start += 1
      setDisplayScore(start)
      if (start >= end) clearInterval(timer)
    }, stepTime)

    return () => clearInterval(timer)
  }, [score])

  const strokeColor = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#f43f5e'
  const glowShadow = score >= 75 
    ? 'drop-shadow(0 0 10px rgba(16,185,129,0.5))' 
    : score >= 50 
      ? 'drop-shadow(0 0 10px rgba(245,158,11,0.5))' 
      : 'drop-shadow(0 0 10px rgba(244,63,94,0.5))'

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Visual Circular Gauge */}
      <div className="glass p-8 text-center space-y-4 border border-white/[0.04] shadow-[0_12px_40px_rgba(0,0,0,0.4)] relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/0 to-transparent pointer-events-none" />
        
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">AI ATS Match Score</p>
        
        <div className="relative inline-flex items-center justify-center">
          <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
            {/* Background Circle */}
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
            
            {/* Foreground Gauge */}
            <motion.circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={strokeColor}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray="326"
              initial={{ strokeDashoffset: 326 }}
              animate={{ strokeDashoffset: 326 - (326 * (score / 100)) }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{ filter: glowShadow }}
            />
          </svg>
          <div className="absolute text-center">
            <p className="text-4xl font-extrabold text-white tracking-tighter">{displayScore}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">out of 100</p>
          </div>
        </div>

        <div className="max-w-md mx-auto space-y-2 relative z-10">
          <p className="text-slate-300 font-semibold text-sm leading-relaxed">{summary}</p>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="border border-white/[0.04]">
          <CardHeader className="pb-4 border-b border-white/[0.04]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-4.5 h-4.5" />
              </div>
              <CardTitle className="text-sm">Matched Skills ({matched_skills.length})</CardTitle>
            </div>
          </CardHeader>
          <div className="flex flex-wrap gap-2.5 mt-4">
            {matched_skills.map(s => <SkillTag key={s} skill={s} variant="success" />)}
            {matched_skills.length === 0 && (
              <p className="text-slate-500 text-sm py-2">No overlapping skills matching this target role.</p>
            )}
          </div>
        </Card>

        <Card className="border border-white/[0.04]">
          <CardHeader className="pb-4 border-b border-white/[0.04]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-4.5 h-4.5" />
              </div>
              <CardTitle className="text-sm">Missing Skills ({missing_skills.length})</CardTitle>
            </div>
          </CardHeader>
          <div className="flex flex-wrap gap-2.5 mt-4">
            {missing_skills.map(s => <SkillTag key={s} skill={s} variant="danger" />)}
            {missing_skills.length === 0 && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-sm font-semibold">
                <span>All core role skills found in your resume! 🎉</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* AI Recommendations */}
      {suggestions?.length > 0 && (
        <Card className="border border-white/[0.04]">
          <CardHeader className="pb-4 border-b border-white/[0.04]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 animate-pulse">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <CardTitle className="text-sm">Skill Gap Recommendations</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-3.5 mt-4">
            {suggestions.map((s, i) => {
              const priorityColors = {
                high: 'bg-red-500/10 text-red-300 border border-red-500/20',
                medium: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
                low: 'bg-slate-700/60 text-slate-300 border border-white/5'
              }
              return (
                <motion.div
                  whileHover={{ x: 4 }}
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-surface-900/40 border border-white/[0.03] hover:border-indigo-500/10 transition-all duration-300"
                >
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${priorityColors[s.priority || 'low']}`}>
                    {s.priority}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white leading-tight">{s.skill}</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{s.reason}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </Card>
      )}
    </motion.div>
  )
}

export default function ResumePage() {
  const [resumes, setResumes] = useState([])
  const [selected, setSelected] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [atsResult, setAtsResult] = useState(null)
  const [atsForm, setAtsForm] = useState({ role: '', jobDescription: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    resumeApi.list()
      .then(data => {
        setResumes(data)
        if (data.length) setSelected(data[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const onDrop = useCallback(async (files) => {
    const file = files[0]
    if (!file) return
    setUploading(true)
    try {
      const resume = await resumeApi.upload(file)
      setResumes(prev => [resume, ...prev])
      setSelected(resume)
      setAtsResult(null)
      toast.success('Resume uploaded and parsed successfully!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'application/pdf': ['.pdf'], 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] 
    },
    maxFiles: 1,
  })

  const handleATS = async () => {
    if (!selected) return toast.error('Select a resume first')
    if (!atsForm.role.trim()) return toast.error('Enter a target role')
    setScoring(true)
    setAtsResult(null)
    try {
      const result = await resumeApi.atsScore(selected.id, atsForm.role, atsForm.jobDescription)
      setAtsResult(result)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setScoring(false)
    }
  }

  if (loading) return <PageLoader text="Loading resume profile assets..." />

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Resume & <span className="gradient-text">ATS Analyser</span>
        </h1>
        <p className="text-slate-500 mt-1.5 font-medium">Extract skills and score compatibility against target job descriptions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Upload Zone & Resumes) */}
        <div className="space-y-5">
          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`border border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 relative group overflow-hidden
              ${isDragActive
                ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01] shadow-[0_0_20px_rgba(99,102,241,0.15)] animate-pulse-glow'
                : 'border-white/[0.08] bg-surface-900/30 hover:border-indigo-500/40 hover:bg-indigo-500/5'
              }`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="space-y-3 py-2">
                <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
                <div>
                  <p className="text-sm font-bold text-white">Analyzing Resume Document</p>
                  <p className="text-xs text-slate-500 mt-1">Extracting technical experience & skill nodes...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-2 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-surface-900 border border-white/5 flex items-center justify-center mx-auto text-slate-500 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300">
                  <Upload className="w-5.5 h-5.5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {isDragActive ? 'Drop the file here' : 'Upload Resume File'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1.5">Drag & drop PDF or DOCX file (Max 10MB)</p>
                </div>
              </div>
            )}
          </div>

          {/* List of Resumes */}
          {resumes.length > 0 && (
            <Card className="border border-white/[0.04]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Historical Resumes</CardTitle>
              </CardHeader>
              <div className="space-y-2 mt-2">
                {resumes.map(r => (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    key={r.id}
                    onClick={() => { setSelected(r); setAtsResult(null) }}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left
                      ${selected?.id === r.id
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                        : 'bg-surface-900/40 border-transparent hover:bg-surface-700/40 text-slate-300'
                      }`}
                  >
                    <FileText className={`w-4.5 h-4.5 flex-shrink-0 ${selected?.id === r.id ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <div className="overflow-hidden flex-1">
                      <p className="text-xs font-bold truncate leading-tight">{r.filename}</p>
                      {r.ats_score != null && (
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">ATS Score: {r.ats_score.toFixed(0)}/100</p>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column (Parsed view & ATS scorecard form) */}
        <div className="lg:col-span-2 space-y-6">
          {selected ? (
            <div className="space-y-6">
              {/* Parsed Skill Set */}
              <Card className="border border-white/[0.04] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                <CardHeader className="pb-4 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Target className="w-4.5 h-4.5" />
                    </div>
                    <CardTitle className="text-sm">Skills Extracted from Resume ({selected.parsed_skills?.length ?? 0})</CardTitle>
                  </div>
                </CardHeader>
                <div className="flex flex-wrap gap-2.5 mt-4">
                  {selected.parsed_skills?.length > 0 ? (
                    selected.parsed_skills.map(s => (
                      <span key={s} className="px-3 py-1 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-bold shadow-[0_0_10px_rgba(99,102,241,0.05)]">
                        {s}
                      </span>
                    ))
                  ) : (
                    <p className="text-slate-500 text-xs">No key skills identified in the document structure.</p>
                  )}
                </div>
              </Card>

              {/* ATS Form Checker */}
              <Card className="border border-white/[0.04] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                <CardHeader className="pb-4 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <TrendingUp className="w-4.5 h-4.5" />
                    </div>
                    <CardTitle className="text-sm">ATS Alignment Evaluator</CardTitle>
                  </div>
                </CardHeader>
                <div className="space-y-5 mt-4">
                  <Input
                    label="Target Professional Role"
                    placeholder="e.g. Full Stack Engineer, Data Scientist"
                    value={atsForm.role}
                    onChange={e => setAtsForm(p => ({ ...p, role: e.target.value }))}
                    icon={<Briefcase className="w-4 h-4 text-slate-500" />}
                  />
                  <Textarea
                    label="Target Job Description"
                    placeholder="Paste the details of the job listing here to check semantic skill matching and receive customized recommendation checklist items..."
                    rows={5}
                    value={atsForm.jobDescription}
                    onChange={e => setAtsForm(p => ({ ...p, jobDescription: e.target.value }))}
                  />
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button onClick={handleATS} loading={scoring} className="w-full">
                      {scoring ? 'Performing ATS Alignment Check...' : 'Evaluate Resume Match'}
                    </Button>
                  </motion.div>
                </div>
              </Card>

              {/* ATS Result Panel */}
              <AnimatePresence mode="wait">
                {atsResult && <ATSResult result={atsResult} />}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 glass border border-white/[0.04] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-surface-900 border border-white/5 flex items-center justify-center text-slate-600 mb-4">
                <FileText className="w-7 h-7" />
              </div>
              <p className="text-white font-bold text-base">No Resume Selected</p>
              <p className="text-slate-500 text-xs mt-1.5 max-w-xs">Upload your resume on the left panel or select an existing one to perform evaluation scans.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
