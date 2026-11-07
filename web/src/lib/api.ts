import axios from "axios";
import type {
  ReportsSummary,
  Reservation,
  Ticket,
  TicketValidation,
  Trip,
  TripSeats,
  User,
  Vehicle,
} from "@/lib/types";

export const api = axios.create({
  baseURL: "/api/backend",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export const sessionApi = axios.create({
  baseURL: "/api/session",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
    return error.response?.status
      ? `Request failed (${error.response.status}). Please try again.`
      : "Unable to reach the server. Check your connection and try again.";
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

export const authApi = {
  login: async (email: string, password: string) =>
    (await sessionApi.post<User>("/login", { email, password })).data,
  register: async (name: string, email: string, password: string) =>
    (await sessionApi.post<User>("/register", { name, email, password })).data,
  me: async () => (await sessionApi.get<User>("/me")).data,
  logout: async () => sessionApi.post("/logout"),
};

export const tripsApi = {
  list: async (params?: {
    origin?: string;
    destination?: string;
    date?: string;
  }) =>
    (await api.get<Trip[]>("/trips", { params })).data,
  get: async (id: string) => (await api.get<Trip>(`/trips/${id}`)).data,
  adminList: async () => (await api.get<Trip[]>("/trips/admin/all")).data,
  seats: async (id: string) =>
    (await api.get<TripSeats>(`/trips/${id}/seats`)).data,
  create: async (data: {
    origin: string;
    destination: string;
    departureAt: string;
    vehicleId: string;
    driverId?: string | null;
  }) => (await api.post<Trip>("/trips", data)).data,
  update: async (id: string, data: Partial<Trip>) =>
    (await api.patch<Trip>(`/trips/${id}`, data)).data,
  remove: async (id: string) => api.delete(`/trips/${id}`),
};

export const vehiclesApi = {
  list: async () => (await api.get<Vehicle[]>("/vehicles")).data,
  create: async (data: { plate: string; capacity: number }) =>
    (await api.post<Vehicle>("/vehicles", data)).data,
  update: async (id: string, data: Partial<Vehicle>) =>
    (await api.patch<Vehicle>(`/vehicles/${id}`, data)).data,
  remove: async (id: string) => api.delete(`/vehicles/${id}`),
};

export const reservationsApi = {
  mine: async () => (await api.get<Reservation[]>("/reservations/me")).data,
  all: async (params?: {
    userId?: string;
    tripId?: string;
    status?: Reservation["status"];
  }) => (await api.get<Reservation[]>("/reservations", { params })).data,
  create: async (tripId: string, seatNumber: number) =>
    (await api.post<Reservation>("/reservations", { tripId, seatNumber })).data,
  update: async (
    id: string,
    tripId: string,
    seatNumber?: number,
  ) =>
    (
      await api.patch<Reservation>(`/reservations/${id}`, {
        tripId,
        ...(seatNumber === undefined ? {} : { seatNumber }),
      })
    ).data,
  cancel: async (id: string) => api.delete(`/reservations/${id}`),
  driverTrip: async (tripId: string) =>
    (await api.get<Reservation[]>(`/driver/trips/${tripId}/reservations`)).data,
  ticket: async (id: string) =>
    (await api.get<Ticket>(`/reservations/${id}/ticket`)).data,
  validateTicket: async (token: string) =>
    (
      await api.post<TicketValidation>("/tickets/validate", { token })
    ).data,
};

export const reportsApi = {
  summary: async () =>
    (await api.get<ReportsSummary>("/reports/summary")).data,
};
