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
import { EllipsisVertical, X } from "lucide-react";

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
  const [showSkillsFor, setShowSkillsFor] = useState<string | null>(null);

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
        <div className="max-w-7xl w-full mx-auto pt-6 sm:pt-8 lg:pt-12 px-4 sm:px-6 lg:px-8 flex-1 flex flex-col">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-6 sm:mb-8 lg:mb-10 text-center text-[#062a47] tracking-tight">
            Joined Teams
          </h1>

          {/* Search Input */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <input
              type="text"
              placeholder="Search by team name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-md px-4 py-3 rounded-xl bg-white text-[#062a47] border border-[#e3e8ee] focus:ring-2 focus:ring-[#f75a2f] focus:border-transparent placeholder:text-[#8ca2c3] shadow-sm transition text-sm sm:text-base"
            />
          </div>

          {filteredTeams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24">
              <div className="text-center bg-white rounded-2xl p-8 sm:p-12 shadow-lg border border-[#e3e8ee] max-w-md">
                <p className="text-[#8ca2c3] text-base sm:text-lg mb-6">
                  {joinedTeams.length === 0
                    ? "You haven't joined any teams yet."
                    : "No teams found matching your search."}
                </p>
                <Link href="/team/view-all-teams">
                  <Button className="bg-gradient-to-r from-[#f75a2f] to-[#ff6b3d] text-white font-semibold rounded-xl hover:from-[#062a47] hover:to-[#0a3a5c] transition-all duration-300 px-6 py-3 text-sm sm:text-base shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                    Explore Teams
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {filteredTeams.map((item) => (
                <Card
                  key={`${item.team_members.userId}-${item.teams.id}`}
                  className="bg-white border border-[#e3e8ee] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full"
                >
                  <CardContent className="p-4 sm:p-6 flex-1 flex flex-col">
                    {/* Header with Team Name and Dropdown */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <Link href={`/team/view-all-teams/${item.teams.id}`}>
                          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold cursor-pointer text-[#f75a2f] hover:text-[#062a47] transition-colors mb-2 line-clamp-2">
                            {item.teams.name}
                          </h2>
                        </Link>
                      </div>

                      {/* Dropdown Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 rounded-full hover:bg-[#f7faff] transition-colors flex-shrink-0 ml-2">
                            <EllipsisVertical className="w-5 h-5 text-[#8ca2c3]" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 bg-white border border-[#e3e8ee] rounded-xl shadow-lg"
                        >
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/team/joined-teams/${item.teams.id}`}
                              className="block px-4 py-2 text-sm text-[#062a47] hover:bg-[#f75a2f] hover:text-white rounded-md transition-colors"
                            >
                              View Pending Invites
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTeam(item.teams);
                              setIsLeaveTimeDialogOpen(true);
                            }}
                            className="block px-4 py-2 text-sm text-[#062a47] hover:bg-red-500 hover:text-white rounded-md cursor-pointer transition-colors"
                          >
                            Leave Team
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/team/edit-team/${item.teams.id}`}
                              className="block px-4 py-2 text-sm text-[#062a47] hover:bg-[#f75a2f] hover:text-white rounded-md transition-colors"
                            >
                              Edit Team
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Description */}
                    {item.teams.description && (
                      <p className="text-[#8ca2c3] text-sm mb-4 line-clamp-3">
                        {item.teams.description}
                      </p>
                    )}

                    {/* Team Stats */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
                      <span className="bg-gradient-to-r from-[#f7faff] to-[#fff5f0] text-[#062a47] px-3 py-1.5 rounded-full text-xs font-medium border border-[#e3e8ee] text-center">
                        Size: {item.teams.teamSize}
                      </span>
                      <span className="bg-gradient-to-r from-[#f7faff] to-[#fff5f0] text-[#062a47] px-3 py-1.5 rounded-full text-xs font-medium border border-[#e3e8ee] text-center">
                        Members: {item.teams.currentMemberCount}
                      </span>
                    </div>

                    {/* Show Skills Button */}
                    <div className="mt-auto">
                      {item.teams.skillsNeeded &&
                      item.teams.skillsNeeded.trim() ? (
                        <button
                          onClick={() => setShowSkillsFor(item.teams.id)}
                          className="inline-block bg-gradient-to-r from-[#f75a2f] to-[#ff6b3d] text-white font-semibold py-1 px-3 rounded-full hover:from-[#062a47] hover:to-[#0a3a5c] transition-all duration-300 shadow-sm hover:shadow-md text-xs cursor-pointer"
                        >
                          Show Skills Required
                        </button>
                      ) : (
                        <div className="w-full bg-gray-100 text-gray-500 font-medium py-1.5 px-3 rounded-full text-center text-xs">
                          No specific skills required
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                      (item) => item.teams.id === showSkillsFor
                    )?.teams;
                    const skills = team?.skillsNeeded
                      ?.split(",")
                      .map((skill) => skill.trim())
                      .filter(Boolean);

                    return skills && skills.length > 0 ? (
                      skills.map((skill, idx) => (
                        <span
                          key={skill + idx}
                          className="bg-gradient-to-r from-[#f75a2f] to-[#ff6b3d] text-white px-4 py-2 rounded-full text-sm font-semibold shadow-sm"
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
    </>
  );
}

export default withAuth(JoinedTeamsPage, "developer");
