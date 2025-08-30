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
      // 檢查瀏覽器支援
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this environment')
      }

      // 創建 AudioContext
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // 如果 AudioContext 被暫停，嘗試恢復
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      // 請求麥克風權限
      mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      const source = audioContext.createMediaStreamSource(mediaStream)
      analyser = audioContext.createAnalyser()
      source.connect(analyser)
      analyser.fftSize = 512
      const dataArray = new Uint8Array(analyser.fftSize)

      isStarted = true
      console.log('VoiceDetectUtility started successfully')

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
      
      // 提供更詳細的錯誤信息
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          console.error('Microphone permission denied')
        } else if (error.name === 'NotFoundError') {
          console.error('No microphone found')
        } else if (error.name === 'NotSupportedError') {
          console.error('Microphone not supported')
        }
      }
      
      throw error
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
