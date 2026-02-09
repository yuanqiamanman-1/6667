'use client'

import { useState } from 'react'
import { X, Download, BookOpen, Play, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SUBJECT_LABELS, toLabel } from '@/lib/match-labels'

interface Resource {
  id: number
  title: string
  description: string
  category: string
  subject?: string
  type: 'document' | 'video'
  author: string
  downloads: number
  rating: number
  fileUrl?: string
  videoUrl?: string
  coverImage?: string
  content?: string
}

interface ResourcePreviewProps {
  resource: Resource | null
  open: boolean
  onClose: () => void
  onDownload: () => void
}

export function ResourcePreview({ resource, open, onClose, onDownload }: ResourcePreviewProps) {
  if (!resource) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{resource.title}</DialogTitle>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline">{resource.subject ?? toLabel(resource.category, SUBJECT_LABELS)}</Badge>
                <Badge variant="secondary">
                  {resource.type === 'document' ? (
                    <>
                      <FileText className="mr-1 h-3 w-3" />
                      文档
                    </>
                  ) : (
                    <>
                      <Play className="mr-1 h-3 w-3" />
                      视频
                    </>
                  )}
                </Badge>
              </div>
            </div>
            <Button
              onClick={onDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              下载
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* 预览区域 */}
          <div className="rounded-lg border-2 border-border bg-muted/20 overflow-hidden">
            {resource.type === 'video' ? (
              <div className="aspect-video bg-black">
                {resource.videoUrl ? (
                  <video
                    controls
                    className="h-full w-full"
                    poster={resource.coverImage}
                  >
                    <source src={resource.videoUrl} type="video/mp4" />
                    您的浏览器不支持视频播放
                  </video>
                ) : (
                  <div className="flex h-full items-center justify-center text-white">
                    <div className="text-center">
                      <Play className="mx-auto h-16 w-16 opacity-50" />
                      <p className="mt-4 text-sm opacity-70">视频预览暂不可用</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8">
                {resource.content ? (
                  <div className="prose prose-sm max-w-none">
                    <div className="space-y-4 text-foreground">
                      {resource.content.split('\n').map((paragraph, index) => (
                        <p key={index} className="leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[400px] items-center justify-center">
                    <div className="text-center">
                      <BookOpen className="mx-auto h-16 w-16 text-muted-foreground" />
                      <p className="mt-4 text-sm text-muted-foreground">
                        文档预览暂不可用，请下载后查看完整内容
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 资源信息 */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">资源简介</h3>
              <p className="text-muted-foreground leading-relaxed">
                {resource.description}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 rounded-lg border p-4">
              <div>
                <p className="text-sm text-muted-foreground">作者</p>
                <p className="font-medium">{resource.author}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">下载量</p>
                <p className="font-medium">{resource.downloads}次</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">评分</p>
                <p className="font-medium">{resource.rating}分</p>
              </div>
            </div>

            {resource.type === 'document' && (
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  💡 提示：完整内容请下载后使用对应软件打开查看
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ResourcePreview
