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
import type { Hackathon } from "@/types/hackathon.types";
import type { Phases } from "@/types/hackathon.types";
import MarkingWinnerPopup from "@/components/popups/MarkingWinnerPopup";

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
  teams: Team[];
}

function ParticularHackathon() {
  const { user, loading } = useAuth();
  const [hackathonDetails, setHackathonDetails] = useState<Hackathon | null>(
    null
  );
  const [joinedTeams, setJoinedTeams] = useState<JoinedTeamData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoinedTeamsDialogOpen, setIsJoinedTeamsDialogOpen] = useState(false);
  const [openDropdownTeamId, setOpenDropdownTeamId] = useState<string | null>(
    null
  );
  const [participatingTeams, setParticipatingTeams] = useState<Team[]>([]);
  const [isMarkingWinnersPopupOpen, setIsMarkingWinnersPopupOpen] =
    useState(false);
  const { id } = useParams();
  const router = useRouter();

  // Fetch hackathon details
  useEffect(() => {
    if (loading) return;
    const fetchHackathonDetails = async () => {
      try {
        const withTeamsParam =
          user && user.role === "organizer" ? "?withTeams=true" : "";
        const endpoint = user
          ? `/hackathon/hackathon-auth/${id}${withTeamsParam}`
          : `/hackathon/hackathon/${id}$`;
        const res = await api.get(endpoint);
        const { status, data, message } = res.data;
        console.log(data);
        if (status === 200) {
          setHackathonDetails(data);
          const participatingTeams = data.teamsApplied
            ? data.teamsApplied.flatMap((item: any) =>
                Array.isArray(item.teams) ? item.teams : [item.teams]
              )
            : [];
          setParticipatingTeams(participatingTeams);
        }
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Failed to fetch hackathon details"
        );
        setHackathonDetails(null);
      }
    };
    if (id) fetchHackathonDetails();
  }, [id, user, loading]);

  // Fetch joined teams
  const handleRegistration = async () => {
    try {
      setIsLoading(true);
      setIsJoinedTeamsDialogOpen(true);
      const res = await api.get(`/team/joined-teams`);
      const { status, data, message } = res.data;
      if (status === 200) {
        setJoinedTeams(data);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch joined teams"
      );
      setJoinedTeams([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkingWinners = async (winners: {
    winner: string | null;
    firstRunnerUp: string | null;
    secondRunnerUp: string | null;
  }) => {
    try {
      setIsMarkingWinnersPopupOpen(true);
      const res = await api.post(`/hackathon/mark-winners`, {
        hackathonId: hackathonDetails?.id,
        winners,
      });

      const { status, data, message } = res.data;

      if (status === 200) {
        toast.success(message || "Winners marked successfully");
        setIsMarkingWinnersPopupOpen(false);
        // router.push(`/hackathon/${id}`);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch teams");
    }
  };

  // Team apply handler
  const handleApplyByTeam = async (teamId: string) => {
    try {
      const res = await api.post(`/hackathon/apply-to-hackathon`, {
        hackathonId: hackathonDetails?.id,
        teamId,
      });
      const { status, data, message } = res.data;

      if (status === 201) {
        toast.success(message || "Successfully applied with the team");
        router.push("/email/team-registration-in-hackathon");
        setIsJoinedTeamsDialogOpen(false);
        setOpenDropdownTeamId(null);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to apply with this team"
      );
    } finally {
      setIsLoading(false);
      setOpenDropdownTeamId(null);
    }
  };

  const handleWinnerDialogOpen = () => {
    setIsMarkingWinnersPopupOpen(true);
  };

  // Handle both active
  const title = hackathonDetails?.title;
  const description = hackathonDetails?.description;
  const poster = hackathonDetails?.poster;
  const tags = hackathonDetails?.tags;
  const registrationStart = hackathonDetails?.registrationStart;
  const registrationEnd = hackathonDetails?.registrationEnd;
  const startTime = hackathonDetails?.startTime;
  const endTime = hackathonDetails?.endTime;
  const minTeamSize = hackathonDetails?.minTeamSize;
  const maxTeamSize = hackathonDetails?.maxTeamSize;
  const mode = hackathonDetails?.mode;
  const status = hackathonDetails?.status;
  const phases = hackathonDetails?.phases;
  const organizationName = hackathonDetails?.organizationName;
  const dateCompleted = hackathonDetails?.dateCompleted;

  const teamsArray = joinedTeams
    ? joinedTeams.flatMap((jt) =>
        Array.isArray(jt.teams) ? jt.teams : [jt.teams]
      )
    : [];

  return (
    <>
      <MarkingWinnerPopup
        open={isMarkingWinnersPopupOpen}
        teams={participatingTeams}
        onSubmit={handleMarkingWinners}
        onClose={() => setIsMarkingWinnersPopupOpen(false)}
      />
      <div className="min-h-screen flex items-center justify-center py-10 px-2">
        <div className="max-w-3xl w-full bg-[#18181e] rounded-3xl shadow-xl border border-[#23232b] p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {poster && (
              <div className="w-full md:w-72 aspect-[3/2] rounded-2xl shadow border border-[#23232b] overflow-hidden bg-[#23232b] flex-shrink-0">
                <img
                  src={poster}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold mb-2 text-white">
                {title}
              </h1>
              {organizationName && (
                <div className="mb-2 text-sm text-gray-400">
                  <span className="font-semibold text-white">Organizer:</span>{" "}
                  {organizationName}
                </div>
              )}
              <div className="mb-2 flex flex-wrap gap-2">
                {tags &&
                  tags.length > 0 &&
                  tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-[#23232b] text-[#a3e635] px-3 py-1 rounded-full text-xs font-semibold border border-[#a3e635]"
                    >
                      #{tag}
                    </span>
                  ))}
              </div>
              {status && (
                <div className="mb-2">
                  <span className="font-semibold text-white">Status:</span>{" "}
                  <span
                    className={
                      status === "upcoming"
                        ? "text-blue-400"
                        : status === "ongoing"
                        ? "text-[#a3e635]"
                        : "text-gray-400"
                    }
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>
              )}
              {mode && (
                <div className="mb-2">
                  <span className="font-semibold text-white">Mode:</span>{" "}
                  <span className="text-gray-300">{mode}</span>
                </div>
              )}
              {(minTeamSize || maxTeamSize) && (
                <div className="mb-2">
                  <span className="font-semibold text-white">Team Size:</span>{" "}
                  <span className="text-gray-300">
                    {minTeamSize ?? "-"} - {maxTeamSize ?? "-"}
                  </span>
                </div>
              )}
              {dateCompleted && (
                <div className="mb-2">
                  <span className="font-semibold text-white">
                    Completed On:
                  </span>{" "}
                  <span className="text-gray-300">
                    {formatDateTime(dateCompleted)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-bold mb-2 text-white">Description</h2>
            <p className="text-gray-300">
              {description || "No description provided."}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {(registrationStart || registrationEnd) && (
              <div className="bg-[#23232b] rounded-xl p-4 border border-[#23232b]">
                <h3 className="font-semibold text-white mb-2">
                  Registration Window
                </h3>
                <div>
                  <span className="text-gray-400">Start:</span>{" "}
                  <span className="text-white">
                    {registrationStart
                      ? formatDateTime(registrationStart)
                      : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">End:</span>{" "}
                  <span className="text-white">
                    {registrationEnd ? formatDateTime(registrationEnd) : "-"}
                  </span>
                </div>
              </div>
            )}
            {(startTime || endTime) && (
              <div className="bg-[#23232b] rounded-xl p-4 border border-[#23232b]">
                <h3 className="font-semibold text-white mb-2">
                  Hackathon Window
                </h3>
                <div>
                  <span className="text-gray-400">Start:</span>{" "}
                  <span className="text-white">
                    {startTime ? formatDateTime(startTime) : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">End:</span>{" "}
                  <span className="text-white">
                    {endTime ? formatDateTime(endTime) : "-"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {phases && phases.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-bold mb-4 text-white">Phases</h2>
              <ol className="relative border-l-2 border-[#a3e635]/30 ml-4">
                {phases
                  .sort((a, b) => a.order - b.order)
                  .map((phase, idx) => (
                    <li key={phase.id} className="mb-10 ml-6">
                      <span className="absolute -left-4 flex items-center justify-center w-8 h-8 bg-[#a3e635] text-black font-bold rounded-full ring-8 ring-[#18181e] shadow">
                        {idx + 1}
                      </span>
                      <div className="flex flex-col gap-1">
                        <div className="font-semibold text-lg text-white">
                          {phase.title}
                        </div>
                        <div className="text-gray-300">{phase.description}</div>
                        <div className="text-xs text-gray-400">
                          {formatDateTime(phase.startTime)} -{" "}
                          {formatDateTime(phase.endTime)}
                        </div>
                      </div>
                    </li>
                  ))}
              </ol>
            </div>
          )}

          {user && user?.role === "developer" && (
            <div className="mt-10 flex flex-col md:flex-row gap-4">
              <Button
                onClick={handleRegistration}
                className="bg-[#a3e635] text-black font-bold rounded-xl hover:bg-lime-400 transition w-full md:w-auto"
              >
                Apply Now
              </Button>
              <Button className="bg-[#23232b] text-white border border-[#a3e635] rounded-xl hover:bg-[#23232b]/80 transition w-full md:w-auto">
                Share to Teams
              </Button>
            </div>
          )}

          {user &&
            user?.role === "organizer" &&
            status === "completed" &&
            hackathonDetails?.positionHolders === null && (
              <div className="mt-10">
                <Button
                  className="bg-[#a3e635] text-black font-bold rounded-xl px-6 py-3 hover:bg-lime-400 transition inline-block"
                  onClick={handleWinnerDialogOpen}
                >
                  Mark Winners
                </Button>
              </div>
            )}

          {/* Joined Teams Dialog */}
          {isJoinedTeamsDialogOpen && (
            <Dialog
              open={isJoinedTeamsDialogOpen}
              onOpenChange={setIsJoinedTeamsDialogOpen}
            >
              <DialogContent className="max-w-3xl w-full bg-[#18181e] border border-[#23232b] rounded-2xl">
                <DialogTitle className="text-white">Your Teams</DialogTitle>
                <DialogDescription className="text-gray-400">
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

                      return (
                        <div
                          key={team.id}
                          className="flex flex-col border border-[#23232b] rounded-xl px-4 py-3 w-full bg-[#23232b]"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-white">
                                {team.name}
                              </div>
                              <div className="text-xs text-gray-400">
                                Max Team size: {team.teamSize}
                              </div>
                              <div className="text-xs text-gray-400">
                                Current Member Count: {team.currentMemberCount}
                              </div>
                            </div>

                            <Button
                              onClick={() => handleApplyByTeam(team.id)}
                              disabled={isLoading}
                              className="ml-4 bg-[#a3e635] text-black font-semibold rounded-xl hover:bg-lime-400 transition"
                            >
                              Apply by this
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </>
  );
}

export default ParticularHackathon;
