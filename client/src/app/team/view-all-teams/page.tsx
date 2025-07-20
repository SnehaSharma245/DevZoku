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
    requiredMemberCount: number;
    currentMemberCount: number;
    isAcceptingInvites: boolean;
  };

  captain: {
    firstName: string;
    email: string;
  };
}

function normalize(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]/gi, "");
}

function ViewAllTeams() {
  const { user } = useAuth();

  const [teams, setTeams] = useState<TeamBrief[]>([]);
  const [invitationSent, setInvitationSent] = useState<boolean>(false);
  const [search, setSearch] = useState(""); // <-- Add search state

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

  const filteredTeams = teams.filter((team) =>
    normalize(team.team.name).includes(normalize(search))
  );

  if (!teams) {
    return <p className="text-center text-gray-500 text-lg">Loading...</p>;
  }

  if (teams.length === 0) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <p className="text-gray-400 text-lg bg-[#23232b] px-6 py-4 rounded-xl shadow border border-[#23232b]">
          No teams found
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#18181e] py-10 px-2">
      <div className="max-w-4xl mx-auto mb-6">
        <input
          type="text"
          placeholder="Search team by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888] px-3 py-2 w-full"
        />
      </div>
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {filteredTeams.length === 0 ? (
          <div className="col-span-full flex justify-center">
            <p className="text-gray-400 text-lg bg-[#23232b] px-6 py-4 rounded-xl shadow border border-[#23232b]">
              No teams found
            </p>
          </div>
        ) : (
          filteredTeams.map((team, key) => (
            <div
              key={team.team.id}
              className="bg-[#23232b] border border-[#23232b] rounded-2xl shadow-xl p-6 flex flex-col gap-3"
            >
              <h2 className="text-xl font-extrabold text-white mb-1 cursor-pointer hover:underline">
                <Link href={`/team/view-all-teams/${team.team.id}`}>
                  {team.team.name}
                </Link>
              </h2>
              <p className="text-gray-300 text-sm mb-1">
                Required Member Count:{" "}
                <span className="font-semibold">
                  {Number(team.team.requiredMemberCount)}
                </span>
              </p>
              <p className="text-gray-300 text-sm mb-1">
                Current Member Count:{" "}
                <span className="font-semibold">
                  {Number(team.team.currentMemberCount)}
                </span>
              </p>
              <p className="text-gray-400 text-xs mb-2">
                Captain:{" "}
                <span className="font-semibold text-white">
                  {team.captain.firstName}
                </span>{" "}
                (<span>{team.captain.email}</span>)
              </p>
              <Button
                disabled={!team.team.isAcceptingInvites}
                className={`mt-auto w-full bg-[#a3e635] text-black font-bold rounded-xl hover:bg-lime-400 transition ${
                  !team.team.isAcceptingInvites
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={() => handleSendingInvite(team.team.id)}
              >
                Send Invitation To Join
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default withAuth(ViewAllTeams, "developer");
