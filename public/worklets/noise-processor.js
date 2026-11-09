// Générateur de bruit (white / pink / brown), échantillon par échantillon.
// Paramètre "kind" via port.postMessage pour changer de couleur sans recréer le nœud.
class NoiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.kind = 'pink';
    this.brown = [0, 0];
    // états du filtre rose (Paul Kellet, version "refined"), un jeu par canal
    this.pink = [new Float32Array(7), new Float32Array(7)];
    this.port.onmessage = (e) => {
      if (e.data && e.data.kind) this.kind = e.data.kind;
    };
  }

  process(_inputs, outputs) {
    const out = outputs[0];
    for (let ch = 0; ch < out.length; ch++) {
      const buf = out[ch];
      const p = this.pink[ch % 2];
      for (let i = 0; i < buf.length; i++) {
        const w = Math.random() * 2 - 1;
        let s;
        if (this.kind === 'white') {
          s = w * 0.5;
        } else if (this.kind === 'brown') {
          // intégrateur à fuite
          const b = (this.brown[ch % 2] + 0.02 * w) / 1.02;
          this.brown[ch % 2] = b;
          s = b * 3.5;
        } else {
          p[0] = 0.99886 * p[0] + w * 0.0555179;
          p[1] = 0.99332 * p[1] + w * 0.0750759;
          p[2] = 0.969 * p[2] + w * 0.153852;
          p[3] = 0.8665 * p[3] + w * 0.3104856;
          p[4] = 0.55 * p[4] + w * 0.5329522;
          p[5] = -0.7616 * p[5] - w * 0.016898;
          s = (p[0] + p[1] + p[2] + p[3] + p[4] + p[5] + p[6] + w * 0.5362) * 0.11;
          p[6] = w * 0.115926;
        }
        buf[i] = s;
      }
    }
    return true;
  }
}

registerProcessor('noise-processor', NoiseProcessor);
