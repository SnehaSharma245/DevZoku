// Define interfaces for both user profile types
export interface DeveloperProfile {
  id: string;
  userId: string;
  title?: string;
  bio?: string;
  skills?: string[];
  socialLinks?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
    twitter?: string;
    hashnode?: string;
    devto?: string;
    instagram?: string;
  };
  projects?: Array<{
    title: string;
    description: string;
    techStack: string[];
    repoUrl?: string;
    demoUrl?: string;
  }>;
  location?: {
    country: string;
    state: string;
    city: string;
  };
  overallScore?: number;
  isProfileComplete?: boolean;
  isAvailable?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrganizerProfile {
  id: string;
  userId: string;
  organizationName?: string;
  bio?: string;
  website?: string;
  companyEmail?: string;
  phoneNumber?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
  location?: {
    country: string;
    state: string;
    city: string;
    address: string;
  };
  totalEventsOrganized?: number;
  isProfileComplete?: boolean;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  role: "developer" | "organizer";
  isProfileComplete?: boolean;
  profile: DeveloperProfile | OrganizerProfile;
  googleId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Type guards to check profile type
export function isDeveloperProfile(profile: any): profile is DeveloperProfile {
  return profile && "skills" in profile;
}

export function isOrganizerProfile(profile: any): profile is OrganizerProfile {
  return (
    profile && ("organizationName" in profile || "companyEmail" in profile)
  );
}
