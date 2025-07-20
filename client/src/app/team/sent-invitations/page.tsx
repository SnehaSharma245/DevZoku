"use client";
import { useAuth } from "@/hooks/useAuth";
import api from "@/utils/api";
import React, { useEffect, useState } from "react";
import { withAuth } from "@/utils/withAuth";
import { Mail } from "lucide-react";

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

  return (
    <div className="py-10 px-2 max-w-xl mx-auto">
      <h1 className="text-2xl font-extrabold text-white tracking-tight mb-8 flex items-center gap-3">
        <Mail className="w-7 h-7 text-[#a3e635]" />
        Sent Invitations
      </h1>
      {sentInvitations.length === 0 ? (
        <div className="text-gray-400 text-center py-12 rounded-xl border border-[#23232b]">
          No sent invitations found.
        </div>
      ) : (
        <ul className="space-y-4">
          {sentInvitations.map((invitation) => (
            <li
              key={invitation.id}
              className="flex items-center border border-[#23232b] rounded-xl px-5 py-4 shadow"
            >
              <span className="font-semibold text-white">
                {invitation.name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default withAuth(SentInvitation, "developer");
