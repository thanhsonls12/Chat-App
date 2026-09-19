import { useEffect, useRef, useState } from 'react'
import { useCallStore } from '@/stores/useCallStore'
import { Button } from '../ui/button'
import UserAvatar from '../chat/UserAvatar'
import { Mic, MicOff, PhoneOff } from 'lucide-react'
import type { CallStatus } from '@/types/call'
import { useI18n } from '@/i18n'

const STATUS_KEY: Record<
  CallStatus,
  | 'preparingMicrophone'
  | 'calling'
  | 'incomingCall'
  | 'connecting'
  | 'connected'
  | 'ended'
  | 'failed'
  | null
> = {
  idle: null,
  preparing: 'preparingMicrophone',
  outgoing: 'calling',
  incoming: 'incomingCall',
  connecting: 'connecting',
  connected: 'connected',
  ended: 'ended',
  failed: 'failed',
}

const formatDuration = (seconds: number) => {
  const mm = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const ss = (seconds % 60).toString().padStart(2, '0')
  return `${mm}:${ss}`
}

export default function VoiceCallOverlay() {
  const {
    status,
    peer,
    remoteStream,
    micEnabled,
    startedAt,
    toggleMic,
    endCall,
  } = useCallStore()
  const { t } = useI18n()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (audioRef.current) audioRef.current.srcObject = remoteStream
  }, [remoteStream])

  useEffect(() => {
    if (status !== 'connected' || !startedAt) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [status, startedAt])

  const statusLabel = (s: CallStatus) => {
    const key = STATUS_KEY[s]
    return key ? t(key) : ''
  }

  const elapsed =
    status === 'connected' && startedAt
      ? Math.max(0, Math.floor((now - startedAt) / 1000))
      : 0

  const visible =
    status === 'preparing' ||
    status === 'outgoing' ||
    status === 'connecting' ||
    status === 'connected' ||
    status === 'ended' ||
    status === 'failed'

  if (!visible || !peer) return null

  const showControls =
    status === 'preparing' ||
    status === 'outgoing' ||
    status === 'connecting' ||
    status === 'connected'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/95 p-4 text-white">
      <audio ref={audioRef} autoPlay />
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-white/10 bg-neutral-900 p-8 text-center shadow-2xl">
        <UserAvatar
          type="profile"
          name={peer.displayName}
          avatarUrl={peer.avatarUrl}
        />
        <div>
          <p className="text-xl font-semibold">{peer.displayName}</p>
          <p className="mt-1 text-sm text-neutral-300">
            {status === 'connected'
              ? formatDuration(elapsed)
              : statusLabel(status)}
          </p>
        </div>

        {showControls && (
          <div className="flex items-center justify-center gap-6 pt-2">
            <Button
              size="icon"
              variant={micEnabled ? 'secondary' : 'destructive'}
              className="size-14 rounded-full transition-transform duration-150 active:scale-95 motion-reduce:transition-none"
              onClick={toggleMic}
              aria-label={
                micEnabled ? t('muteMicrophone') : t('unmuteMicrophone')
              }
            >
              {micEnabled ? (
                <Mic className="size-6" />
              ) : (
                <MicOff className="size-6" />
              )}
            </Button>
            <Button
              size="icon"
              variant="destructive"
              className="size-16 rounded-full bg-red-600 text-white transition-transform duration-150 hover:bg-red-700 active:scale-95 motion-reduce:transition-none"
              onClick={endCall}
              aria-label={t('endCallAction')}
            >
              <PhoneOff className="size-7" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
