import Taro from '@tarojs/taro';

/**
 * 小程序原生 Toast 封装 — 包 Taro.showToast
 * 用法：toast.success("已保存") / toast.error("失败")
 */
export const toast = {
  success(title: string, duration = 1500) {
    Taro.showToast({ title, icon: 'success', duration });
  },
  error(title: string, duration = 2000) {
    Taro.showToast({ title, icon: 'error', duration });
  },
  info(title: string, duration = 1500) {
    Taro.showToast({ title, icon: 'none', duration });
  },
  loading(title = '加载中') {
    Taro.showLoading({ title, mask: true });
  },
  hideLoading() {
    Taro.hideLoading();
  },
};
