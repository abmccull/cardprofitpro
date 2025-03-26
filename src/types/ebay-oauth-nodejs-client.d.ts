declare module 'ebay-oauth-nodejs-client' {
  export interface EbayAuthConfig {
    clientId: string;
    clientSecret: string;
    redirectUri?: string;
  }

  export class EbayAuthToken {
    constructor(config: EbayAuthConfig);
    getApplicationToken(environment: 'PRODUCTION' | 'SANDBOX'): Promise<string>;
    generateUserAuthorizationUrl(environment: 'PRODUCTION' | 'SANDBOX', scopes: string[], options?: { state?: string; prompt?: string }): string;
    exchangeCodeForAccessToken(environment: 'PRODUCTION' | 'SANDBOX', code: string): Promise<string>;
    getAccessToken(environment: 'PRODUCTION' | 'SANDBOX', refreshToken: string, scopes: string[]): Promise<string>;
  }
} 