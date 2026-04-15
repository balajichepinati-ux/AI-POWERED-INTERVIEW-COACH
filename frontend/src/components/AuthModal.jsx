import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Mic, X, User, Zap, Mail, Lock, Chrome } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AuthModal({ onClose }) {
  const { mockSignIn } = useAuth()
  const [authMode, setAuthMode] = useState('email') // 'email' or 'demo'
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mockName, setMockName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter an email address')
      return
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address')
      return
    }

    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    // Simulate auth call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    mockSignIn(email.split('@')[0], email)
    onClose?.()
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setError('')
    // Simulate Google auth
    await new Promise(resolve => setTimeout(resolve, 1500))
    mockSignIn('Google User', 'user@gmail.com')
    onClose?.()
  }

  const handleDemoAuth = () => {
    if (!mockName.trim()) {
      setError('Please enter a name to continue')
      return
    }
    mockSignIn(mockName.trim(), `${mockName.toLowerCase().replace(/\s+/g, '.')}@demo.ai`)
    onClose?.()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 perspective-[1000px]">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-dark-900/80 backdrop-blur-xl" 
          onClick={onClose} 
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent-violet/10 rounded-full blur-[80px] pointer-events-none mix-blend-screen" />

        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, y: 50, rotateX: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
          className="relative glass-card w-full max-w-md p-10 border-brand-500/30 shadow-glow-purple"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {onClose && (
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          )}

          {/* Logo */}
          <div className="text-center mb-10">
            <motion.div 
              animate={{ boxShadow: ['0 0 15px rgba(79,157,255,0.4)', '0 0 30px rgba(138,92,255,0.6)', '0 0 15px rgba(79,157,255,0.4)'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-600/20 to-accent-violet/20 rounded-2xl mb-6 border border-brand-400/30"
            >
              <Mic size={32} className="text-brand-400 drop-shadow-[0_0_10px_rgba(79,157,255,0.8)]" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white tracking-tight">System Init</h2>
            <p className="text-slate-400 text-sm mt-2">Enter credentials to authenticate.</p>
          </div>

          {/* Auth Mode Tabs */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => { setAuthMode('email'); setError('') }}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                authMode === 'email'
                  ? 'bg-brand-500/20 border border-brand-400/60 text-brand-300'
                  : 'bg-dark-600/30 border border-white/10 text-slate-400 hover:text-slate-300'
              }`}
            >
              <Mail size={14} className="inline mr-1" /> Email
            </button>
            <button
              onClick={() => { setAuthMode('demo'); setError('') }}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                authMode === 'demo'
                  ? 'bg-accent-violet/20 border border-accent-violet/60 text-accent-violet'
                  : 'bg-dark-600/30 border border-white/10 text-slate-400 hover:text-slate-300'
              }`}
            >
              Demo
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm shadow-[0_0_15px_rgba(248,113,113,0.3)]"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6 relative z-10">
            {authMode === 'email' ? (
              <>
                {/* Email Form */}
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-brand-300 uppercase tracking-widest mb-2 block">Email Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail size={16} className="text-slate-500 group-focus-within:text-brand-400 transition-colors" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={e => {
                          setEmail(e.target.value)
                          setError('')
                        }}
                        placeholder="you@example.com"
                        className="w-full bg-dark-600/50 border border-white/10 rounded-xl pl-11 pr-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/60 focus:bg-dark-600/80 focus:shadow-glow-sm transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-brand-300 uppercase tracking-widest mb-2 block">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock size={16} className="text-slate-500 group-focus-within:text-brand-400 transition-colors" />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={e => {
                          setPassword(e.target.value)
                          setError('')
                        }}
                        placeholder="••••••••"
                        className="w-full bg-dark-600/50 border border-white/10 rounded-xl pl-11 pr-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/60 focus:bg-dark-600/80 focus:shadow-glow-sm transition-all duration-300"
                      />
                    </div>
                  </div>

                  {isSignUp && (
                    <div>
                      <label className="text-xs font-semibold text-brand-300 uppercase tracking-widest mb-2 block">Confirm Password</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock size={16} className="text-slate-500 group-focus-within:text-brand-400 transition-colors" />
                        </div>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={e => {
                            setConfirmPassword(e.target.value)
                            setError('')
                          }}
                          placeholder="••••••••"
                          className="w-full bg-dark-600/50 border border-white/10 rounded-xl pl-11 pr-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/60 focus:bg-dark-600/80 focus:shadow-glow-sm transition-all duration-300"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full py-4 bg-brand-500 hover:bg-brand-400 disabled:bg-dark-600 disabled:border-white/10 border border-brand-400 font-bold text-white rounded-xl overflow-hidden group shadow-[0_0_20px_rgba(79,157,255,0.4)] hover:shadow-[0_0_40px_rgba(138,92,255,0.6)] disabled:shadow-none transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    <div className="relative z-10 flex items-center justify-center gap-2">
                      <Zap size={18} className={`${loading ? 'animate-spin' : 'fill-white text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'}`} />
                      {loading ? 'INITIALIZING...' : isSignUp ? 'SIGN UP' : 'LOGIN'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp)
                      setError('')
                      setConfirmPassword('')
                    }}
                    className="w-full py-2 text-sm text-slate-400 hover:text-brand-300 transition-colors"
                  >
                    {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                  </button>
                </form>

                {/* Google Auth */}
                <div className="pt-4 border-t border-white/[0.05]">
                  <button
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full py-3 bg-dark-600/50 hover:bg-dark-600/80 border border-white/10 hover:border-accent-cyan/40 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <Chrome size={18} className="text-accent-cyan" />
                    <span>Continue with Google</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Demo Mode */}
                <div>
                  <label className="text-xs font-semibold text-accent-violet uppercase tracking-widest mb-2 block">Agent Designation</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User size={16} className="text-slate-500 group-focus-within:text-accent-violet transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={mockName}
                      onChange={e => {
                        setMockName(e.target.value)
                        setError('')
                      }}
                      onKeyDown={e => e.key === 'Enter' && handleDemoAuth()}
                      placeholder="Subject Name"
                      className="w-full bg-dark-600/50 border border-white/10 rounded-xl pl-11 pr-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-accent-violet/60 focus:bg-dark-600/80 focus:shadow-glow-sm transition-all duration-300"
                      autoFocus
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleDemoAuth}
                  disabled={!mockName.trim() || loading}
                  className="relative w-full py-4 bg-accent-violet hover:bg-accent-violet/90 disabled:bg-dark-600 disabled:border-white/10 border border-accent-violet/60 font-bold text-white rounded-xl overflow-hidden group shadow-[0_0_20px_rgba(167,139,250,0.4)] hover:shadow-[0_0_40px_rgba(167,139,250,0.6)] disabled:shadow-none transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    <Zap size={18} className={`${loading ? 'animate-spin' : 'fill-white text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'}`} />
                    {loading ? 'INITIALIZING...' : 'INITIALIZE'}
                  </div>
                </button>

                <div className="pt-4 border-t border-white/[0.05]">
                  <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 bg-accent-green rounded-full shadow-[0_0_5px_rgba(52,211,153,0.8)] inline-block mr-1"></span>
                    Secure offline demo mode enabled.
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
