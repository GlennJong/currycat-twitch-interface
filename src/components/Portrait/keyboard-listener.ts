type KeyboardListenerProps = {
  onKeydown: (keyname: string) => void;
};

export class KeyboardListener {
  private onKeydown: (keyname: string) => void;

  constructor({ onKeydown }: KeyboardListenerProps) {
    this.onKeydown = onKeydown;
    this.handleKeydown = this.handleKeydown.bind(this);
    this.init();
  }

  private handleKeydown(event: KeyboardEvent) {
    this.onKeydown(event.key);
  }

  private init() {
    window.addEventListener('keydown', this.handleKeydown);
  }

  public destroy() {
    window.removeEventListener('keydown', this.handleKeydown);
  }
}