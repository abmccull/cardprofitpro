import ebayOAuth from 'ebay-oauth-nodejs-client';

const createEbayAuth = () => {
  // Use a more type-safe approach to access the constructor
  // @ts-ignore - Handle both ESM and CJS module formats
  const EbayAuthToken = ebayOAuth.EbayAuthToken || ebayOAuth.default?.EbayAuthToken || ebayOAuth;
  return new EbayAuthToken({
    clientId: process.env.EBAY_CLIENT_ID!,
    clientSecret: process.env.EBAY_CLIENT_SECRET!,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/ebay/callback`,
  });
};

const ebayAuth = createEbayAuth();

export const EBAY_SCOPES = [
  'https://api.ebay.com/oauth/api_scope',
  'https://api.ebay.com/oauth/api_scope/sell.inventory',
  'https://api.ebay.com/oauth/api_scope/sell.marketing',
  'https://api.ebay.com/oauth/api_scope/sell.account',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
];

export async function getEbayAuthUrl(): Promise<string> {
  try {
    return await ebayAuth.generateUserAuthorizationUrl('PRODUCTION', EBAY_SCOPES);
  } catch (error) {
    console.error('Error generating eBay auth URL:', error);
    throw error;
  }
}

export async function exchangeEbayCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  try {
    const tokenData = await ebayAuth.exchangeCodeForAccessToken('PRODUCTION', code);
    return JSON.parse(tokenData);
  } catch (error) {
    console.error('Error exchanging eBay code:', error);
    throw error;
  }
}

export async function refreshEbayToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  try {
    // Add the third argument (scope) as an empty string to match the expected signature
    // @ts-ignore - Handle potential API differences
    const tokenData = await ebayAuth.getAccessToken('PRODUCTION', refreshToken, '');
    return JSON.parse(tokenData);
  } catch (error) {
    console.error('Error refreshing eBay token:', error);
    throw error;
  }
} 