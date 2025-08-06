type VoiceInputUtilityParams = {
  onStart?: () => void
  onStop?: () => void
  onError?: (error: SpeechRecognitionErrorEvent) => void
  onInput?: (content: string) => void
  onSilence?: () => void
  interruption?: number  // ms of silence before restart, e.g. 3000
}

export function VoiceInputUtility(params: VoiceInputUtilityParams = {}) {
  const {
    onStart,
    onStop,
    onError,
    onInput,
    onSilence,
    interruption = 3000,
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

  const clearTimers = () => {
    if (pauseTimeout) clearTimeout(pauseTimeout)
    pauseTimeout = null
  }

  const restartRecognition = () => {
    transcriptBuffer = ''
    clearTimers()
    stop()
    setTimeout(() => {
      start()
    }, 100)
  }

  const start = () => {
    if (isRecognizing) return
    try {
      recognition.start()
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
  }

  recognition.onerror = (event) => {
    onError?.(event)
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
      restartRecognition()
    }, interruption)
  }

  return {
    start,
    stop,
  }
}
