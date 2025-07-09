"use client";
import { Button } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import api from "@/utils/api";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface TeamBrief {
  team: {
    id: string;
    name: string;
    teamSize: number;
    isAcceptingInvites: boolean;
  };

  captain: {
    firstName: string;
    email: string;
  };
}

function ViewAllTeams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<TeamBrief[]>([]);

  const fetchAllTeams = async () => {
    try {
      const response = await api.get(`/developer/view-all-teams`, {
        withCredentials: true,
      });

      console.log(response);
      setTeams(response.data.data || []);
    } catch (error: any) {
      console.log(error);
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
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/api/v1/developer/join-invitation`,
        { teamId: id },
        { withCredentials: true }
      );
      toast.success(response.data.message || "Invitation sent successfully");
    } catch (error: any) {
      console.log(error);
      toast.error(
        error?.response?.data?.message || "Failed to send invitation"
      );
      console.error("Error sending invitation:", error);
    }
  };

  {
    teams.length === 0 && (
      <p className="text-center text-gray-500 text-lg">No teams found</p>
    );
  }

  return (
    <div>
      {teams.map((team, key) => (
        <div key={team.team.id}>
          <h2 className="text-xl font-semibold cursor-pointer hover:underline">
            <Link href={`view-all-teams/${team.team.id}`}>
              {team.team.name}
            </Link>
          </h2>
          <p>Team Size: {team.team.teamSize}</p>
          <p>
            Captain: {team.captain.firstName} ({team.captain.email})
          </p>
          <Button
            disabled={!team.team.isAcceptingInvites}
            onClick={() => handleSendingInvite(team.team.id)}
          >
            Send Invitation To Join
          </Button>
        </div>
      ))}
    </div>
  );
}

export default ViewAllTeams;
