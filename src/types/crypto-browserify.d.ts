declare module 'crypto-browserify' {
  export function createHash(algorithm: string): {
    update(data: string): { digest(encoding: string): string };
  };
  export function randomBytes(size: number): Buffer;
} 