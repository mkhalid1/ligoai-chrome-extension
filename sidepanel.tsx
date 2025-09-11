import React from 'react'
import { AuthGate } from './src/components/auth/AuthGate'
import { SidebarLayout } from './src/components/layout/SidebarLayout'
import './src/styles/globals.css'

function IndexSidepanel() {
  return (
    <div className="min-h-screen bg-background">
      <AuthGate children={<SidebarLayout children={null} />} />
    </div>
  )
}

export default IndexSidepanel