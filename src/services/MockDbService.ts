import * as fs from 'fs';
import * as path from 'path';
import { Provider, Booking, Notification, Dispute, AgentLog, Review, PaymentMethod, User } from '../types';

export class MockDbService {
  private providers: Provider[] = [];
  private bookings: Booking[] = [];
  private notifications: Notification[] = [];
  private disputes: Dispute[] = [];
  private agentLogs: AgentLog[] = [];
  private reviews: Review[] = [];
  private paymentMethods: PaymentMethod[] = [];
  private favorites: string[] = [];
  private users: User[] = [];
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    this.loadAll();
  }

  private loadAll(): void {
    this.providers = this.loadJson<Provider>('providers.json');
    this.bookings = this.loadJson<Booking>('bookings.json');
    this.notifications = this.loadJson<Notification>('notifications.json');
    this.disputes = this.loadJson<Dispute>('disputes.json');
    this.agentLogs = this.loadJson<AgentLog>('agent_logs.json');
    this.users = this.loadJson<User>('users.json');
  }

  private loadJson<T>(filename: string): T[] {
    const filePath = path.join(this.dbPath, filename);
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as T[];
    } catch {
      return [];
    }
  }

  private saveJson<T>(filename: string, data: T[]): void {
    try {
      const filePath = path.join(this.dbPath, filename);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch {
      // Read-only filesystem (e.g. Vercel serverless) - silently skip
    }
  }

  getProviders(): Provider[] {
    return this.providers;
  }

  getProviderById(id: string): Provider | undefined {
    return this.providers.find(p => p.provider_id === id);
  }

  getBookings(): Booking[] {
    return this.bookings;
  }

  getBookingById(id: string): Booking | undefined {
    return this.bookings.find(b => b.booking_id === id);
  }

  addBooking(booking: Booking): void {
    this.bookings.push(booking);
    this.saveJson('bookings.json', this.bookings);
  }

  updateBookingStatus(bookingId: string, status: Booking['status']): void {
    const booking = this.bookings.find(b => b.booking_id === bookingId);
    if (booking) {
      booking.status = status;
      booking.updated_at = new Date().toISOString();
      this.saveJson('bookings.json', this.bookings);
    }
  }

  getNotifications(): Notification[] {
    return this.notifications;
  }

  addNotification(notification: Notification): void {
    this.notifications.push(notification);
    this.saveJson('notifications.json', this.notifications);
  }

  markNotificationRead(notificationId: string): void {
    const notif = this.notifications.find(n => n.notification_id === notificationId);
    if (notif) {
      notif.read = true;
      this.saveJson('notifications.json', this.notifications);
    }
  }

  getDisputes(): Dispute[] {
    return this.disputes;
  }

  addDispute(dispute: Dispute): void {
    this.disputes.push(dispute);
    this.saveJson('disputes.json', this.disputes);
  }

  getAgentLogs(): AgentLog[] {
    return this.agentLogs;
  }

  logAgentTrace(log: AgentLog): void {
    this.agentLogs.push(log);
    this.saveJson('agent_logs.json', this.agentLogs);
  }

  getReviews(providerId?: string): Review[] {
    if (providerId) return this.reviews.filter(r => r.provider_id === providerId);
    return this.reviews;
  }

  addReview(data: { provider_id: string; user_id: string; rating: number; comment?: string }): Review {
    const review: Review = {
      review_id: 'rev_' + Date.now(),
      provider_id: data.provider_id,
      user_id: data.user_id,
      rating: data.rating,
      comment: data.comment || '',
      created_at: new Date().toISOString(),
    };
    this.reviews.push(review);
    return review;
  }

  getPaymentMethods(): PaymentMethod[] {
    return this.paymentMethods;
  }

  addPaymentMethod(data: { type: string; details: Record<string, unknown> }): PaymentMethod {
    const method: PaymentMethod = {
      id: 'pm_' + Date.now(),
      type: data.type,
      details: data.details,
      is_default: this.paymentMethods.length === 0,
      created_at: new Date().toISOString(),
    };
    this.paymentMethods.push(method);
    return method;
  }

  removePaymentMethod(id: string): void {
    this.paymentMethods = this.paymentMethods.filter(p => p.id !== id);
  }

  getFavorites(): string[] {
    return this.favorites;
  }

  toggleFavorite(providerId: string): { is_favorite: boolean } {
    const idx = this.favorites.indexOf(providerId);
    if (idx >= 0) {
      this.favorites.splice(idx, 1);
      return { is_favorite: false };
    }
    this.favorites.push(providerId);
    return { is_favorite: true };
  }

  getUsers(): User[] {
    return this.users;
  }

  getUserByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user: User): void {
    this.users.push(user);
    this.saveJson('users.json', this.users);
  }

  createProvider(provider: Provider): void {
    this.providers.push(provider);
    this.saveJson('providers.json', this.providers);
  }

  updateUser(userId: string, data: Partial<User>): User | null {
    const user = this.users.find(u => u.id === userId);
    if (!user) return null;
    Object.assign(user, data);
    this.saveJson('users.json', this.users);
    return user;
  }

  updateProvider(providerId: string, data: Partial<Provider>): Provider | null {
    const provider = this.providers.find(p => p.provider_id === providerId);
    if (!provider) return null;
    Object.assign(provider, data);
    this.saveJson('providers.json', this.providers);
    return provider;
  }
}
