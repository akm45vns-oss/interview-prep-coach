import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Brain, Sparkles, Cpu, ShieldCheck } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.name.trim())     errs.name = 'Name is required'
    if (!form.email)           errs.email = 'Email is required'
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const data = await authApi.register({ name: form.name, email: form.email, password: form.password })
      setAuth(data.access_token, data.user)
      toast.success(`Welcome, ${data.user.name}! Let's start prepping 🚀`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const change = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }))
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }))
  }

  return (
    <div className="min-h-screen flex bg-surface-950 overflow-hidden relative">
      {/* Background Decorative Haze */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[150px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[150px]" />

      {/* Left Panel - Hero Section */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-surface-950 via-surface-900 to-indigo-950/20 p-16 relative border-r border-white/[0.03]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.01)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <Brain className="w-5.5 h-5.5 text-white" />
          </div>
          <span className="text-lg font-black text-white tracking-wider uppercase">Interview Coach</span>
        </div>

        <div className="relative z-10 space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-black text-white mb-6 leading-tight tracking-tight">
              Create your account<br />
              <span className="gradient-text">start prep today</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-lg font-medium">
              Join thousands of candidates using our AI-driven environment to practice, improve, and secure engineering offers.
            </p>
          </motion.div>

          <div className="space-y-5">
            {[
              { icon: Sparkles, color: 'text-indigo-400', text: 'Tailored Mock Questions in Real-Time' },
              { icon: Cpu, color: 'text-purple-400', text: 'Detailed Skill-Matcher & Resume Insights' },
              { icon: ShieldCheck, color: 'text-pink-400', text: 'Custom 5-Phase AI Development Roadmaps' },
            ].map(({ icon: Icon, color, text }, i) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
                key={text}
                className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] backdrop-blur-sm"
              >
                <div className={`w-8 h-8 rounded-xl bg-surface-900/60 border border-white/5 flex items-center justify-center ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-slate-300 font-semibold text-sm">{text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-slate-600 text-xs font-semibold uppercase tracking-widest">
          Powered by Groq LLaMA 3.1 & scikit-learn
        </p>
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4 lg:hidden">
              <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                <Brain className="w-7 h-7 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Get started</h2>
            <p className="text-slate-500 mt-2 text-sm font-semibold">Join today to optimize your mock performance</p>
          </div>

          <div className="glass p-8 space-y-5 border border-white/[0.05] shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="reg-name"
                label="Full Name"
                type="text"
                placeholder="Jane Smith"
                icon={<User className="w-4 h-4 text-slate-500" />}
                value={form.name}
                onChange={change('name')}
                error={errors.name}
              />
              <Input
                id="reg-email"
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                icon={<Mail className="w-4 h-4 text-slate-500" />}
                value={form.email}
                onChange={change('email')}
                error={errors.email}
              />
              <Input
                id="reg-password"
                label="Password"
                type="password"
                placeholder="Min 6 characters"
                icon={<Lock className="w-4 h-4 text-slate-500" />}
                value={form.password}
                onChange={change('password')}
                error={errors.password}
              />
              <Input
                id="reg-confirm"
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                icon={<Lock className="w-4 h-4 text-slate-500" />}
                value={form.confirm}
                onChange={change('confirm')}
                error={errors.confirm}
              />
              <Button type="submit" loading={loading} className="w-full mt-4" size="lg">
                Create Account
              </Button>
            </form>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-white/[0.06]"></div>
              <span className="flex-shrink mx-4 text-slate-600 text-xs font-bold uppercase tracking-wider">Already registered?</span>
              <div className="flex-grow border-t border-white/[0.06]"></div>
            </div>

            <p className="text-center text-sm text-slate-500 font-semibold">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
