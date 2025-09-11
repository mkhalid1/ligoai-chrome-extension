import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { 
  BarChart3, 
  ExternalLink,
  Loader2,
  AlertCircle,
  CreditCard,
  Settings
} from 'lucide-react'

const UsageDetailsPanel = ({ activeTab }) => {
  const { API_URL, authenticatedFetch, FRONTEND_URL, getToken } = useAuth()
  const [usageDetails, setUsageDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Helper function to calculate usage percentage
  const calculateUsagePercentage = (used, total) =>
    Math.min((used / total) * 100, 100)

  // Helper function to get metrics sorted by usage
  const getSortedMetrics = (usageDetails) => {
    const metrics = [
      {
        name: "Ideas generated",
        used: usageDetails.ideas_generated,
        total: usageDetails.plan_details.number_of_ideas,
        percentage: calculateUsagePercentage(
          usageDetails.ideas_generated,
          usageDetails.plan_details.number_of_ideas
        ),
      },
      {
        name: "Posts generated",
        used: usageDetails.posts_generated,
        total: usageDetails.plan_details.number_of_posts,
        percentage: calculateUsagePercentage(
          usageDetails.posts_generated,
          usageDetails.plan_details.number_of_posts
        ),
      },
      {
        name: "Repurpose content",
        used: usageDetails.posts_rewritten,
        total: usageDetails.plan_details.post_rewrites,
        percentage: calculateUsagePercentage(
          usageDetails.posts_rewritten,
          usageDetails.plan_details.post_rewrites
        ),
      },
      {
        name: "Active themes",
        used: usageDetails.number_of_active_themes,
        total: usageDetails.plan_details.number_of_themes,
        percentage: calculateUsagePercentage(
          usageDetails.number_of_active_themes,
          usageDetails.plan_details.number_of_themes
        ),
      },
      {
        name: "Comments generated",
        used: usageDetails.extension_num_of_comments,
        total: usageDetails.plan_details.extension_num_of_comments,
        percentage: calculateUsagePercentage(
          usageDetails.extension_num_of_comments,
          usageDetails.plan_details.extension_num_of_comments
        ),
      },
      {
        name: "Chat messages",
        used: usageDetails.chat_messages,
        total: usageDetails.plan_details.chat_messages,
        percentage: calculateUsagePercentage(
          usageDetails.chat_messages,
          usageDetails.plan_details.chat_messages
        ),
      },
    ]

    return metrics.sort((a, b) => b.percentage - a.percentage)
  }

  // Helper function to get credits info
  const getCreditsInfo = (usageDetails) => {
    if (!usageDetails.credits_details) return []
    
    const credits = []
    
    if (usageDetails.credits_details.comments_credits !== undefined) {
      credits.push({
        name: "Comments generation",
        remaining: usageDetails.credits_details.comments_credits,
        type: "credits"
      })
    }
    
    if (usageDetails.credits_details.rewrites_credits !== undefined) {
      credits.push({
        name: "Repurpose content",
        remaining: usageDetails.credits_details.rewrites_credits,
        type: "credits"
      })
    }
    
    return credits
  }

  // Fetch usage details
  useEffect(() => {
    const fetchUsageDetails = async () => {
      if (!activeTab || activeTab !== 'usage') return

      try {
        setLoading(true)
        setError(null)
        
        // Get token for chrome extension endpoint
        const token = await getToken()
        
        const response = await fetch(`${API_URL}/api/chrome-extension/user-usage-details`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: token
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch usage details')
        }

        const data = await response.json()
        setUsageDetails(data)
      } catch (error) {
        console.error('Error fetching usage details:', error)
        setError('Failed to load usage details. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchUsageDetails()
  }, [activeTab, API_URL, authenticatedFetch])

  const handleExternalLink = (path) => {
    chrome.tabs.create({ url: `${FRONTEND_URL}${path}` })
  }

  const ProgressBar = ({ percentage, className = "" }) => (
    <div className={`h-2 bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div 
        className={`h-full transition-all duration-300 rounded-full ${
          percentage >= 90
            ? "bg-red-400"
            : percentage >= 60
            ? "bg-orange-400"
            : "bg-teal-400"
        }`}
        style={{ width: `${Math.max(percentage, 0)}%` }}
      />
    </div>
  )

  if (!activeTab || activeTab !== 'usage') return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Usage Details</h1>
            <p className="text-sm text-muted-foreground">Monitor your plan usage and credits</p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading usage details...</p>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-6 border-red-200">
          <div className="flex items-center space-x-3 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4"
            variant="outline"
          >
            Try Again
          </Button>
        </Card>
      )}

      {/* Usage Details */}
      {!loading && !error && usageDetails && (
        <>
          {/* Plan Usage Card */}
          <Card className="p-6">
            <div className="space-y-6">
              {/* Header with plan name and actions */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Plan Usage</h3>
                  <p className="text-sm text-muted-foreground">
                    {usageDetails.plan_name || 'Current Plan'} • Resets monthly
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExternalLink('/billing')}
                  className="flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Manage</span>
                </Button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {getSortedMetrics(usageDetails).map((metric, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground font-medium truncate pr-2">
                        {metric.name}
                      </span>
                      <span className="text-muted-foreground whitespace-nowrap">
                        {metric.used}/{metric.total}
                      </span>
                    </div>
                    <ProgressBar percentage={metric.percentage} />
                    <div className="text-xs text-muted-foreground">
                      {Math.round(metric.percentage)}% used
                    </div>
                  </div>
                ))}
              </div>

              {/* Upgrade prompt if needed */}
              {getSortedMetrics(usageDetails).some(metric => metric.percentage >= 80) && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-800">
                        Usage Alert
                      </p>
                      <p className="text-xs text-orange-700 mt-1">
                        You're approaching your plan limits. Consider upgrading to continue using all features.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Credits Section */}
          {getCreditsInfo(usageDetails).length > 0 && (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Additional Credits</h3>
                    <p className="text-sm text-muted-foreground">Never expire • Purchase additional as needed</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExternalLink('/credits-billing')}
                    className="flex items-center space-x-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Buy Credits</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getCreditsInfo(usageDetails).map((credit, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground font-medium truncate pr-2">
                          {credit.name}
                        </span>
                        <span className={`whitespace-nowrap font-medium ${
                          credit.remaining === 0 ? 'text-red-500' : 'text-green-600'
                        }`}>
                          {credit.remaining} remaining
                        </span>
                      </div>
                      <div className={`h-2 rounded-full ${
                        credit.remaining === 0 ? 'bg-red-100' : 'bg-green-100'
                      }`}>
                        <div className={`h-full rounded-full ${
                          credit.remaining === 0 ? 'bg-red-400' : 'bg-green-400'
                        } w-full`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              onClick={() => handleExternalLink('/credits-billing')}
              className="flex items-center justify-center space-x-2 bg-primary hover:bg-primary/90"
            >
              <CreditCard className="h-4 w-4" />
              <span>Buy Credits</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={() => handleExternalLink('/billing')}
              variant="outline"
              className="flex items-center justify-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Manage Subscription</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export { UsageDetailsPanel }