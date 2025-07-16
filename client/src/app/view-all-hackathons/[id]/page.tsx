"use client";
import { useAuth } from "@/hooks/useAuth";
import api from "@/utils/api";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatDateTime } from "@/utils/formattedDate";
import { Button } from "@/components";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"; // apne Dialog component ka import path sahi karein
import Link from "next/link";

export interface Hackathon {
  id: string;
  title: string;
  description?: string;
  registrationStart?: string;
  registrationEnd?: string;
  createdBy?: string;
  organizationName?: string;
  startTime?: string;
  endTime?: string;
  participants?: string[];
  status?: "upcoming" | "ongoing" | "completed";
  tags?: string[];
  poster?: string;
  minTeamSize?: number;
  maxTeamSize?: number;
  mode?: "online" | "offline";
  phases?: Phases[];
  dateCompleted?: string; // archived field
}

export interface Phases {
  id: string;
  hackathonId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  order: number;
}

interface TeamMember {
  userId: string;
  teamId: string;
  name?: string;
  email?: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  currentMemberCount: number;
  teamSize: number;
}

interface JoinedTeamData {
  team_members: TeamMember[];
  teams: Team[];
}

function ParticularHackathon() {
  const { user } = useAuth();
  const [hackathonDetails, setHackathonDetails] = useState<Hackathon | null>(
    null
  );
  const [joinedTeams, setJoinedTeams] = useState<JoinedTeamData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoinedTeamsDialogOpen, setIsJoinedTeamsDialogOpen] = useState(false);
  const [openDropdownTeamId, setOpenDropdownTeamId] = useState<string | null>(
    null
  );
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const { id } = useParams();
  const router = useRouter();

  // Fetch hackathon details
  useEffect(() => {
    const fetchHackathonDetails = async () => {
      try {
        const res = await api.get(`/users/hackathon/${id}`);
        setHackathonDetails(res.data.data);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Failed to fetch hackathon details"
        );
        setHackathonDetails(null);
      }
    };
    if (id) fetchHackathonDetails();
  }, [id]);

  // Dropdown open/close handler
  const handleChooseMembersClick = (teamId: string) => {
    setOpenDropdownTeamId((prev) => (prev === teamId ? null : teamId));
    setSelectedMembers([]);
  };

  // Checkbox handler
  const handleMemberCheckbox = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Fetch joined teams
  const handleRegistration = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      setIsLoading(true);
      setIsJoinedTeamsDialogOpen(true);
      const res = await api.get(`/developer/joined-teams`);
      setJoinedTeams(res.data.data || []);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch joined teams"
      );
      setJoinedTeams([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Team apply handler
  const handleApplyByTeam = async (teamId: string) => {
    try {
      const res = await api.post(`/developer/apply-to-hackathon`, {
        hackathonId: hackathonDetails?.id,
        teamId,
        userIds: selectedMembers,
      });
      toast.success("Applied successfully with this team!");
      router.push("/email/team-registration-in-hackathon");
      setIsJoinedTeamsDialogOpen(false);
      setSelectedMembers([]);
      setOpenDropdownTeamId(null);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to apply with this team"
      );
    } finally {
      setIsLoading(false);
      setSelectedMembers([]);
      setOpenDropdownTeamId(null);
    }
  };

  if (!hackathonDetails) {
    return (
      <div className="text-center py-10 text-red-500">Hackathon not found.</div>
    );
  }

  // Handle both active and archived hackathon fields
  const {
    title,
    description,
    poster,
    tags,
    registrationStart,
    registrationEnd,
    startTime,
    endTime,
    minTeamSize,
    maxTeamSize,
    mode,
    status,
    phases,
    organizationName,
    dateCompleted,
  } = hackathonDetails;

  const teamsArray = joinedTeams
    ? joinedTeams.flatMap((jt) =>
        Array.isArray(jt.teams) ? jt.teams : [jt.teams]
      )
    : [];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row gap-6">
        {poster && (
          <img
            src={poster}
            alt={title}
            className="w-full md:w-72 h-48 object-cover rounded shadow"
          />
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          {organizationName && (
            <div className="mb-2 text-sm text-gray-700">
              <span className="font-semibold">Organizer:</span>{" "}
              {organizationName}
            </div>
          )}
          <div className="mb-2 flex flex-wrap gap-2">
            {tags &&
              tags.length > 0 &&
              tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
          </div>
          {status && (
            <div className="mb-2">
              <span className="font-semibold">Status:</span>{" "}
              <span
                className={
                  status === "upcoming"
                    ? "text-blue-600"
                    : status === "ongoing"
                    ? "text-green-600"
                    : "text-gray-600"
                }
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
          )}
          {mode && (
            <div className="mb-2">
              <span className="font-semibold">Mode:</span> {mode}
            </div>
          )}
          {(minTeamSize || maxTeamSize) && (
            <div className="mb-2">
              <span className="font-semibold">Team Size:</span>{" "}
              {minTeamSize ?? "-"} - {maxTeamSize ?? "-"}
            </div>
          )}
          {dateCompleted && (
            <div className="mb-2">
              <span className="font-semibold">Completed On:</span>{" "}
              {formatDateTime(dateCompleted)}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-1">Description</h2>
        <p className="text-gray-700">
          {description || "No description provided."}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {(registrationStart || registrationEnd) && (
          <div>
            <h3 className="font-semibold">Registration Window</h3>
            <div>
              <span className="text-gray-600">Start:</span>{" "}
              {registrationStart ? formatDateTime(registrationStart) : "-"}
            </div>
            <div>
              <span className="text-gray-600">End:</span>{" "}
              {registrationEnd ? formatDateTime(registrationEnd) : "-"}
            </div>
          </div>
        )}
        {(startTime || endTime) && (
          <div>
            <h3 className="font-semibold">Hackathon Window</h3>
            <div>
              <span className="text-gray-600">Start:</span>{" "}
              {startTime ? formatDateTime(startTime) : "-"}
            </div>
            <div>
              <span className="text-gray-600">End:</span>{" "}
              {endTime ? formatDateTime(endTime) : "-"}
            </div>
          </div>
        )}
      </div>

      {phases && phases.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Phases</h2>
          <div className="space-y-3">
            {phases
              .sort((a, b) => a.order - b.order)
              .map((phase) => (
                <div key={phase.id} className="border rounded p-3 bg-gray-50">
                  <div className="font-semibold">{phase.title}</div>
                  <div className="text-gray-700 mb-1">{phase.description}</div>
                  <div className="text-xs text-gray-500">
                    {formatDateTime(phase.startTime)} -{" "}
                    {formatDateTime(phase.endTime)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <Button onClick={handleRegistration}>Apply Now</Button>
      <Button>Share to Teams</Button>

      {/* Joined Teams Dialog */}
      {isJoinedTeamsDialogOpen && (
        <Dialog
          open={isJoinedTeamsDialogOpen}
          onOpenChange={setIsJoinedTeamsDialogOpen}
        >
          <DialogContent className="max-w-3xl w-full">
            <DialogTitle>Your Teams</DialogTitle>
            <DialogDescription>
              {isLoading
                ? "Loading..."
                : teamsArray.length > 0
                ? "Select a team to apply for this hackathon."
                : "You have not joined any teams yet."}
            </DialogDescription>
            {!isLoading && teamsArray.length > 0 && (
              <div className="space-y-3 mt-4">
                {teamsArray.map((team) => {
                  const teamData = joinedTeams.find((jt) =>
                    Array.isArray(jt.teams)
                      ? jt.teams.some((t) => t.id === team.id)
                      : jt.teams &&
                        typeof jt.teams === "object" &&
                        "id" in jt.teams &&
                        (jt.teams as Team).id === team.id
                  );
                  const members = teamData?.team_members || [];

                  return (
                    <div
                      key={team.id}
                      className="flex flex-col border rounded px-3 py-2 w-full"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{team.name}</div>
                          <div className="text-xs text-gray-500">
                            Max Team size: {team.teamSize}
                          </div>
                          <div className="text-xs text-gray-500">
                            Current Member Count: {team.currentMemberCount}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleChooseMembersClick(team.id)}
                          className="mt-2"
                        >
                          Choose Members
                        </Button>
                        <Button
                          onClick={() => handleApplyByTeam(team.id)}
                          disabled={isLoading}
                          className="ml-4"
                        >
                          Apply by this
                        </Button>
                      </div>
                      {/* Dropdown as block inside card */}
                      {openDropdownTeamId === team.id && (
                        <div className="w-full bg-gray-50 border rounded mt-3 p-3">
                          {members.length === 0 ? (
                            <div className="text-xs text-gray-500">
                              No members
                            </div>
                          ) : (
                            members.map((member) => (
                              <div
                                key={member.userId}
                                className="flex items-center gap-2 py-1"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedMembers.includes(
                                    member.userId
                                  )}
                                  onChange={() =>
                                    handleMemberCheckbox(member.userId)
                                  }
                                  id={`${team.id}-${member.userId}`}
                                />
                                <label htmlFor={`${team.id}-${member.userId}`}>
                                  <Link
                                    href={`/developer/profile/${encodeURIComponent(
                                      member.userId
                                    )}`}
                                  >
                                    {member.name || member.userId}
                                  </Link>
                                  <span className="text-xs text-gray-500 ml-2">
                                    {member.email}
                                  </span>
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default ParticularHackathon;
