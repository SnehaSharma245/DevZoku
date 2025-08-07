"use client";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Textarea, Button, Switch } from "@/components/index";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { withAuth } from "@/utils/withAuth";
import { toast } from "sonner";
import api from "@/utils/api";
import { X, Users } from "lucide-react";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamNameStatus, setTeamNameStatus] = useState({
    isChecking: false,
    isAvailable: true,
    message: "",
  });
  const [descCharCount, setDescCharCount] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
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
      const res = await api.get(
        `/team/check-teamName-unique?teamName=${encodeURIComponent(teamName)}`,
        { withCredentials: true }
      );

      const { status, data, message } = res.data;

      setTeamNameStatus({
        isChecking: false,
        isAvailable: data.isUnique,
        message: message,
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

  // When form resets, also clear skills
  useEffect(() => {
    if (!form.getValues("skillsNeeded")) setSkills([]);
  }, [form.watch("skillsNeeded")]);

  const onSubmit = async (formData: TeamFormData) => {
    try {
      setIsSubmitting(true);

      const res = await api.post(`/team/create-team`, formData, {
        withCredentials: true,
      });

      const { status, data, message } = res.data;

      if (status === 201) {
        toast.success(message || "Team created successfully");
        form.reset();
        setTeamNameStatus({
          isChecking: false,
          isAvailable: true,
          message: "",
        });
      }
    } catch (error: any) {
      console.error("Error creating team:", error);
      toast.error(error?.response?.data?.message || "Failed to create team");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 mt-4">
      <div className="max-w-3xl w-full mx-auto">
        {/* Card-style container */}
        <div className="bg-gradient-to-br from-white via-white to-[#fff9f5] rounded-3xl shadow-2xl border border-[#e3e8ee] p-8 mb-10 flex flex-col items-center">
          {/* Team Logo Avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#FF9466] to-[#FF6F61] flex items-center justify-center shadow-xl border-4 border-white mb-4">
            <Users className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#062a47] mb-2 text-center">
            Create Your Team
          </h1>
        </div>

        {/* Form Card */}
        <div className="bg-gradient-to-br from-white via-white to-[#fff9f5] rounded-3xl shadow-xl border border-[#e3e8ee] p-8">
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Name */}
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#062a47] font-semibold">
                      Team Name *
                    </FormLabel>
                    <FormControl>
                      <div>
                        <Input
                          {...field}
                          placeholder="Enter team name"
                          className="bg-gradient-to-br from-white via-white to-[#fff9f5] text-[#062a47]  rounded-xl placeholder:text-[#888]"
                          onChange={(e) => {
                            field.onChange(e);
                            debouncedTeamNameCheck(e.target.value);
                          }}
                        />

                        {/* Only show status if input is not empty */}
                        {field.value?.trim() && (
                          <>
                            {teamNameStatus.isChecking ? (
                              <span className="text-sm text-gray-400">
                                Checking availability...
                              </span>
                            ) : teamNameStatus.message ===
                              "Invalid Team Name" ? (
                              <span className="text-sm text-red-500">
                                Invalid Team Name
                              </span>
                            ) : (
                              <span
                                className={`text-sm ${
                                  teamNameStatus.isAvailable
                                    ? "text-green-500"
                                    : "text-red-500"
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
                    <div className="flex justify-between items-center">
                      <FormLabel className="text-[#062a47] font-semibold">
                        Description
                      </FormLabel>
                      <span className="text-xs text-gray-400">
                        {descCharCount}/250
                      </span>
                    </div>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="What's your team about?"
                        className="bg-gradient-to-br from-white via-white to-[#fff9f5] text-[#062a47]  rounded-xl  placeholder:text-[#888] resize-none"
                        rows={3}
                        maxLength={250}
                        onChange={(e) => {
                          field.onChange(e);
                          setDescCharCount(e.target.value.length);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Skills Needed as labels/cards */}
              <FormItem>
                <FormLabel className="text-[#062a47] font-semibold">
                  Skills Needed
                </FormLabel>
                <FormControl>
                  <div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {skills.map((skill, idx) => (
                        <span
                          key={skill + idx}
                          className="flex items-center bg-gradient-to-tr from-[#FF9466] to-[#FF6F61] text-[#fff] px-3 py-1 rounded-full text-sm font-semibold shadow"
                        >
                          {skill}
                          <button
                            type="button"
                            className="ml-2 text-gray-400 hover:text-red-400"
                            onClick={() => {
                              const updated = skills.filter(
                                (_, i) => i !== idx
                              );
                              setSkills(updated);
                              form.setValue("skillsNeeded", updated.join(", "));
                            }}
                            tabIndex={-1}
                          >
                            <X className="w-3 h-3 text-[#fff]" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <Input
                      placeholder="Type a skill and press Enter"
                      className="bg-gradient-to-br from-white via-white to-[#fff9f5] text-[#062a47] rounded-xl placeholder:text-[#888]"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && skillInput.trim() !== "") {
                          e.preventDefault();
                          const val = skillInput.trim();
                          if (!skills.includes(val)) {
                            const updated = [...skills, val];
                            setSkills(updated);
                            form.setValue("skillsNeeded", updated.join(", "));
                          }
                          setSkillInput("");
                        }
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>

              {/* Team Size */}
              <FormField
                control={control}
                name="teamSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#062a47] font-semibold">
                      Team Size
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={1}
                        placeholder="Enter number of members"
                        className="bg-gradient-to-br from-white via-white to-[#fff9f5] text-[#062a47]  rounded-xl  placeholder:text-[#888]"
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
                        className="data-[state=checked]:bg-[#f75a2f] data-[state=unchecked]:bg-[#eaf6fb]"
                      />
                    </FormControl>
                    <FormLabel className="text-[#062a47] font-semibold">
                      Accepting Members
                    </FormLabel>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-[#f75a2f] text-white font-bold rounded-xl hover:bg-[#FF9466] transition"
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
      </div>
    </div>
  );
}

export default withAuth(CreateTeamForm, "developer");
