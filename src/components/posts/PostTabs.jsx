import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../layout/Tabs'
import { PostSlider } from './PostSlider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Lightbulb, Settings, ExternalLink } from 'lucide-react'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'

const PostTabs = ({ 
  posts, 
  extensionSettings = {}, 
  onCopy,
  onRegenerate,
  className 
}) => {
  const { FRONTEND_URL } = useAuth()
  
  // Split posts based on your existing logic
  const ligoPosts = posts.slice(0, 3)
  const myStylePosts = posts.slice(3, 6)

  const handleExternalLink = (path) => {
    chrome.tabs.create({ url: `${FRONTEND_URL}${path}` })
  }

  const EmptyState = ({ 
    title, 
    message, 
    isDisabled = false,
    actionText,
    actionPath
  }) => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4">
          <div className={`p-3 rounded-full ${isDisabled ? 'bg-muted' : 'bg-yellow-100'}`}>
            {isDisabled ? (
              <Settings className="h-8 w-8 text-muted-foreground" />
            ) : (
              <Lightbulb className="h-8 w-8 text-yellow-600" />
            )}
          </div>
        </div>
        <CardTitle className="mb-2">{title}</CardTitle>
        <CardDescription className="mb-4">{message}</CardDescription>
        {actionText && actionPath && (
          <Button
            onClick={() => handleExternalLink(actionPath)}
            variant="outline"
            size="sm"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            {actionText}
          </Button>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className={className}>
      <Tabs defaultValue="mystyle">
        <TabsList>
          <TabsTrigger value="mystyle">My Style</TabsTrigger>
          <TabsTrigger value="ligo">LiGo</TabsTrigger>
        </TabsList>

        <TabsContent value="mystyle">
          {!extensionSettings.myStylePosts ? (
            <EmptyState
              title="Feature Disabled"
              message="My Style posts generation is disabled in extension settings."
              isDisabled
              actionText="Enable in Settings"
              actionPath="/extension-settings"
            />
          ) : myStylePosts.length === 0 ? (
            <EmptyState
              title="No Style Preferences Found"
              message="Add some example posts in preferences to generate posts in your style."
              actionText="Set Style Preferences"
              actionPath="/style-preferences"
            />
          ) : (
            <PostSlider
              posts={myStylePosts}
              title="My Style Posts"
              onCopy={onCopy}
              onRegenerate={onRegenerate}
            />
          )}
        </TabsContent>

        <TabsContent value="ligo">
          {ligoPosts.length === 0 ? (
            <EmptyState
              title="No LiGo Posts"
              message="No LiGo style posts available."
            />
          ) : (
            <PostSlider
              posts={ligoPosts}
              title="LiGo Style Posts"
              onCopy={onCopy}
              onRegenerate={onRegenerate}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { PostTabs }