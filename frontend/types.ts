export enum RegistrationStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL', // Surname matched, waiting for general admin approval if needed (or auto-approved based on rules)
  SURNAME_REVIEW = 'SURNAME_REVIEW',     // Surname not in whitelist
  APPROVED = 'APPROVED',                 // Admin approved
  REJECTED = 'REJECTED'                  // Admin rejected
}

export interface User {
  id: string;
  fullName: string;
  surname: string;
  fatherName: string;
  phone: string; 
  email?: string; // Added email field
  aadhaar: string;
  // Removed sponsorId
  selfieUrl?: string; // Optional now
  profilePhotoUrl?: string; 
  aadhaarCardUrl?: string; // Optional now
  verified: boolean;      // Manual Verification status
  registrationStatus: RegistrationStatus;
  createdAt: string;
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface SurnameEntry {
  id: string;
  surname: string;
  normalized: string;
  addedBy: string;
  addedAt: string;
}

export enum TicketType {
  MALE = 'MALE',
  FEMALE = 'FEMALE'
}

export enum ParkingType {
  TWO_WHEELER = 'TWO_WHEELER',
  FOUR_WHEELER = 'FOUR_WHEELER',
  NONE = 'NONE'
}

export interface Booking {
  id: string;
  userId: string;
  ticketType: TicketType;
  parkingType: ParkingType;
  parkingCount: number;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  paymentId?: string;
  signature?: string;
  timestamp: string;
}

export interface PricingStructure {
  MALE_PASS: number;
  FEMALE_PASS: number;
  TWO_WHEELER: number;
  FOUR_WHEELER: number;
}

export interface SystemSettings {
  parkingFull: boolean;
  lastAnnouncement: string;
  lastAnnouncementTime: string;
  registrationOpen: boolean;
  eventStartDate: string;
  eventEndDate: string;
  prices: PricingStructure;
  passDownloadEnabled: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  adminId: string;
}

export interface Feedback {
  id: string;
  name: string;
  suggestion: string;
  timestamp: string;
}

export interface Inquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  timestamp: string;
}

export const DEFAULT_PRICES: PricingStructure = {
  MALE_PASS: 1500,
  FEMALE_PASS: 500,
  TWO_WHEELER: 50,
  FOUR_WHEELER: 200,
};

export const PARKING_LIMITS = {
  TWO_WHEELER: 5,
  FOUR_WHEELER: 2,
};

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  status: TaskStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export const MASTER_KEY = "GAJJAR SUTHAR";