import { useState, useCallback, useRef } from 'react'
import { useAuth } from './useAuth'

export const useVoiceTranscription = () => {
  const { authenticatedFetch, API_URL } = useAuth()
  
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [error, setError] = useState(null)
  const [recordingTime, setRecordingTime] = useState(0)
  
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearTranscription = useCallback(() => {
    setTranscription('')
  }, [])

  const startTimer = useCallback(() => {
    setRecordingTime(0)
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1)
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setTranscription('')
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        } 
      })
      
      streamRef.current = stream
      chunksRef.current = []

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        stopTimer()
        setIsRecording(false)
        
        // Create audio blob
        const audioBlob = new Blob(chunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        })
        
        // Transcribe audio
        await transcribeAudio(audioBlob)
      }

      // Start recording
      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      startTimer()
      
    } catch (err) {
      console.error('Error starting recording:', err)
      setError('Failed to start recording. Please check microphone permissions.')
      setIsRecording(false)
      stopTimer()
    }
  }, [startTimer, stopTimer])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop()
        })
        streamRef.current = null
      }
    }
  }, [isRecording])

  const transcribeAudio = useCallback(async (audioBlob) => {
    try {
      setIsTranscribing(true)
      setError(null)

      // Create FormData
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      // Send to transcription API
      const response = await authenticatedFetch(`${API_URL}/api/speech/transcribe`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.transcription) {
          setTranscription(data.transcription)
          return data.transcription
        } else {
          throw new Error(data.error || 'No transcription received')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Transcription failed')
      }
    } catch (err) {
      console.error('Transcription error:', err)
      setError(err.message || 'Failed to transcribe audio')
      return null
    } finally {
      setIsTranscribing(false)
    }
  }, [authenticatedFetch, API_URL])

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Check if browser supports audio recording
  const isSupported = useCallback(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder)
  }, [])

  // Cleanup function
  const cleanup = useCallback(() => {
    if (isRecording) {
      stopRecording()
    }
    stopTimer()
    setRecordingTime(0)
    setTranscription('')
    setError(null)
  }, [isRecording, stopRecording, stopTimer])

  return {
    // State
    isRecording,
    isTranscribing,
    transcription,
    error,
    recordingTime,
    
    // Actions
    startRecording,
    stopRecording,
    transcribeAudio,
    clearError,
    clearTranscription,
    cleanup,
    
    // Utilities
    formatTime,
    isSupported
  }
}