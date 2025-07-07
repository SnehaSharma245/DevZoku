"use client";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Input, Textarea, Button, Switch } from "@/components/index";
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

const createTeamFormSchema = z.object({
  name: z
    .string()
    .min(3, "Team name must be at least 3 characters")
    .max(255, "Team name must be under 255 characters")
    .trim(),

  description: z.string().max(500, "Description too long").trim().optional(),

  teamSize: z.coerce.number().min(1).max(20),
  isAcceptingInvites: z.boolean().optional(),
  skillsNeeded: z.string().max(500).trim().optional(),
});

type TeamFormData = z.infer<typeof createTeamFormSchema>;

function CreateTeamForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamNameStatus, setTeamNameStatus] = useState({
    isChecking: false,
    isAvailable: true,
    message: "",
  });
  const teamNameCheckTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const form = useForm<TeamFormData>({
    resolver: zodResolver(createTeamFormSchema),
    defaultValues: {
      name: "",
      description: "",
      teamSize: 1,
      isAcceptingInvites: true,
      skillsNeeded: "",
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  const checkTeamNameAvailability = async (teamName: string) => {
    if (!teamName) {
      setTeamNameStatus({ isChecking: false, isAvailable: true, message: "" });
      return;
    }

    try {
      const response = await api.get(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/api/v1/developer/check-teamName-unique?teamName=${encodeURIComponent(
          teamName
        )}`,
        { withCredentials: true }
      );

      setTeamNameStatus({
        isChecking: false,
        isAvailable: response.data.data.isUnique, // <-- yeh sahi hai
        message: response.data.message,
      });
    } catch (error: any) {
      setTeamNameStatus({
        isChecking: false,
        isAvailable: false,
        message: error?.response?.data?.message || "Error checking team name",
      });
    }
  };

  const debouncedTeamNameCheck = (teamName: string) => {
    setTeamNameStatus((prev) => ({ ...prev, isChecking: true }));
    if (teamNameCheckTimeout.current) {
      clearTimeout(teamNameCheckTimeout.current);
    }
    teamNameCheckTimeout.current = setTimeout(() => {
      checkTeamNameAvailability(teamName);
    }, 1000); // 1 second delay
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (teamNameCheckTimeout.current) {
        clearTimeout(teamNameCheckTimeout.current);
      }
    };
  }, []);

  const onSubmit = async (data: TeamFormData) => {
    try {
      setIsSubmitting(true);

      const response = await api.post(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/api/v1/developer/create-team`,
        data,
        { withCredentials: true }
      );

      if (response.status === 200) {
        toast.success("Team created successfully!");
        router.push("/teams");
      }
    } catch (error: any) {
      console.error("Error creating team:", error);
      toast.error(
        "Failed to create team",
        error ? error.message : "Unknown error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Create Your Team</h1>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team Name</FormLabel>
                <FormControl>
                  <div>
                    <Input
                      {...field}
                      placeholder="Enter team name"
                      onChange={(e) => {
                        field.onChange(e);
                        debouncedTeamNameCheck(e.target.value);
                      }}
                    />

                    {/* Only show status if input is not empty */}
                    {field.value?.trim() && (
                      <>
                        {teamNameStatus.isChecking ? (
                          <span className="text-sm text-gray-500">
                            Checking availability...
                          </span>
                        ) : teamNameStatus.message === "Invalid Team Name" ? (
                          <span className="text-sm text-red-600">
                            Invalid Team Name
                          </span>
                        ) : (
                          <span
                            className={`text-sm ${
                              teamNameStatus.isAvailable
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {teamNameStatus.message
                              ? teamNameStatus.message
                              : teamNameStatus.isAvailable
                              ? "Team name is available"
                              : "Team name is taken"}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="What's your team about?" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Skills Needed */}
          <FormField
            control={control}
            name="skillsNeeded"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Skills Needed (optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Next.js, MongoDB" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Team Size */}
          <FormField
            control={control}
            name="teamSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team Size</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min={1}
                    placeholder="Enter number of members"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Accepting Invites */}
          <FormField
            control={control}
            name="isAcceptingInvites"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-3">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Accepting Members</FormLabel>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={
              isSubmitting ||
              !teamNameStatus.isAvailable ||
              teamNameStatus.isChecking
            }
          >
            {isSubmitting ? "Creating..." : "Create Team"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default withAuth(CreateTeamForm, "developer");
