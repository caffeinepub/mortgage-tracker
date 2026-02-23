/**
 * Utility functions for safely converting BigInt values to serializable formats
 * to prevent React Query serialization errors
 */

import type { 
  House, 
  Payment, 
  DashboardSummary, 
  HouseProgress, 
  HouseWithProgress, 
  AppVersion 
} from '../backend';

/**
 * Serializable versions of backend types with BigInt converted to number
 */
export interface SerializableHouse extends Omit<House, 'loanTermYears' | 'createdAt'> {
  loanTermYears: number;
  createdAt: number;
}

export interface SerializablePayment extends Omit<Payment, 'date'> {
  date: number;
}

export interface SerializableDashboardSummary extends Omit<DashboardSummary, 'totalHouses' | 'totalPayments'> {
  totalHouses: number;
  totalPayments: number;
}

export interface SerializableHouseProgress extends Omit<HouseProgress, 'loanTermYears'> {
  loanTermYears: number;
}

export interface SerializableHouseWithProgress extends Omit<HouseWithProgress, 'house'> {
  house: SerializableHouse;
}

export interface SerializableAppVersion {
  major: number;
  minor: number;
  patch: number;
  build: number;
}

/**
 * Safely converts a BigInt to a number
 * Throws an error if the value is too large to be safely represented as a number
 */
function bigIntToNumber(value: bigint): number {
  const num = Number(value);
  if (!Number.isSafeInteger(num) && value > BigInt(Number.MAX_SAFE_INTEGER)) {
    console.warn(`BigInt value ${value} exceeds safe integer range, precision may be lost`);
  }
  return num;
}

/**
 * Converts a House object with BigInt fields to a serializable format
 */
export function serializeHouse(house: House): SerializableHouse {
  return {
    ...house,
    loanTermYears: bigIntToNumber(house.loanTermYears),
    createdAt: bigIntToNumber(house.createdAt),
  };
}

/**
 * Converts a Payment object with BigInt fields to a serializable format
 */
export function serializePayment(payment: Payment): SerializablePayment {
  return {
    ...payment,
    date: bigIntToNumber(payment.date),
  };
}

/**
 * Converts a DashboardSummary object with BigInt fields to a serializable format
 */
export function serializeDashboardSummary(summary: DashboardSummary): SerializableDashboardSummary {
  return {
    ...summary,
    totalHouses: bigIntToNumber(summary.totalHouses),
    totalPayments: bigIntToNumber(summary.totalPayments),
  };
}

/**
 * Converts a HouseProgress object with BigInt fields to a serializable format
 */
export function serializeHouseProgress(progress: HouseProgress): SerializableHouseProgress {
  return {
    ...progress,
    loanTermYears: bigIntToNumber(progress.loanTermYears),
  };
}

/**
 * Converts a HouseWithProgress object with BigInt fields to a serializable format
 */
export function serializeHouseWithProgress(houseWithProgress: HouseWithProgress): SerializableHouseWithProgress {
  return {
    ...houseWithProgress,
    house: serializeHouse(houseWithProgress.house),
  };
}

/**
 * Converts an AppVersion object with BigInt fields to a serializable format
 */
export function serializeAppVersion(version: AppVersion): SerializableAppVersion {
  return {
    major: bigIntToNumber(version.major),
    minor: bigIntToNumber(version.minor),
    patch: bigIntToNumber(version.patch),
    build: bigIntToNumber(version.build),
  };
}

/**
 * Converts a serializable house back to the format expected by the backend
 */
export function deserializeHouse(house: SerializableHouse): House {
  return {
    ...house,
    loanTermYears: BigInt(house.loanTermYears),
    createdAt: BigInt(house.createdAt),
  };
}

/**
 * Converts a serializable app version back to the format expected by the backend
 */
export function deserializeAppVersion(version: SerializableAppVersion): AppVersion {
  return {
    major: BigInt(version.major),
    minor: BigInt(version.minor),
    patch: BigInt(version.patch),
    build: BigInt(version.build),
  };
}
