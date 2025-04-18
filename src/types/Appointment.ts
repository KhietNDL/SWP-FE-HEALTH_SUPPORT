import { DoctorType } from "./doctor";
import { User } from "./user";
export interface Appointment {
    id: string;
    createAt: string;
    modifiedAt: string | null;
    appointmentDate: string;
    accountId: string;
    account: User;
    psychologistId: DoctorType;
    psychologist: any | null;
    content: string;
    isDelete: boolean;
    status: "pending" | "approved" | "rejected" | "in progress" | "completed" | "expired";
  }