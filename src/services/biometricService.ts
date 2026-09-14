export type CaptureResult = 
  | 'CAPTURE_SUCCESS' 
  | 'CAPTURE_FAILED' 
  | 'DEVICE_NOT_FOUND' 
  | 'DEVICE_NOT_SUPPORTED' 
  | 'USER_CANCELLED';

export interface FingerprintCaptureResponse {
  status: CaptureResult;
  dataUrl?: string;
  errorMessage?: string;
  qualityScore?: number; // 0 - 100 NFIQ
  deviceInfo?: {
    type: string;
    id?: string;
    vendor?: string;
  };
  timestamp?: string;
}

export interface FingerprintCaptureProvider {
  id: string;
  name: string;
  isAvailable: () => Promise<boolean>;
  capture: () => Promise<FingerprintCaptureResponse>;
}

/**
 * Generate a high-fidelity SVG friction ridge thumbprint impression
 */
export function generateBiometricThumbprintSvg(seedStr: string = 'thumb', color: string = '#1e3a8a'): string {
  // Deterministic seed
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
    hash |= 0;
  }
  
  const ridges = [];
  const centerX = 100;
  const centerY = 110;
  const count = 18;

  for (let r = 10; r <= 85; r += 4.2) {
    const rx = r * 0.78;
    const ry = r * 1.12;
    const strokeWidth = 2.0 + ((r % 3 === 0) ? 0.4 : 0);
    const dashArray = (r % 7 === 0) ? '18, 4, 32, 5' : (r % 5 === 0 ? '40, 6, 12, 4' : 'none');
    
    ridges.push(`
      <ellipse 
        cx="${centerX}" 
        cy="${centerY - (r * 0.1)}" 
        rx="${rx}" 
        ry="${ry}" 
        fill="none" 
        stroke="${color}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round" 
        stroke-dasharray="${dashArray}"
        opacity="${0.85 + ((100 - r) / 400)}"
      />
    `);
  }

  // Add delta & core patterns
  const svg = `
    <svg width="200" height="240" viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="thumbBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
          <stop offset="90%" stop-color="#f8fafc" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#f1f5f9" stop-opacity="0" />
        </radialGradient>
        <filter id="inkBleed" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter="url(#inkBleed)">
        <ellipse cx="${centerX}" cy="${centerY}" rx="78" ry="98" fill="url(#thumbBg)" />
        ${ridges.join('\n')}
        <!-- Core whorl -->
        <path d="M 94 95 Q 100 85 106 95 Q 110 110 98 118 Q 90 108 94 95 Z" fill="none" stroke="${color}" stroke-width="2.2" />
        <!-- Delta tri-radius -->
        <path d="M 60 145 L 75 140 L 70 155" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" />
        <path d="M 140 145 L 125 140 L 130 155" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" />
      </g>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Standard Biometric Provider supporting both simulated USB scanner & Touch
 */
export class StandardBiometricProvider implements FingerprintCaptureProvider {
  id = 'wallahi-biometric-sensor';
  name = 'Optical & Capacitive Biometric Sensor';

  async isAvailable(): Promise<boolean> {
    return true; 
  }

  async capture(): Promise<FingerprintCaptureResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const quality = Math.floor(88 + Math.random() * 11); // 88-99% quality
        const thumbprintDataUrl = generateBiometricThumbprintSvg(`bio-${Date.now()}`);
        
        resolve({
          status: 'CAPTURE_SUCCESS',
          dataUrl: thumbprintDataUrl,
          qualityScore: quality,
          deviceInfo: {
            type: 'Optical Biometric Scanner (500 DPI)',
            id: `BIO-USB-${Math.floor(1000 + Math.random() * 9000)}`,
            vendor: 'SecuGen / DigitalPersona Compatible'
          },
          timestamp: new Date().toISOString()
        });
      }, 1200);
    });
  }
}

export class BiometricService {
  private providers: FingerprintCaptureProvider[] = [];

  constructor() {
    this.providers.push(new StandardBiometricProvider());
  }

  async getAvailableProvider(): Promise<FingerprintCaptureProvider | null> {
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        return provider;
      }
    }
    return null;
  }

  async captureThumbprint(): Promise<FingerprintCaptureResponse> {
    const provider = await this.getAvailableProvider();
    if (!provider) {
      return { status: 'DEVICE_NOT_FOUND' };
    }
    return provider.capture();
  }

  generateTouchImpression(identifier: string = 'touch-stamp'): string {
    return generateBiometricThumbprintSvg(identifier, '#1e293b');
  }
}

export const biometricService = new BiometricService();
