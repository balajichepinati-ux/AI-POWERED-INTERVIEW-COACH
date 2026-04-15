import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { Mic, BarChart2, FileText, Target, ArrowRight, Shield, Brain, Zap, Github, Linkedin, Mail, MessageSquare, Waves, Play } from 'lucide-react'
import AuthModal from '../components/AuthModal'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  { icon: Brain, color: 'text-brand-400 border-brand-500/30', glow: 'shadow-glow-sm', glowColor: '#06b6d4', title: 'AI-Powered Scoring', desc: 'Claude AI scores clarity, structure, confidence, and relevance — instantly.', image: '/feature_ai_scoring.png' },
  { icon: Waves, color: 'text-accent-violet border-accent-violet/30', glow: 'shadow-glow-purple', glowColor: '#a78bfa', title: 'Voice & Emotion', desc: 'Speak naturally. Real-time wave transcription captures every nuance.', image: '/feature_voice_emotion.png' },
  { icon: FileText, color: 'text-accent-cyan border-accent-cyan/30', glow: 'shadow-glow-cyan', glowColor: '#3b82f6', title: 'Resume Intelligence', desc: 'Upload your resume. Get questions tailored to your exact background.', image: '/feature_resume.png' },
  { icon: BarChart2, color: 'text-accent-green border-accent-green/30', glow: 'shadow-[0_0_15px_rgba(52,211,153,0.3)]', glowColor: '#10b981', title: '3D Analytics', desc: 'Futuristic glowing graphs and animated charts track your progress over time.', image: '/feature_analytics.png' },
  { icon: Target, color: 'text-accent-amber border-accent-amber/30', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]', glowColor: '#f59e0b', title: 'Live Feedback', desc: 'Glassmorphism score cards reveal real-time performance insights.', image: '/feature_live_feedback.png' },
  { icon: Zap, color: 'text-rose-400 border-rose-400/30', glow: 'shadow-[0_0_15px_rgba(248,113,113,0.3)]', glowColor: '#ef4444', title: 'Instant Rewrites', desc: 'Floating panels generate perfect STAR method replies for you.', image: '/feature_rewrites.png' },
]

// Glowing Particle Effect Component
const Particles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-brand-400/50 blur-[1px]"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: Math.random() * 0.5 + 0.2
          }}
          animate={{
            y: [null, Math.random() * -200 - 100],
            x: [null, Math.random() * 100 - 50],
            opacity: [null, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  )
}

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const { scrollYProgress } = useScroll()

  // Parallax transformations
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const featureY = useTransform(scrollYProgress, [0, 0.5], ['50px', '0px'])

  return (
    <div className="min-h-screen bg-dark-900 overflow-hidden font-sans">
      <Particles />

      {/* HERO SECTION */}
      <motion.section 
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative pt-32 pb-32 min-h-screen flex flex-col justify-center items-center overflow-hidden perspective-[1000px]"
      >
        <div className="absolute inset-0 bg-mesh pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-hero-glow rounded-full blur-[120px] pointer-events-none animate-pulse-ring" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-hero-glow-purple rounded-full blur-[100px] pointer-events-none mix-blend-screen opacity-60" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center transform-style-3d">
          {/* Floating Avatar / Interface Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mb-12 relative mx-auto w-48 h-48 sm:w-64 sm:h-64 aspect-square rounded-full border border-brand-500/30 p-2 shadow-glow"
          >
            <div className="absolute inset-0 rounded-full border border-accent-violet/20 animate-[spin_10s_linear_infinite]" />
            <div className="absolute inset-2 rounded-full border border-brand-400/20 animate-[spin_15s_linear_infinite_reverse]" />
            <div className="w-full h-full rounded-full bg-dark-800/80 backdrop-blur-md flex items-center justify-center overflow-hidden relative">
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }} 
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-radial from-brand-500/20 to-transparent" 
              />
              <Mic size={64} className="text-brand-400 drop-shadow-[0_0_15px_rgba(79,157,255,0.8)]" />
              {/* Audio Waveform mock */}
              <div className="absolute bottom-6 flex gap-1 items-end h-8">
                {[...Array(9)].map((_, i) => (
                  <motion.div 
                    key={i}
                    className="w-1.5 bg-accent-violet rounded-t-full shadow-[0_0_8px_rgba(138,92,255,0.8)]"
                    animate={{ height: ['20%', '100%', '20%'] }}
                    transition={{
                      duration: 0.8 + Math.random() * 0.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 glass-card border border-brand-500/30 shadow-glow-sm rounded-full text-brand-300 text-xs font-medium mb-8"
          >
            <Zap size={14} className="text-accent-amber drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            <span className="shimmer-text font-bold tracking-wide">AI-Powered Next Gen Coaching</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-5xl sm:text-7xl lg:text-8xl font-bold text-white leading-[1.05] tracking-tight mb-8 drop-shadow-2xl"
          >
            Master the Interview.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-accent-violet to-accent-cyan animate-pulse-ring block mt-2">
              Get Hired Faster.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            A highly immersive 3D AI assistant that analyzes your every word, tone, and pause. Upload your resume and experience the most realistic mock interview ever.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            {isAuthenticated ? (
              <Link to="/practice" className="group relative px-8 py-4 bg-brand-500 rounded-xl font-bold text-white overflow-hidden shadow-glow hover:shadow-glow-purple transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 flex items-center gap-2">
                  <Play size={18} className="fill-white" />
                  Launch Interview Panel
                </span>
              </Link>
            ) : (
              <button 
                onClick={() => setShowAuth(true)}
                className="group relative px-8 py-4 bg-brand-500 hover:bg-brand-400 rounded-xl font-bold text-white overflow-hidden shadow-[0_0_30px_rgba(79,157,255,0.6)] hover:shadow-[0_0_50px_rgba(138,92,255,0.8)] transition-all duration-300 hover:-translate-y-1 block border border-brand-400/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400 via-accent-violet to-brand-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_auto] animate-shimmer" />
                <span className="relative z-10 flex items-center gap-2 text-lg">
                  <span className="relative flex h-3 w-3 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                  Start Mock Interview
                </span>
              </button>
            )}
            <Link to="/auth" className="px-8 py-4 rounded-xl font-semibold text-slate-300 glass-card border border-white/10 hover:border-white/30 hover:text-white transition-all duration-300 hover:-translate-y-1 flex items-center gap-2">
              <Shield size={18} /> Enable Demo Mode
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* FEATURES SECTION */}
      <section className="py-32 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 drop-shadow-md">Futuristic Feature Set</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">Deep depth-based layout housing next-generation AI scoring and live analysis metrics.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 perspective-[1200px]">
            {FEATURES.map((feat, index) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 50, rotateX: 15 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.03, rotateY: 3, rotateX: -3, z: 40 }}
                className={`glass-card group relative overflow-hidden transition-all duration-300 ${feat.glow} hover:border-brand-500/50`}
                style={{ transformStyle: 'preserve-3d', padding: 0 }}
              >
                {/* Feature Image */}
                <div style={{ position: 'relative', width: '100%', height: '180px', overflow: 'hidden', flexShrink: 0 }}>
                  <img
                    src={feat.image}
                    alt={feat.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      display: 'block',
                      transition: 'transform 0.5s ease',
                    }}
                    className="group-hover:scale-110"
                  />
                  {/* Gradient fade to card body */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70px', background: 'linear-gradient(to bottom, transparent 0%, rgba(15,23,42,0.95) 100%)', pointerEvents: 'none' }} />
                  {/* Colour tint */}
                  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${feat.glowColor}25 0%, transparent 60%)`, pointerEvents: 'none' }} />
                </div>

                {/* Card Body */}
                <div style={{ padding: '20px 24px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `${feat.glowColor}18`,
                      border: `1.5px solid ${feat.glowColor}60`,
                      boxShadow: `0 0 10px ${feat.glowColor}30`,
                      transition: 'transform 0.3s ease',
                    }}>
                      <feat.icon size={20} style={{ color: feat.glowColor, filter: `drop-shadow(0 0 5px ${feat.glowColor}90)` }} />
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', margin: 0, letterSpacing: '-0.3px' }}>{feat.title}</h3>
                  </div>
                  <p style={{ color: 'rgba(148,163,184,0.85)', fontSize: '13px', lineHeight: '1.65', margin: 0 }}>{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION (NEW) */}
      <section className="py-32 relative bg-dark-800/30 overflow-hidden border-y border-white/[0.02]">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-violet/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl font-bold text-white mb-4">The Process</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-brand-500 to-accent-violet mx-auto rounded-full shadow-glow-purple" />
          </motion.div>

          {/* Stepper */}
          <div className="flex flex-col md:flex-row items-center justify-between relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-dark-600 -translate-y-1/2 z-0">
              <motion.div 
                className="h-full bg-gradient-to-r from-brand-500 via-accent-violet to-accent-cyan shadow-[0_0_10px_rgba(138,92,255,0.8)]"
                initial={{ width: "0%" }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
              />
            </div>

            {[
              { step: '01', title: 'Speak Naturally', icon: Mic, delay: 0 },
              { step: '02', title: 'AI Analyzes', icon: Brain, delay: 0.5 },
              { step: '03', title: 'Actionable Feedback', icon: Target, delay: 1 }
            ].map((item, i) => (
              <motion.div 
                key={item.step}
                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: item.delay }}
                className="relative z-10 flex flex-col items-center mb-12 md:mb-0 group"
              >
                <div className="w-24 h-24 rounded-full glass-card border border-brand-500/30 shadow-glow flex items-center justify-center mb-6 relative overflow-hidden group-hover:border-accent-violet/50 transition-colors duration-300">
                  <div className="absolute inset-0 bg-brand-500/10 group-hover:bg-accent-violet/20 transition-colors duration-300" />
                  <item.icon size={36} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] z-10" />
                </div>
                <div className="text-center glass-card px-6 py-3 rounded-xl border border-white/5 group-hover:border-white/10">
                  <span className="text-brand-400 font-mono text-sm font-bold block mb-1">STEP {item.step}</span>
                  <h4 className="text-lg font-semibold text-white">{item.title}</h4>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-32 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="glass-card p-12 sm:p-20 relative overflow-hidden shadow-glow-purple border-accent-violet/30"
          >
            <div className="absolute inset-0 bg-hero-glow-purple opacity-20 pointer-events-none animate-pulse-ring" />
            <motion.div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-1 bg-gradient-to-r from-transparent via-brand-400 to-transparent"
              animate={{ x: ['-100%', '0%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            
            <Shield size={48} className="text-brand-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(79,157,255,0.8)]" />
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">Ready for your dream job?</h2>
            <p className="text-slate-400 mb-10 text-lg max-w-xl mx-auto">Experience the most advanced 3D AI interview assistant. Fast. Immersive. Completely free to start.</p>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
              <button 
                onClick={() => setShowAuth(true)} 
                className="relative px-10 py-5 bg-dark-900 border border-brand-400 text-white font-bold rounded-2xl text-lg overflow-hidden group shadow-[0_0_30px_rgba(79,157,255,0.5)] hover:shadow-[0_0_60px_rgba(138,92,255,0.8)] transition-all duration-300"
              >
                <div className="absolute inset-0 bg-brand-500/20 group-hover:bg-accent-violet/20 transition-colors duration-300" />
                <span className="relative z-10 flex items-center gap-3">
                  <Play size={20} className="fill-brand-400 group-hover:fill-accent-violet transition-colors" /> 
                  Initiate System
                </span>
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative border-t border-white/[0.05] bg-dark-800/50 backdrop-blur-lg pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div className="flex items-center gap-3 mb-6 md:mb-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-violet flex items-center justify-center shadow-glow-sm">
                <Brain size={24} className="text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">MockMate</span>
            </div>
            
            <div className="flex gap-6">
              {[Github, Linkedin, Mail].map((Icon, i) => (
                <motion.a 
                  key={i}
                  href="#"
                  whileHover={{ y: -3, color: '#4F9DFF' }}
                  className="text-slate-500 hover:text-brand-400 transition-colors"
                >
                  <Icon size={24} />
                </motion.a>
              ))}
            </div>
          </div>
          
          <div className="text-center text-slate-600 text-sm border-t border-white/[0.05] pt-8 space-y-3">
            <p className="flex items-center justify-center gap-2">
              © 2026 MockMate <span className="w-1 h-1 rounded-full bg-slate-600" /> High-Performance AI Assistant <span className="w-1 h-1 rounded-full bg-slate-600" /> 3D Web Engine
            </p>
            <p className="text-slate-500 text-xs">
              Proudly Built by Students of<br/>
              <span className="text-brand-400 font-semibold">SRM Institute of Technology, Kattankulathur</span>
            </p>
            <p className="text-slate-500 text-xs">
              Project Guide: <span className="text-accent-violet font-semibold">Dr. Maheshwari A</span>
            </p>
          </div>
        </div>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
