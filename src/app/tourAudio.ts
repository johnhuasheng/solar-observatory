/** A small original ambient score, synthesized only while a guided tour plays. */
export class TourAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private echo: DelayNode | null = null;
  private interval: number | null = null;
  private suspendTimer: number | null = null;
  private step = 0;
  private playing = false;
  private stopped = false;

  private initialize() {
    const context = new AudioContext({ latencyHint: "playback" });
    this.context = context;
    const master = context.createGain();
    master.gain.value = 0;
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -18;
    limiter.ratio.value = 2;
    master.connect(limiter).connect(context.destination);
    this.master = master;

    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 510;
    filter.Q.value = 0.35;
    filter.connect(master);
    const slowSweep = context.createOscillator();
    const sweepDepth = context.createGain();
    slowSweep.type = "sine";
    slowSweep.frequency.value = 0.026;
    sweepDepth.gain.value = 180;
    slowSweep.connect(sweepDepth).connect(filter.frequency);
    slowSweep.start();
    for (const [frequency, level, type] of [
      [73.42, 0.16, "triangle"], [110, 0.11, "sine"],
      [146.83, 0.07, "triangle"], [220.4, 0.035, "sine"],
    ] as const) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.value = level;
      oscillator.connect(gain).connect(filter);
      oscillator.start();
    }

    const delay = context.createDelay(2);
    delay.delayTime.value = 0.62;
    const feedback = context.createGain();
    feedback.gain.value = 0.22;
    const wet = context.createGain();
    wet.gain.value = 0.24;
    delay.connect(feedback).connect(delay);
    delay.connect(wet).connect(master);
    this.echo = delay;
  }

  private chime() {
    const context = this.context;
    if (!context || !this.master || !this.echo) return;
    const notes = [293.66, 440, 349.23, 523.25, 392, 587.33, 440, 349.23,
      293.66, 392, 523.25, 440, 349.23, 293.66, 261.63, 440];
    const frequency = notes[this.step++ % notes.length];
    const time = context.currentTime + 0.06;
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(0.085, time + 0.18);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + 5.8);
    envelope.connect(this.master);
    envelope.connect(this.echo);
    const fundamental = context.createOscillator();
    fundamental.type = "sine";
    fundamental.frequency.value = frequency;
    fundamental.connect(envelope);
    fundamental.start(time);
    fundamental.stop(time + 6);
    fundamental.onended = () => envelope.disconnect();
  }

  play() {
    if (this.stopped || this.playing) return;
    try {
      if (!this.context) this.initialize();
      if (this.suspendTimer !== null) window.clearTimeout(this.suspendTimer);
      this.suspendTimer = null;
      const context = this.context!;
      void context.resume().catch(() => {});
      this.playing = true;
      const gain = this.master!.gain;
      gain.cancelScheduledValues(context.currentTime);
      gain.setTargetAtTime(0.23, context.currentTime, 0.55);
      this.chime();
      this.interval = window.setInterval(() => this.chime(), 4600);
    } catch {
      this.stop();
    }
  }

  pause() {
    if (!this.context || !this.master || !this.playing) return;
    this.playing = false;
    if (this.interval !== null) window.clearInterval(this.interval);
    this.interval = null;
    const context = this.context;
    this.master.gain.cancelScheduledValues(context.currentTime);
    this.master.gain.setTargetAtTime(0, context.currentTime, 0.17);
    this.suspendTimer = window.setTimeout(() => {
      if (!this.playing && !this.stopped) void context.suspend().catch(() => {});
    }, 850);
  }

  stop() {
    if (this.stopped) return;
    this.stopped = true;
    this.playing = false;
    if (this.interval !== null) window.clearInterval(this.interval);
    if (this.suspendTimer !== null) window.clearTimeout(this.suspendTimer);
    const context = this.context;
    if (!context) return;
    void context.resume().then(() => {
      const gain = this.master?.gain;
      if (gain) {
        gain.cancelScheduledValues(context.currentTime);
        gain.setTargetAtTime(0, context.currentTime, 0.18);
      }
      window.setTimeout(() => { void context.close().catch(() => {}); }, 1100);
    }).catch(() => { void context.close().catch(() => {}); });
  }
}
