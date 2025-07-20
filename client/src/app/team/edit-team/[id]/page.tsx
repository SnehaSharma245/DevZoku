"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input, Textarea, Button, Switch } from "@/components/index";
import { X } from "lucide-react";
import { withAuth } from "@/utils/withAuth";
import api from "@/utils/api";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RadioGroup } from "@/components/ui/radio-group";

interface Team {
  id: string;
  name: string;
  description?: string;
  teamSize: number;
  isAcceptingInvites: boolean;
  skillsNeeded?: string;
  captain: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "developer" | "organizer";
    isProfileComplete: boolean;
    createdAt: string;
    updatedAt: string;
  };
  team_members: { userId: string; name: string; lastName?: string }[];
}

function EditTeamPage() {
  const { id } = useParams();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    teamSize: 1,
    isAcceptingInvites: true,
    skillsNeeded: "",
  });
  const [descCharCount, setDescCharCount] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [selectedCaptain, setSelectedCaptain] = useState<string | null>(null);
  const fetchTeam = async () => {
    try {
      const res = await api.get(`/team/view-all-teams/${id}`, {
        withCredentials: true,
      });

      const { status, data } = res.data;

      if (status === 200 && data && data.team) {
        setTeam(data);
        setForm({
          name: data.team.name,
          description: data.team.description || "",
          teamSize: data.team.teamSize,
          isAcceptingInvites: data.team.isAcceptingInvites,
          skillsNeeded: data.team.skillsNeeded || "",
        });
        setDescCharCount(data.team.description?.length || 0);
        setSkills(
          data.team.skillsNeeded
            ? data.team.skillsNeeded
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean)
            : []
        );
        setSelectedCaptain(data.team.captain?.id || null);
      }
    } catch (error: any) {
      console.error("Error fetching team:", error);
      toast.error(error?.response?.data?.message || "Failed to fetch team");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchTeam();
  }, []);

  // Keep skillsNeeded in sync with skills array
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      skillsNeeded: skills.join(", "),
    }));
  }, [skills]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    if (name === "description") setDescCharCount(value.length);
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? target.checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        captainId: selectedCaptain, // add captainId to payload
      };
      const res = await api.put(`/team/edit/${id}`, payload, {
        withCredentials: true,
      });
      if (res.data.status === 200) {
        toast.success("Team updated successfully!");
        router.push(`/team/view-all-teams/${id}`);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update team");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-400">Loading...</span>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-red-400">Team not found.</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center pb-16">
      <div className="max-w-2xl w-full mx-auto py-10 px-4">
        <h1 className="text-3xl font-extrabold mb-8 text-center text-white tracking-tight">
          Edit Your Team
        </h1>
        <form
          onSubmit={handleSubmit}
          className="space-y-8 bg-[#18181e] rounded-3xl shadow-xl p-8 border border-[#23232b]"
        >
          {/* Team Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">
              Team Name *
            </label>
            <Input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={255}
              className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888]"
              placeholder="Enter team name"
            />
          </div>
          {/* Description */}
          <div>
            <div className="flex justify-between items-center">
              <label className="block text-sm font-semibold text-gray-300">
                Description
              </label>
              <span className="text-xs text-gray-400">{descCharCount}/250</span>
            </div>
            <Textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              maxLength={250}
              rows={3}
              className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888] resize-none"
              placeholder="What's your team about?"
            />
          </div>
          {/* Skills Needed */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">
              Skills Needed
            </label>
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {skills.map((skill, idx) => (
                  <span
                    key={skill + idx}
                    className="flex items-center bg-[#23232b] text-white px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      className="ml-2 text-gray-400 hover:text-red-400"
                      onClick={() => {
                        const updated = skills.filter((_, i) => i !== idx);
                        setSkills(updated);
                      }}
                      tabIndex={-1}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <Input
                placeholder="Type a skill and press Enter"
                className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888]"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && skillInput.trim() !== "") {
                    e.preventDefault();
                    const val = skillInput.trim();
                    if (!skills.includes(val)) {
                      setSkills([...skills, val]);
                    }
                    setSkillInput("");
                  }
                }}
              />
            </div>
          </div>
          {/* Team Size & Accepting Invites */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-300 mb-1">
                Team Size
              </label>
              <Input
                type="number"
                name="teamSize"
                value={form.teamSize}
                onChange={handleChange}
                min={1}
                max={20}
                className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888]"
                placeholder="Enter number of members"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-1">
                <Switch
                  checked={form.isAcceptingInvites}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      isAcceptingInvites: checked,
                    }))
                  }
                  className="data-[state=checked]:bg-[#a3e635] data-[state=unchecked]:bg-[#23232b]"
                />
                Accepting Members
              </label>
            </div>
          </div>
          <div className="flex gap-4">
            {/* accordion for team members */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="team-members">
                <AccordionTrigger className="text-sm font-semibold text-gray-300">
                  Change Captain
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  {team.team_members.length > 0 ? (
                    <ul className="space-y-2">
                      {team.team_members.map((member) => (
                        <li
                          key={member.userId}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="checkbox"
                            name="captain"
                            value={member.userId}
                            checked={selectedCaptain === member.userId}
                            onChange={() => setSelectedCaptain(member.userId)}
                            className="accent-[#a3e635] w-4 h-4"
                          />
                          <span>
                            {member.name}{" "}
                            {member.lastName ? member.lastName : ""}
                            {team.captain.id === member.userId && (
                              <span className="ml-2 text-xs text-[#a3e635]">
                                (Current Captain)
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No members in this team.</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          <Button
            type="submit"
            className="w-full bg-[#a3e635] text-black font-bold rounded-xl hover:bg-lime-400 transition"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default withAuth(EditTeamPage, "developer");
