import React from 'react'
import { useAuth } from '../context/AuthContext'
import { Settings, User, Bell, Shield, LogOut, ExternalLink } from 'lucide-react'

export default function SettingsPage() {
  const { user, signOut, getUserDisplayName, getUserAvatar, isMockAuth } = useAuth()

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Settings size={22} className="text-brand-400" /> Settings
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage your account and preferences</p>
        </div>

        {/* Profile */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <User size={15} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-white">Profile</h3>
          </div>
          <div className="flex items-center gap-4">
            {getUserAvatar() ? (
              <img src={getUserAvatar()} alt="" className="w-14 h-14 rounded-2xl border border-white/10" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
                <span className="text-xl font-bold text-brand-300">{getUserDisplayName().charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div>
              <p className="font-semibold text-white">{getUserDisplayName()}</p>
              <p className="text-sm text-slate-400">{user?.email}</p>
              {isMockAuth && (
                <span className="inline-block mt-1 text-xs text-accent-amber bg-accent-amber/10 border border-accent-amber/20 px-2 py-0.5 rounded-full">
                  Demo Mode
                </span>
              )}
            </div>
          </div>
        </div>

        {/* App info */}
        <div className="glass-card p-6 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={15} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-white">About</h3>
          </div>
          <div className="space-y-2">
            {[
              ['AI Engine', 'Claude (Anthropic)'],
              ['Auth', 'Supabase Google OAuth'],
              ['Database', 'PostgreSQL via Supabase'],
              ['Version', '1.0.0'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                <span className="text-sm text-slate-400">{k}</span>
                <span className="text-sm text-slate-200 font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications placeholder */}
        <div className="glass-card p-6 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Bell size={15} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-white">Preferences</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Practice Reminders</p>
              <p className="text-xs text-slate-500">Daily email nudges</p>
            </div>
            <div className="w-10 h-5 bg-dark-500 rounded-full border border-white/10 relative cursor-not-allowed opacity-50">
              <div className="w-4 h-4 bg-slate-600 rounded-full absolute top-0.5 left-0.5" />
            </div>
          </div>
          <p className="text-xs text-slate-600">Email preferences coming soon</p>
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="btn-danger w-full justify-center py-3"
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </div>
  )
}
