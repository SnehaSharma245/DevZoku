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
    window.location.href = "/auth/login";
    return null; // Prevent rendering if user is not authenticated
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-2xl">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-2 text-red-600">Leave Team</h2>
        <p className="mb-4 text-gray-700">
          Are you sure you want to leave
          {teamName ? ` the team "${teamName}"` : " this team"}?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Yes, Leave
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LeaveTeamPopup;
