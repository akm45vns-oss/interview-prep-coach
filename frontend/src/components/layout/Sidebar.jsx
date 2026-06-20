import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, FileText, MessageSquare, Map, LogOut, Brain, ChevronRight
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/resume',    icon: FileText,        label: 'Resume & ATS' },
  { to: '/interview', icon: MessageSquare,   label: 'Mock Interview' },
  { to: '/roadmap',   icon: Map,             label: 'Learning Roadmap' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <aside className="w-64 min-h-screen flex flex-col bg-surface-950/80 backdrop-blur-xl border-r border-white/[0.04] relative">
      {/* Brand Logo */}
      <div className="px-6 py-6 border-b border-white/[0.04]">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.35)] relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
            <Brain className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-white tracking-wide">Interview Coach</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">AI Companion</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        <p className="px-4 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">
          Dashboard Menu
        </p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className="block select-none">
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.02)' }}
                whileTap={{ scale: 0.98 }}
                className={isActive ? 'nav-link-active' : 'nav-link'}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="activeTabGlow"
                    className="absolute left-0 w-1 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_12px_#6366f1]"
                  />
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400 opacity-80" />}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Profile & Footer */}
      <div className="px-4 py-5 border-t border-white/[0.04] space-y-3.5">
        {user && (
          <div className="p-3 rounded-2xl bg-surface-900/60 border border-white/[0.03] shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center text-white text-xs font-black shadow-[0_0_15px_rgba(99,102,241,0.25)]">
                {user.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-bold text-white truncate leading-snug">{user.name}</p>
                <p className="text-[10px] text-slate-500 truncate leading-snug">{user.email}</p>
              </div>
            </div>
          </div>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="nav-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/15"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </motion.button>
      </div>
    </aside>
  )
}
