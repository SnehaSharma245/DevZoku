"use client";
import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/utils/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { withAuth } from "@/utils/withAuth";

export interface TeamDetail {
  team: {
    id: string;
    name: string;
    description?: string;
    createdAt: string; // ISO string format from backend
    captainId: string;
    createdBy: string;
    teamSize: number;
    isAcceptingInvites: boolean;
    skillsNeeded?: string;
  };
  captain: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "developer" | "organizer";
    password?: string;
    refreshToken?: string;
    googleId?: string;
    isProfileComplete: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

function TeamDetailPage() {
  const { user } = useAuth();

  const { id } = useParams();
  const [teamDetails, setTeamDetails] = React.useState<TeamDetail | null>(null);

  const fetchTeamDetails = async () => {
    try {
      const response = await api.get(`/team/view-all-teams/${id}`, {
        withCredentials: true,
      });

      const { status, data, message } = response.data;

      if (status === 200) {
        setTeamDetails(data);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch team details"
      );
      console.error("Error fetching team details:", error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTeamDetails();
    } else {
      toast.error("Invalid team ID");
    }
  }, [id]);

  return (
    <div>
      <h1>Team Details</h1>

      {teamDetails ? (
        <div>
          <h2>{teamDetails.team.name}</h2>
          <p>Description: {teamDetails.team.description || "No description"}</p>
          <p>
            Created At:{" "}
            {new Date(teamDetails.team.createdAt).toLocaleDateString()}
          </p>
          <p>
            Captain: {teamDetails.captain.firstName}{" "}
            {teamDetails.captain.lastName}
          </p>
          <p>Email: {teamDetails.captain.email}</p>
          <p>Team Size: {teamDetails.team.teamSize}</p>
          <p>
            Is Accepting Invites:{" "}
            {teamDetails.team.isAcceptingInvites ? "Yes" : "No"}
          </p>
          <p>
            Skills Needed: {teamDetails.team.skillsNeeded || "Not specified"}
          </p>
        </div>
      ) : (
        <p className="text-center text-gray-500 text-lg">
          Loading team details...
        </p>
      )}
    </div>
  );
}

export default withAuth(TeamDetailPage, "developer");
