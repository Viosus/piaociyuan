// Type declarations for @google/model-viewer web component

declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        src?: string;
        alt?: string;
        poster?: string;
        'camera-controls'?: boolean;
        'auto-rotate'?: boolean;
        'shadow-intensity'?: string;
        exposure?: string;
        'environment-image'?: string;
        'camera-orbit'?: string;
        'min-camera-orbit'?: string;
        'max-camera-orbit'?: string;
        'field-of-view'?: string;
        'min-field-of-view'?: string;
        'max-field-of-view'?: string;
        'interaction-prompt'?: string;
        'interaction-prompt-style'?: string;
        'interaction-prompt-threshold'?: string;
        loading?: 'auto' | 'lazy' | 'eager';
        reveal?: 'auto' | 'interaction' | 'manual';
        ar?: boolean;
        'ar-modes'?: string;
        'ar-scale'?: string;
        'ar-placement'?: string;
        'ios-src'?: string;
        'touch-action'?: string;
        'disable-zoom'?: boolean;
        'disable-pan'?: boolean;
        'disable-tap'?: boolean;
        'interpolation-decay'?: string;
        'orbit-sensitivity'?: string;
        'animation-name'?: string;
        'animation-crossfade-duration'?: string;
        autoplay?: boolean;
        onLoad?: () => void;
        onError?: (error: Event) => void;
        onProgress?: (event: CustomEvent<{ totalProgress: number }>) => void;
        'onModel-visibility'?: (event: CustomEvent<{ visible: boolean }>) => void;
      },
      HTMLElement
    >;
  }
}

declare module '@google/model-viewer' {
  export interface ModelViewerElement extends HTMLElement {
    src: string;
    alt: string;
    poster: string;
    cameraControls: boolean;
    autoRotate: boolean;
    shadowIntensity: string;
    exposure: string;
    environmentImage: string;
    cameraOrbit: string;
    fieldOfView: string;
    loading: 'auto' | 'lazy' | 'eager';
    reveal: 'auto' | 'interaction' | 'manual';
    ar: boolean;
    arModes: string;
    arScale: string;
    arPlacement: string;
    iosSrc: string;
    touchAction: string;
    disableZoom: boolean;
    disablePan: boolean;
    disableTap: boolean;
    interpolationDecay: string;
    orbitSensitivity: string;
    animationName: string;
    animationCrossfadeDuration: string;
    autoplay: boolean;

    // Methods
    getCameraOrbit(): { theta: number; phi: number; radius: number };
    setCameraOrbit(theta: number, phi: number, radius: number): void;
    resetCameraOrbit(): void;
    getCameraTarget(): { x: number; y: number; z: number };
    setCameraTarget(x: number, y: number, z: number): void;
    getFieldOfView(): number;
    setFieldOfView(fov: number): void;
    toDataURL(type?: string, quality?: number): string;
    toBlob(callback: (blob: Blob | null) => void, type?: string, quality?: number): void;
  }
}
