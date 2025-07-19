"use client";
import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  Input,
  Textarea,
  Button,
  Switch,
  Card,
  CardContent,
  Label,
} from "@/components/index";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { withAuth } from "@/utils/withAuth";
import { toast } from "sonner";
import api from "@/utils/api";

// Client-side validation schema
// Make all fields optional except for project fields if a project exists
const projectSchema = z.object({
  title: z.string().min(1, "Project title is required"),
  description: z.string().min(1, "Project description is required"),
  techStack: z.string().min(1, "Tech stack is required"),
  repoUrl: z.string().url("Enter a valid URL").or(z.literal("")),
  demoUrl: z.string().url("Enter a valid URL").or(z.literal("")),
});

const formSchema = z.object({
  title: z.string().trim().min(2, "Title is required"),
  bio: z.string().optional(),
  skills: z.string().min(2, "Skills are required"),

  location: z
    .object({
      city: z.string().min(2, "City is required"),
      state: z.string().min(2, "State is required"),
      country: z.string().min(2, "Country is required"),
    })
    .optional(),

  socialLinks: z
    .object({
      github: z.string().url("Enter a valid URL").or(z.literal("")),
      linkedin: z.string().url("Enter a valid URL").or(z.literal("")),
      portfolio: z.string().url("Enter a valid URL").or(z.literal("")),
      twitter: z.string().url("Enter a valid URL").or(z.literal("")),
      hashnode: z.string().url("Enter a valid URL").or(z.literal("")),
      devto: z.string().url("Enter a valid URL").or(z.literal("")),
      instagram: z.string().url("Enter a valid URL").or(z.literal("")),
    })
    .optional(),

  // Projects array is optional, but if a project exists, its fields are required
  projects: z.array(projectSchema).optional(),
});

type FormData = z.infer<typeof formSchema>;

const initialProject = {
  title: "",
  description: "",
  techStack: "",
  repoUrl: "",
  demoUrl: "",
};

function CompleteProfileForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      bio: "",
      skills: "",
      location: {
        city: "",
        state: "",
        country: "",
      },
      socialLinks: {
        github: "",
        linkedin: "",
        portfolio: "",
        twitter: "",
        hashnode: "",
        devto: "",
        instagram: "",
      },
      projects: [],
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "projects",
  });

  // Track if user is trying to add a project
  const [isAddingProject, setIsAddingProject] = useState(false);

  // Load user data once when component mounts
  useEffect(() => {
    if (user?.profile && user.role === "developer") {
      const profile = user.profile;

      reset({
        title: profile.title || "",
        bio: profile.bio || "",
        skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : "",

        location: {
          city: profile.location?.city || "",
          state: profile.location?.state || "",
          country: profile.location?.country || "",
        },

        socialLinks: {
          github: profile.socialLinks?.github || "",
          linkedin: profile.socialLinks?.linkedin || "",
          portfolio: profile.socialLinks?.portfolio || "",
          twitter: profile.socialLinks?.twitter || "",
          hashnode: profile.socialLinks?.hashnode || "",
          devto: profile.socialLinks?.devto || "",
          instagram: profile.socialLinks?.instagram || "",
        },

        // Map existing projects if any exist, otherwise keep as empty array
        projects:
          Array.isArray(profile.projects) && profile.projects.length > 0
            ? profile.projects.map((project) => ({
                title: project.title || "",
                description: project.description || "",
                techStack: Array.isArray(project.techStack)
                  ? project.techStack.join(", ")
                  : project.techStack || "",
                repoUrl: project.repoUrl || "",
                demoUrl: project.demoUrl || "",
              }))
            : undefined, // ← yahi change chahiye
      });
    }
  }, [user, reset]);

  const onSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true);

      // Check if any project is incomplete
      if (formData.projects && formData.projects.length > 0) {
        const hasIncompleteProject = formData.projects.some(
          (project) =>
            !project.title || !project.description || !project.techStack
        );

        if (hasIncompleteProject) {
          toast.error("Please complete all required fields in your projects");
          setIsSubmitting(false);
          return;
        }
      }

      // Format data to match API expectations
      const formattedData = {
        title: formData.title?.trim(),
        bio: formData.bio?.trim(),
        skills: formData.skills
          ? formData.skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],

        location: formData.location && {
          city: formData.location.city?.trim() || "",
          state: formData.location.state?.trim(),
          country: formData.location.country?.trim() || "",
        },

        socialLinks:
          formData.socialLinks &&
          Object.fromEntries(
            Object.entries(formData.socialLinks)
              .filter(([_, value]) => value && value.trim() !== "")
              .map(([key, value]) => [key, value?.trim()])
          ),

        projects:
          formData.projects &&
          formData.projects.map((proj) => ({
            title: proj.title.trim(),
            description: proj.description.trim(),
            techStack: proj.techStack
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            repoUrl: proj.repoUrl?.trim() || "",
            demoUrl: proj.demoUrl?.trim() || "",
          })),
      };

      const res = await api.post(`/developer/complete-profile`, formattedData, {
        withCredentials: true,
      });

      const { status, data, message } = res.data;

      if (status === 200) {
        toast.success(message || "Profile updated successfully!");
        router.push(`/developer/profile/${user?.id}`);
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role !== "developer") {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        This page is only for developers.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Complete Your Developer Profile
      </h1>

      <Form {...form}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-8 bg-white rounded-xl shadow-md p-6"
        >
          {/* Basic Information */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">
              Basic Information
            </h2>

            {/* Title */}
            <FormField
              control={control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professional Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Full Stack Developer" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bio */}
            <FormField
              control={control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Tell us about yourself..."
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Skills */}
            <FormField
              control={control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skills (comma separated)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="React, Node.js, PostgreSQL"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Location */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["city", "state", "country"] as const).map((key) => (
                <FormField
                  key={key}
                  control={control}
                  name={`location.${key}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="capitalize">{key}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={`Enter ${key}`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">
              Social Links
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Add your social media profiles
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(form.getValues().socialLinks || {}).map((key) => (
                <FormField
                  key={key}
                  control={control}
                  name={`socialLinks.${key}` as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="capitalize">{key}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={`https://${key}.com/username`}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>

          {/* Projects */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">Projects</h2>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">
                Add projects to showcase your skills
              </p>

              {/* Add project button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAddingProject(true);
                  append(initialProject);
                }}
              >
                + Add Project
              </Button>
            </div>

            {/* No projects message */}
            {fields.length === 0 && !isAddingProject && (
              <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">No projects added yet</p>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsAddingProject(true);
                    append(initialProject);
                  }}
                  className="mt-2"
                >
                  Click to add your first project
                </Button>
              </div>
            )}

            {/* Project list */}
            <div className="space-y-6">
              {fields.map((field, index) => (
                <Card key={field.id} className="border border-gray-200">
                  <CardContent className="space-y-4 p-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Project {index + 1}</h3>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        Remove
                      </Button>
                    </div>

                    <FormField
                      control={control}
                      name={`projects.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Title *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Project Title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`projects.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Describe your project"
                              className="min-h-[80px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`projects.${index}.techStack`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tech Stack (comma separated) *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="React, Node.js, MongoDB"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={control}
                        name={`projects.${index}.repoUrl`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Repository URL</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="https://github.com/username/repo"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`projects.${index}.demoUrl`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Demo URL</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="https://your-project.com"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

// Wrap with auth HOC to ensure only authenticated developers can access
export default withAuth(CompleteProfileForm, "developer");
