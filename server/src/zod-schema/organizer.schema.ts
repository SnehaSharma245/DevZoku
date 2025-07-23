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
  phoneNumber: z
    .string()
    .min(8, "Phone number is required")
    .max(16, "Phone number is too long")
    .regex(/^\+?[0-9]{8,16}$/, "Enter a valid phone number"),
  socialLinks: z
    .object({
      linkedin: safeUrl.optional(),
      twitter: safeUrl.optional(),
      instagram: safeUrl.optional(),
    })
    .optional(),
  location: z.object({
    country: z.string().min(1, "Country is required"),
    state: z.string().min(1, "State is required"),
    city: z.string().min(1, "City is required"),
    address: z.string().min(1, "Address is required"),
  }),
});
