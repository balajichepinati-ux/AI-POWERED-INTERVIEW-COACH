import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Mic, LayoutDashboard, History, Settings,
  LogOut, ChevronDown, Menu, X, Zap
} from 'lucide-react'

export default function Navbar() {
  const { user, signOut, getUserDisplayName, getUserAvatar, isAuthenticated } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()

  const navItems = [
    { to: '/practice', icon: Mic, label: 'Practice' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/history', icon: History, label: 'History' },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setProfileOpen(false)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b border-white/[0.06]" style={{ background: 'rgba(6,6,16,0.85)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-brand-600/20 rounded-lg border border-brand-500/30 flex items-center justify-center group-hover:bg-brand-600/30 transition-colors">
              <Mic size={16} className="text-brand-400" />
            </div>
            <span className="font-semibold text-white text-lg tracking-tight">
              Mock<span className="text-gradient">Mate</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-brand-400 bg-brand-500/10 border border-brand-500/20 px-1.5 py-0.5 rounded-full">AI</span>
          </NavLink>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {/* Authenticated-only nav items */}
            {isAuthenticated && navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <NavLink to="/practice" className="hidden sm:flex btn-primary text-sm py-2 px-4">
                  <Zap size={14} />
                  Practice Now
                </NavLink>

                {/* Profile */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 bg-dark-600/60 border border-white/[0.08] hover:border-white/[0.15] rounded-xl px-3 py-1.5 transition-all"
                  >
                    {getUserAvatar() ? (
                      <img src={getUserAvatar()} alt="" className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-brand-600/30 border border-brand-500/30 flex items-center justify-center">
                        <span className="text-xs font-medium text-brand-300">
                          {getUserDisplayName().charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-sm text-slate-300 hidden sm:block max-w-[120px] truncate">{getUserDisplayName()}</span>
                    <ChevronDown size={14} className="text-slate-500" />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 glass-card py-1 z-50 animate-fade-in">
                      <div className="px-4 py-2.5 border-b border-white/[0.06]">
                        <p className="text-sm font-medium text-white truncate">{getUserDisplayName()}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      </div>
                      <NavLink to="/settings" onClick={() => setProfileOpen(false)} className="nav-link mx-1 my-0.5">
                        <Settings size={14} /> Settings
                      </NavLink>
                      <button onClick={handleSignOut} className="nav-link w-full text-left mx-1 my-0.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile menu toggle */}
                <button
                  className="md:hidden text-slate-400 hover:text-white transition-colors"
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </>
            ) : (
              <>
                <NavLink to="/auth" className="btn-primary text-sm py-2 px-4">
                  Get Started
                </NavLink>
                <button
                  className="md:hidden text-slate-400 hover:text-white transition-colors"
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/[0.06] py-3 space-y-1 animate-fade-in">
            {isAuthenticated && (
              <>
                {navItems.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={15} />
                    {label}
                  </NavLink>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
