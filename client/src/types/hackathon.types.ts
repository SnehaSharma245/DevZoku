export interface Hackathon {
  id: string;
  title: string;
  description?: string;
  registrationStart?: string;
  registrationEnd?: string;
  createdBy?: string;
  organizationName?: string;
  startTime: string;
  endTime: string;
  participants?: string[];
  status?:
    | "upcoming"
    | "ongoing"
    | "completed"
    | "Registration in Progress"
    | "Registration ended"
    | "unknown";
  tags: string[];
  poster?: string;
  minTeamSize?: number;
  maxTeamSize?: number;
  location?: string;
  mode?: "online" | "offline";
  phases?: Phases[];
  positionHolders?: {
    winner?: string;
    firstRunnerUp?: string;
    secondRunnerUp?: string;
    participant?: string[];
  } | null;
  dateCompleted?: string; // archived field
}

export interface Phases {
  id: string;
  hackathonId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  order: number;
}
