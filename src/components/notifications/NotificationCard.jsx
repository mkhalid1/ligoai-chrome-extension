import React from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { 
  CheckSquare,
  Circle,
  CheckCircle,
  Trash2,
  ExternalLink,
  Activity,
  AlertCircle,
  Zap,
  Trophy,
  Lightbulb,
  User,
  Bell
} from 'lucide-react'

const NotificationCard = ({ 
  notification, 
  isSelected, 
  onSelect, 
  onMarkRead, 
  onDelete, 
  onClick,
  getNotificationTypeInfo 
}) => {
  const typeInfo = getNotificationTypeInfo(notification.type)
  
  // Get icon for notification type
  const getTypeIcon = (type) => {
    const iconMap = {
      'linkedin_activity': Activity,
      'system_alert': AlertCircle,
      'feature_announcement': Zap,
      'engagement_milestone': Trophy,
      'content_suggestion': Lightbulb,
      'account_update': User
    }
    return iconMap[type] || Bell
  }

  const TypeIcon = getTypeIcon(notification.type)

  // Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
        !notification.isRead ? 'border-primary/40 bg-primary/5' : ''
      } ${isSelected ? 'ring-2 ring-primary' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Selection checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSelect(notification.id)
            }}
            className="mt-1"
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-primary" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground hover:text-primary" />
            )}
          </button>

          {/* Type icon */}
          <div className={`p-2 rounded-lg mt-0.5 bg-${typeInfo.color}-100`}>
            <TypeIcon className={`h-4 w-4 text-${typeInfo.color}-600`} />
          </div>

          {/* Content */}
          <div 
            className="flex-1 min-w-0"
            onClick={() => onClick(notification)}
          >
            <div className="flex items-start justify-between mb-1">
              <h4 className={`text-sm font-medium ${
                !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {notification.title}
              </h4>
              <div className="flex items-center gap-2 ml-2">
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDate(notification.createdAt)}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {notification.content}
            </p>
            
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-${typeInfo.color}-100 text-${typeInfo.color}-700`}>
                <TypeIcon className="h-3 w-3" />
                {typeInfo.label}
              </span>
              
              {notification.link && (
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1">
            {!notification.isRead && (
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkRead(notification.id)
                }}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                title="Mark as read"
              >
                <CheckCircle className="h-3 w-3" />
              </Button>
            )}
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(notification.id)
              }}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              title="Delete notification"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { NotificationCard }