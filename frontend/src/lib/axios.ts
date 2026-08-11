import { useAuthStore } from '@/stores/useAuthStore'
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

interface RefreshTokenResponse {
  accessToken: string
}

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined

    if (
      !originalRequest ||
      originalRequest.url?.includes('/auth/signin') ||
      originalRequest.url?.includes('/auth/signup') ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      try {
        originalRequest._retry = true
        const res = await api.post<RefreshTokenResponse>(
          '/auth/refresh',
          {},
          { withCredentials: true }
        )
        const newAccessToken = res.data.accessToken
        useAuthStore.getState().setAccessToken(newAccessToken)

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

        return api(originalRequest)
      } catch (error) {
        useAuthStore.getState().clearState()
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default api
