"use client";
import React, { useEffect, useState } from "react";
import api from "@/utils/api";
import { Card, CardContent } from "@/components/ui/card";
import { withAuth } from "@/utils/withAuth";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components";
import LeaveTeamPopup from "@/components/popups/LeaveTeamPopup";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { EllipsisVertical } from "lucide-react";

interface TeamMember {
  userId: string;
  teamId: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  currentMemberCount: number;
  teamSize: number;
  skillsNeeded?: string;
}

interface JoinedTeamData {
  team_members: TeamMember;
  teams: Team;
}

function JoinedTeamsPage() {
  const { user } = useAuth();

  const [joinedTeams, setJoinedTeams] = useState<JoinedTeamData[]>([]);

  const [isLeaveTimeDialogOpen, setIsLeaveTimeDialogOpen] =
    useState<boolean>(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [search, setSearch] = useState("");

  //  Remove non-alphanumeric and spaces, lowercase
  const normalize = (str: string) =>
    str.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

  // Filtered teams by search (alphanumeric only, no spaces/special chars)
  const filteredTeams = joinedTeams.filter((item) =>
    normalize(item.teams.name).includes(normalize(search))
  );

  useEffect(() => {
    const fetchJoinedTeams = async () => {
      try {
        const res = await api.get(`/team/joined-teams`, {
          withCredentials: true,
        });

        const { status, data, message } = res.data;

        if (status === 200) {
          setJoinedTeams(data || []);
        }
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message || "Failed to fetch joined teams"
        );
        console.error("Error fetching joined teams:", err);
      }
    };

    fetchJoinedTeams();
  }, []);

  const handleLeavingTeam = async (teamId: string) => {
    try {
      const res = await api.delete(`/team/leave-team`, {
        data: { teamId },
        withCredentials: true,
      });

      const { status, data, message } = res.data;

      if (status === 200) {
        toast.success(message || "Successfully left the team");
        setJoinedTeams((prev) =>
          prev.filter((item) => item.teams.id !== teamId)
        );
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to leave the team");
      console.error("Error leaving team:", error);
    } finally {
      setIsLeaveTimeDialogOpen(false);
      setSelectedTeam(null);
    }
  };

  return (
    <>
      <LeaveTeamPopup
        open={isLeaveTimeDialogOpen}
        onClose={() => {
          setIsLeaveTimeDialogOpen(false);
          setSelectedTeam(null);
        }}
        onConfirm={() => selectedTeam && handleLeavingTeam(selectedTeam.id)}
        teamName={selectedTeam?.name}
      />
      <div className="min-h-screen w-full flex flex-col ">
        <div className="max-w-7xl w-full mx-auto pt-8 sm:pt-12 px-2 sm:px-6 flex-1 flex flex-col">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-10 text-center text-[#062a47] tracking-tight drop-shadow-lg">
            Joined Teams
          </h1>

          {/* Search by title */}
          <div className="flex justify-center mb-8">
            <input
              type="text"
              placeholder="Search by team title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-md px-4 py-2 rounded-xl bg-white text-[#062a47] border border-[#e3e8ee] focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#8ca2c3] shadow transition"
            />
          </div>

          {filteredTeams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <p className="text-center text-[#8ca2c3] text-lg mb-6">
                {joinedTeams.length === 0
                  ? "You haven't joined any teams yet."
                  : "No teams found."}
              </p>
              <Link href="/team/view-all-teams">
                <Button className="bg-[#f75a2f] text-white font-semibold rounded-xl hover:bg-[#062a47] transition px-6 py-2 text-base shadow-md">
                  Explore Teams
                </Button>
              </Link>
            </div>
          ) : (
            <div
              className="
      grid
      grid-cols-1
      sm:grid-cols-2
      lg:grid-cols-3
      xl:grid-cols-4
      gap-8
      "
            >
              {filteredTeams.map((item) => (
                <Card
                  key={`${item.team_members.userId}-${item.teams.id}`}
                  className="bg-white border border-[#e3e8ee] rounded-2xl shadow-xl hover:shadow-2xl transition-shadow aspect-square flex flex-col justify-between"
                >
                  <CardContent className="p-6 sm:p-8 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      {/* Team Name & Details */}
                      <Link href={`/team/view-all-teams/${item.teams.id}`}>
                        <h2 className="text-2xl font-bold cursor-pointer text-[#f75a2f] hover:underline transition mb-2">
                          {item.teams.name}
                        </h2>
                      </Link>
                      {/* 3 Dots Dropdown (shadcn) */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 rounded-full hover:bg-[#f7faff]">
                            <EllipsisVertical className="w-6 h-6 text-[#8ca2c3]" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 bg-white border border-[#e3e8ee] rounded-xl shadow-lg"
                        >
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/team/joined-teams/${item.teams.id}`}
                              className="block px-4 py-2 text-sm text-[#062a47] hover:bg-[#f75a2f] hover:text-white rounded"
                            >
                              View Pending Invites
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTeam(item.teams);
                              setIsLeaveTimeDialogOpen(true);
                            }}
                            className="block px-4 py-2 text-sm text-[#062a47] hover:bg-[#f75a2f] hover:text-white rounded cursor-pointer"
                          >
                            Leave Team
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/team/edit-team/${item.teams.id}`}
                              className="block px-4 py-2 text-sm text-[#062a47] hover:bg-[#f75a2f] hover:text-white rounded"
                            >
                              Edit Team
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="bg-[#f7faff] text-[#062a47] px-4 py-1 rounded-full text-xs font-medium border border-[#e3e8ee]">
                        Required Team Size: {item.teams.teamSize}
                      </span>
                      <span className="bg-[#f7faff] text-[#062a47] px-4 py-1 rounded-full text-xs font-medium border border-[#e3e8ee]">
                        Current Members: {item.teams.currentMemberCount}
                      </span>
                    </div>
                    {/* Render skillsNeeded as labels if present */}
                    <div className="flex flex-wrap gap-3 mt-2">
                      {item.teams.skillsNeeded &&
                        item.teams.skillsNeeded
                          .split(",")
                          .map((skill: string, idx: number) => {
                            const trimmed = skill.trim();
                            if (!trimmed) return null;
                            return (
                              <span
                                key={trimmed + idx}
                                className="bg-[#f75a2f]  px-3 py-1 rounded-full text-xs font-semibold"
                              >
                                {trimmed}
                              </span>
                            );
                          })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default withAuth(JoinedTeamsPage, "developer");
