"use client";
import { Button } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import api from "@/utils/api";
import { withAuth } from "@/utils/withAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const [invitationSent, setInvitationSent] = useState<boolean>(false);

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

  if (!teams) {
    return <p className="text-center text-gray-500 text-lg">Loading...</p>;
  }

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
            <Link href={`/team/view-all-teams/${team.team.id}`}>
              {team.team.name}
            </Link>
          </h2>
          <p>Team Size: {team.team.teamSize}</p>
          <p>
            Captain: {team.captain.firstName} ({team.captain.email})
          </p>
          <Button
            disabled={!team.team.isAcceptingInvites}
            className={`${
              invitationSent ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={() => handleSendingInvite(team.team.id)}
          >
            Send Invitation To Join
          </Button>
        </div>
      ))}
    </div>
  );
}

export default withAuth(ViewAllTeams, "developer");
