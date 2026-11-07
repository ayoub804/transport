export type UserRole = "ADMIN" | "DRIVER" | "CLIENT";
export type TripStatus = "SCHEDULED" | "CANCELLED" | "COMPLETED";
export type ReservationStatus = "CONFIRMED" | "CANCELLED" | "USED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  capacity: number;
  createdAt: string;
}

export interface Trip {
  id: string;
  origin: string;
  destination: string;
  departureAt: string;
  vehicleId: string;
  driverId: string | null;
  status: TripStatus;
  createdAt: string;
  vehicle?: Pick<Vehicle, "id" | "plate" | "capacity">;
  driver?: Pick<User, "id" | "name" | "email"> | null;
}

export interface Reservation {
  id: string;
  userId: string;
  tripId: string;
  seatNumber: number;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
  trip: Trip;
  user?: Pick<User, "id" | "name" | "email" | "role">;
}

export interface TripSeat {
  seatNumber: number;
  available: boolean;
}

export interface TripSeats {
  tripId: string;
  capacity: number;
  seats: TripSeat[];
}

export interface Ticket {
  reservationId: string;
  qrCodeDataUrl: string;
}

export interface ReportsSummary {
  totalReservations: number;
  cancellationRate: number;
  reservationsPerTrip: Array<
    Pick<Trip, "id" | "origin" | "destination" | "departureAt" | "status"> & {
      reservationCount: number;
    }
  >;
}

export interface TicketValidation {
  valid: true;
  message: string;
  reservationId: string;
}
