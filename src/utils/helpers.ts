import { v4 as uuidv4 } from 'uuid';

export function generateTransactionId(): string {
  return 'txn_' + uuidv4().replace(/-/g, '').substring(0, 20);
}

export function generateBookingId(): string {
  return 'bk_' + uuidv4().replace(/-/g, '').substring(0, 16);
}

export function generateDisputeId(): string {
  return 'disp_' + uuidv4().replace(/-/g, '').substring(0, 12);
}

export function generateNotificationId(): string {
  return 'notif_' + uuidv4().replace(/-/g, '').substring(0, 12);
}

export function generateLogId(): string {
  return 'log_' + uuidv4().replace(/-/g, '').substring(0, 14);
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function roundToTwo(num: number): number {
  return Math.round(num * 100) / 100;
}
