"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { addComment } from "@/modules/teacher/teacher.actions"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"

interface CommentAuthor {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

interface CommentData {
  id: string
  content: string
  createdAt: Date
  user: CommentAuthor
  replies: Array<{
    id: string
    content: string
    createdAt: Date
    user: CommentAuthor
  }>
}

interface CommentSectionProps {
  experienceId: string
  initialComments?: CommentData[]
  currentUserId?: string
}

function CommentSection({ experienceId, initialComments = [], currentUserId: _currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentData[]>(initialComments)
  const [newComment, setNewComment] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!newComment.trim()) return
    setLoading(true)
    try {
      const result = await addComment(experienceId, newComment.trim())
      if (result.success && result.comment) {
        setComments((prev) => [{ ...result.comment!, replies: [] }, ...prev])
        setNewComment("")
        toast.success("Comment added")
      }
    } catch {
      toast.error("Failed to add comment")
    } finally {
      setLoading(false)
    }
  }

  async function handleReply(parentId: string) {
    if (!replyContent.trim()) return
    setLoading(true)
    try {
      const result = await addComment(experienceId, replyContent.trim(), parentId)
      if (result.success && result.comment) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: [...c.replies, result.comment!] }
              : c
          )
        )
        setReplyContent("")
        setReplyTo(null)
        toast.success("Reply added")
      }
    } catch {
      toast.error("Failed to add reply")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* New comment */}
      <div className="flex gap-3">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          aria-label="Write a comment"
          className="flex-1 min-h-[80px] bg-[var(--color-surface)] border-[var(--color-border)]"
        />
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!newComment.trim() || loading} size="sm">
          {loading ? "Posting..." : "Post Comment"}
        </Button>
      </div>

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)] py-4">No comments yet</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <Card key={comment.id} className="p-4 bg-[var(--color-surface)]">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {comment.user.name ?? comment.user.email ?? "Unknown"}
                  </span>
                  <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{comment.content}</p>

              {/* Reply button */}
              <button
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                className="mt-2 text-xs text-[var(--color-accent)] hover:underline"
              >
                Reply
              </button>

              {/* Reply form */}
              {replyTo === comment.id && (
                <div className="mt-3 pl-4 border-l-2 border-[var(--color-border)]">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    aria-label="Write a reply"
                    className="min-h-[60px] bg-[var(--color-surface)] border-[var(--color-border)] text-sm"
                  />
                  <div className="mt-2 flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>Cancel</Button>
                    <Button size="sm" onClick={() => handleReply(comment.id)} disabled={!replyContent.trim() || loading}>
                      Reply
                    </Button>
                  </div>
                </div>
              )}

              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="mt-3 space-y-2 pl-4 border-l-2 border-[var(--color-border)]">
                  {comment.replies.map((reply) => (
                    <div key={reply.id}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">
                          {reply.user.name ?? reply.user.email ?? "Unknown"}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {new Date(reply.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export { CommentSection }
export type { CommentData, CommentAuthor }
