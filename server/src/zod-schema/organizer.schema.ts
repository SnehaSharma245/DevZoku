import { z } from "zod";

const safeUrl = z
  .string()
  .trim()
  .refine((val) => val === "" || /^https?:\/\/[^\s$.?#].[^\s]*$/i.test(val), {
    message: "Enter a valid URL or leave empty",
  });

export const completeOrganizerProfileSchema = z.object({
  organizationName: z.string().trim().min(2, "Organization name is required"),
  bio: z.string().optional(),
  website: safeUrl.optional(),
  companyEmail: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(7, "Invalid phone number"),

  socialLinks: z
    .object({
      linkedin: safeUrl.optional(),
      twitter: safeUrl.optional(),
      instagram: safeUrl.optional(),
    })
    .optional(),

  location: z
    .object({
      country: z.string(),
      state: z.string(),
      city: z.string(),
      address: z.string(),
    })
    .optional(),

  isProfileComplete: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});
