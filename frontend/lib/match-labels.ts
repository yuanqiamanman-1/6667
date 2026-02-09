export const SUBJECT_LABELS: Record<string, string> = {
  math: '数学',
  physics: '物理',
  chemistry: '化学',
  biology: '生物',
  chinese: '语文',
  english: '英语',
  history: '历史',
  geography: '地理',
  politics: '政治',
  programming: '编程',
  art: '美术',
  music: '音乐',
}

export const COMMUNICATION_METHOD_LABELS: Record<string, string> = {
  text: '文字交流',
  voice: '语音通话',
  video: '视频辅导',
}

export const TIME_OPTION_LABELS: Record<string, string> = {
  now: '立即开始',
  schedule: '预约时间',
}

export function toLabel(value: string | null | undefined, labels: Record<string, string>) {
  if (!value) return ''
  return labels[value] ?? value
}
