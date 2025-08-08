type VoiceInputUtilityParams = {
  onStart?: () => void
  onStop?: () => void
  onError?: (error: SpeechRecognitionErrorEvent) => void
  onInput?: (content: string) => void
  onSilence?: () => void
  onSentenceEnd?: (sentence: string) => void // 新增斷句 callback
  interruption?: number  // ms of silence before restart, e.g. 3000
  maxSessionTime?: number // 最大 session 時長，預設 60 秒
}

export function VoiceInputUtility(params: VoiceInputUtilityParams = {}) {
  const {
    onStart,
    onStop,
    onError,
    onInput,
    onSilence,
    onSentenceEnd,
    interruption = 3000,
    maxSessionTime = 60000,
  } = params

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

  if (!SpeechRecognition) {
    throw new Error('SpeechRecognition is not supported in this browser.')
  }

  const recognition = new SpeechRecognition()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = 'zh-TW'

  let isRecognizing = false
  let transcriptBuffer = ''
  let pauseTimeout: ReturnType<typeof setTimeout> | null = null
  let sessionTimeout: ReturnType<typeof setTimeout> | null = null
  let lastSentence = ''

  const clearTimers = () => {
    if (pauseTimeout) clearTimeout(pauseTimeout)
    pauseTimeout = null
    if (sessionTimeout) clearTimeout(sessionTimeout)
    sessionTimeout = null
  }

  const restartRecognition = () => {
    // 斷句時觸發 callback
    if (transcriptBuffer.trim()) {
      onSentenceEnd?.(transcriptBuffer.trim())
      lastSentence = transcriptBuffer.trim()
    }
    transcriptBuffer = ''
    clearTimers()
    stop()
    setTimeout(() => {
      start()
    }, 50)
  }

  const start = () => {
    if (isRecognizing) return
    try {
      recognition.start()
      // 啟動 session 定時重啟
      if (sessionTimeout) clearTimeout(sessionTimeout)
      sessionTimeout = setTimeout(() => {
        // session 到期自動重啟
        restartRecognition()
      }, maxSessionTime)
    } catch {
      // ignore start errors if already started
    }
  }

  const stop = () => {
    if (!isRecognizing) return
    recognition.stop()
  }

  recognition.onstart = () => {
    isRecognizing = true
    onStart?.()
  }

  recognition.onend = () => {
    isRecognizing = false
    onStop?.()
    // 若非手動 stop，則自動重啟
    setTimeout(() => {
      if (!isRecognizing) start()
    }, 200)
  }

  recognition.onerror = (event) => {
    onError?.(event)
    // 錯誤時自動重啟
    setTimeout(() => {
      if (!isRecognizing) start()
    }, 300)
  }

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let interimTranscript = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      interimTranscript += event.results[i][0].transcript
    }
    interimTranscript = interimTranscript.trim()

    if (interimTranscript) {
      transcriptBuffer = interimTranscript
      onInput?.(transcriptBuffer)
    }

    clearTimers()

    pauseTimeout = setTimeout(() => {
      onSilence?.()
      // 斷句並重啟
      restartRecognition()
    }, interruption)
  }

  return {
    start,
    stop,
    switch: (lang: string) => {
      if (typeof lang === 'string' && lang !== recognition.lang) {
        recognition.lang = lang
        clearTimers()
        stop()
        setTimeout(() => {
          start()
        }, 100)
      }
    },
  }
}
