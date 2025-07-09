"use client";
import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/utils/api";
import { toast } from "sonner";

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
  const { id } = useParams();
  const [teamDetails, setTeamDetails] = React.useState<TeamDetail | null>(null);

  const fetchTeamDetails = async () => {
    try {
      const response = await api.get(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/api/v1/developer/view-all-teams/${id}`,
        { withCredentials: true }
      );
      setTeamDetails(response.data.data);
      console.log(response);
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

export default TeamDetailPage;
