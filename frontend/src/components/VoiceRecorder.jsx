import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, MicOff, Square, Volume2 } from 'lucide-react'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export default function VoiceRecorder({ onTranscript, onError }) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimText, setInterimText] = useState('')
  const [supported, setSupported] = useState(!!SpeechRecognition)
  const [volume, setVolume] = useState(0)
  const recognitionRef = useRef(null)
  const analyserRef = useRef(null)
  const animFrameRef = useRef(null)
  const streamRef = useRef(null)

  // Volume visualizer
  const startVolumeDetection = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((a, b) => a + b, 0) / data.length
        setVolume(Math.min(100, avg * 2))
        animFrameRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch {}
  }, [])

  const stopVolumeDetection = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setVolume(0)
  }, [])

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      onError?.('Speech recognition is not supported in your browser. Please use Chrome.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      startVolumeDetection()
    }

    recognition.onresult = (event) => {
      let final = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript
        if (event.results[i].isFinal) final += text + ' '
        else interim = text
      }
      setTranscript(prev => {
        const updated = prev + final
        if (final) onTranscript?.(updated.trim())
        return updated
      })
      setInterimText(interim)
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') return
      if (event.error === 'not-allowed') {
        onError?.('Microphone access denied. Please allow microphone access in your browser settings.')
      } else {
        onError?.(`Speech recognition error: ${event.error}`)
      }
      stopListening()
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimText('')
      stopVolumeDetection()
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [startVolumeDetection, stopVolumeDetection, onTranscript, onError])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
    setInterimText('')
    stopVolumeDetection()
  }, [stopVolumeDetection])

  const clearTranscript = () => {
    setTranscript('')
    setInterimText('')
    onTranscript?.('')
  }

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      stopVolumeDetection()
    }
  }, [stopVolumeDetection])

  if (!supported) {
    return (
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
        <div className="flex items-center gap-2 text-amber-400">
          <MicOff size={16} />
          <span className="text-sm font-medium">Voice input not supported</span>
        </div>
        <p className="text-xs text-amber-400/70 mt-1">
          Please use Google Chrome for voice input, or type your answer below.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center gap-3">
        {!isListening ? (
          <button
            onClick={startListening}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-medium px-4 py-2.5 rounded-xl transition-all"
          >
            <Mic size={16} />
            <span className="text-sm">Start Recording</span>
          </button>
        ) : (
          <button
            onClick={stopListening}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium px-4 py-2.5 rounded-xl transition-all recording-pulse"
          >
            <Square size={14} fill="white" />
            <span className="text-sm">Stop</span>
          </button>
        )}

        {transcript && !isListening && (
          <button onClick={clearTranscript} className="text-xs text-slate-500 hover:text-rose-400 transition-colors">
            Clear
          </button>
        )}

        {/* Volume bars */}
        {isListening && (
          <div className="flex items-center gap-0.5 h-6">
            {[...Array(12)].map((_, i) => {
              const barHeight = Math.max(4, (volume / 100) * 24 * (0.4 + Math.sin(i * 0.8) * 0.6))
              return (
                <div
                  key={i}
                  className="w-1 bg-brand-400 rounded-full transition-all duration-75"
                  style={{ height: `${barHeight}px`, opacity: 0.6 + (volume / 100) * 0.4 }}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Transcript display */}
      {(transcript || interimText) && (
        <div className="p-3 bg-dark-600/40 border border-white/[0.06] rounded-xl text-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <Volume2 size={12} className="text-brand-400" />
            <span className="text-xs text-slate-500 font-medium">Transcript</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {transcript}
            {interimText && <span className="text-slate-500 italic">{interimText}</span>}
          </p>
        </div>
      )}

      {isListening && (
        <p className="text-xs text-slate-500 flex items-center gap-1.5 animate-pulse">
          <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
          Listening... speak clearly into your microphone
        </p>
      )}
    </div>
  )
}
