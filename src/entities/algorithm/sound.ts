// Sound utility for sorting visualizer
// Uses Web Audio API to generate sounds

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Initialize audio context on user interaction
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
    }
  }

  public enable() {
    this.enabled = true;
    this.resume();
  }

  public disable() {
    this.enabled = false;
  }

  public toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.resume();
    }
    return this.enabled;
  }

  private resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // Play a tone for comparison - higher pitch for higher values
  public playCompare(value: number, maxValue: number) {
    if (!this.enabled || !this.audioContext) {
      this.init();
      if (!this.audioContext) return;
    }

    const frequency = 200 + (value / maxValue) * 400; // 200-600 Hz range
    this.playTone(frequency, 0.05, 'sine', 0.02);
  }

  // Play a sound for swap - slightly lower pitch
  public playSwap(value1: number, value2: number, maxValue: number) {
    if (!this.enabled || !this.audioContext) {
      this.init();
      if (!this.audioContext) return;
    }

    const freq1 = 300 + (value1 / maxValue) * 300; // 300-600 Hz
    const freq2 = 300 + (value2 / maxValue) * 300; // 300-600 Hz
    
    this.playTone(freq1, 0.08, 'triangle', 0.03);
    setTimeout(() => {
      this.playTone(freq2, 0.08, 'triangle', 0.03);
    }, 50);
  }

  // Play completion sound
  public playComplete() {
    if (!this.enabled || !this.audioContext) {
      this.init();
      if (!this.audioContext) return;
    }

    // Play a pleasant chord
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.3, 'sine', 0.1);
      }, i * 100);
    });
  }

  // Play a single tone
  private playTone(frequency: number, duration: number, type: OscillatorType, volume: number) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }
}

// Export singleton instance
export const soundManager = new SoundManager();