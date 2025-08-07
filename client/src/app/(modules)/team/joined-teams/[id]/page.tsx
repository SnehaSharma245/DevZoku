"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/utils/api";
import { toast } from "sonner";
import { Button } from "@/components";
import { withAuth } from "@/utils/withAuth";
import Link from "next/link";
import { Bell } from "lucide-react";

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
      const response = await api.post(`/team/fetch-invites-and-accept/${id}`, {
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
    <div className="min-h-screen flex px-4 sm:px-6 lg:px-8 mt-4">
      <div className="max-w-4xl w-full mx-auto">
        {/* Header */}
        <div className="rounded-3xl mb-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#FF9466] to-[#FF6F61] flex items-center justify-center shadow-xl border-4 border-white">
            <Bell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#062a47] tracking-tight">
            Pending Invites
          </h1>
        </div>
        {pendingInvites && pendingInvites.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold text-[#FF6F61] mb-4">
              {teamName}
            </h2>
            <ul className="space-y-6">
              {pendingInvites.map((invite) => (
                <li
                  key={invite.id}
                  className="flex items-center justify-between bg-gradient-to-r from-[#fff9f5] to-[#f8f8f8] border border-[#eaf6fb] rounded-xl px-6 py-5 shadow-lg transition hover:border-[#FF9466]"
                >
                  <div>
                    <Link href={`/developer/profile/${invite.id}`}>
                      <span className="font-semibold text-[#FF6F61] hover:underline">
                        {invite.firstName}
                      </span>
                    </Link>
                    <span className="text-[#6B7A8F] text-sm ml-2">
                      ({invite.email})
                    </span>
                  </div>
                  <Button
                    className={`bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white font-bold rounded-xl hover:opacity-90 transition ml-4 ${
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
          <div className="text-[#6B7A8F] text-center py-12 bg-gradient-to-br from-white via-white to-[#fff9f5] rounded-xl border border-[#eaf6fb] shadow">
            No pending invites
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(TeamDetailPage, "developer");
