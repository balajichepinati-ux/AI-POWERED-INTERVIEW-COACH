import React, { useState, useRef, useEffect } from 'react'
import { Mic, Play, Zap, Check, AlertCircle, Radio } from 'lucide-react'
import '../styles/system-init.css'

export default function SystemInitPage() {
  const [step, setStep] = useState(1) // 1: Name, 2: Role, 3: Confirm
  const [agentName, setAgentName] = useState('')
  const [agentRole, setAgentRole] = useState('interviewer')
  const [isListening, setIsListening] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState('demo') // demo or live
  const [status, setStatus] = useState('ready') // ready, initializing, online, error
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const roles = [
    { id: 'interviewer', label: 'Interviewer Mode', icon: '🎤' },
    { id: 'coach', label: 'Interview Coach', icon: '🎯' },
    { id: 'analyzer', label: 'Response Analyzer', icon: '📊' },
  ]

  // Parallax tilt effect on mouse move
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return
      
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      const rotateX = ((y - rect.height / 2) / rect.height) * 10
      const rotateY = ((x - rect.width / 2) / rect.width) * -10
      
      setMousePos({ x: rotateX, y: rotateY })
      
      if (containerRef.current) {
        containerRef.current.style.transform = `
          perspective(1200px)
          rotateX(${rotateX}deg)
          rotateY(${rotateY}deg)
          translateZ(20px)
        `
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus()
  }, [step])

  const startVoiceInput = () => {
    setIsListening(!isListening)
    // Simulate voice input detection
    if (!isListening) {
      setTimeout(() => {
        setAgentName('Sample Agent')
        setIsListening(false)
      }, 2000)
    }
  }

  const handleInitialize = async () => {
    setIsLoading(true)
    setStatus('initializing')
    
    // Simulate initialization
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setStatus('online')
    setIsLoading(false)
    
    // Redirect after success
    setTimeout(() => {
      window.location.href = '/dashboard'
    }, 1500)
  }

  const canProceed = step === 1 ? agentName.trim().length > 0 : true

  return (
    <div className="system-init-container">
      {/* Animated Background */}
      <div className="background-elements">
        <div className="gradient-blob blob-1"></div>
        <div className="gradient-blob blob-2"></div>
        <div className="gradient-blob blob-3"></div>
        <div className="particle-field"></div>
      </div>

      {/* Particle Elements */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{
            '--delay': `${i * 0.15}s`,
            '--duration': `${10 + Math.random() * 15}s`,
            '--x': `${Math.random() * 100}%`,
            '--y': `${Math.random() * 100}%`,
          }}></div>
        ))}
      </div>

      {/* Main Content */}
      <div className="init-content" ref={containerRef}>
        {/* Floating Microphone Icon */}
        <div className="floating-icon-wrapper">
          <div className="floating-icon">
            <Mic size={48} className="icon-glow" />
          </div>
        </div>

        {/* Glass Card */}
        <div className="glass-card init-card">
          {/* Glow effect */}
          <div className="card-glow"></div>

          {/* Header */}
          <div className="init-header">
            <h1 className="init-title">System Init</h1>
            <p className="init-subtitle">Enter credentials to authenticate.</p>
          </div>

          {/* Mode Toggle */}
          <div className="mode-toggle">
            <button
              className={`mode-btn ${mode === 'demo' ? 'active' : ''}`}
              onClick={() => setMode('demo')}
            >
              <span className="mode-dot"></span> Demo Mode
            </button>
            <button
              className={`mode-btn ${mode === 'live' ? 'active' : ''}`}
              onClick={() => setMode('live')}
            >
              <span className="mode-dot"></span> Live Mode
            </button>
          </div>

          {/* Status Indicator */}
          <div className="status-bar">
            <div className={`status-indicator status-${status}`}>
              <Radio size={10} />
            </div>
            <span className="status-text">
              {status === 'ready' && '🟢 System Ready'}
              {status === 'initializing' && '🟡 Initializing...'}
              {status === 'online' && '🟢 System Online'}
              {status === 'error' && '🔴 Error'}
            </span>
          </div>

          {/* Steps */}
          <div className="steps-indicator">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`step-dot ${step >= s ? 'active' : ''} ${step === s ? 'current' : ''}`}
              ></div>
            ))}
          </div>

          {/* Step 1: Agent Name */}
          {step === 1 && (
            <div className="init-step fade-in">
              <label className="input-label">AGENT DESIGNATION</label>
              <div className="input-wrapper">
                <Mic size={16} className="input-icon" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Subject Name"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="init-input"
                  onKeyPress={(e) => e.key === 'Enter' && canProceed && setStep(2)}
                />
                <button
                  className={`voice-btn ${isListening ? 'listening' : ''}`}
                  onClick={startVoiceInput}
                  title="Voice Input"
                >
                  <Mic size={14} />
                </button>
              </div>

              {/* Voice Wave Animation */}
              {isListening && (
                <div className="voice-wave">
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                </div>
              )}

              <button
                className={`init-btn ${canProceed ? '' : 'disabled'}`}
                onClick={() => canProceed && setStep(2)}
                disabled={!canProceed}
              >
                <Zap size={16} />
                NEXT
              </button>
            </div>
          )}

          {/* Step 2: Agent Role */}
          {step === 2 && (
            <div className="init-step fade-in">
              <label className="input-label">AGENT ROLE SELECTION</label>
              <div className="role-grid">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    className={`role-card ${agentRole === role.id ? 'selected' : ''}`}
                    onClick={() => setAgentRole(role.id)}
                  >
                    <div className="role-icon">{role.icon}</div>
                    <div className="role-label">{role.label}</div>
                    {agentRole === role.id && (
                      <div className="role-check">
                        <Check size={16} />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="step-buttons">
                <button className="init-btn secondary" onClick={() => setStep(1)}>
                  BACK
                </button>
                <button className="init-btn" onClick={() => setStep(3)}>
                  <Zap size={16} />
                  CONFIRM
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="init-step fade-in">
              <div className="confirmation-box">
                <h3 className="confirm-title">Confirm Initialization</h3>
                <div className="confirm-details">
                  <div className="detail-row">
                    <span className="detail-label">Agent Name:</span>
                    <span className="detail-value">{agentName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Role:</span>
                    <span className="detail-value">
                      {roles.find(r => r.id === agentRole)?.label}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Mode:</span>
                    <span className="detail-value">{mode === 'demo' ? 'Demo' : 'Live'}</span>
                  </div>
                </div>
              </div>

              {/* Loading Animation */}
              {isLoading && (
                <div className="loading-container">
                  <div className="energy-loader">
                    <div className="loader-ring"></div>
                    <div className="loader-ring"></div>
                    <div className="loader-ring"></div>
                  </div>
                  <p className="loading-text">Booting system...</p>
                  <div className="progress-bar">
                    <div className="progress-fill"></div>
                  </div>
                </div>
              )}

              <div className="step-buttons">
                <button
                  className="init-btn secondary"
                  onClick={() => setStep(2)}
                  disabled={isLoading}
                >
                  BACK
                </button>
                <button
                  className={`init-btn ${isLoading ? 'loading' : ''}`}
                  onClick={handleInitialize}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="btn-loader"></div>
                      INITIALIZING...
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      INITIALIZE
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="init-footer">
            <span className={`status-indicator status-${mode}`}>
              ●
            </span>
            <span className="footer-text">
              {mode === 'demo'
                ? 'Secure offline demo mode enabled.'
                : 'Live mode - connected to production.'}
            </span>
          </div>
        </div>

        {/* Ambient Glow Accents */}
        <div className="glow-accent accent-1"></div>
        <div className="glow-accent accent-2"></div>
        <div className="glow-accent accent-3"></div>
      </div>
    </div>
  )
}
