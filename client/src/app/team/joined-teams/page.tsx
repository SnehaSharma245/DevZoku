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
      <div className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Joined Teams</h1>

        {joinedTeams.length === 0 ? (
          <p className="text-center text-gray-500 text-lg">
            You haven't joined any teams yet.
          </p>
        ) : (
          <div className="space-y-4">
            {joinedTeams.map((item) => (
              <div key={`${item.team_members.userId}-${item.teams.id}`}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <Link href={`/team/view-all-teams/${item.teams.id}`}>
                      <h2 className="text-xl font-semibold cursor-pointer hover:text-blue-600">
                        {item.teams.name}
                      </h2>
                    </Link>

                    <p className="text-sm text-gray-600">
                      {item.teams.description || "No description provided."}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Required Team Size: {item.teams.teamSize}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Current Member Count: {item.teams.currentMemberCount}
                    </p>
                    <div className="flex gap-4 items-center mt-3">
                      <Button>
                        <Link href={`/team/joined-teams/${item.teams.id}`}>
                          View Pending Invites
                        </Link>
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedTeam(item.teams);
                          setIsLeaveTimeDialogOpen(true);
                        }}
                      >
                        Leave the team
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default withAuth(JoinedTeamsPage, "developer");
