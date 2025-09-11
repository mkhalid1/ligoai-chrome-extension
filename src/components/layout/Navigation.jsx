import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import { Button } from '../ui/Button'
import { 
  BarChart3, 
  Users, 
  Settings, 
  HelpCircle, 
  LogOut, 
  User,
  Sliders,
  LayoutDashboard,
  Bell
} from 'lucide-react'

const Navigation = ({ user }) => {
  const { logout, FRONTEND_URL } = useAuth()
  const { unreadCount } = useNotifications()

  const handleExternalLink = (path) => {
    chrome.tabs.create({ url: `${FRONTEND_URL}${path}` })
  }

  return (
    <div className="flex flex-col justify-between h-full p-4 bg-muted/50 border-l border-border min-w-[80px]">
      {/* Top buttons */}
      <div className="flex flex-col space-y-4">
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <img
            src={chrome.runtime.getURL("assets/icon128.plasmo.3c1ed2d2.png")}
            alt="LiGo"
            className="w-8 h-8 rounded-lg"
          />
        </div>

        {/* Dashboard Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center p-2"
          onClick={() => handleExternalLink("/dashboard")}
          title="Dashboard"
          aria-label="Go to Dashboard"
        >
          <LayoutDashboard className="h-4 w-4" />
        </Button>

        {/* Style Preferences Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center p-2"
          onClick={() => handleExternalLink("/style-preferences")}
          title="Style Preferences"
          aria-label="Go to Style Preferences"
        >
          <Sliders className="h-4 w-4" />
        </Button>

        {/* Analytics Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center p-2"
          onClick={() => handleExternalLink("/linkedin-analytics")}
          title="Analytics"
          aria-label="Go to LinkedIn Analytics"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>

        {/* Leads Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center p-2"
          onClick={() => handleExternalLink("/basic-crm")}
          title="Leads"
          aria-label="Go to CRM and Leads"
        >
          <Users className="h-4 w-4" />
        </Button>

        {/* Notifications Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center p-2 relative"
          onClick={() => {
            /* This will be handled by the tab system */
          }}
          title={`Notifications${
            unreadCount > 0 ? ` (${unreadCount} unread)` : ""
          }`}
          aria-label={`Notifications${
            unreadCount > 0 ? ` (${unreadCount} unread)` : ""
          }`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full min-w-[16px] h-[16px] flex items-center justify-center text-[10px]"
              aria-hidden="true"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </div>

      {/* Bottom buttons */}
      <div className="flex flex-col space-y-2">
        {/* User Avatar/Profile */}
        <div className="flex justify-center mb-2">
          {user?.avatar || user?.avatarUrl ? (
            <img
              src={user.avatar || user.avatarUrl}
              alt="User Profile"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-secondary-foreground" />
            </div>
          )}
        </div>

        {/* Settings */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center p-2"
          onClick={() => handleExternalLink("/extension-settings")}
          title="Settings"
          aria-label="Go to Extension Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>

        {/* Support */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center p-2"
          onClick={() => handleExternalLink("/report-bug")}
          title="Support"
          aria-label="Get Support and Report Bug"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center p-2 text-destructive hover:text-destructive"
          onClick={logout}
          title="Logout"
          aria-label="Logout from LiGo"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export { Navigation }