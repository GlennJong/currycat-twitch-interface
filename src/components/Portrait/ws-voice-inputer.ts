type VoiceInputerEvents = {
  onStart?: () => void;
  onStop?: () => void;
  onError?: (error: Event) => void;
  onSpeak?: (payload: any) => void;
  onSilence?: () => void;
};

export class VoiceInputer {
  private onStart?: () => void;
  private onStop?: () => void;
  private onError?: (error: Event) => void;
  private onSpeak?: (payload: any) => void;
  private onSilence?: () => void;
  private ws: WebSocket | null;

  constructor({ onStart, onStop, onError, onSpeak, onSilence }: VoiceInputerEvents) {
    this.onStart = onStart;
    this.onStop = onStop;
    this.onError = onError;
    this.onSpeak = onSpeak;
    this.onSilence = onSilence;
    this.ws = null;
  }

  start() {
    this.ws = new WebSocket('ws://localhost:4455');

    this.ws.onopen = () => {
      if (this.onStart) this.onStart();
    };

    this.ws.onmessage = (message: MessageEvent) => {
      const data = JSON.parse(message.data);
      switch (data.event) {
        case 'speak':
          if (this.onSpeak) this.onSpeak(data.payload);
          break;
        case 'silence':
          if (this.onSilence) this.onSilence();
          break;
        default:
          console.warn('Unknown event:', data.event);
      }
    };

    this.ws.onerror = (error) => {
      if (this.onError) this.onError(error);
    };

    this.ws.onclose = () => {
      if (this.onStop) this.onStop();
    };
  }

  stop() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default VoiceInputer;