"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import {
  Input,
  Textarea,
  Button,
  Switch,
  Card,
  CardContent,
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

// Client-side validation schema
const formSchema = z.object({
  organizationName: z.string().min(2, "Organization name is required"),
  bio: z.string().optional(),
  website: z.string().url("Enter a valid URL").or(z.literal("")),
  companyEmail: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(7, "Invalid phone number"),

  socialLinks: z.object({
    linkedin: z.string().url("Enter a valid URL").or(z.literal("")),
    twitter: z.string().url("Enter a valid URL").or(z.literal("")),
    instagram: z.string().url("Enter a valid URL").or(z.literal("")),
  }),

  location: z.object({
    country: z.string().min(1, "Country is required"),
    state: z.string().min(1, "State is required"),
    city: z.string().min(1, "City is required"),
    address: z.string().min(1, "Address is required"),
  }),

  isProfileComplete: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

function OrganizerCompleteProfileForm() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationName: "",
      bio: "",
      website: "",
      companyEmail: "",
      phoneNumber: "",
      socialLinks: {
        linkedin: "",
        twitter: "",
        instagram: "",
      },
      location: {
        country: "",
        state: "",
        city: "",
        address: "",
      },
      isProfileComplete: true,
      isVerified: false,
    },
  });

  // Load user data once when component mounts
  useEffect(() => {
    if (user?.profile && user.role === "organizer") {
      const profile = user.profile;

      form.reset({
        organizationName: profile.organizationName || "",
        bio: profile.bio || "",
        website: profile.website || "",
        companyEmail: profile.companyEmail || "",
        phoneNumber: profile.phoneNumber || "",

        socialLinks: {
          linkedin: profile.socialLinks?.linkedin || "",
          twitter: profile.socialLinks?.twitter || "",
          instagram: profile.socialLinks?.instagram || "",
        },

        location: {
          country: profile.location?.country || "",
          state: profile.location?.state || "",
          city: profile.location?.city || "",
          address: profile.location?.address || "",
        },

        isProfileComplete: true,
        isVerified: profile.isVerified ?? false,
      });
    }
  }, [user, form]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      // Format data to match API expectations
      const formattedData = {
        organizationName: data.organizationName.trim(),
        bio: data.bio?.trim(),
        website: data.website?.trim() || "",
        companyEmail: data.companyEmail.trim(),
        phoneNumber: data.phoneNumber.trim(),

        socialLinks: Object.fromEntries(
          Object.entries(data.socialLinks)
            .filter(([_, value]) => value && value.trim() !== "")
            .map(([key, value]) => [key, value?.trim()])
        ),

        location: {
          country: data.location.country.trim(),
          state: data.location.state.trim(),
          city: data.location.city.trim(),
          address: data.location.address.trim(),
        },

        isProfileComplete: true,
        isVerified: data.isVerified ?? false,
      };

      const response = await axios.post(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/api/v1/organizer/complete-profile`,
        formattedData,
        { withCredentials: true }
      );

      if (response.status === 200) {
        toast.success("Organization profile updated successfully!");
      }
    } catch (error) {
      console.error("Error updating profile:", error);

      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Failed to update profile"
        );
        console.error("API error:", error.response?.data);
      } else {
        toast.error("An unexpected error occurred");
        console.error("Unexpected error:", error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role !== "organizer") {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        This page is only for organizers.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Complete Your Organization Profile
      </h1>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 bg-white rounded-xl shadow-md p-6"
        >
          {/* Basic Information */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">
              Organization Information
            </h2>

            {/* Organization Name */}
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. DevZoku Inc." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bio */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Tell us about your organization..."
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Website */}
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://yourcompany.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company Email */}
            <FormField
              control={form.control}
              name="companyEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Email *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="contact@yourcompany.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone Number */}
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="+91-9876543210" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Location */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(["country", "state", "city", "address"] as const).map((key) => (
                <FormField
                  key={key}
                  control={form.control}
                  name={`location.${key}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="capitalize">{key} *</FormLabel>
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
              Social Media Presence
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Add your organization's social media profiles
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["linkedin", "twitter", "instagram"] as const).map((key) => (
                <FormField
                  key={key}
                  control={form.control}
                  name={`socialLinks.${key}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="capitalize">{key}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={`https://${key}.com/companyname`}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">Status</h2>
            <div className="flex items-center space-x-6">
              <FormField
                control={form.control}
                name="isProfileComplete"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={true} // Always true when submitting profile
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Profile Complete</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Organization Profile"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

// Wrap with auth HOC to ensure only authenticated organizers can access
export default withAuth(OrganizerCompleteProfileForm, "organizer");
