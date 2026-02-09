// 云助学平台 - 完整虚拟数据系统

// 头像列表
export const AVATAR_OPTIONS = [
  '/avatars/avatar-01.jpg',
  '/avatars/avatar-02.jpg',
  '/avatars/avatar-03.jpg',
  '/avatars/avatar-04.jpg',
  '/avatars/avatar-05.jpg',
  '/avatars/avatar-06.jpg',
  '/avatars/avatar-07.jpg',
  '/avatars/avatar-08.jpg',
  '/avatars/avatar-09.jpg',
  '/avatars/avatar-10.jpg',
  '/avatars/avatar-11.jpg',
  '/avatars/avatar-12.jpg',
]

// 扩展的问答数据
export const MOCK_QUESTIONS = [
  {
    id: 1,
    title: '高中数学函数题求解',
    content: '已知函数f(x)=x²-2x+3，求其最小值及对应的x值',
    subject: '数学',
    author: {
      name: '小明',
      avatar: '/avatars/avatar-01.jpg',
      level: 3
    },
    tags: ['数学', '函数', '高中'],
    reward: 50,
    answers: 3,
    views: 125,
    solved: true,
    createdAt: '2024-01-20',
  },
  {
    id: 2,
    title: '英语语法：现在完成时的使用',
    content: 'I have been to Beijing和I have gone to Beijing有什么区别？',
    subject: '英语',
    author: {
      name: '小红',
      avatar: '/avatars/avatar-03.jpg',
      level: 2
    },
    tags: ['英语', '语法', '时态'],
    reward: 30,
    answers: 5,
    views: 203,
    solved: true,
    createdAt: '2024-01-19',
  },
  {
    id: 3,
    title: '物理电路分析题请教',
    content: '如何判断电路中的短路和断路情况？需要详细步骤',
    subject: '物理',
    author: {
      name: '小刚',
      avatar: '/avatars/avatar-04.jpg',
      level: 4
    },
    tags: ['物理', '电路', '初中'],
    reward: 80,
    answers: 2,
    views: 89,
    solved: false,
    createdAt: '2024-01-21',
  },
  {
    id: 4,
    title: '化学方程式配平技巧',
    content: '复杂的氧化还原反应方程式该如何配平？',
    subject: '化学',
    author: {
      name: '小芳',
      avatar: '/avatars/avatar-05.jpg',
      level: 3
    },
    tags: ['化学', '方程式', '高中'],
    reward: 60,
    answers: 4,
    views: 156,
    solved: true,
    createdAt: '2024-01-18',
  },
  {
    id: 5,
    title: '历史事件时间轴整理',
    content: '中国近代史的重要事件如何记忆？求助记方法',
    subject: '历史',
    author: {
      name: '小华',
      avatar: '/avatars/avatar-10.jpg',
      level: 2
    },
    tags: ['历史', '记忆方法', '高中'],
    reward: 40,
    answers: 6,
    views: 234,
    solved: true,
    createdAt: '2024-01-17',
  },
  {
    id: 6,
    title: '生物细胞结构知识点总结',
    content: '动物细胞和植物细胞的区别是什么？有哪些共同点？',
    subject: '生物',
    author: {
      name: '小丽',
      avatar: '/avatars/avatar-05.jpg',
      level: 3
    },
    tags: ['生物', '细胞', '初中'],
    reward: 45,
    answers: 4,
    views: 167,
    solved: true,
    createdAt: '2024-01-16',
  },
  {
    id: 7,
    title: '语文作文如何提高文采',
    content: '写作文总是平平无奇，如何让语言更生动优美？',
    subject: '语文',
    author: {
      name: '小强',
      avatar: '/avatars/avatar-11.jpg',
      level: 2
    },
    tags: ['语文', '作文', '写作技巧'],
    reward: 35,
    answers: 8,
    views: 198,
    solved: false,
    createdAt: '2024-01-15',
  },
  {
    id: 8,
    title: 'Python循环语句怎么用',
    content: 'for循环和while循环的区别，什么时候用哪个？',
    subject: '编程',
    author: {
      name: '小张',
      avatar: '/avatars/avatar-02.jpg',
      level: 4
    },
    tags: ['编程', 'Python', '循环'],
    reward: 60,
    answers: 5,
    views: 145,
    solved: true,
    createdAt: '2024-01-14',
  },
  {
    id: 9,
    title: '物理力学压强问题',
    content: '液体压强和大气压强的计算公式分别是什么？',
    subject: '物理',
    author: {
      name: '小王',
      avatar: '/avatars/avatar-04.jpg',
      level: 3
    },
    tags: ['物理', '压强', '初中'],
    reward: 55,
    answers: 3,
    views: 112,
    solved: false,
    createdAt: '2024-01-13',
  },
  {
    id: 10,
    title: '英语单词记忆方法',
    content: '有什么好的方法可以快速记住英语单词并且不容易忘？',
    subject: '英语',
    author: {
      name: '小美',
      avatar: '/avatars/avatar-03.jpg',
      level: 2
    },
    tags: ['英语', '单词', '记忆方法'],
    reward: 40,
    answers: 9,
    views: 267,
    solved: true,
    createdAt: '2024-01-12',
  },
  {
    id: 11,
    title: '数学三角函数公式推导',
    content: '正弦定理和余弦定理是如何推导出来的？求详细过程',
    subject: '数学',
    author: {
      name: '小李',
      avatar: '/avatars/avatar-01.jpg',
      level: 4
    },
    tags: ['数学', '三角函数', '高中'],
    reward: 70,
    answers: 2,
    views: 95,
    solved: false,
    createdAt: '2024-01-11',
  },
  {
    id: 12,
    title: '化学实验安全注意事项',
    content: '做化学实验时有哪些必须注意的安全事项？',
    subject: '化学',
    author: {
      name: '小周',
      avatar: '/avatars/avatar-05.jpg',
      level: 3
    },
    tags: ['化学', '实验', '安全'],
    reward: 30,
    answers: 7,
    views: 178,
    solved: true,
    createdAt: '2024-01-10',
  },
]

// 扩展的社区动态
export const MOCK_POSTS = [
  {
    id: 1,
    author: {
      name: '李老师',
      avatar: '/avatars/avatar-06.jpg',
      role: 'teacher',
      university: '北京大学'
    },
    content: '刚刚帮助一位云南的同学解决了数学难题，看到他恍然大悟的表情真的很开心！教育的力量就是这样温暖～',
    images: [],
    likes: 89,
    comments: 12,
    shares: 5,
    createdAt: '2小时前',
    tags: ['志愿感悟', '数学辅导']
  },
  {
    id: 2,
    author: {
      name: '小明',
      avatar: '/avatars/avatar-01.jpg',
      role: 'student',
      school: '昭通一中'
    },
    content: '感谢云助学平台！这个月在王老师的帮助下，我的英语成绩提升了20分！💪',
    images: [],
    likes: 156,
    comments: 28,
    shares: 8,
    createdAt: '5小时前',
    tags: ['学习进步', '感谢']
  },
  {
    id: 3,
    author: {
      name: '张志愿',
      avatar: '/avatars/avatar-07.jpg',
      role: 'teacher',
      university: '清华大学'
    },
    content: '分享一下物理学习技巧：理解概念比死记公式更重要！推荐大家多做实验，培养物理思维',
    images: [],
    likes: 234,
    comments: 45,
    shares: 67,
    createdAt: '1天前',
    tags: ['学习方法', '物理']
  },
  {
    id: 4,
    author: {
      name: '小红',
      avatar: '/avatars/avatar-03.jpg',
      role: 'student',
      school: '丽江二中'
    },
    content: '今天第一次体验视频辅导，老师很耐心！以前不敢问的问题现在都能得到解答了～',
    images: [],
    likes: 78,
    comments: 15,
    shares: 3,
    createdAt: '1天前',
    tags: ['学习体验']
  },
]

// 扩展的知识库资源
export const MOCK_RESOURCES = [
  {
    id: 1,
    title: '高中数学必修一知识点总结',
    type: 'document',
    category: '数学',
    grade: '高中',
    description: '涵盖集合、函数、指数对数等核心知识点',
    author: '王老师',
    downloads: 1234,
    size: '2.3 MB',
    uploadedAt: '2024-01-15',
    thumbnail: '/illustrations/knowledge-math.jpg'
  },
  {
    id: 2,
    title: '英语语法精讲视频系列',
    type: 'video',
    category: '英语',
    grade: '初中',
    description: '系统讲解初中英语全部语法点，含练习题',
    author: '李老师',
    downloads: 892,
    duration: '3小时25分',
    uploadedAt: '2024-01-10',
    thumbnail: '/illustrations/knowledge-english.jpg'
  },
  {
    id: 3,
    title: '物理实验操作指南',
    type: 'document',
    category: '物理',
    grade: '高中',
    description: '高中物理常见实验的标准操作流程和注意事项',
    author: '张老师',
    downloads: 567,
    size: '5.1 MB',
    uploadedAt: '2024-01-12',
    thumbnail: '/illustrations/knowledge-physics.jpg'
  },
  {
    id: 4,
    title: '化学元素周期表记忆法',
    type: 'video',
    category: '化学',
    grade: '初中',
    description: '趣味记忆法帮你快速掌握元素周期表',
    author: '刘老师',
    downloads: 723,
    duration: '45分钟',
    uploadedAt: '2024-01-08',
    thumbnail: '/illustrations/knowledge-chemistry.jpg'
  },
]

// 志愿者数据（用于匹配结果）
export const MOCK_VOLUNTEERS = [
  {
    id: 1,
    name: '王老师',
    avatar: '/avatars/avatar-06.jpg',
    university: '北京大学',
    major: '数学系',
    grade: '研究生',
    tags: ['数学', '物理', '高中'],
    rating: 4.9,
    helpCount: 156,
    matchScore: 95,
    online: true,
    bio: '擅长高中数理化，耐心细致，善于引导学生思考',
    availableTime: ['周一 19:00-21:00', '周三 19:00-21:00', '周六 14:00-18:00']
  },
  {
    id: 2,
    name: '李老师',
    avatar: '/avatars/avatar-08.jpg',
    university: '清华大学',
    major: '英语系',
    grade: '本科四年级',
    tags: ['英语', '语文', '初中', '高中'],
    rating: 4.8,
    helpCount: 203,
    matchScore: 92,
    online: true,
    bio: '英语专八，口语流利，擅长语法讲解和写作指导',
    availableTime: ['周二 19:00-21:00', '周四 19:00-21:00', '周日 9:00-12:00']
  },
  {
    id: 3,
    name: '张老师',
    avatar: '/avatars/avatar-07.jpg',
    university: '复旦大学',
    major: '物理系',
    grade: '研究生',
    tags: ['物理', '化学', '高中'],
    rating: 4.7,
    helpCount: 98,
    matchScore: 88,
    online: false,
    bio: '物理竞赛金牌，善于用生活案例讲解抽象概念',
    availableTime: ['周五 20:00-22:00', '周六 16:00-18:00']
  },
  {
    id: 4,
    name: '刘老师',
    avatar: '/avatars/avatar-12.jpg',
    university: '浙江大学',
    major: '化学系',
    grade: '本科三年级',
    tags: ['化学', '生物', '初中', '高中'],
    rating: 4.8,
    helpCount: 134,
    matchScore: 90,
    online: true,
    bio: '化学竞赛省一等奖，擅长实验讲解和方程式配平',
    availableTime: ['每天 18:00-20:00']
  },
  {
    id: 5,
    name: '陈老师',
    avatar: '/avatars/avatar-09.jpg',
    university: '上海交通大学',
    major: '计算机系',
    grade: '研究生',
    tags: ['数学', '信息技术', '高中'],
    rating: 4.6,
    helpCount: 76,
    matchScore: 85,
    online: false,
    bio: '编程竞赛选手，数学逻辑能力强，善于培养计算思维',
    availableTime: ['周末全天']
  },
]

// 合作高校数据
export const MOCK_UNIVERSITIES = [
  {
    id: 1,
    name: '北京大学',
    logo: '/universities/pku.jpg',
    volunteers: 234,
    helpCount: 3456,
    specialties: ['数学', '物理', '化学', '英语'],
    joinedAt: '2023-06-01'
  },
  {
    id: 2,
    name: '清华大学',
    logo: '/universities/tsinghua.jpg',
    volunteers: 198,
    helpCount: 2890,
    specialties: ['数学', '物理', '英语', '信息技术'],
    joinedAt: '2023-06-01'
  },
  {
    id: 3,
    name: '复旦大学',
    logo: '/universities/fudan.jpg',
    volunteers: 167,
    helpCount: 2345,
    specialties: ['英语', '语文', '历史', '地理'],
    joinedAt: '2023-07-15'
  },
  {
    id: 4,
    name: '浙江大学',
    logo: '/universities/zju.jpg',
    volunteers: 145,
    helpCount: 1998,
    specialties: ['化学', '生物', '数学', '物理'],
    joinedAt: '2023-08-01'
  },
]

// 消息会话数据
export const MOCK_CONVERSATIONS = [
  {
    id: 1,
    teacher: {
      name: '王老师',
      avatar: '/avatars/avatar-06.jpg',
      online: true
    },
    lastMessage: '明天晚上7点我们继续讲解这道题吧',
    unread: 2,
    timestamp: '10分钟前',
    type: 'teaching'
  },
  {
    id: 2,
    teacher: {
      name: '李老师',
      avatar: '/avatars/avatar-08.jpg',
      online: false
    },
    lastMessage: '你的作文写得不错，注意语法细节',
    unread: 0,
    timestamp: '2小时前',
    type: 'teaching'
  },
  {
    id: 3,
    teacher: {
      name: '系统通知',
      avatar: '/logo.png',
      online: true
    },
    lastMessage: '你的学生认证已通过审核',
    unread: 1,
    timestamp: '昨天',
    type: 'system'
  },
]
