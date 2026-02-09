// 云助学设计系统常量

// 配色系统
export const COLORS = {
  // 主色调
  primary: '#002FA7', // 克莱因蓝
  secondary: '#9CD5D5', // 浅青色（Logo辅助色）
  accent: '#5B9BD5', // 中蓝
  
  // 中性色
  white: '#FFFFFF',
  gray: {
    50: '#F5F7FA',
    100: '#E2E8F0',
    200: '#CBD5E1',
    300: '#94A3B8',
    400: '#64748B',
    500: '#475569',
    600: '#334155',
    700: '#2D3748',
    800: '#1E293B',
    900: '#0F172A',
  },
  
  // 线条色
  line: '#001F3F', // 深蓝
  
  // 功能色
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const

// 动画时长
export const DURATIONS = {
  fast: 300,
  normal: 500,
  slow: 800,
} as const

// 动画缓动函数
export const EASINGS = {
  default: [0.4, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  },
} as const

// 响应式断点
export const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  laptop: 1024,
  desktop: 1280,
} as const

// 导航菜单（登录后使用）
export const NAV_ITEMS = [
  { label: '首页', href: '/home', icon: 'Home' },
  { label: '匹配', href: '/match/help', icon: 'Users' },
  { label: '问答', href: '/qa', icon: 'MessageCircle' },
  { label: '社区', href: '/community', icon: 'Heart' },
  { label: '知识库', href: '/knowledge', icon: 'BookOpen' },
  { label: '高校', href: '/campus', icon: 'GraduationCap' },
  { label: '消息', href: '/messages', icon: 'Mail' },
  { label: '我的', href: '/profile', icon: 'User' },
] as const

// 云助学快捷入口
export const QUICK_ACTIONS = [
  {
    title: '我要求助',
    description: '资源匮乏地区学生发起公益求助',
    icon: 'HeartHandshake',
    href: '/match/help',
    color: 'primary',
  },
  {
    title: '成为志愿者',
    description: '加入云助学，传递知识与温暖',
    icon: 'GraduationCap',
    href: '/volunteer',
    color: 'secondary',
  },
  {
    title: '高校入驻',
    description: '打造专属校园交流空间',
    icon: 'Building2',
    href: '/university/register',
    color: 'accent',
  },
] as const
