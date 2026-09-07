export function openWifiSettings(): boolean {
  const isAndroid = /android/i.test(navigator.userAgent);
  if (isAndroid) {
    window.location.href = 'intent:#Intent;action=android.settings.WIFI_SETTINGS;end';
    return true;
  }
  return false;
}

export function openHotspotSettings(): boolean {
  const isAndroid = /android/i.test(navigator.userAgent);
  if (isAndroid) {
    window.location.href = 'intent:#Intent;action=android.settings.TETHERING_SETTINGS;end';
    return true;
  }
  return false;
}

export function getPlatform(): 'android' | 'ios' | 'desktop' {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  return 'desktop';
}
