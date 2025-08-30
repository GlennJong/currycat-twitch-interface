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
  private password: string;

  constructor({ onStart, onStop, onError, onSpeak, onSilence }: VoiceInputerEvents, password: string) {
    this.onStart = onStart;
    this.onStop = onStop;
    this.onError = onError;
    this.onSpeak = onSpeak;
    this.onSilence = onSilence;
    this.ws = null;
    this.password = password;
  }

  start() {
    this.ws = new WebSocket('ws://localhost:4455');

    this.ws.onopen = () => {
      // Authenticate with the server
      this.ws?.send(JSON.stringify({
        'request-type': 'Authenticate',
        'auth': this.password,
        'message-id': 'auth',
      }));

      if (this.onStart) this.onStart();
    };

    this.ws.onmessage = async (message: MessageEvent) => {
      const data = JSON.parse(message.data);

      
      if (data['message-id'] === 'auth') {
        if (data.status === 'ok') {
          console.log('Authentication successful');
        } else {
          console.error('Authentication failed:', data.error);
          this.ws?.close();
          return;
        }
      }

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