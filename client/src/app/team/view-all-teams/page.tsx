"use client";
import { Button } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import api from "@/utils/api";
import { withAuth } from "@/utils/withAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Users, X } from "lucide-react";

interface TeamBrief {
  team: {
    id: string;
    name: string;
    requiredMemberCount: number;
    currentMemberCount: number;
    isAcceptingInvites: boolean;
    skillsNeeded?: string;
  };

  captain: {
    firstName: string;
    email: string;
  };
}

function normalize(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]/gi, "");
}

function ViewAllTeams() {
  const { user } = useAuth();

  const [teams, setTeams] = useState<TeamBrief[]>([]);
  const [invitationSent, setInvitationSent] = useState<boolean>(false);
  const [search, setSearch] = useState("");
  const [skillFilterInput, setSkillFilterInput] = useState("");
  const [skillFilters, setSkillFilters] = useState<string[]>([]);
  const [showSkillsFor, setShowSkillsFor] = useState<string | null>(null);

  const fetchAllTeams = async () => {
    try {
      const response = await api.get(`/team/view-all-teams`, {
        withCredentials: true,
      });

      const { status, data, message } = response.data;

      if (status === 200) {
        setTeams(data || []);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch all teams"
      );
      console.error("Error fetching all teams:", error);
    }
  };

  useEffect(() => {
    fetchAllTeams();
  }, []);

  const handleSendingInvite = async (id: string) => {
    try {
      const response = await api.post(
        `/team/send-invitation`,
        { teamId: id },
        { withCredentials: true }
      );

      const { status, data, message } = response.data;
      if (status === 200) {
        setInvitationSent(true);
        toast.success(message || "Invitation sent successfully");
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to send invitation"
      );
      console.error("Error sending invitation:", error);
    }
  };

  // Add skill on Enter/comma
  const handleSkillInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      (e.key === "Enter" || e.key === ",") &&
      skillFilterInput.trim() !== ""
    ) {
      e.preventDefault();
      const skillsToAdd = skillFilterInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s && !skillFilters.includes(s));
      if (skillsToAdd.length > 0) {
        setSkillFilters([...skillFilters, ...skillsToAdd]);
      }
      setSkillFilterInput("");
    }
  };

  // Remove skill filter
  const removeSkillFilter = (idx: number) => {
    setSkillFilters(skillFilters.filter((_, i) => i !== idx));
  };

  // Filter teams by search and required skills
  const filteredTeams = teams.filter((team) => {
    const matchesSearch = normalize(team.team.name).includes(normalize(search));
    const teamSkills = team.team.skillsNeeded
      ? team.team.skillsNeeded.split(",").map((s) => s.trim().toLowerCase())
      : [];
    const matchesSkills =
      skillFilters.length === 0 ||
      skillFilters.every((filterSkill) =>
        teamSkills.includes(filterSkill.toLowerCase())
      );
    return matchesSearch && matchesSkills;
  });

  if (!teams) {
    return <p className="text-center text-gray-500 text-lg">Loading...</p>;
  }

  if (teams.length === 0) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center ">
        <div className="bg-gradient-to-tr from-[#FF9466] to-[#FF6F61] px-8 py-6 rounded-2xl shadow-xl border border-[#FF9466] flex flex-col items-center">
          <p className="text-white text-lg font-bold mb-2">No teams found</p>
          <span className="text-white text-sm opacity-80">
            Try changing your search or filters.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-2">
      <div className="max-w-4xl mx-auto mb-6 flex flex-col gap-4">
        <input
          type="text"
          placeholder="Search team by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gradient-to-br from-white via-white to-[#fff9f5] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#888] px-3 py-2 w-full"
        />
        {/* Skill filter input */}
        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            {skillFilters.map((skill, idx) => (
              <span
                key={skill + idx}
                className="flex items-center bg-gradient-to-tr from-[#FF9466] to-[#FF6F61] text-white px-3 py-1 rounded-full text-sm font-semibold shadow"
              >
                {skill}
                <button
                  type="button"
                  className="ml-2 text-gray-200 hover:text-red-400"
                  onClick={() => removeSkillFilter(idx)}
                  tabIndex={-1}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Filter by skills (Type a skill & press Enter)..."
            value={skillFilterInput}
            onChange={(e) => setSkillFilterInput(e.target.value)}
            onKeyDown={handleSkillInputKeyDown}
            className="bg-gradient-to-br from-white via-white to-[#fff9f5] text-[#062a47] border border-[#e3e8ee] rounded-xl px-3 py-2 w-full focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#888]"
          />
        </div>
      </div>
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {filteredTeams.length === 0 ? (
          <div className="col-span-full flex justify-center">
            <p className="text-gray-400 text-lg bg-gradient-to-br from-white via-white to-[#fff9f5] px-6 py-4 rounded-xl shadow border border-[#e3e8ee]">
              No teams found
            </p>
          </div>
        ) : (
          filteredTeams.map((team, key) => (
            <div
              key={team.team.id}
              className="bg-gradient-to-br from-white via-white to-[#fff9f5] border border-[#e3e8ee] rounded-2xl shadow-xl p-6 flex flex-col gap-3 items-start"
            >
              {/* Team Logo Avatar */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF9466] to-[#FF6F61] flex items-center justify-center shadow-xl border-4 border-white mb-2">
                <Users className="text-white w-5 h-5" />
              </div>
              <h2 className="text-xl font-extrabold text-[#062a47] mb-1 cursor-pointer hover:underline text-center">
                <Link href={`/team/view-all-teams/${team.team.id}`}>
                  {team.team.name}
                </Link>
              </h2>
              <p className="text-[#6B7A8F] text-sm mb-1 text-center">
                Required Member Count:{" "}
                <span className="font-semibold text-[#f75a2f]">
                  {Number(team.team.requiredMemberCount)}
                </span>
              </p>
              <p className="text-[#6B7A8F] text-sm mb-1 text-center">
                Current Member Count:{" "}
                <span className="font-semibold text-[#f75a2f]">
                  {Number(team.team.currentMemberCount)}
                </span>
              </p>

              <p className="text-[#6B7A8F] text-xs mb-2 ">
                Captain:{" "}
                <span className="font-semibold text-[#062a47]">
                  {team.captain.firstName}
                </span>{" "}
                (<span>{team.captain.email}</span>)
              </p>
              {/* Show skills for each team as a button with popup */}
              {team.team.skillsNeeded && team.team.skillsNeeded.trim() ? (
                <button
                  onClick={() => setShowSkillsFor(team.team.id)}
                  className="inline-block bg-gradient-to-tr from-[#FF9466] to-[#FF6F61] text-white font-semibold py-1 px-3 rounded-full hover:from-[#062a47] hover:to-[#0a3a5c] transition-all duration-300 shadow-sm hover:shadow-md text-xs cursor-pointer mb-1"
                  type="button"
                >
                  Show Skills Required
                </button>
              ) : (
                <div className="w-full bg-gray-100 text-gray-500 font-medium py-1.5 px-3 rounded-full text-center text-xs mb-1">
                  No specific skills required
                </div>
              )}
              <Button
                disabled={!team.team.isAcceptingInvites}
                className={`mt-auto w-full bg-[#f75a2f] text-white font-bold rounded-xl hover:bg-[#FF9466] transition ${
                  !team.team.isAcceptingInvites
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={() => handleSendingInvite(team.team.id)}
              >
                Send Invitation To Join
              </Button>
            </div>
          ))
        )}
      </div>
      {/* Skills Popup */}
      {showSkillsFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e3e8ee]">
              <h3 className="text-lg font-bold text-[#062a47]">
                Skills Required
              </h3>
              <button
                onClick={() => setShowSkillsFor(null)}
                className="text-[#8ca2c3] hover:text-[#f75a2f] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const team = filteredTeams.find(
                    (item) => item.team.id === showSkillsFor
                  )?.team;
                  const skills = team?.skillsNeeded
                    ?.split(",")
                    .map((skill) => skill.trim())
                    .filter(Boolean);

                  return skills && skills.length > 0 ? (
                    skills.map((skill, idx) => (
                      <span
                        key={skill + idx}
                        className="bg-gradient-to-tr from-[#FF9466] to-[#FF6F61] text-white px-4 py-2 rounded-full text-sm font-semibold shadow-sm"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <div className="text-center w-full">
                      <p className="text-[#8ca2c3] text-sm">
                        No specific skills required for this team.
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(ViewAllTeams, "developer");
