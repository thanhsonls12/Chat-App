import { create } from 'zustand'
import { toast } from 'sonner'
import { authService } from '@/services/authService'
import type { AuthState } from '@/types/store'
import { persist } from 'zustand/middleware'
import { useChatStore } from './useChatStore'
import { t } from '@/i18n'
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      loading: false,
      setUser: (user) => {
        set({ user })
      },
      setAccessToken: (accessToken: string) => {
        set({ accessToken })
      },

      clearState: () => {
        set({ accessToken: null, user: null, loading: false })
        useChatStore.getState().reset()
      },

      signUp: async (username, password, email, firstName, lastName) => {
        try {
          set({ loading: true })

          await authService.signUp(
            username,
            password,
            email,
            firstName,
            lastName
          )

          toast.success(
            t('signUpSuccess')
          )
        } catch (error) {
          console.error(error)
          toast.error(t('signUpFailed'))
          throw error
        } finally {
          set({ loading: false })
        }
      },

      signIn: async (username, password) => {
        try {
          set({ loading: true })
          useChatStore.getState().reset()
          const { accessToken } = await authService.signIn(username, password)
          get().setAccessToken(accessToken)
          await get().fetchMe()
          useChatStore.getState().fetchConversations()
          toast.success(t('signInSuccess'))
        } catch (error) {
          console.error(error)
          toast.error(t('signInFailed'))
          throw error
        } finally {
          set({ loading: false })
        }
      },

      signOut: async () => {
        try {
          get().clearState()
          await authService.signOut()
          toast.success(t('signOutSuccess'))
        } catch (error) {
          console.error(error)
          toast.error(t('signOutFailed'))
        }
      },

      fetchMe: async () => {
        try {
          set({ loading: true })

          const user = await authService.fetchMe()

          set({ user })
        } catch (error) {
          console.error(error)
          set({ user: null, accessToken: null })
          toast.error(t('fetchUserFailed'))
        } finally {
          set({ loading: false })
        }
      },

      refresh: async () => {
        try {
          set({ loading: true })
          const { user, fetchMe, setAccessToken } = get()
          const accessToken = await authService.refresh()
          setAccessToken(accessToken)
          if (!user) {
            await fetchMe()
          }
        } catch (error) {
          console.error(error)
          toast.error(t('sessionExpired'))

          get().clearState()
        } finally {
          set({ loading: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
)
