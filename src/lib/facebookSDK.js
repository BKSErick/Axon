/**
 * Facebook SDK Helper — Loads and manages the Facebook JavaScript SDK
 * Used for Facebook Login OAuth flow (client self-connect)
 */

const FB_APP_ID = import.meta.env.VITE_META_APP_ID;
const FB_SDK_VERSION = 'v18.0';

let sdkLoaded = false;
let sdkLoading = false;
let loadCallbacks = [];

/**
 * Load the Facebook SDK asynchronously
 * Returns a promise that resolves when the SDK is ready
 */
export const initFacebookSDK = () => {
  return new Promise((resolve, reject) => {
    if (sdkLoaded && window.FB) {
      resolve(window.FB);
      return;
    }

    if (sdkLoading) {
      loadCallbacks.push({ resolve, reject });
      return;
    }

    sdkLoading = true;
    loadCallbacks.push({ resolve, reject });

    // Setup the async init callback
    window.fbAsyncInit = () => {
      window.FB.init({
        appId: FB_APP_ID,
        cookie: true,
        xfbml: false,
        version: FB_SDK_VERSION,
      });

      sdkLoaded = true;
      sdkLoading = false;
      console.log('[FB SDK] ✅ Facebook SDK initialized');

      loadCallbacks.forEach(cb => cb.resolve(window.FB));
      loadCallbacks = [];
    };

    // Load the SDK script
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/pt_BR/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.onerror = () => {
      sdkLoading = false;
      const err = new Error('Failed to load Facebook SDK');
      loadCallbacks.forEach(cb => cb.reject(err));
      loadCallbacks = [];
    };
    document.body.appendChild(script);
  });
};

/**
 * Open Facebook Login popup and request permissions
 * @param {string[]} scopes - Permission scopes to request
 * @returns {Promise<{accessToken: string, userID: string, grantedScopes: string[]}>}
 */
export const loginWithFacebook = async (scopes = []) => {
  const FB = await initFacebookSDK();

  const defaultScopes = [
    'pages_read_engagement',
    'pages_show_list',
    'instagram_basic',
    'instagram_manage_insights',
    'read_insights',
    'ads_read',
    'leads_retrieval',
    'business_management',
  ];

  const allScopes = [...new Set([...defaultScopes, ...scopes])];

  return new Promise((resolve, reject) => {
    FB.login(
      (response) => {
        if (response.authResponse) {
          const { accessToken, userID, grantedScopes } = response.authResponse;
          console.log('[FB SDK] ✅ Login successful:', { userID, grantedScopes });
          resolve({
            accessToken,
            userID,
            grantedScopes: grantedScopes ? grantedScopes.split(',') : allScopes,
          });
        } else {
          console.warn('[FB SDK] ❌ Login cancelled or failed');
          reject(new Error('Facebook login was cancelled'));
        }
      },
      {
        scope: allScopes.join(','),
        return_scopes: true,
        auth_type: 'rerequest',
      }
    );
  });
};

/**
 * Check if user is currently logged into Facebook
 * @returns {Promise<{isConnected: boolean, accessToken?: string, userID?: string}>}
 */
export const checkFacebookLoginStatus = async () => {
  const FB = await initFacebookSDK();

  return new Promise((resolve) => {
    FB.getLoginStatus((response) => {
      if (response.status === 'connected') {
        resolve({
          isConnected: true,
          accessToken: response.authResponse.accessToken,
          userID: response.authResponse.userID,
        });
      } else {
        resolve({ isConnected: false });
      }
    });
  });
};

/**
 * Logout from Facebook
 */
export const logoutFacebook = async () => {
  const FB = await initFacebookSDK();
  return new Promise((resolve) => {
    FB.logout(() => {
      console.log('[FB SDK] ✅ Logged out');
      resolve();
    });
  });
};
