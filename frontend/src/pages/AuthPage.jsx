import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'
import { Mic } from 'lucide-react'

export default function AuthPage() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/onboarding" replace />
  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh p-4">
      <AuthModal />
    </div>
  )
}
