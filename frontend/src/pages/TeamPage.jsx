import React, { useState } from 'react'
import { Users, Github, Linkedin, Mail } from 'lucide-react'

const TeamMember = ({ name, role, initials, color, delay, image, bio, links }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setMousePos({ x: x * 20, y: y * 20 })
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setMousePos({ x: 0, y: 0 })
  }

  return (
    <div
      className="perspective group"
      style={{
        animation: `fadeInUp 0.6s ease-out ${delay}s both`,
        transformStyle: 'preserve-3d'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <div
        style={{
          transform: isHovered 
            ? `perspective(1200px) rotateY(${mousePos.x}deg) rotateX(${-mousePos.y}deg) translateZ(30px) scale(1.05)` 
            : 'perspective(1200px) rotateY(0deg) rotateX(0deg) translateZ(0px) scale(1)',
          transition: isHovered ? 'none' : 'transform 0.4s cubic-bezier(0.23, 1, 0.320, 1)',
          transformStyle: 'preserve-3d'
        }}
        className="glass-card relative rounded-2xl cursor-pointer overflow-hidden"
      >
        {/* Animated Border Glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${color}40 0%, ${color}10 100%)`,
            opacity: isHovered ? 1 : 0.3,
            transition: 'opacity 0.4s ease-out',
            pointerEvents: 'none',
            zIndex: 1,
            border: `2px solid ${color}60`
          }}
        />

        {/* Background Glow Orb */}
        <div
          style={{
            position: 'absolute',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
            filter: 'blur(50px)',
            animation: `float 4s ease-in-out infinite`,
            opacity: isHovered ? 1 : 0.4,
            transition: 'opacity 0.4s ease-out',
            pointerEvents: 'none',
            top: '-50px',
            right: '-50px',
            zIndex: 0
          }}
        />

        {/* Card Content */}
        <div style={{ position: 'relative', zIndex: 2, padding: '40px 32px' }}>
          {/* Avatar Section */}
          <div
            style={{
              width: '120px',
              height: '120px',
              margin: '0 auto 24px',
              perspective: '1000px',
              position: 'relative'
            }}
          >
            {/* Avatar Circle with Image/Gradient */}
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: !image ? `linear-gradient(135deg, ${color}40 0%, ${color}60 100%)` : 'transparent',
                border: `4px solid ${color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                fontWeight: 'bold',
                color: color,
                boxShadow: `0 0 50px ${color}80, inset 0 -4px 8px rgba(0,0,0,0.5), 0 20px 50px rgba(0,0,0,0.4)`,
                transform: isHovered ? 'scale(1.2) translateZ(40px)' : 'scale(1) translateZ(0)',
                transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
                backdropFilter: 'blur(8px)',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {image ? (
                <>
                  <img
                    src={image}
                    alt={name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '50%',
                      display: 'block'
                    }}
                  />
                  {/* Colour tint overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(135deg, ${color}20 0%, ${color}05 100%)`,
                      borderRadius: '50%',
                      pointerEvents: 'none'
                    }}
                  />
                </>
              ) : (
                initials
              )}
            </div>
            
            {/* 3D Shadow Ring */}
            <div
              style={{
                position: 'absolute',
                width: '130%',
                height: '130%',
                borderRadius: '50%',
                border: `3px solid ${color}50`,
                top: '-15%',
                left: '-15%',
                transform: isHovered ? 'scale(1.4) rotateX(60deg)' : 'scale(1) rotateX(0deg)',
                transition: isHovered ? 'transform 0.15s ease-out' : 'transform 0.4s ease-out',
                pointerEvents: 'none',
                boxShadow: `inset 0 0 30px ${color}30`
              }}
            />
          </div>

          {/* Name & Role */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h3 
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#f1f5f9',
                margin: '0 0 8px 0',
                textTransform: 'capitalize',
                letterSpacing: '-0.5px'
              }}
            >
              {name}
            </h3>
            <p
              style={{
                color: color,
                fontFamily: 'monospace',
                fontSize: '13px',
                letterSpacing: '2px',
                margin: 0,
                textTransform: 'uppercase',
                fontWeight: '600',
                textShadow: `0 0 12px ${color}50`
              }}
            >
              {role}
            </p>
          </div>

          {/* Bio */}
          {bio && (
            <p
              style={{
                fontSize: '13px',
                color: 'rgba(148, 163, 184, 0.8)',
                textAlign: 'center',
                margin: '0 0 16px 0',
                lineHeight: '1.5'
              }}
            >
              {bio}
            </p>
          )}

          {/* Social Links */}
          {links && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
                marginTop: '16px'
              }}
            >
              {links.github && (
                <a
                  href={links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: `${color}20`,
                    border: `1px solid ${color}50`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = `${color}40`
                    e.target.style.boxShadow = `0 0 12px ${color}80`
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = `${color}20`
                    e.target.style.boxShadow = 'none'
                  }}
                >
                  <Github size={18} />
                </a>
              )}
              {links.linkedin && (
                <a
                  href={links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: `${color}20`,
                    border: `1px solid ${color}50`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = `${color}40`
                    e.target.style.boxShadow = `0 0 12px ${color}80`
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = `${color}20`
                    e.target.style.boxShadow = 'none'
                  }}
                >
                  <Linkedin size={18} />
                </a>
              )}
              {links.email && (
                <a
                  href={`mailto:${links.email}`}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: `${color}20`,
                    border: `1px solid ${color}50`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = `${color}40`
                    e.target.style.boxShadow = `0 0 12px ${color}80`
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = `${color}20`
                    e.target.style.boxShadow = 'none'
                  }}
                >
                  <Mail size={18} />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Hover effect glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '16px',
            background: `radial-gradient(circle at 30% 30%, ${color}30, transparent 80%)`,
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.4s ease-out',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />

        {/* Shine Effect */}
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: `linear-gradient(135deg, transparent 0%, ${color}20 50%, transparent 100%)`,
            transform: isHovered ? 'rotate(45deg) translateX(50px)' : 'rotate(45deg) translateX(-120px)',
            transition: 'transform 0.7s cubic-bezier(0.23, 1, 0.320, 1)',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
      </div>
    </div>
  )
}

export default function TeamPage() {
  const teamMembers = [
    {
      name: 'Chepinati Balaji',
      role: 'Lead Frontend Developer',
      initials: 'CB',
      color: '#10B981',
      image: '/team_balaji.png',
      bio: 'Full-stack developer passionate about building intuitive UIs and scalable systems.',
      links: {
        github: 'https://github.com/balajichepinati-ux',
        linkedin: 'https://www.linkedin.com/in/chepinati-balaji-790b72332?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app',
        email: 'cc2083@srmist.edu.in'
      }
    },
    {
      name: 'Rupesh Prakash',
      role: 'Database Developer',
      initials: 'RP',
      color: '#3B82F6',
      image: '/team_rupesh.png',
      bio: 'Database architect specializing in optimization and scalable data solutions.',
      links: {
        github: 'https://github.com/rupeshprakash2509-dev',
        linkedin: 'https://www.linkedin.com/in/rupesh-prakash-15b6583b3?utm_source=share_via&utm_content=profile&utm_medium=member_android',
        email: 'rj4629@srmist.edu.in'
      }
    },
    {
      name: 'Shaik Zakeer Ahmed',
      role: 'Backend Developer',
      initials: 'Z',
      color: '#A78BFA',
      image: '/team_zakeer.png',
      bio: 'Backend engineer building robust APIs and intelligent systems with AI integration.',
      links: {
        github: 'https://github.com/zackyshaik',
        linkedin: 'https://www.linkedin.com/in/shaik-zakeer-ahmed-763482271/',
        email: 'zs2231@srmist.edu.in'
      }
    }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0d1b2a 100%)',
      padding: '100px 20px 80px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px) translateZ(0);
          }
          to {
            opacity: 1;
            transform: translateY(0) translateZ(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        @keyframes gradientFlow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes underlineGlow {
          0%, 100% {
            box-shadow: 0 0 8px rgba(16, 185, 129, 0.6), 0 2px 0 currentColor;
          }
          50% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.9), 0 2px 0 currentColor;
          }
        }

        .perspective {
          perspective: 1000px;
        }

        .glass-card {
          backdrop-filter: blur(12px);
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(148, 163, 184, 0.15);
          position: relative;
        }

        .team-title {
          background: linear-gradient(135deg, #10B981 0%, #3B82F6 35%, #A78BFA 70%, #10B981 100%);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientFlow 6s ease infinite;
        }

        .underline-glow {
          position: relative;
          display: inline-block;
          height: 4px;
          background: linear-gradient(90deg, #10B981, #3B82F6, #A78BFA, #10B981);
          background-size: 300% 100%;
          border-radius: 2px;
          animation: underlineGlow 3s ease infinite;
        }
      `}</style>

      {/* Background Blobs */}
      <div style={{
        position: 'fixed',
        top: '-100px',
        right: '-100px',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%)',
        filter: 'blur(100px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'fixed',
        bottom: '-100px',
        left: '5%',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
        filter: 'blur(100px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Particle Elements */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '2px',
              height: '2px',
              background: `rgba(${6 + Math.random() * 50}, ${182 + Math.random() * 50}, 212, 0.6)`,
              borderRadius: '50%',
              animation: `float ${15 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              boxShadow: `0 0 10px rgba(6, 182, 212, 0.5)`
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(59, 130, 246, 0.3))',
              border: '1px solid rgba(6, 182, 212, 0.5)'
            }}>
              <Users size={20} style={{ color: '#06b6d4' }} />
            </div>
            <h1 style={{
              fontSize: '56px',
              fontWeight: '800',
              margin: 0,
              letterSpacing: '-1.5px',
              color: '#f1f5f9'
            }}>
              Meet the <span className="team-title">Team</span>
            </h1>
          </div>
          <div style={{
            height: '6px',
            width: '80px',
            margin: '20px auto 32px',
            borderRadius: '3px'
          }} className="underline-glow" />
          <p style={{
            fontSize: '18px',
            color: 'rgba(148, 163, 184, 0.9)',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: '1.8'
          }}>
            Meet the exceptional developers behind MockMate, committed to revolutionizing interview preparation through cutting-edge AI and innovative technology.
          </p>
        </div>

        {/* Team Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px',
          maxWidth: '1100px',
          margin: '0 auto 80px'
        }}>
          {teamMembers.map((member, index) => (
            <TeamMember
              key={member.initials}
              {...member}
              delay={index * 0.15}
            />
          ))}
        </div>

        {/* Divider */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.3), transparent)',
          margin: '60px 0'
        }} />

        {/* Institution Footer */}
        <div style={{ textAlign: 'center', paddingTop: '40px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '32px',
            borderRadius: '16px',
            background: 'rgba(99, 102, 241, 0.05)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4, #10B981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)'
            }}>
              🎓
            </div>
            <div>
              <p style={{
                fontSize: '14px',
                color: 'rgba(148, 163, 184, 0.9)',
                margin: 0,
                fontWeight: '500'
              }}>
                Proudly Built by Students of
              </p>
              <p style={{
                fontSize: '16px',
                color: '#06b6d4',
                margin: '4px 0 0 0',
                fontWeight: '700',
                letterSpacing: '0.5px'
              }}>
                SRM Institute of Technology, Kattankulathur
              </p>
              <p style={{
                fontSize: '13px',
                color: 'rgba(167, 139, 250, 0.9)',
                margin: '12px 0 0 0',
                fontWeight: '600',
                letterSpacing: '0.3px'
              }}>
                Project Guide: <span style={{ color: '#a78bfa' }}>Dr. Maheshwari A</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
