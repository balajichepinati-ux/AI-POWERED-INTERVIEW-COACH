import React, { useState } from 'react'
import { Zap, Mic, FileText, BarChart3, Sparkles, RefreshCw } from 'lucide-react'

const FeatureCard = ({ icon: Icon, title, description, glowColor, delay, image, index }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      style={{
        animation: `fadeInUp 0.6s ease-out ${delay}s both`,
        position: 'relative',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Outer glow ring */}
      <div
        style={{
          position: 'absolute',
          inset: '-2px',
          borderRadius: '22px',
          background: `linear-gradient(135deg, ${glowColor}80 0%, transparent 60%, ${glowColor}40 100%)`,
          opacity: isHovered ? 1 : 0.3,
          transition: 'opacity 0.4s ease',
          zIndex: 0,
        }}
      />

      {/* Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          background: 'rgba(10, 14, 39, 0.85)',
          borderRadius: '20px',
          overflow: 'hidden',
          border: `1px solid ${glowColor}40`,
          backdropFilter: 'blur(20px)',
          transform: isHovered ? 'translateY(-10px) scale(1.02)' : 'translateY(0) scale(1)',
          transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
          boxShadow: isHovered
            ? `0 30px 70px ${glowColor}30, 0 0 0 1px ${glowColor}50`
            : `0 4px 20px rgba(0,0,0,0.5)`,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* Feature Image */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '200px',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <img
            src={image}
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              transform: isHovered ? 'scale(1.08)' : 'scale(1)',
              transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
              display: 'block',
            }}
          />
          {/* Gradient fade from image to card body */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '80px',
              background: `linear-gradient(to bottom, transparent 0%, rgba(10, 14, 39, 0.85) 100%)`,
              pointerEvents: 'none',
            }}
          />
          {/* Colour tint overlay on hover */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(135deg, ${glowColor}20 0%, transparent 60%)`,
              opacity: isHovered ? 1 : 0.3,
              transition: 'opacity 0.4s ease',
              pointerEvents: 'none',
            }}
          />
          {/* Feature number badge */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: `${glowColor}30`,
              border: `1px solid ${glowColor}80`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '800',
              color: glowColor,
              backdropFilter: 'blur(8px)',
              fontFamily: 'monospace',
              boxShadow: `0 0 12px ${glowColor}60`,
            }}
          >
            {String(index + 1).padStart(2, '0')}
          </div>
        </div>

        {/* Card Body */}
        <div
          style={{
            padding: '24px 28px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            flex: 1,
          }}
        >
          {/* Icon + Title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: `${glowColor}15`,
                border: `1.5px solid ${glowColor}60`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0)',
                transition: 'transform 0.4s ease',
                boxShadow: isHovered ? `0 0 18px ${glowColor}70` : `0 0 8px ${glowColor}30`,
              }}
            >
              <Icon
                size={24}
                style={{
                  color: glowColor,
                  filter: `drop-shadow(0 0 6px ${glowColor}90)`,
                }}
              />
            </div>
            <h3
              style={{
                fontSize: '17px',
                fontWeight: '700',
                color: '#f1f5f9',
                margin: 0,
                letterSpacing: '-0.3px',
                lineHeight: 1.2,
              }}
            >
              {title}
            </h3>
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: '14px',
              color: 'rgba(148, 163, 184, 0.85)',
              margin: 0,
              lineHeight: '1.65',
              flex: 1,
            }}
          >
            {description}
          </p>

          {/* Bottom action strip */}
          <div
            style={{
              paddingTop: '16px',
              borderTop: `1px solid ${glowColor}25`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                color: glowColor,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                opacity: isHovered ? 1 : 0.6,
                transition: 'opacity 0.3s ease',
              }}
            >
              Explore Feature
            </span>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: `${glowColor}15`,
                border: `1px solid ${glowColor}50`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: glowColor,
                fontSize: '14px',
                transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                transition: 'transform 0.3s ease',
              }}
            >
              →
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FeaturesPage() {
  const features = [
    {
      icon: Zap,
      title: 'AI-Powered Scoring',
      description: 'Claude AI scores clarity, structure, confidence, and relevance — instantly. Every answer gets a detailed multi-dimensional score.',
      glowColor: '#06b6d4',
      image: '/feature_ai_scoring.png',
    },
    {
      icon: Mic,
      title: 'Voice & Emotion',
      description: 'Speak naturally. Real-time wave transcription captures every nuance. Emotion detection analyzes tone, pace, and energy in your voice.',
      glowColor: '#a78bfa',
      image: '/feature_voice_emotion.png',
    },
    {
      icon: FileText,
      title: 'Resume Intelligence',
      description: 'Upload your resume. Get questions tailored to your exact background. Our AI maps your skills to real interview scenarios.',
      glowColor: '#3b82f6',
      image: '/feature_resume.png',
    },
    {
      icon: BarChart3,
      title: '3D Analytics',
      description: 'Futuristic glowing graphs and animated charts track your progress over time. Visualize your improvement across every session.',
      glowColor: '#10b981',
      image: '/feature_analytics.png',
    },
    {
      icon: Sparkles,
      title: 'Live Feedback',
      description: 'Glassmorphism score cards reveal real-time performance insights. See exactly where you excelled and where to improve.',
      glowColor: '#f59e0b',
      image: '/feature_live_feedback.png',
    },
    {
      icon: RefreshCw,
      title: 'Instant Rewrites',
      description: 'Floating panels generate perfect STAR method replies for you. Turn weak answers into compelling, structured responses instantly.',
      glowColor: '#ef4444',
      image: '/feature_rewrites.png',
    },
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0d1b2a 100%)',
        padding: '90px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes gradientShift {
          0%   { background-position: 0% 50%;   }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%;   }
        }
        .features-gradient-text {
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 40%, #a78bfa 80%, #06b6d4 100%);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 5s ease infinite;
        }
      `}</style>

      {/* Background blobs */}
      <div style={{ position: 'absolute', top: '-120px', right: '-120px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-80px', left: '5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />

      {/* Content */}
      <div style={{ maxWidth: '1300px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '72px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '20px',
              background: 'rgba(6,182,212,0.1)',
              border: '1px solid rgba(6,182,212,0.3)',
              marginBottom: '20px',
            }}
          >
            <span style={{ fontSize: '11px', color: '#06b6d4', fontFamily: 'monospace', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>
              ✦ Next-Gen AI Platform
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: '800',
              margin: '0 0 20px 0',
              letterSpacing: '-1.5px',
              color: '#f1f5f9',
              lineHeight: 1.1,
            }}
          >
            Powerful <span className="features-gradient-text">Features</span> for{' '}
            <span className="features-gradient-text">Success</span>
          </h1>

          <p
            style={{
              fontSize: '17px',
              color: 'rgba(148, 163, 184, 0.85)',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.8',
            }}
          >
            Deep depth-based layout housing next-generation AI scoring and live analysis metrics. Experience the future of interview preparation.
          </p>

          {/* Decorative divider */}
          <div
            style={{
              width: '80px',
              height: '4px',
              borderRadius: '2px',
              background: 'linear-gradient(90deg, #06b6d4, #3b82f6, #a78bfa)',
              margin: '28px auto 0',
              boxShadow: '0 0 12px rgba(6,182,212,0.6)',
            }}
          />
        </div>

        {/* Features Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
            gap: '28px',
          }}
        >
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              index={index}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* CTA Banner */}
        <div
          style={{
            marginTop: '80px',
            padding: '48px 40px',
            borderRadius: '24px',
            background: 'rgba(10, 14, 39, 0.7)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            backdropFilter: 'blur(20px)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 0 80px rgba(99,102,241,0.1)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)',
              pointerEvents: 'none',
            }}
          />
          <h2
            style={{
              fontSize: '30px',
              fontWeight: '800',
              color: '#f1f5f9',
              margin: '0 0 12px 0',
              letterSpacing: '-0.5px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            Ready to Transform Your Interviews?
          </h2>
          <p
            style={{
              fontSize: '16px',
              color: 'rgba(148, 163, 184, 0.8)',
              margin: '0 0 28px 0',
              position: 'relative',
              zIndex: 1,
            }}
          >
            Start practicing with MockMate and unlock your full potential.
          </p>
          <button
            style={{
              padding: '14px 40px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              border: 'none',
              borderRadius: '14px',
              color: 'white',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: '0 6px 20px rgba(6,182,212,0.4)',
              position: 'relative',
              zIndex: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.boxShadow = '0 12px 35px rgba(6,182,212,0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(6,182,212,0.4)'
            }}
          >
            Get Started Free →
          </button>
        </div>
      </div>
    </div>
  )
}
