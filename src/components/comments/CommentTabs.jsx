import React from 'react'
import { CommentCard } from './CommentCard'
import { Card, CardContent, CardDescription, CardTitle } from '../ui/Card'
import { MessageSquare } from 'lucide-react'

const CommentTabs = ({ 
  comments = [], 
  onCopy,
  onSaveAndCopy,
  className 
}) => {
  // Show empty state if no comments
  if (comments.length === 0) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-4">
              <div className="p-3 rounded-full bg-gray-100">
                <MessageSquare className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <CardTitle className="mb-2">No Comments Generated</CardTitle>
            <CardDescription>Paste a LinkedIn post above and click generate to see comments.</CardDescription>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show all comments in linear hierarchy
  return (
    <div className={className}>
      <div className="space-y-2">
        {comments.map((comment, index) => (
          <CommentCard
            key={index}
            comment={comment}
            type={`Comment ${index + 1}`}
            onCopy={onCopy}
            onSaveAndCopy={onSaveAndCopy}
            className="slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

export { CommentTabs }