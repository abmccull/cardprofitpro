declare module 'chroma-js' {
  interface Scale {
    domain(domain: number[]): Scale;
    mode(mode: string): Scale;
    gamma(gamma: number): Scale;
    colors(count: number): string[];
    hex(): string;
    rgb(): [number, number, number];
    rgba(): [number, number, number, number];
    (val: number): { hex: () => string };
  }

  interface ChromaStatic {
    scale(colors: string[]): Scale;
    mix(color1: string, color2: string, ratio?: number, mode?: string): any;
    contrast(color1: string, color2: string): number;
    brewer: Record<string, string[]>;
  }

  const chroma: ChromaStatic;
  export = chroma;
} 