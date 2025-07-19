interface Developer {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  title?: string;
  bio?: string;
  resumeUrl?: string;
  skills?: string[];
  socialLinks?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
    twitter?: string;
    instagram?: string;
    devto?: string;
    hashnode?: string;
  };
  projects?: {
    title: string;
    description: string;
    repoUrl: string;
    demoUrl?: string;
    techStack: string[]; // or string (comma-separated)
  }[];
}

interface Organizer {
  id: string;
  userId: string;

  // Organization Info
  organizationName?: string;

  // Contact & Description
  bio?: string;
  website?: string;
  companyEmail?: string;
  phoneNumber?: string;

  // 🌐 Social Links
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };

  // Statistics
  totalEventsOrganized?: number;

  // Metadata
  createdAt?: string; // or Date
  updatedAt?: string; // or Date
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  role: "developer" | "organizer";
  password?: string; // usually not used in frontend but included for completeness
  refreshToken?: string | null;
  googleId?: string;
  isProfileComplete?: boolean;
  createdAt: string; // will be string when received from API (ISO format)
  updatedAt: string;
  location?: {
    country?: string;
    state?: string;
    city?: string;
    address?: string;
  };
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  teamId?: string;
  createdAt: string;
}

export type AppUser =
  | (User & { role: "developer"; profile: Developer })
  | (User & { role: "organizer"; profile: Organizer });
