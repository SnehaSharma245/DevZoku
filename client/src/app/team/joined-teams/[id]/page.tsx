"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/utils/api";
import { toast } from "sonner";
import { Button } from "@/components";
import { withAuth } from "@/utils/withAuth";
import Link from "next/link";

export interface PendingInvites {
  id: string;
  firstName: string;
  email: string;
}

export interface PendingInvitesResponse {
  pendingUsers: PendingInvites[];
  teamName: string;
}

function TeamDetailPage() {
  const { id } = useParams();
  const [pendingInvites, setPendingInvites] = useState<PendingInvites[]>([]);
  const [teamName, setTeamName] = useState<string>("");
  const [inviteAccepted, setInviteAccepted] = useState<boolean>(false);
  const fetchPendingInvites = async () => {
    try {
      const response = await api.post(`team/fetch-invites-and-accept/${id}`, {
        withCredentials: true,
      });

      const { status, data, message } = response.data;

      if (status === 200) {
        setPendingInvites(data.pendingUsers);
        setTeamName(data.teamName);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch pending invites"
      );
      console.error("Error fetching team details:", error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPendingInvites();
    } else {
      toast.error("Invalid team ID");
    }
  }, [id]);

  const handleAcceptInvite = async (pendingUserId: string) => {
    try {
      const res = await api.post(
        `/team/fetch-invites-and-accept/${id}?pendingUserId=${pendingUserId}`,
        { withCredentials: true }
      );

      const { status, data, message } = res.data;
      if (status === 200) {
        toast.success(res.data.data.message || "Invite accepted successfully");
        setInviteAccepted(true);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to accept invite");
      console.error("Error accepting invite:", error);
    }
  };

  return (
    <div className="py-10 px-2 max-w-xl mx-auto">
      <h1 className="text-2xl font-extrabold text-white tracking-tight mb-8 flex items-center gap-2">
        Pending Invites
      </h1>
      {pendingInvites && pendingInvites.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold text-[#a3e635] mb-4">
            {teamName}
          </h2>
          <ul className="space-y-4">
            {pendingInvites.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center justify-between border border-[#23232b] rounded-xl px-5 py-4 shadow"
              >
                <div>
                  <Link href={`/developer/profile/${invite.id}`}>
                    <span className="font-semibold text-white">
                      {invite.firstName}
                    </span>
                  </Link>
                  <span className="text-gray-400 text-sm ml-2">
                    ({invite.email})
                  </span>
                </div>
                <Button
                  className={`bg-[#a3e635] text-black font-bold rounded-xl hover:bg-lime-400 transition ml-4 ${
                    inviteAccepted ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={() => handleAcceptInvite(invite.id)}
                  disabled={inviteAccepted}
                >
                  Accept Invite
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-gray-400 text-center py-12 rounded-xl border border-[#23232b]">
          No pending invites
        </div>
      )}
    </div>
  );
}

export default withAuth(TeamDetailPage, "developer");
