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

  overallScore?: number;
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
  totalEventsOrganized?: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isProfileComplete: boolean;
  googleId?: string;
  createdAt?: string;
  updatedAt?: string;
  location?: {
    country?: string;
    state?: string;
    city?: string;
    address?: string;
  };
  profile?: DeveloperProfile | OrganizerProfile;
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
