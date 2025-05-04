declare module 'vanta/dist/vanta.waves.min' {
  interface VantaWavesOptions {
    el: HTMLElement;
    THREE: any;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
    color?: number;
    shininess?: number;
    waveHeight?: number;
    waveSpeed?: number;
    zoom?: number;
  }

  interface VantaWavesEffect {
    destroy: () => void;
  }

  interface VantaBase {
    WAVES: (options: VantaWavesOptions) => VantaWavesEffect;
  }

  declare global {
    const VANTA: VantaBase;
  }
}