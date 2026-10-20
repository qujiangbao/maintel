export type Role = "student" | "admin" | "technician";

export type TagId = "host" | "display" | "network" | "media" | "peripheral";

export type Urgency = "low" | "medium" | "high" | "critical";

export type TicketStatus =
  | "submitted"
  | "triaged"
  | "confirmed"
  | "dispatched"
  | "accepted"
  | "processing"
  | "completed";

export type ModelId = "deepseek" | "zhipu";

export type User = {
  id: string;
  role: Role;
  username: string;
  password: string;
  name: string;
  detail: string;
  position?: string;
};

export type PublicUser = Omit<User, "password">;

export type TriageRecord = {
  id: string;
  model: ModelId;
  modelName: string;
  createdAt: string;
  actorId: string;
  actorName: string;
  ok: boolean;
  error?: string;
  tag?: TagId;
  urgency?: Urgency;
  position?: string;
  reason?: string;
  raw: string;
  latencyMs: number;
  httpStatus?: number;
};

export type HistoryEvent = {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: string;
  fromStatus: TicketStatus | null;
  toStatus: TicketStatus;
  note: string;
};

export type Ticket = {
  id: string;
  no: string;
  studentId: string;
  studentName: string;
  studentDetail: string;
  room: string;
  device: string;
  description: string;
  status: TicketStatus;
  triages: TriageRecord[];
  confirmedTriageId: string | null;
  confirmedAt: string | null;
  confirmedById: string | null;
  confirmedByName: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneePosition: string | null;
  dispatchedAt: string | null;
  createdAt: string;
  updatedAt: string;
  history: HistoryEvent[];
};

export type RepairCase = {
  id: string;
  room: string;
  device: string;
  description: string;
  tag: TagId;
  urgency: Urgency;
  position: string;
  basis: string;
};
