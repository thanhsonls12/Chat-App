export const getIceServers = (): RTCIceServer[] => {
  const iceServers: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }]
  // Set VITE_TURN_URL / USERNAME / CREDENTIAL (see frontend/.env.example) for NAT.

  const turnUrl = import.meta.env.VITE_TURN_URL
  if (turnUrl) {
    iceServers.push({
      urls: turnUrl,
      username: import.meta.env.VITE_TURN_USERNAME,
      credential: import.meta.env.VITE_TURN_CREDENTIAL,
    })
  }

  return iceServers
}

export const createPeerConnection = () =>
  new RTCPeerConnection({ iceServers: getIceServers() })

export const getLocalMediaStream = async () => {
  return navigator.mediaDevices.getUserMedia({ video: false, audio: true })
}

export const stopStream = (stream: MediaStream | null) => {
  stream?.getTracks().forEach((track) => track.stop())
}
