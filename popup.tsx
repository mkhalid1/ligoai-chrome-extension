import React from 'react'
import { AuthGate } from './src/components/auth/AuthGate'
import { useAuth } from './src/hooks/useAuth'
import './src/styles/globals.css'

function PopupContent() {
  const { user, logout } = useAuth()

  const openSidebar = () => {
    chrome.runtime.sendMessage({ action: "openSidePanel" })
    window.close()
  }

  return (
    <div style={{ width: '320px', padding: '20px', backgroundColor: 'white' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            backgroundColor: '#106AD8', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 12px',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            L
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 4px' }}>LiGo</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            {user ? `Welcome, ${user.display_name || user.email}!` : 'AI-powered social engagement'}
          </p>
        </div>
        
        <button 
          onClick={openSidebar}
          style={{
            width: '100%',
            backgroundColor: '#106AD8',
            color: 'white',
            fontWeight: '500',
            padding: '12px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#0F5BB8'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#106AD8'}
        >
          Open LiGo Panel
        </button>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '12px', 
          marginTop: '16px',
          fontSize: '12px'
        }}>
          <div style={{ 
            backgroundColor: '#f8faff', 
            padding: '12px', 
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', marginBottom: '4px' }}>🎯</div>
            <div style={{ fontWeight: '600', color: '#1f2937' }}>Engage</div>
            <div style={{ color: '#6b7280' }}>Smart comments</div>
          </div>
          <div style={{ 
            backgroundColor: '#f8faff', 
            padding: '12px', 
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', marginBottom: '4px' }}>✍️</div>
            <div style={{ fontWeight: '600', color: '#1f2937' }}>Write</div>
            <div style={{ color: '#6b7280' }}>Create posts</div>
          </div>
          <div style={{ 
            backgroundColor: '#f8faff', 
            padding: '12px', 
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', marginBottom: '4px' }}>📊</div>
            <div style={{ fontWeight: '600', color: '#1f2937' }}>Analytics</div>
            <div style={{ color: '#6b7280' }}>Track performance</div>
          </div>
          <div style={{ 
            backgroundColor: '#f8faff', 
            padding: '12px', 
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', marginBottom: '4px' }}>🤝</div>
            <div style={{ fontWeight: '600', color: '#1f2937' }}>CRM</div>
            <div style={{ color: '#6b7280' }}>Manage contacts</div>
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginTop: '16px' 
        }}>
          <button
            onClick={() => chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id })}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Settings
          </button>
          <button
            onClick={logout}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
        
        <div style={{ 
          marginTop: '16px', 
          padding: '8px', 
          backgroundColor: '#f0f9ff', 
          borderRadius: '6px',
          fontSize: '11px',
          color: '#0369a1'
        }}>
          💡 Right-click LinkedIn posts to generate comments
        </div>
      </div>
    </div>
  )
}

function IndexPopup() {
  return (
    <AuthGate>
      <PopupContent />
    </AuthGate>
  )
}

export default IndexPopup
