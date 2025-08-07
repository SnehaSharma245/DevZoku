"use client";
import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/utils/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { withAuth } from "@/utils/withAuth";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
export interface TeamDetail {
  team: {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
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
    isProfileComplete: boolean;
    createdAt: string;
    updatedAt: string;
  };
  team_members: { userId: string; name: string; lastName?: string }[];
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

      const { status, data } = response.data;

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
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 mt-4 bg-gradient-to-br from-white via-white to-[#fff9f5]">
      <div className="max-w-3xl w-full mx-auto">
        <div className="bg-gradient-to-br from-white via-white to-[#fff9f5] rounded-3xl shadow-2xl border border-[#e3e8ee] p-8 mb-10 flex flex-col items-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#062a47] mb-2 text-center">
            Team Details
          </h1>
        </div>
        <div className="bg-gradient-to-br from-white via-white to-[#fff9f5] rounded-3xl shadow-xl border border-[#e3e8ee] p-8">
          {teamDetails ? (
            <div>
              <h2 className="text-2xl font-bold text-[#062a47] mb-2 flex items-center justify-between">
                {teamDetails.team.name}
                {teamDetails.team.isAcceptingInvites && (
                  <span className="ml-2 px-3 py-1 rounded-full bg-gradient-to-tr from-[#FF9466] to-[#FF6F61] text-white text-xs font-semibold">
                    Accepting Invites
                  </span>
                )}
              </h2>
              <p className="text-[#6B7A8F] mb-4 italic">
                {teamDetails.team.description || "No description provided."}
              </p>
              <div className="flex flex-wrap gap-3 mb-4">
                <span className="bg-[#fff9f5] text-[#6B7A8F] px-4 py-1 rounded-full text-xs font-medium border border-[#e3e8ee]">
                  Created:{" "}
                  {new Date(teamDetails.team.createdAt).toLocaleDateString()}
                </span>
                <span className="bg-[#fff9f5] text-[#6B7A8F] px-4 py-1 rounded-full text-xs font-medium border border-[#e3e8ee]">
                  Team Size: {teamDetails.team.teamSize}
                </span>
              </div>
              <div className="mb-4">
                <span className="block text-sm text-[#f75a2f] mb-1 font-semibold">
                  Captain
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#062a47] font-medium">
                    {teamDetails.captain.firstName}{" "}
                    {teamDetails.captain.lastName}
                  </span>
                  <span className="bg-gradient-to-br from-[#FF9466] to-[#FF6F61] text-white px-3 py-1 rounded-full text-xs">
                    {teamDetails.captain.email}
                  </span>
                </div>
              </div>
              <div className="mb-2">
                <span className="block text-sm text-[#f75a2f] mb-1 font-semibold">
                  Skills Needed
                </span>
                <div className="flex flex-wrap gap-2">
                  {teamDetails.team.skillsNeeded ? (
                    teamDetails.team.skillsNeeded
                      .split(",")
                      .map((skill, idx) => {
                        const trimmed = skill.trim();
                        if (!trimmed) return null;
                        return (
                          <span
                            key={trimmed + idx}
                            className="bg-gradient-to-tr from-[#FF9466] to-[#FF6F61] text-white px-3 py-1 rounded-full text-xs font-semibold shadow"
                          >
                            {trimmed}
                          </span>
                        );
                      })
                  ) : (
                    <span className="text-gray-400">Not specified</span>
                  )}
                </div>
              </div>
              <Accordion type="single" collapsible className="mt-4">
                <AccordionItem value="team-info">
                  <AccordionTrigger className="text-lg font-semibold text-[#062a47]">
                    Show Team Members
                  </AccordionTrigger>
                  <AccordionContent className="text-[#6B7A8F]">
                    <ul className="list-disc list-inside">
                      {teamDetails.team_members.map((member) => (
                        <Link
                          key={member.userId}
                          href={`/developer/profile/${member.userId}`}
                        >
                          <li>
                            {member.name}{" "}
                            {member.lastName ? `${member.lastName}` : ""}
                          </li>
                        </Link>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          ) : (
            <p className="text-center text-gray-500 text-lg">
              Loading team details...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default withAuth(TeamDetailPage, "developer");
