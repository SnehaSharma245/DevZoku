"use client";
import { useAuth } from "@/hooks/useAuth";
import api from "@/utils/api";
import React, { useEffect, useState } from "react";

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
      const res = await api.get(`/developer/sent-invitations`, {
        withCredentials: true,
      });
      console.log(res);
      setSentInvitations(res.data.data);
    } catch (error) {
      console.error("Error fetching sent invitations:", error);
    }
  };

  useEffect(() => {
    fetchSentInvitations();
  }, []);

  console.log("Sent Invitations:", sentInvitations);

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

export default SentInvitation;
