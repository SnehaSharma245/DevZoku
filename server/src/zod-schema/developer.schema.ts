import { z } from "zod";

const safeUrl = z
  .string()
  .trim()
  .refine((val) => val === "" || /^https?:\/\/[^\s$.?#].[^\s]*$/i.test(val), {
    message: "Enter a valid URL or leave empty",
  });

export const completeDeveloperProfileSchema = z.object({
  title: z.string().trim().min(2, "Title is required"),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  socialLinks: z
    .object({
      github: safeUrl.optional(),
      linkedin: safeUrl.optional(),
      portfolio: safeUrl.optional(),
      twitter: safeUrl.optional(),
      hashnode: safeUrl.optional(),
      devto: safeUrl.optional(),
    })
    .optional(),
  projects: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        techStack: z.array(z.string()),
        repoUrl: safeUrl.optional(),
        demoUrl: safeUrl.optional(),
      })
    )
    .optional(),
  location: z.object({
    country: z.string().min(2, "Country is required"),
    state: z.string().min(2, "State is required"),
    city: z.string().min(2, "City is required"),
    address: z.string().optional(), // Optional address field
  }),
});
