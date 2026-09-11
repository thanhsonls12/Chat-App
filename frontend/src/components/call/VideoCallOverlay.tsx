import { useEffect, useRef, useState } from 'react'
import { useCallStore } from '@/stores/useCallStore'
import { Button } from '../ui/button'
import UserAvatar from '../chat/UserAvatar'
import { cn } from '@/lib/utils'
import {
  Mic,
  MicOff,
  PhoneOff,
  Video as VideoIcon,
  VideoOff,
} from 'lucide-react'
import type { CallStatus } from '@/types/call'
import { useI18n } from '@/i18n'

const STATUS_KEY: Record<CallStatus, 'preparingCamera' | 'calling' | 'incomingCall' | 'connecting' | 'connected' | 'ended' | 'failed' | null> = {
  idle: null,
  preparing: 'preparingCamera',
  outgoing: 'calling',
  incoming: 'incomingCall',
  connecting: 'connecting',
  connected: 'connected',
  ended: 'ended',
  failed: 'failed',
}

function StreamVideo({
  stream,
  muted,
  mirror,
  className,
}: {
  stream: MediaStream | null
  muted?: boolean
  mirror?: boolean
  className?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream
  }, [stream])
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      className={cn(className, mirror && 'scale-x-[-1]')}
    />
  )
}

const formatDuration = (seconds: number) => {
  const mm = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const ss = (seconds % 60).toString().padStart(2, '0')
  return `${mm}:${ss}`
}

export default function VideoCallOverlay() {
  const {
    status,
    peer,
    localStream,
    remoteStream,
    micEnabled,
    camEnabled,
    startedAt,
    toggleMic,
    toggleCam,
    endCall,
  } = useCallStore()
  const { t } = useI18n()
  const statusLabel = (s: CallStatus) => {
    const key = STATUS_KEY[s]
    return key ? t(key) : ''
  }

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (status !== 'connected' || !startedAt) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [status, startedAt])

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

  const hasRemote = status === 'connected' && !!remoteStream
  const hasVideoTrack = (localStream?.getVideoTracks().length ?? 0) > 0
  const showControls =
    status === 'preparing' ||
    status === 'outgoing' ||
    status === 'connecting' ||
    status === 'connected'

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-neutral-950 text-white">
      <div className="absolute inset-0">
        {hasRemote ? (
          <StreamVideo
            stream={remoteStream}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4">
            <UserAvatar
              type="profile"
              name={peer.displayName}
              avatarUrl={peer.avatarUrl}
            />
            <p className="text-xl font-semibold">{peer.displayName}</p>
            <p className="text-sm text-neutral-300 motion-safe:animate-pulse">
              {statusLabel(status)}
            </p>
          </div>
        )}
      </div>

      <div className="relative z-10 flex items-center justify-between p-4">
        <div>
          <p className="font-semibold">{peer.displayName}</p>
          <p className="text-sm text-neutral-300">
            {status === 'connected'
              ? formatDuration(elapsed)
              : statusLabel(status)}
          </p>
        </div>
      </div>

      {localStream && (
        <div className="absolute right-3 top-3 z-20 h-32 w-24 overflow-hidden rounded-xl border border-white/20 bg-black shadow-lg sm:right-4 sm:top-4 sm:h-48 sm:w-36">
          <StreamVideo
            stream={localStream}
            muted
            mirror
            className={cn(
              'h-full w-full object-cover',
              !camEnabled && 'opacity-0'
            )}
          />
          {!camEnabled && (
            <div className="absolute inset-0 flex items-center justify-center">
              <VideoOff className="size-6 text-neutral-400" />
            </div>
          )}
        </div>
      )}

      {showControls && (
        <div className="relative z-10 mt-auto flex items-center justify-center gap-5 px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8 sm:gap-6 sm:px-8">
          <Button
            size="icon"
            variant={micEnabled ? 'secondary' : 'destructive'}
            className="size-14 rounded-full transition-transform duration-150 active:scale-95 motion-reduce:transition-none"
            onClick={toggleMic}
            disabled={!localStream}
            aria-label={micEnabled ? t('muteMicrophone') : t('unmuteMicrophone')}
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
          <Button
            size="icon"
            variant={camEnabled ? 'secondary' : 'destructive'}
            className="size-14 rounded-full transition-transform duration-150 active:scale-95 motion-reduce:transition-none"
            onClick={toggleCam}
            disabled={!hasVideoTrack}
            aria-label={camEnabled ? t('disableCamera') : t('enableCamera')}
          >
            {camEnabled ? (
              <VideoIcon className="size-6" />
            ) : (
              <VideoOff className="size-6" />
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
