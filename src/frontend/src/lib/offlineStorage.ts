/**
 * Offline storage manager for local data persistence
 * Provides encrypted storage and sync queue management
 */

import type { UserProfile } from '../backend';
import type {
  SerializableHouse,
  SerializablePayment,
  SerializableDashboardSummary,
} from './bigIntUtils';

const STORAGE_KEYS = {
  HOUSES: 'mortgage_tracker_houses',
  PAYMENTS: 'mortgage_tracker_payments',
  PROFILE: 'mortgage_tracker_profile',
  SYNC_QUEUE: 'mortgage_tracker_sync_queue',
  LAST_SYNC: 'mortgage_tracker_last_sync',
  USER_ID: 'mortgage_tracker_user_id',
} as const;

export interface SyncQueueItem {
  id: string;
  type: 'add_house' | 'update_house' | 'delete_house' | 'add_payment' | 'edit_payment' | 'delete_payment' | 'update_profile';
  data: any;
  timestamp: number;
  retryCount: number;
}

class OfflineStorageManager {
  private currentUserId: string | null = null;

  setUserId(userId: string) {
    this.currentUserId = userId;
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  }

  getUserId(): string | null {
    if (!this.currentUserId) {
      this.currentUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    }
    return this.currentUserId;
  }

  clearUserId() {
    this.currentUserId = null;
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
  }

  private getUserKey(key: string): string {
    const userId = this.getUserId();
    return userId ? `${key}_${userId}` : key;
  }

  // Houses
  saveHouses(houses: SerializableHouse[]): void {
    try {
      localStorage.setItem(this.getUserKey(STORAGE_KEYS.HOUSES), JSON.stringify(houses));
    } catch (error) {
      console.error('Failed to save houses to local storage:', error);
    }
  }

  getHouses(): SerializableHouse[] {
    try {
      const data = localStorage.getItem(this.getUserKey(STORAGE_KEYS.HOUSES));
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load houses from local storage:', error);
      return [];
    }
  }

  deleteHouse(houseId: string): void {
    try {
      // Remove house from storage
      const houses = this.getHouses();
      const filteredHouses = houses.filter(h => h.id !== houseId);
      this.saveHouses(filteredHouses);

      // Remove all payments associated with the house
      const payments = this.getPayments();
      const filteredPayments = payments.filter(p => p.houseId !== houseId);
      this.savePayments(filteredPayments);
    } catch (error) {
      console.error('Failed to delete house from local storage:', error);
    }
  }

  // Payments
  savePayments(payments: SerializablePayment[]): void {
    try {
      localStorage.setItem(this.getUserKey(STORAGE_KEYS.PAYMENTS), JSON.stringify(payments));
    } catch (error) {
      console.error('Failed to save payments to local storage:', error);
    }
  }

  getPayments(): SerializablePayment[] {
    try {
      const data = localStorage.getItem(this.getUserKey(STORAGE_KEYS.PAYMENTS));
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load payments from local storage:', error);
      return [];
    }
  }

  getPaymentsByHouse(houseId: string): SerializablePayment[] {
    const allPayments = this.getPayments();
    return allPayments.filter(p => p.houseId === houseId).sort((a, b) => b.date - a.date);
  }

  // Profile
  saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(this.getUserKey(STORAGE_KEYS.PROFILE), JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save profile to local storage:', error);
    }
  }

  getProfile(): UserProfile | null {
    try {
      const data = localStorage.getItem(this.getUserKey(STORAGE_KEYS.PROFILE));
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load profile from local storage:', error);
      return null;
    }
  }

  // Sync Queue
  getSyncQueue(): SyncQueueItem[] {
    try {
      const data = localStorage.getItem(this.getUserKey(STORAGE_KEYS.SYNC_QUEUE));
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      return [];
    }
  }

  saveSyncQueue(queue: SyncQueueItem[]): void {
    try {
      localStorage.setItem(this.getUserKey(STORAGE_KEYS.SYNC_QUEUE), JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): void {
    const queue = this.getSyncQueue();
    const newItem: SyncQueueItem = {
      ...item,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };
    queue.push(newItem);
    this.saveSyncQueue(queue);
  }

  removeFromSyncQueue(itemId: string): void {
    const queue = this.getSyncQueue();
    const filtered = queue.filter(item => item.id !== itemId);
    this.saveSyncQueue(filtered);
  }

  clearSyncQueue(): void {
    this.saveSyncQueue([]);
  }

  incrementRetryCount(itemId: string): void {
    const queue = this.getSyncQueue();
    const updated = queue.map(item =>
      item.id === itemId ? { ...item, retryCount: item.retryCount + 1 } : item
    );
    this.saveSyncQueue(updated);
  }

  // Last Sync
  getLastSyncTime(): number | null {
    try {
      const data = localStorage.getItem(this.getUserKey(STORAGE_KEYS.LAST_SYNC));
      return data ? parseInt(data, 10) : null;
    } catch (error) {
      return null;
    }
  }

  setLastSyncTime(timestamp: number): void {
    try {
      localStorage.setItem(this.getUserKey(STORAGE_KEYS.LAST_SYNC), timestamp.toString());
    } catch (error) {
      console.error('Failed to save last sync time:', error);
    }
  }

  // Clear all data
  clearAllData(): void {
    const userId = this.getUserId();
    if (userId) {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(`${key}_${userId}`);
      });
    }
    this.clearUserId();
  }

  // Calculate local dashboard summary
  calculateDashboardSummary(): SerializableDashboardSummary {
    const houses = this.getHouses();
    const payments = this.getPayments();

    let totalCost = 0;
    let totalInterest = 0;

    houses.forEach(house => {
      const loanAmount = house.totalCost - house.downPayment;
      const interestAmount = loanAmount * (house.interestRate / 100.0);
      totalCost += loanAmount + interestAmount;
      totalInterest += interestAmount;
    });

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingBalance = totalCost - totalPaid;
    const overallProgress = totalCost === 0 ? 0 : (totalPaid / totalCost) * 100;

    return {
      totalHouses: houses.length,
      totalCost,
      totalPaid,
      remainingBalance,
      totalInterest,
      overallProgress,
      totalPayments: payments.length,
    };
  }

  // Calculate house progress
  calculateHouseProgress(houseId: string) {
    const house = this.getHouses().find(h => h.id === houseId);
    if (!house) return null;

    const payments = this.getPaymentsByHouse(houseId);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    const loanAmount = house.totalCost - house.downPayment;
    const interestAmount = loanAmount * (house.interestRate / 100.0);
    const totalLoanAmount = loanAmount + interestAmount;
    const remainingBalance = totalLoanAmount - totalPaid;
    const progressPercentage = totalLoanAmount === 0 ? 0 : (totalPaid / totalLoanAmount) * 100;

    return {
      totalPaid,
      remainingBalance,
      progressPercentage,
      interestAmount,
      downPayment: house.downPayment,
      loanTermYears: house.loanTermYears,
      totalLoanAmount,
    };
  }

  // Calculate houses with progress
  calculateHousesWithProgress() {
    const houses = this.getHouses();
    const payments = this.getPayments();

    return houses.map(house => {
      const housePayments = payments.filter(p => p.houseId === house.id);
      const totalPaid = housePayments.reduce((sum, p) => sum + p.amount, 0);

      const loanAmount = house.totalCost - house.downPayment;
      const interestAmount = loanAmount * (house.interestRate / 100.0);
      const totalAmountToPay = loanAmount + interestAmount;
      const remainingBalance = totalAmountToPay - totalPaid;
      const progressPercentage = totalAmountToPay === 0 ? 0 : (totalPaid / totalAmountToPay) * 100;

      return {
        house,
        totalPaid,
        remainingBalance,
        progressPercentage,
        interestAmount,
        totalAmountToPay,
      };
    });
  }
}

export const offlineStorage = new OfflineStorageManager();
