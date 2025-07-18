"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/utils/api";
import { toast } from "sonner";
import { Button } from "@/components";
import { withAuth } from "@/utils/withAuth";

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
    <div>
      <h1>Pending Invites</h1>

      {pendingInvites && pendingInvites.length > 0 ? (
        <div>
          <h2>{teamName}</h2>
          <h2>Pending Invites</h2>
          <ul>
            {pendingInvites.map((invite) => (
              <div key={invite.id}>
                <li key={invite.id}>
                  {invite.firstName} ({invite.email})
                </li>
                <Button
                  className={`${
                    inviteAccepted ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={() => handleAcceptInvite(invite.id)}
                >
                  Accept Invite
                </Button>
              </div>
            ))}
          </ul>
        </div>
      ) : (
        <p>No pending invites</p>
      )}
    </div>
  );
}

export default withAuth(TeamDetailPage, "developer");
