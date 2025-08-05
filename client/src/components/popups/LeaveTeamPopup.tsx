import React from "react";
import { Button } from "@/components";
import { useAuth } from "@/hooks/useAuth";

interface LeaveTeamPopupProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  teamName?: string;
}

const LeaveTeamPopup: React.FC<LeaveTeamPopupProps> = ({
  open,
  onClose,
  onConfirm,
  teamName,
}) => {
  if (!open) return null;
  const { user } = useAuth();

  if (!user) {
    window.location.href = "/";
    return null; // Prevent rendering if user is not authenticated
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-2xl">
      <div className="bg-gradient-to-br from-white via-white to-[#fff9f5] rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-sm mx-4 border border-[#fff9f5] flex flex-col gap-6 flex-shrink-0 flex-grow-0 justify-center items-center">
        <h2 className="text-xl font-bold mb-3 text-[#FF6F61]">Leave Team</h2>
        <p className="mb-6 text-[#6B7A8F] text-center">
          Are you sure you want to leave
          {teamName ? (
            <span className="font-semibold text-[#FF9466]">
              {" "}
              the team "{teamName}"
            </span>
          ) : (
            " this team"
          )}
          ?
        </p>
        <div className="flex justify-end gap-3 w-full">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-[#FF9466] text-[#FF6F61] hover:bg-[#FF9466]/10"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="rounded-xl bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white font-bold hover:opacity-90"
          >
            Yes, Leave
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LeaveTeamPopup;
