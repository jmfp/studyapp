import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';
import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';

export const RC_ENTITLEMENT = 'pro';
export const FREE_DECK_LIMIT = 2;
export const PRO_PRICE = '$4.99/month';

// Set these in .env — get them from RevenueCat dashboard
const RC_API_KEY_IOS = process.env.EXPO_PUBLIC_RC_API_KEY_IOS || 'appl_REPLACE_WITH_YOUR_IOS_KEY';
const RC_API_KEY_ANDROID = process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID || 'goog_REPLACE_WITH_YOUR_ANDROID_KEY';

export function canUseRevenueCat(): boolean {
  if (Constants.appOwnership === 'expo') return false;
  const apiKey = Platform.OS === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
  return !apiKey.includes('REPLACE');
}

export async function initRevenueCat(userId: string): Promise<void> {
  if (!canUseRevenueCat()) return;
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);

  const apiKey = Platform.OS === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
  await Purchases.configure({ apiKey });
  await Purchases.logIn(userId);
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}

export async function isPro(info?: CustomerInfo): Promise<boolean> {
  const ci = info ?? (await Purchases.getCustomerInfo());
  return ci.entitlements.active[RC_ENTITLEMENT] !== undefined;
}

export async function getOfferings(): Promise<PurchasesPackage[]> {
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current) return [];
  return current.availablePackages;
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

export async function logOut(): Promise<void> {
  await Purchases.logOut();
}

const SUBSCRIPTION_SETTINGS_URL = Platform.select({
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions',
  default: 'https://www.revenuecat.com',
});

export function addCustomerInfoListener(
  listener: (info: CustomerInfo) => void,
): () => void {
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}

/** Opens the platform subscription management UI (cancel, change plan, etc.). */
export async function openSubscriptionManagement(): Promise<void> {
  if (!canUseRevenueCat()) {
    if (SUBSCRIPTION_SETTINGS_URL) await Linking.openURL(SUBSCRIPTION_SETTINGS_URL);
    return;
  }

  try {
    await Purchases.showManageSubscriptions();
    return;
  } catch {
    // Fall through to management URL / store settings
  }

  const info = await getCustomerInfo();
  if (info.managementURL) {
    await Linking.openURL(info.managementURL);
    return;
  }

  if (SUBSCRIPTION_SETTINGS_URL) await Linking.openURL(SUBSCRIPTION_SETTINGS_URL);
}

export function getProEntitlement(info: CustomerInfo) {
  return info.entitlements.active[RC_ENTITLEMENT];
}
