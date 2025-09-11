import React, { useEffect } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { useVoiceTranscription } from '../../hooks/useVoiceTranscription'
import { 
  Mic, 
  Square, 
  Loader2, 
  AlertCircle, 
  Clock,
  CheckCircle,
  Volume2,
  MicOff
} from 'lucide-react'

const VoiceRecording = ({ onTranscriptionReady, isVisible, onClose }) => {
  const {
    isRecording,
    isTranscribing,
    transcription,
    error,
    recordingTime,
    startRecording,
    stopRecording,
    clearError,
    clearTranscription,
    formatTime,
    isSupported
  } = useVoiceTranscription()

  // Auto-close when transcription is ready and delivered
  useEffect(() => {
    if (transcription && onTranscriptionReady) {
      onTranscriptionReady(transcription)
      // Small delay to show success state
      setTimeout(() => {
        clearTranscription()
        if (onClose) onClose()
      }, 1500)
    }
  }, [transcription, onTranscriptionReady, onClose, clearTranscription])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording()
      }
    }
  }, [isRecording, stopRecording])

  if (!isVisible) return null

  if (!isSupported()) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <MicOff className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700 font-medium">Voice Recording Not Supported</p>
              <p className="text-xs text-red-600 mt-1">
                Your browser doesn't support audio recording. Please use a modern browser like Chrome, Firefox, or Safari.
              </p>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="mt-2 text-red-600 hover:text-red-700"
              >
                Close
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-medium flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-green-600" />
              Voice to Text
            </h3>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </Button>
          </div>

          {/* Recording Status */}
          <div className="text-center space-y-3">
            {isRecording ? (
              <div className="space-y-3">
                <div className="relative">
                  <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                    <Mic className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                    <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-mono">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {formatTime(recordingTime)}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-green-700">Recording in progress...</p>
                <Button
                  onClick={stopRecording}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Recording
                </Button>
              </div>
            ) : isTranscribing ? (
              <div className="space-y-3">
                <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
                <p className="text-sm text-green-700">Processing your audio...</p>
              </div>
            ) : transcription ? (
              <div className="space-y-3">
                <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <p className="text-sm text-green-700 font-medium">Transcription Complete!</p>
                <div className="p-3 bg-white/70 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-800">{transcription}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-200 transition-colors">
                  <Mic className="h-8 w-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-green-700">Click to start recording</p>
                  <p className="text-xs text-green-600">
                    Speak clearly for best results. Recording will convert to text automatically.
                  </p>
                </div>
                <Button
                  onClick={startRecording}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-700 font-medium">Recording Error</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={clearError}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 h-auto p-1"
                  >
                    Dismiss
                  </Button>
                  <Button
                    onClick={startRecording}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 h-auto p-1"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          {!isRecording && !isTranscribing && !transcription && !error && (
            <div className="bg-green-100/50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-700 font-medium mb-1">💡 Tips for better results:</p>
              <ul className="text-xs text-green-600 space-y-0.5">
                <li>• Speak clearly and at normal pace</li>
                <li>• Use a quiet environment</li>
                <li>• Keep microphone close to your mouth</li>
                <li>• Pause briefly between sentences</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export { VoiceRecording }