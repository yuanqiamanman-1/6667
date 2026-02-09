'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ShoppingBag, Sliders, Trash2 } from 'lucide-react'
import {
  getAssociationMallItems,
  getAssociationRuleSet,
  getVolunteerHourGrants,
  nowIso,
  setAssociationMallItems,
  setAssociationRuleSet,
  setVolunteerHourGrants,
  uid,
  type AssociationMallItem,
  type AssociationRuleSet,
  type VolunteerHourGrant,
} from '@/lib/client-store'

function formatTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('zh-CN')
}

export default function AssociationMallRuleTab(props: { schoolId: string; adminName: string }) {
  const [version, setVersion] = useState(0)
  const [itemOpen, setItemOpen] = useState(false)
  const [draftItem, setDraftItem] = useState({
    title: '',
    description: '',
    costPoints: 100,
    stock: 50,
    enabled: true,
  })

  const [grantOpen, setGrantOpen] = useState(false)
  const [grantDraft, setGrantDraft] = useState({ userName: '', hoursGranted: 2, reason: '' })
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)

  useEffect(() => {
    const current = getAssociationRuleSet(props.schoolId)
    if (!current) {
      const seed: AssociationRuleSet = {
        id: uid('rule'),
        schoolId: props.schoolId,
        enabled: true,
        pointsPerHour: 100,
        weeklyHourLimit: 10,
        monthlyHourLimit: 30,
        cooldownDays: 7,
        minRating: 4.5,
        requireManualReview: true,
        version: 1,
        updatedAt: nowIso(),
        updatedBy: props.adminName,
      }
      setAssociationRuleSet(props.schoolId, seed)
    }

    const mall = getAssociationMallItems(props.schoolId)
    if (mall.length === 0) {
      const seed: AssociationMallItem[] = [
        {
          id: uid('mall'),
          schoolId: props.schoolId,
          title: '校内培训证书（电子）',
          description: '完成指定培训与考核后可兑换',
          costPoints: 200,
          stock: 9999,
          enabled: true,
          createdAt: nowIso(),
        },
        {
          id: uid('mall'),
          schoolId: props.schoolId,
          title: '志愿者徽章（校内）',
          description: '校内志愿服务纪念徽章',
          costPoints: 300,
          stock: 200,
          enabled: true,
          createdAt: nowIso(),
        },
      ]
      setAssociationMallItems(props.schoolId, seed)
    }

    setVersion(v => v + 1)
  }, [props.adminName, props.schoolId])

  const rule = useMemo(() => getAssociationRuleSet(props.schoolId), [props.schoolId, version])

  const [draftRule, setDraftRule] = useState<AssociationRuleSet | null>(null)

  useEffect(() => {
    if (!rule) return
    setDraftRule(rule)
  }, [rule?.id])

  const mallItems = useMemo(() => {
    const items = getAssociationMallItems(props.schoolId)
    return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [props.schoolId, version])

  const hourGrants = useMemo(() => {
    const items = getVolunteerHourGrants(props.schoolId)
    return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [props.schoolId, version])

  const handleSaveRule = () => {
    if (!draftRule) return
    const next: AssociationRuleSet = {
      ...draftRule,
      enabled: Boolean(draftRule.enabled),
      pointsPerHour: Number(draftRule.pointsPerHour || 0),
      weeklyHourLimit: Number(draftRule.weeklyHourLimit || 0),
      monthlyHourLimit: Number(draftRule.monthlyHourLimit || 0),
      cooldownDays: Number(draftRule.cooldownDays || 0),
      minRating: Number(draftRule.minRating || 0),
      requireManualReview: Boolean(draftRule.requireManualReview),
      version: (draftRule.version ?? 0) + 1,
      updatedAt: nowIso(),
      updatedBy: props.adminName,
    }
    setAssociationRuleSet(props.schoolId, next)
    setVersion(v => v + 1)
  }

  const handleCreateItem = () => {
    const title = draftItem.title.trim()
    const description = draftItem.description.trim()
    if (!title || !description) return
    const current = getAssociationMallItems(props.schoolId)
    const item: AssociationMallItem = {
      id: uid('mall'),
      schoolId: props.schoolId,
      title,
      description,
      costPoints: Number(draftItem.costPoints || 0),
      stock: Number(draftItem.stock || 0),
      enabled: draftItem.enabled,
      createdAt: nowIso(),
    }
    setAssociationMallItems(props.schoolId, [item, ...current])
    setDraftItem({ title: '', description: '', costPoints: 100, stock: 50, enabled: true })
    setItemOpen(false)
    setVersion(v => v + 1)
  }

  const handleToggleItem = (id: string, enabled: boolean) => {
    const current = getAssociationMallItems(props.schoolId)
    setAssociationMallItems(props.schoolId, current.map(i => (i.id === id ? { ...i, enabled } : i)))
    setVersion(v => v + 1)
  }

  const handleDeleteItem = (id: string) => {
    const current = getAssociationMallItems(props.schoolId)
    setAssociationMallItems(props.schoolId, current.filter(i => i.id !== id))
    setVersion(v => v + 1)
  }

  const handleManualGrant = () => {
    const name = grantDraft.userName.trim()
    if (!name) return
    const current = getVolunteerHourGrants(props.schoolId)
    const item: VolunteerHourGrant = {
      id: uid('grant'),
      schoolId: props.schoolId,
      userId: uid('user'),
      userName: name,
      sourceType: 'manual',
      hoursGranted: Number(grantDraft.hoursGranted || 0),
      status: 'approved',
      createdAt: nowIso(),
      approvedBy: props.adminName,
      approvedAt: nowIso(),
      rejectedReason: grantDraft.reason.trim() || undefined,
    }
    setVolunteerHourGrants(props.schoolId, [item, ...current])
    setGrantDraft({ userName: '', hoursGranted: 2, reason: '' })
    setGrantOpen(false)
    setVersion(v => v + 1)
  }

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-primary" />
            兑换规则配置
          </CardTitle>
          <CardDescription>配置积分兑换志愿时长比例、门槛与上限（组织域生效）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!draftRule ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              暂无规则
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <div className="font-medium text-foreground">启用兑换规则</div>
                  <div className="text-xs text-muted-foreground">关闭后仅可通过专项任务发放时长</div>
                </div>
                <Switch
                  checked={draftRule.enabled}
                  onCheckedChange={(checked) => setDraftRule({ ...draftRule, enabled: checked })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>兑换比例（points / 小时）</Label>
                  <Input
                    type="number"
                    min={1}
                    value={draftRule.pointsPerHour}
                    onChange={(e) => setDraftRule({ ...draftRule, pointsPerHour: Number(e.target.value || 0) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>最低评分门槛</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={draftRule.minRating}
                    onChange={(e) => setDraftRule({ ...draftRule, minRating: Number(e.target.value || 0) })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>每周上限（小时）</Label>
                  <Input
                    type="number"
                    min={0}
                    value={draftRule.weeklyHourLimit}
                    onChange={(e) => setDraftRule({ ...draftRule, weeklyHourLimit: Number(e.target.value || 0) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>每月上限（小时）</Label>
                  <Input
                    type="number"
                    min={0}
                    value={draftRule.monthlyHourLimit}
                    onChange={(e) => setDraftRule({ ...draftRule, monthlyHourLimit: Number(e.target.value || 0) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>冷却期（天）</Label>
                  <Input
                    type="number"
                    min={0}
                    value={draftRule.cooldownDays}
                    onChange={(e) => setDraftRule({ ...draftRule, cooldownDays: Number(e.target.value || 0) })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <div className="font-medium text-foreground">人工复核</div>
                  <div className="text-xs text-muted-foreground">开启后兑换申请需人工审核（原型占位）</div>
                </div>
                <Switch
                  checked={draftRule.requireManualReview}
                  onCheckedChange={(checked) => setDraftRule({ ...draftRule, requireManualReview: checked })}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 p-4">
                <div className="text-xs text-muted-foreground">
                  当前版本：v{draftRule.version} · 更新时间：{formatTime(draftRule.updatedAt)} · 更新人：{draftRule.updatedBy}
                </div>
                <Button onClick={handleSaveRule}>保存为新版本</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              校内协会商城
            </CardTitle>
            <CardDescription>商品上架与库存配置（原型）</CardDescription>
          </div>
          <Dialog open={itemOpen} onOpenChange={setItemOpen}>
            <DialogTrigger asChild>
              <Button>新增商品</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>新增商品</DialogTitle>
                <DialogDescription>商品将仅在本校协会板块展示</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>名称 *</Label>
                  <Input value={draftItem.title} onChange={(e) => setDraftItem({ ...draftItem, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>描述 *</Label>
                  <Textarea
                    value={draftItem.description}
                    onChange={(e) => setDraftItem({ ...draftItem, description: e.target.value })}
                    className="min-h-24"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>所需积分</Label>
                    <Input
                      type="number"
                      min={0}
                      value={draftItem.costPoints}
                      onChange={(e) => setDraftItem({ ...draftItem, costPoints: Number(e.target.value || 0) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>库存</Label>
                    <Input
                      type="number"
                      min={0}
                      value={draftItem.stock}
                      onChange={(e) => setDraftItem({ ...draftItem, stock: Number(e.target.value || 0) })}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="text-sm text-muted-foreground">上架</div>
                  <Switch checked={draftItem.enabled} onCheckedChange={(checked) => setDraftItem({ ...draftItem, enabled: checked })} />
                </div>
                <Button className="w-full" onClick={handleCreateItem} disabled={!draftItem.title.trim() || !draftItem.description.trim()}>
                  创建
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {mallItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              暂无商品
            </div>
          ) : (
            mallItems.map(i => (
              <div key={i.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-foreground">{i.title}</div>
                      <Badge variant="secondary">{i.costPoints} 积分</Badge>
                      <Badge variant="outline">库存 {i.stock}</Badge>
                      {!i.enabled && <Badge variant="outline">已下架</Badge>}
                    </div>
                    <div className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{i.description}</div>
                    <div className="mt-2 text-xs text-muted-foreground">{formatTime(i.createdAt)}</div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <Switch checked={i.enabled} onCheckedChange={(checked) => handleToggleItem(i.id, checked)} />
                    <Button variant="outline" size="icon" className="bg-transparent text-destructive hover:bg-destructive/10" onClick={() => setDeleteItemId(i.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>志愿时长结算记录</CardTitle>
            <CardDescription>专项任务/兑换/补发等来源统一审计</CardDescription>
          </div>
          <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-transparent">人工补发</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>人工补发时长</DialogTitle>
                <DialogDescription>用于纠错或特殊补发（原型：直接记为已通过）</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>讲师姓名 *</Label>
                  <Input value={grantDraft.userName} onChange={(e) => setGrantDraft({ ...grantDraft, userName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>补发时长（小时）</Label>
                  <Input
                    type="number"
                    min={0}
                    value={grantDraft.hoursGranted}
                    onChange={(e) => setGrantDraft({ ...grantDraft, hoursGranted: Number(e.target.value || 0) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>备注（可选）</Label>
                  <Textarea value={grantDraft.reason} onChange={(e) => setGrantDraft({ ...grantDraft, reason: e.target.value })} className="min-h-20" />
                </div>
                <Button className="w-full" onClick={handleManualGrant} disabled={!grantDraft.userName.trim()}>
                  确认补发
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {hourGrants.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              暂无记录
            </div>
          ) : (
            hourGrants.map(g => (
              <div key={g.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-foreground">{g.userName}</div>
                      <Badge variant="secondary">+{g.hoursGranted} 小时</Badge>
                      <Badge variant="outline">
                        {g.sourceType === 'task' ? '任务结算' : g.sourceType === 'redeem' ? '积分兑换' : g.sourceType === 'manual' ? '人工补发' : '回滚'}
                      </Badge>
                      <Badge variant={g.status === 'approved' ? 'secondary' : g.status === 'rejected' ? 'destructive' : 'outline'}>
                        {g.status === 'approved' ? '已通过' : g.status === 'rejected' ? '已驳回' : g.status === 'rolled_back' ? '已回滚' : '待审核'}
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      创建：{formatTime(g.createdAt)} {g.approvedAt ? `· 审核：${g.approvedBy ?? '-'} · ${formatTime(g.approvedAt)}` : ''}
                    </div>
                    {g.rejectedReason && <div className="mt-2 text-xs text-muted-foreground">备注：{g.rejectedReason}</div>}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 删除商品确认对话框 */}
      <AlertDialog open={!!deleteItemId} onOpenChange={(open) => !open && setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除商品</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销。确定要删除该商品吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteItemId && handleDeleteItem(deleteItemId)}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

