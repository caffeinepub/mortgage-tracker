import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AppVersion {
    major: bigint;
    minor: bigint;
    build: bigint;
    patch: bigint;
}
export interface OverviewData {
    dashboardSummary: DashboardSummary;
    userProfile: UserProfile;
    housesWithProgress: Array<HouseWithProgress>;
}
export interface HouseWithProgress {
    house: House;
    progressPercentage: number;
    totalAmountToPay: number;
    totalPaid: number;
    remainingBalance: number;
    interestAmount: number;
}
export interface HouseProgress {
    downPayment: number;
    progressPercentage: number;
    totalPaid: number;
    remainingBalance: number;
    loanTermYears: bigint;
    interestAmount: number;
    totalLoanAmount: number;
}
export interface Payment {
    paymentMethod: string;
    date: bigint;
    note: string;
    amount: number;
    houseId: string;
}
export interface House {
    id: string;
    downPayment: number;
    name: string;
    createdAt: bigint;
    totalCost: number;
    interestRate: number;
    loanTermYears: bigint;
}
export interface DashboardSummary {
    totalInterest: number;
    totalCost: number;
    totalPayments: bigint;
    totalPaid: number;
    overallProgress: number;
    totalHouses: bigint;
    remainingBalance: number;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addOrUpdateHouse(house: House): Promise<void>;
    addPayment(amount: number, note: string, houseId: string, paymentMethod: string, maybeDate: bigint | null): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteHouse(houseId: string): Promise<void>;
    deletePayment(paymentIndex: bigint): Promise<void>;
    editPayment(paymentIndex: bigint, amount: number, note: string, houseId: string, paymentMethod: string, date: bigint): Promise<void>;
    getAllHouses(): Promise<Array<House>>;
    getBootstrapData(): Promise<OverviewData>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentAppVersion(): Promise<AppVersion>;
    getHouse(houseId: string): Promise<House | null>;
    getHouseProgress(houseId: string): Promise<HouseProgress>;
    getInitializationStatus(): Promise<string>;
    getPaymentHistoryByHouse(houseId: string): Promise<Array<Payment>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    healthCheck(): Promise<string>;
    isCallerAdmin(): Promise<boolean>;
    isUpdateAvailable(frontendVersion: AppVersion): Promise<boolean>;
    safeInitialize(): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
