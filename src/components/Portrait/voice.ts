// 只偵測麥克風是否有聲音（分貝），不做語音辨識
type VoiceDetectUtilityParams = {
  onVoice?: () => void
  onSilence?: () => void
  threshold?: number  // 音量門檻，建議 0.02~0.1
  interval?: number   // 檢查間隔(ms)
}

export function VoiceDetectUtility(params: VoiceDetectUtilityParams = {}) {
  const {
    onVoice,
    onSilence,
    threshold = 0.05,
    interval = 100,
  } = params

  let audioContext: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let mediaStream: MediaStream | null = null
  let timer: number | null = null
  let isStarted = false

  const start = async () => {
    if (isStarted) return

    try {
      audioContext = new window.AudioContext()
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const source = audioContext.createMediaStreamSource(mediaStream)
      analyser = audioContext.createAnalyser()
      source.connect(analyser)
      analyser.fftSize = 512
      const dataArray = new Uint8Array(analyser.fftSize)

      isStarted = true

      timer = window.setInterval(() => {
        if (!analyser) return
        
        analyser.getByteTimeDomainData(dataArray)
        // 計算音量
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128
          sum += v * v
        }
        const volume = Math.sqrt(sum / dataArray.length)
        
        if (volume > threshold) {
          onVoice?.()
        } else {
          onSilence?.()
        }
      }, interval)
    } catch (error) {
      console.error('VoiceDetectUtility start failed:', error)
      isStarted = false
    }
  }

  const stop = () => {
    if (!isStarted) return

    if (timer) {
      clearInterval(timer)
      timer = null
    }
    
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop())
      mediaStream = null
    }
    
    if (audioContext) {
      audioContext.close()
      audioContext = null
    }
    
    analyser = null
    isStarted = false
  }

  const destroy = () => {
    stop()
  }

  return {
    start,
    stop,
    destroy,
  }
}
