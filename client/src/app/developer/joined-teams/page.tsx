"use client";
import React, { useEffect, useState } from "react";
import api from "@/utils/api";
import { Card, CardContent } from "@/components/ui/card";
import { withAuth } from "@/utils/withAuth";
import { toast } from "sonner";

interface Team {
  id: string;
  name: string;
  description?: string;
  teamSize: number;
}

function JoinedTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const fetchJoinedTeams = async () => {
      try {
        const res = await api.get(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
          }/api/v1/developer/joined-teams`,
          {
            withCredentials: true,
          }
        );
        setTeams(res?.data?.data || []);
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message || "Failed to fetch joined teams"
        );
        console.error("Error fetching joined teams:", err);
      }
    };

    fetchJoinedTeams();
  }, []);

  const handleTeamNameClick = (e: React.MouseEvent<HTMLHeadingElement>) => {
    const teamName = e.currentTarget.textContent;
    if (teamName) {
      window.location.href = `/teams/${teamName}`;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Joined Teams</h1>

      {teams.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">
          You haven't joined any teams yet.
        </p>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardContent className="p-4">
                <h2
                  className="text-xl font-semibold"
                  onClick={handleTeamNameClick}
                >
                  {team.name}
                </h2>
                <p className="text-sm text-gray-600">
                  {team.description || "No description provided."}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Team Size: {team.teamSize}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default withAuth(JoinedTeamsPage, "developer");
