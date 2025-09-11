# LiGo Notifications System

This directory contains the comprehensive notifications system for the LiGo Chrome extension, which integrates with the backend notifications APIs to provide users with real-time updates about LinkedIn activity, system alerts, and other important information.

## Components

### 1. NotificationsPanel.jsx
The main panel component that displays notifications in the extension's tab system.

**Features:**
- Real-time notification display with automatic refresh every 5 minutes
- Two view modes: "Recent" (last 20 notifications) and "All" (paginated)
- Advanced filtering by read status, type, and search query
- Bulk operations: select all, mark as read, delete
- Individual notification actions: mark as read, delete
- Notification type badges with color coding
- Empty states and error handling
- Loading states and progress indicators

**Props:**
- `activeTab`: String - Current active tab to control when to load data

### 2. NotificationCard.jsx
Reusable card component for displaying individual notifications.

**Features:**
- Clean card layout with type icon, title, content preview
- Visual indicators for read/unread status
- Action buttons (mark as read, delete)
- Click handling for external links
- Selection checkbox for bulk operations
- Responsive design

**Props:**
- `notification`: Object - Notification data
- `isSelected`: Boolean - Selection state
- `onSelect`: Function - Selection handler
- `onMarkRead`: Function - Mark as read handler
- `onDelete`: Function - Delete handler
- `onClick`: Function - Click handler
- `getNotificationTypeInfo`: Function - Type info helper

### 3. NotificationUtils.js
Utility functions for working with notification data.

**Functions:**
- `formatNotification()` - Format notification for display
- `formatNotificationDate()` - Human-readable date formatting
- `getNotificationTypeInfo()` - Get type styling and metadata
- `sortNotifications()` - Sort by priority and date
- `groupNotificationsByDate()` - Group notifications by time periods
- `filterNotifications()` - Apply filters to notification list
- `getNotificationStats()` - Generate summary statistics
- `createSampleNotification()` - Create test notifications

## Hook

### useNotifications.js
Custom hook for managing notification state and API interactions.

**Returns:**
- `notifications` - Filtered notifications array
- `allNotifications` - Complete notifications array
- `unreadCount` - Number of unread notifications
- `pagination` - Pagination metadata
- `filters` - Current filter settings
- `searchQuery` - Current search query
- `isLoading` - Loading state
- `error` - Error message
- `lastUpdated` - Last refresh timestamp

**Actions:**
- `loadNotifications()` - Fetch recent notifications
- `loadAllNotifications()` - Fetch paginated notifications
- `markAsRead()` - Mark single notification as read
- `markAllAsRead()` - Mark all notifications as read
- `deleteNotification()` - Delete single notification
- `refresh()` - Refresh current view
- `updateFilters()` - Update filter settings
- `setSearch()` - Update search query
- `clearError()` - Clear error state

**Utilities:**
- `getNotificationTypeInfo()` - Get type metadata

## Integration

### Backend APIs Used
The system integrates with the following backend endpoints:

- `GET /api/notifications` - Get recent notifications (last 20)
- `GET /api/notifications/all` - Get all notifications with pagination
- `POST /api/notifications/mark-read` - Mark notification(s) as read
- `POST /api/notifications/delete` - Delete (hide) notification

### Tab Integration
The notifications system is integrated into the main extension tabs:

1. **SidebarLayout.jsx** - Updated to include notifications tab with unread badge
2. **sidepanel.jsx** - Updated to include NotificationsPanel in TabsContent
3. **Navigation.jsx** - Updated to show notification badge in sidebar

## Notification Types

The system supports various notification types with specific styling:

| Type | Label | Color | Icon | Priority |
|------|-------|-------|------|----------|
| `linkedin_activity` | LinkedIn Activity | Blue | Activity | Medium |
| `system_alert` | System Alert | Orange | Alert Circle | High |
| `feature_announcement` | Feature Update | Green | Zap | Medium |
| `engagement_milestone` | Milestone | Purple | Trophy | Low |
| `content_suggestion` | Content Idea | Indigo | Lightbulb | Low |
| `account_update` | Account | Gray | User | Medium |

## Usage Examples

### Basic Usage
```jsx
import { NotificationsPanel } from './components/notifications/NotificationsPanel'

function App() {
  return (
    <TabsContent value="notifications">
      <NotificationsPanel activeTab="notifications" />
    </TabsContent>
  )
}
```

### Using the Hook
```jsx
import { useNotifications } from './hooks/useNotifications'

function NotificationBadge() {
  const { unreadCount, markAllAsRead } = useNotifications()
  
  return (
    <div className="relative">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-[16px] flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </div>
  )
}
```

### Creating Test Notifications
```jsx
import { createSampleNotification } from './components/notifications/NotificationUtils'

// Create a sample LinkedIn activity notification
const testNotification = createSampleNotification('linkedin_activity', false)

// Create a system alert
const alertNotification = createSampleNotification('system_alert', false)
```

## Styling

The notifications system follows the LiGo design system:

- **Primary color**: `#106AD8` for unread indicators and badges
- **Card styling**: Consistent with other panels using the Card component
- **Typography**: Uses DM Sans font family
- **Spacing**: Follows the established spacing scale
- **Colors**: Type-specific color coding for easy recognition

## Real-time Updates

The system includes automatic refresh functionality:

- **Auto-refresh**: Every 5 minutes when authenticated
- **Manual refresh**: Refresh button in panel header
- **Real-time badge**: Unread count updates immediately after actions
- **Optimistic updates**: UI updates immediately, syncs with server

## Error Handling

Comprehensive error handling includes:

- **Network errors**: Graceful degradation with retry options
- **Authentication errors**: Automatic token refresh and re-authentication
- **API errors**: User-friendly error messages with dismiss option
- **Loading states**: Clear loading indicators during API calls

## Performance Optimizations

- **Lazy loading**: Notifications load only when tab is active
- **Pagination**: Large notification lists are paginated
- **Debounced search**: Search queries are debounced to reduce API calls
- **Memoization**: Components use React.memo and useCallback for optimization
- **Local state management**: Reduces unnecessary API calls

## Testing

To test the notifications system:

1. Use the `createSampleNotification()` utility function
2. Mock API responses in development
3. Test with different notification types and states
4. Verify real-time updates and error handling
5. Test responsive behavior on different screen sizes

## Future Enhancements

Potential future improvements:

- **Push notifications**: Browser notifications for high-priority alerts
- **Notification preferences**: User settings for notification types
- **Advanced filtering**: More granular filtering options
- **Notification templates**: Rich content with images and actions
- **Real-time WebSocket**: Live updates instead of polling