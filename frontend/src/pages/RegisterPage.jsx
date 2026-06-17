import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Brain } from 'lucide-react'
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
    <div className="min-h-screen flex items-center justify-center bg-surface-950 p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-brand-lg animate-glow">
              <Brain className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-500 mt-1 text-sm">Start your AI-powered interview journey</p>
        </div>

        <div className="glass p-8 space-y-5 animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="reg-name"
              label="Full name"
              type="text"
              placeholder="Jane Smith"
              icon={<User className="w-4 h-4" />}
              value={form.name}
              onChange={change('name')}
              error={errors.name}
            />
            <Input
              id="reg-email"
              label="Email address"
              type="email"
              placeholder="you@example.com"
              icon={<Mail className="w-4 h-4" />}
              value={form.email}
              onChange={change('email')}
              error={errors.email}
            />
            <Input
              id="reg-password"
              label="Password"
              type="password"
              placeholder="Min 6 characters"
              icon={<Lock className="w-4 h-4" />}
              value={form.password}
              onChange={change('password')}
              error={errors.password}
            />
            <Input
              id="reg-confirm"
              label="Confirm password"
              type="password"
              placeholder="Same as above"
              icon={<Lock className="w-4 h-4" />}
              value={form.confirm}
              onChange={change('confirm')}
              error={errors.confirm}
            />
            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
