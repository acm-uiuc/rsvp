interface AppConfig {
  apiBaseUrl: string;
  turnstileSiteKey: string;
  auth: {
    authority: string;
    clientId: string; 
    redirectUri: string;
  };
}

const getRedirectUri = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }
  return ''; 
};

const ENVIRONMENTS: Record<'local-dev' | 'dev' | 'prod', AppConfig> = {
  'local-dev': {
    apiBaseUrl: 'https://core.aws.qa.acmuiuc.org', 
    turnstileSiteKey: '1x00000000000000000000AA', 
    auth: {
      authority: 'https://login.microsoftonline.com/44467e6f-462c-4ea2-823f-7800de5434e3',
      clientId: '7924ef11-be10-413d-aaa9-f1d634e85a26', 
      redirectUri: 'http://localhost:5173/auth/callback'
    }
  },
  
  dev: {
    apiBaseUrl: 'https://core.aws.qa.acmuiuc.org',
    turnstileSiteKey: '1x00000000000000000000AA',
    auth: {
      authority: 'https://login.microsoftonline.com/44467e6f-462c-4ea2-823f-7800de5434e3',
      clientId: '7924ef11-be10-413d-aaa9-f1d634e85a26',
      redirectUri: getRedirectUri(),
    }
  },

  prod: {
    apiBaseUrl: 'https://core.acm.illinois.edu',
    turnstileSiteKey: '0x4AAAAAACLtNvWF7VjCKZfe', 
    auth: {
      authority: 'https://login.microsoftonline.com/44467e6f-462c-4ea2-823f-7800de5434e3',
      clientId: '7924ef11-be10-413d-aaa9-f1d634e85a26',
      redirectUri: 'https://rsvp.acm.illinois.edu/auth/callback'
    }
  },
};

const activeEnv = (import.meta.env.VITE_RUN_ENVIRONMENT as 'local-dev' | 'dev' | 'prod') || 'local-dev';

export const config = ENVIRONMENTS[activeEnv];