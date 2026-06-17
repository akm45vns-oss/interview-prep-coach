import React, { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Upload, FileText, CheckCircle, AlertTriangle, Target,
  Loader2, Briefcase, ChevronDown, Star, TrendingUp, X
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
  return <span className={`badge badge-${variant} text-xs`}>{skill}</span>
}

function ATSResult({ result }) {
  if (!result) return null
  const { score, matched_skills, missing_skills, suggestions, summary } = result

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Score */}
      <div className="glass p-6 text-center space-y-3">
        <p className="text-slate-400 text-sm">ATS Score</p>
        <div className="relative inline-flex items-center justify-center">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="50" fill="none"
              stroke={score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 314} 314`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute text-center">
            <p className="text-3xl font-bold text-white">{score.toFixed(0)}</p>
            <p className="text-xs text-slate-500">/ 100</p>
          </div>
        </div>
        <p className="text-slate-400 text-sm max-w-md mx-auto">{summary}</p>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <CardTitle>Matched Skills ({matched_skills.length})</CardTitle>
            </div>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            {matched_skills.map(s => <SkillTag key={s} skill={s} variant="success" />)}
            {matched_skills.length === 0 && <p className="text-slate-500 text-sm">No matches found</p>}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <CardTitle>Missing Skills ({missing_skills.length})</CardTitle>
            </div>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            {missing_skills.map(s => <SkillTag key={s} skill={s} variant="danger" />)}
            {missing_skills.length === 0 && <p className="text-emerald-400 text-sm">All required skills present! 🎉</p>}
          </div>
        </Card>
      </div>

      {/* Suggestions */}
      {suggestions?.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-brand-400" />
              <CardTitle>AI Suggestions</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-3">
            {suggestions.map((s, i) => {
              const priorityColor = s.priority === 'high' ? 'danger' : s.priority === 'medium' ? 'warning' : 'gray'
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-surface-700/40">
                  <Badge variant={priorityColor} className="mt-0.5 flex-shrink-0">{s.priority}</Badge>
                  <div>
                    <p className="text-sm font-medium text-white">{s.skill}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.reason}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
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
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
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

  if (loading) return <PageLoader text="Loading resumes..." />

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Resume & <span className="gradient-text">ATS Analysis</span></h1>
        <p className="text-slate-500 mt-1">Upload your resume and get AI-powered ATS scoring</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-5">
          {/* Upload Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
              ${isDragActive
                ? 'border-brand-500 bg-brand-500/10 scale-[1.01]'
                : 'border-white/10 hover:border-brand-500/50 hover:bg-brand-500/5'
              }`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="space-y-2">
                <Loader2 className="w-10 h-10 text-brand-400 animate-spin mx-auto" />
                <p className="text-sm text-brand-300">Uploading & parsing...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className={`w-10 h-10 mx-auto transition-colors ${isDragActive ? 'text-brand-400' : 'text-slate-600'}`} />
                <div>
                  <p className="text-sm font-medium text-white">
                    {isDragActive ? 'Drop it here!' : 'Upload Resume'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">PDF or DOCX · Max 10MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Resume List */}
          {resumes.length > 0 && (
            <Card>
              <CardTitle className="mb-3">Your Resumes</CardTitle>
              <div className="space-y-2">
                {resumes.map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setSelected(r); setAtsResult(null) }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left
                      ${selected?.id === r.id
                        ? 'bg-brand-500/15 border border-brand-500/30'
                        : 'bg-surface-700/40 hover:bg-surface-700/60'
                      }`}
                  >
                    <FileText className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-white truncate">{r.filename}</p>
                      {r.ats_score != null && (
                        <p className="text-xs text-slate-500">ATS: {r.ats_score.toFixed(0)}/100</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {selected ? (
            <>
              {/* Parsed Skills */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-brand-400" />
                    <CardTitle>Parsed Skills ({selected.parsed_skills?.length ?? 0})</CardTitle>
                  </div>
                </CardHeader>
                {selected.parsed_skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selected.parsed_skills.map(s => (
                      <span key={s} className="badge-brand">{s}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No skills parsed yet</p>
                )}
              </Card>

              {/* ATS Score Form */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-brand-400" />
                    <CardTitle>ATS Score Check</CardTitle>
                  </div>
                </CardHeader>
                <div className="space-y-4">
                  <Input
                    label="Target Role"
                    placeholder="e.g. Machine Learning Engineer"
                    value={atsForm.role}
                    onChange={e => setAtsForm(p => ({ ...p, role: e.target.value }))}
                    icon={<Briefcase className="w-4 h-4" />}
                  />
                  <Textarea
                    label="Job Description (optional)"
                    placeholder="Paste the job description for more accurate scoring..."
                    rows={4}
                    value={atsForm.jobDescription}
                    onChange={e => setAtsForm(p => ({ ...p, jobDescription: e.target.value }))}
                  />
                  <Button onClick={handleATS} loading={scoring} className="w-full">
                    {scoring ? 'Analyzing...' : 'Analyze ATS Score'}
                  </Button>
                </div>
              </Card>

              {/* ATS Result */}
              {atsResult && <ATSResult result={atsResult} />}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 glass rounded-2xl">
              <FileText className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-500">Upload a resume to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
