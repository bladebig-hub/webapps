export enum AppView {
  HOME = 'HOME',
  NFC_SCANNING = 'NFC_SCANNING',
  CHECK_IN_SUCCESS = 'CHECK_IN_SUCCESS',
  REWARD_SELECTION = 'REWARD_SELECTION',
  REWARD_CLAIMED = 'REWARD_CLAIMED',
  MAP_VIEW = 'MAP_VIEW',
  PRIZE_SELECTOR = 'PRIZE_SELECTOR',
  WALLET = 'WALLET',
  MISSION_COMPLETE = 'MISSION_COMPLETE'
}

export interface GrandPrize {
  id: string;
  name: string;
  imageUrl: string;
  totalFragments: number;
  description: string;
}

export interface WalletItem {
  id: string;
  type: 'FRAGMENT' | 'COUPON' | 'RED_PACKET';
  title: string;
  value?: string;
  date: string;
  description?: string;
  imageUrl?: string;
}

export interface Merchant {
  id: string;
  name: string;
  category: '餐饮' | '娱乐' | '零售' | '酒吧';
  distance: string;
  imageUrl: string;
  // Enhanced offer details
  offerType: 'COUPON' | 'GROUP_DEAL' | 'VOUCHER';
  offerTitle: string;
  originalPrice?: string;
  price?: string; // For group deals
  description?: string;
}

export interface Reward {
  type: 'RED_PACKET' | 'COUPON';
  value: string;
  title: string;
  description: string;
}

export interface UserState {
  currentPrizeId: string;
  collectedFragments: number; // Count for current prize
  history: Merchant[];
  wallet: WalletItem[];
  wishingCards: number; // New: Number of wishing cards collected
}