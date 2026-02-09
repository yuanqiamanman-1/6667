'use client'

import { createContext, useContext, useState, useCallback, type ReactNode, useEffect } from 'react'
import { apiClient, ApiError } from './api-client'

import { useRouter, usePathname } from 'next/navigation'

// 用户角色类型
export type UserRole =
  | 'guest'
  | 'general_student'
  | 'university_student'
  | 'volunteer_teacher'
  | 'special_aid_student'
  | 'governance' // New unified role for admins
  | 'university_admin' // Legacy support if needed, but backend sends 'governance'
  | 'university_association_admin'
  | 'association_hq'
  | 'aid_school_admin'
  | 'student'
  | 'teacher'
  | 'school'
  | 'association'
  | 'superadmin'

// 认证状态
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected'

// Onboarding Status
export type OnboardingStatus = 'pending' | 'approved' | 'rejected'

// Admin Role
export interface AdminRole {
  role_code: string
  organization_id: string | null
}

// Capabilities
export interface Capabilities {
  can_access_admin_panel: boolean
  can_access_campus: boolean
  can_access_association: boolean
  can_manage_association: boolean
  can_manage_university: boolean
  can_manage_aid: boolean
  can_manage_platform: boolean
  can_audit_cross_campus: boolean
  role_display: string
}

// 用户信息接口
export interface User {
  id: string
  name: string
  email: string
  avatar: string
  role: UserRole
  school?: string
  grade?: string
  bio?: string
  tags?: string[]
  points: number
  level: number
  verification: {
    student: VerificationStatus
    teacher: VerificationStatus
    aid?: VerificationStatus
    generalBasic?: VerificationStatus
  }
  onboarding_status: OnboardingStatus
  admin_roles: AdminRole[]
  capabilities: Capabilities
  stats: {
    helpCount: number
    answerCount: number
    postCount: number
    rating: number
  }
  createdAt: string
}

// ... MOCK_USERS (Keep as fallback or remove if confident) ...

// 上下文接口
interface UserContextType {
  user: User | null
  isLoggedIn: boolean
  isLoading: boolean
  login: (userId: string, password: string) => Promise<boolean>
  logout: () => void
  switchUser: (userId: string) => void
  updateUser: (updates: Partial<User>) => void
  refreshUser: () => Promise<boolean>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

// Provider 组件
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasToken, setHasToken] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // 从 API 获取用户信息
  const fetchUser = useCallback(async (token: string) => {
    try {
      const [userData, pointsResponse] = await Promise.all([
        apiClient.get<any>('/auth/me', token),
        apiClient.get<any>('/match/points/balance', token).catch(() => 0) // Handle 404/Error for points
      ]);

      // 解析 Profile (如果存在)
      let profile = {};
      if (userData.profile) {
        try {
          profile = JSON.parse(userData.profile);
        } catch (e) {
          console.error('Failed to parse user profile', e);
        }
      }

      // 映射到前端 User 结构
      const derivedVerification = (() => {
        const fromProfile = (profile as any).verification
        if (fromProfile) return fromProfile
        if (userData.role === 'university_student') return { student: 'verified', teacher: 'none' }
        if (userData.role === 'volunteer_teacher') return { student: 'verified', teacher: 'pending' }
        return { student: 'none', teacher: 'none' }
      })()

      const mappedUser: User = {
        id: userData.id,
        name: userData.full_name || userData.username,
        email: userData.email,
        role: userData.role as UserRole,
        school: userData.school_id,
        // Profile 扩展字段
        avatar: (profile as any).avatar || '/placeholder.svg',
        grade: (profile as any).grade,
        bio: (profile as any).bio,
        tags: (profile as any).tags || [],
        level: (profile as any).level || 1,
        verification: derivedVerification,
        stats: (profile as any).stats || { helpCount: 0, answerCount: 0, postCount: 0, rating: 5.0 },
        
        // New Fields
        onboarding_status: userData.onboarding_status || 'approved',
        admin_roles: userData.admin_roles || [],
        capabilities: userData.capabilities || {
             can_access_admin_panel: false,
             can_access_campus: false,
             can_access_association: false,
             can_manage_association: false,
             can_manage_university: false,
             can_manage_aid: false,
             can_manage_platform: false,
             can_audit_cross_campus: false,
             role_display: userData.role
        },
        
        createdAt: userData.created_at,
        points: typeof pointsResponse === 'number' ? pointsResponse : 0
      };

      setUser(mappedUser);
      
      // Onboarding Check
      if (mappedUser.onboarding_status === 'pending') {
          if (pathname !== '/onboarding/pending' && pathname !== '/login') {
             router.push('/onboarding/pending')
          }
      } else if (mappedUser.onboarding_status === 'rejected') {
          if (pathname !== '/onboarding/rejected' && pathname !== '/login') {
              router.push('/onboarding/rejected')
          }
      }

      return true;
    } catch (error) {
      const status = error instanceof ApiError ? error.status : undefined
      if (status === 401 || status === 403) {
        console.error('Fetch user failed', error)
        localStorage.removeItem('token')
        setUser(null)
        setHasToken(false)
        return false
      }
      console.error('Fetch user failed', error)
      return false
    }
  }, [router, pathname]);

  // 初始化检查 Token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setHasToken(false)
      setIsLoading(false)
      setInitialized(true)
      return
    }
    setHasToken(true)
    setIsLoading(true)
    fetchUser(token)
      .finally(() => {
        setIsLoading(false)
        setInitialized(true)
      })
  }, [fetchUser]);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token') || undefined
    if (!token) return false
    return await fetchUser(token)
  }, [fetchUser])

  useEffect(() => {
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    const timer = setInterval(async () => {
      try {
        const raw = await apiClient.get<any[]>(`/notifications?unread_only=true&limit=20`, token)
        if (!Array.isArray(raw) || raw.length === 0) return
        const shouldRefresh = raw.some((n: any) =>
          n && typeof n.type === 'string' && (n.type === 'verification_reviewed' || n.type === 'verification_revoked'),
        )
        if (shouldRefresh) await fetchUser(token)
      } catch {
        return
      }
    }, 10000)
    return () => clearInterval(timer)
  }, [fetchUser])

  const login = useCallback(async (userId: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const formData = new FormData();
      formData.append('username', userId);
      formData.append('password', password);

      const response = await apiClient.postForm<{ access_token: string }>('/auth/login/access-token', formData);
      
      if (response.access_token) {
        localStorage.setItem('token', response.access_token);
        setHasToken(true)
        await fetchUser(response.access_token);
        setIsLoading(false);
        return true;
      }
      return false;
    } catch (error) {
      if (!(error instanceof ApiError) || error.status >= 500) {
        console.error('Login failed', error)
      }
      setIsLoading(false);
      return false;
    }
  }, [fetchUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setHasToken(false)
  }, [])

  const switchUser = useCallback((userId: string) => {
    // 演示模式：使用默认密码重新登录
    login(userId, '123456');
  }, [login])

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null)
  }, [])

  return (
    <UserContext.Provider
      value={{
        user,
        isLoggedIn: (user !== null && user.role !== 'guest') || hasToken,
        isLoading,
        login,
        logout,
        switchUser,
        updateUser,
        refreshUser,
      }}
    >
      {initialized ? children : null}
    </UserContext.Provider>
  )
}

// Hook
export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

// 权限检查函数
export function canAccessTeacherFeatures(user: User | null): boolean {
  return (
    (user?.role === 'teacher' || user?.role === 'volunteer_teacher') &&
    user.verification.teacher === 'verified'
  )
}

export function canAccessStudentFeatures(user: User | null): boolean {
  return user !== null && user.role !== 'guest'
}

export function needsVerification(user: User | null, type: 'student' | 'teacher'): boolean {
  if (!user) return true
  return user.verification[type] !== 'verified'
}
