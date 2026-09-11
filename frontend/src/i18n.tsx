import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Language = 'vi' | 'en'

const messages = {
  vi: {
    language: 'Ngôn ngữ',
    vietnamese: 'Tiếng Việt',
    english: 'English',
    signInTitle: 'Đăng nhập Chat',
    signInWelcome: 'Chào mừng bạn! Hãy đăng nhập để bắt đầu',
    username: 'Tên đăng nhập',
    password: 'Mật khẩu',
    usernameMin: 'Tên đăng nhập phải có ít nhất 3 ký tự',
    passwordMin: 'Mật khẩu phải có ít nhất 6 ký tự',
    signIn: 'Đăng nhập',
    signUp: 'Đăng ký',
    noAccount: 'Chưa có tài khoản?',
    continueNotice: 'Bằng cách tiếp tục, bạn đồng ý với',
    terms: 'Điều khoản dịch vụ',
    privacy: 'Chính sách bảo mật',
    and: 'và',
    chatGroups: 'Nhóm Chat',
    friends: 'Bạn bè',
    createGroup: 'Tạo Nhóm',
    account: 'Tài khoản',
    notifications: 'Thông báo',
    welcome: 'Chào mừng bạn đến với Chat App',
    welcomeHint:
      'Bắt đầu một cuộc trò chuyện mới hoặc chọn một cuộc trò chuyện từ danh sách bên dưới.',
    incomingVideoCall: 'Cuộc gọi video đến',
    callingYou: 'đang gọi cho bạn...',
    preparingCamera: 'Đang chuẩn bị camera...',
    calling: 'Đang gọi...',
    incomingCall: 'Cuộc gọi đến',
    connecting: 'Đang kết nối...',
    connected: 'Đã kết nối',
    ended: 'Đã kết thúc',
    failed: 'Kết nối thất bại',
    videoCall: 'Gọi video',
    connectTimeout: 'Kết nối cuộc gọi quá thời gian',
    connectionLost: 'Mất kết nối cuộc gọi',
    connectionLostLong: 'Mất kết nối quá lâu, đã kết thúc cuộc gọi',
    mediaUnavailable: 'Không thể truy cập camera hoặc micro',
    noResponse: 'Không có phản hồi',
    setupFailed: 'Không thể thiết lập cuộc gọi',
    callRejected: 'Cuộc gọi bị từ chối',
    userBusy: 'Người dùng đang bận',
    userOffline: 'Người dùng không trực tuyến',
    signUpSuccess: 'Đăng ký thành công! Bạn sẽ được chuyển sang trang đăng nhập',
    signUpFailed: 'Đăng ký không thành công',
    signInSuccess: 'Đăng nhập thành công',
    signInFailed: 'Đăng nhập không thành công',
    signOutSuccess: 'Đăng xuất thành công',
    signOutFailed: 'Lỗi khi đăng xuất. Hãy thử lại',
    fetchUserFailed: 'Lỗi xảy ra khi lấy dữ liệu người dùng. Hãy thử lại',
    sessionExpired: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại',
  },
  en: {
    language: 'Language',
    vietnamese: 'Tiếng Việt',
    english: 'English',
    signInTitle: 'Sign in to Chat',
    signInWelcome: 'Welcome back! Sign in to get started',
    username: 'Username',
    password: 'Password',
    usernameMin: 'Username must be at least 3 characters',
    passwordMin: 'Password must be at least 6 characters',
    signIn: 'Sign in',
    signUp: 'Sign up',
    noAccount: "Don't have an account?",
    continueNotice: 'By continuing, you agree to our',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    and: 'and',
    chatGroups: 'Chat groups',
    friends: 'Friends',
    createGroup: 'Create group',
    account: 'Account',
    notifications: 'Notifications',
    welcome: 'Welcome to Chat App',
    welcomeHint: 'Start a new conversation or choose one from the list below.',
    incomingVideoCall: 'Incoming video call',
    callingYou: 'is calling you...',
    preparingCamera: 'Preparing camera...',
    calling: 'Calling...',
    incomingCall: 'Incoming call',
    connecting: 'Connecting...',
    connected: 'Connected',
    ended: 'Ended',
    failed: 'Connection failed',
    videoCall: 'Video call',
    connectTimeout: 'Call connection timed out',
    connectionLost: 'Call connection lost',
    connectionLostLong: 'Disconnected for too long, the call has ended',
    mediaUnavailable: 'Cannot access camera or microphone',
    noResponse: 'No response',
    setupFailed: 'Failed to set up the call',
    callRejected: 'Call rejected',
    userBusy: 'User is busy',
    userOffline: 'User is not online',
    signUpSuccess: 'Sign up successful! Redirecting you to sign in',
    signUpFailed: 'Sign up failed',
    signInSuccess: 'Signed in successfully',
    signInFailed: 'Sign in failed',
    signOutSuccess: 'Signed out successfully',
    signOutFailed: 'Error signing out. Try again',
    fetchUserFailed: 'Error fetching your data. Try again',
    sessionExpired: 'Your session has expired. Please sign in again',
  },
} as const

type Key = keyof typeof messages.en
type ContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: Key) => string
}

const I18nContext = createContext<ContextValue | null>(null)
const STORAGE_KEY = 'chat-app-language'

const readStoredLanguage = (): Language => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'en' || stored === 'vi' ? stored : 'vi'
  } catch {
    return 'vi'
  }
}

let currentLanguage: Language =
  typeof window !== 'undefined' ? readStoredLanguage() : 'vi'

// eslint-disable-next-line react-refresh/only-export-components
export const t = (key: Key) =>
  messages[currentLanguage][key] ?? messages.vi[key] ?? key

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage)

  const setLanguage = (next: Language) => {
    setLanguageState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
    currentLanguage = next
  }

  useEffect(() => {
    currentLanguage = language
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: Key) => messages[language][key] ?? messages.vi[key] ?? key,
    }),
    [language]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside I18nProvider')
  return context
}
