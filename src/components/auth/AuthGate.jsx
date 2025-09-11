import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { AlertCircle, User, Mail, Check, ArrowLeft, ArrowRight, Loader2, ExternalLink, HelpCircle } from 'lucide-react'

const AuthGate = ({ children }) => {
  const { isAuthenticated, isLoading, sendMagicLink, verifyMagicLink, sendVerificationCode, verifyVerificationCode, user } = useAuth()
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [errorType, setErrorType] = useState('')

  const handleSendVerificationCode = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email address')
      setErrorType('')
      return
    }

    setIsSubmitting(true)
    setError('')
    setErrorType('')
    
    try {
      await sendVerificationCode(email)
      setEmailSent(true)
    } catch (err) {
      // Check for specific error types from backend
      if (err.message.includes('new_user_signup_required')) {
        setErrorType('new_user')
        setError('Please sign up first to create your account, then return to the extension.')
      } else if (err.message.includes('email_send_failed')) {
        setErrorType('email_failed')
        setError('We\'re having trouble sending emails right now. Please try again in a few minutes.')
      } else {
        setErrorType('general')
        setError(err.message || 'Failed to send verification code. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyCode = async (e) => {
    e.preventDefault()
    if (!verificationCode.trim()) {
      setError('Please enter the verification code')
      return
    }

    setIsSubmitting(true)
    setError('')
    
    try {
      await verifyVerificationCode(email, verificationCode)
      // Success - useAuth will handle state update
    } catch (err) {
      setError(err.message || 'Invalid verification code. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackToEmail = () => {
    setEmailSent(false)
    setVerificationCode('')
    setError('')
    setErrorType('')
  }

  const handleSignUpRedirect = () => {
    chrome.tabs.create({ url: 'https://ligo.ertiqah.com/auth' })
  }

  const handleContactSupport = () => {
    chrome.tabs.create({ url: 'https://ligo.ertiqah.com/contact' })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-secondary-400 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background gradient element */}
        <div className="absolute top-0 left-0 right-0 bottom-0 opacity-5 bg-gradient-radial from-white via-transparent to-transparent z-0" />

        {/* Decorative illustration elements */}
        <div className="absolute top-[10%] right-[-10%] opacity-15 transform rotate-[15deg] z-0 w-full max-w-[300px]">
          <div className="w-full h-[300px] bg-yellow-200/20 rounded-full blur-3xl"></div>
        </div>

        <div className="absolute bottom-[-8%] left-[-17%] opacity-10 transform rotate-[-10deg] z-0 w-full max-w-[400px] hidden md:block">
          <div className="w-full h-[400px] bg-yellow-200/20 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full max-w-lg relative z-10">
          <Card className="bg-white shadow-xl rounded-2xl border-0 transition-all duration-300 hover:shadow-2xl">
            <CardHeader className="space-y-6 pb-6">
              {/* Logo and brand */}
              <div className="flex items-center justify-center mt-2">
                <div className="flex items-center gap-3">
                  <img 
                    src={chrome.runtime.getURL("assets/48x48.png")} 
                    alt="LiGo" 
                    className="w-10 h-10 rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  <div 
                    className="w-10 h-10 rounded-lg bg-secondary-400 flex items-center justify-center" 
                    style={{ display: 'none' }}
                  >
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">LiGo</h1>
                </div>
              </div>
              
              <div className="space-y-4 text-center">
                <div className="space-y-4">
                  <CardTitle className="text-2xl font-bold text-gray-900 tracking-[-0.02em]">
                    {emailSent ? 'Check your email' : 'Welcome to LiGo'}
                  </CardTitle>
                  <CardDescription className="text-base text-gray-600 leading-relaxed">
                    {emailSent 
                      ? (
                        <>
                          We've sent a 6-digit verification code to
                          <div className="bg-gray-50 rounded-lg px-4 py-3 border mt-3 mb-3">
                            <p className="font-medium text-gray-900">{email}</p>
                          </div>
                          <div className="text-sm text-gray-500 space-y-2">
                            <p>
                              Don't see it? Check your spam folder and mark us as safe for future emails.
                            </p>
                            <p>
                              Still having trouble? {" "}
                              <button 
                                onClick={handleContactSupport}
                                className="text-secondary-400 hover:text-secondary-500 underline font-medium"
                              >
                                Contact our support team
                              </button>
                              {" "} for help. 
                            </p>
                          </div>
                        </>
                      )
                      : 'Enter your email to get started with personalized LinkedIn content generation'
                    }
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          <CardContent className="px-6 pb-6">
            {!emailSent ? (
              // Email input form
              <form 
                onSubmit={handleSendVerificationCode} 
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Enter your email address:
                  </label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="bg-gray-50 border-gray-200 h-12 rounded-xl focus:ring-secondary-400 focus:border-secondary-400"
                    required
                  />
                </div>
                
                {error && (
                  <div className={`p-4 border rounded-lg ${
                    errorType === 'new_user' ? 'bg-blue-50 border-blue-200' : 
                    errorType === 'email_failed' ? 'bg-yellow-50 border-yellow-200' : 
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className={`flex items-start gap-3 text-sm ${
                      errorType === 'new_user' ? 'text-blue-700' : 
                      errorType === 'email_failed' ? 'text-yellow-700' : 
                      'text-red-600'
                    }`}>
                      {errorType === 'new_user' ? (
                        <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      ) : errorType === 'email_failed' ? (
                        <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium mb-2">{error}</p>
                        {errorType === 'new_user' && (
                          <Button 
                            onClick={handleSignUpRedirect}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Sign Up Now
                          </Button>
                        )}
                        {errorType === 'email_failed' && (
                          <div className="space-y-2">
                            <p className="text-xs text-yellow-600">
                              If the problem continues, please contact our support team.
                            </p>
                            <Button 
                              onClick={handleContactSupport}
                              size="sm"
                              variant="outline"
                              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Contact Support
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-secondary-400 hover:bg-secondary-500 text-white rounded-xl transition-all duration-200 h-12 text-base font-medium group relative"
                  disabled={isSubmitting}
                >
                  <span className="flex items-center justify-center gap-2 group-hover:translate-x-[-4px] transition-transform duration-200">
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Send Verification Code
                        <ArrowLeft className="h-4 w-4 rotate-180 group-hover:translate-x-2 transition-transform duration-200" />
                      </>
                    )}
                  </span>
                </Button>
              </form>
            ) : (
              // Verification code form
              <form 
                onSubmit={handleVerifyCode} 
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Enter the Verification Code:
                  </label>
                  <Input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      setVerificationCode(value);
                    }}
                    className="text-center text-2xl tracking-[0.5em] bg-gray-50 border-gray-200 h-14 rounded-xl focus:ring-secondary-400 focus:border-secondary-400"
                    placeholder="000000"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-secondary-400 hover:bg-secondary-500 text-white rounded-xl transition-all duration-200 h-12 text-base font-medium group relative"
                  disabled={isSubmitting || verificationCode.length !== 6}
                >
                  <span className="flex items-center justify-center gap-2 group-hover:translate-x-[-4px] transition-transform duration-200">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify Email
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-200" />
                      </>
                    )}
                  </span>
                </Button>

                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full rounded-xl h-12"
                  onClick={handleBackToEmail}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Use Different Email
                </Button>
              </form>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg mt-4">
              <AlertCircle className="h-4 w-4" />
              <span>
                {emailSent 
                  ? 'Check your spam folder if you don\'t see the email'
                  : 'We\'ll send you a secure login code via email'
                }
              </span>
            </div>
          </CardContent>
          
          <div className="px-6 pb-6">
            <div className="text-center">
              <p className="text-xs text-gray-500 leading-relaxed">
                By continuing, you agree to our{" "}
                <a
                  href="https://ertiqah.com/terms-and-conditions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-secondary-400 hover:text-secondary-500 transition-colors duration-200"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="https://ertiqah.com/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-secondary-400 hover:text-secondary-500 transition-colors duration-200"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </Card>
      </div>
      </div>
    )
  }

  // User is authenticated, render children
  return children
}

export { AuthGate }