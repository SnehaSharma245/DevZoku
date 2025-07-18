"use client";
import { useAuth } from "@/hooks/useAuth";
import api from "@/utils/api";
import React, { useEffect, useState } from "react";
import { withAuth } from "@/utils/withAuth";

export interface SentInvitationData {
  id: string;
  name: string;
}

function SentInvitation() {
  const { user } = useAuth();

  const [sentInvitations, setSentInvitations] = useState<SentInvitationData[]>(
    []
  );

  const fetchSentInvitations = async () => {
    try {
      const res = await api.get(`/team/sent-invitations`, {
        withCredentials: true,
      });

      const { status, data, message } = res.data;

      if (status === 200) {
        setSentInvitations(data || []);
      }
    } catch (error) {
      console.error("Error fetching sent invitations:", error);
    }
  };

  useEffect(() => {
    fetchSentInvitations();
  }, []);

  if (sentInvitations.length === 0) {
    return <div>No sent invitations found.</div>;
  }

  return (
    <div>
      <h1>Sent Invitations</h1>
      <ul>
        {sentInvitations.map((invitation) => (
          <li key={invitation.id}>{invitation.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default withAuth(SentInvitation, "developer");
