import type { User } from './User'

export interface AuthState {
  accessToken: string | null
  user: User | null
  loading: boolean

  signUp: (
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string
  ) => Promise<void>

  signIn: (username: string, password: string) => Promise<void>

  signOut: () => Promise<void>

  clearState: () => void

  fetchMe: () => Promise<void>

  refresh: () => Promise<void>

  setAccessToken: (accessToken: string) => void
}
