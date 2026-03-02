import wx from 'weixin-js-sdk';

/**
 * Check if the app is running inside a WeChat Mini Program environment
 */
export const isWeChatMiniProgram = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    
    // Check user agent first for WeChat environment
    const ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('micromessenger') === -1) {
      resolve(false);
      return;
    }

    // Check if it's specifically a Mini Program
    wx.miniProgram.getEnv((res) => {
      resolve(res.miniprogram || false);
    });
  });
};

/**
 * Navigate to a Mini Program page
 */
export const navigateToMiniProgram = (url: string) => {
  wx.miniProgram.navigateTo({ url });
};

/**
 * Navigate back in Mini Program
 */
export const navigateBackMiniProgram = (delta: number = 1) => {
  wx.miniProgram.navigateBack({ delta });
};

/**
 * Post message to Mini Program
 */
export const postMessageToMiniProgram = (data: any) => {
  wx.miniProgram.postMessage({ data });
};

export default wx;
