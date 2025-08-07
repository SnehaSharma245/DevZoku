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
    <div className="min-h-screen flex px-4 sm:px-6 lg:px-8 mt-4">
      <div className="max-w-4xl w-full mx-auto">
        {/* Header */}
        <div className="rounded-3xl mb-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#FF9466] to-[#FF6F61] flex items-center justify-center shadow-xl border-4 border-white">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#062a47] tracking-tight">
            Sent Invitations
          </h1>
        </div>
        <ul className="space-y-6">
          {sentInvitations.length === 0 && (
            <li>
              <div className="text-[#6B7A8F] text-center py-12 bg-gradient-to-br from-white via-white to-[#fff9f5] rounded-xl border border-[#eaf6fb] shadow">
                No sent invitations found.
              </div>
            </li>
          )}
          {sentInvitations.map((invitation) => (
            <li
              key={invitation.id}
              className="flex items-center justify-between bg-gradient-to-r from-[#fff9f5] to-[#f8f8f8] border border-[#eaf6fb] rounded-xl px-6 py-5 shadow-lg transition hover:border-[#FF9466]"
            >
              <div>
                <div className="font-semibold text-[#FF6F61] mb-1 text-lg">
                  Invitation Sent
                </div>
                <div className="text-[#062a47] font-medium">
                  {invitation.name}
                </div>
              </div>
              {/* You can add actions here if needed */}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default withAuth(SentInvitation, "developer");
