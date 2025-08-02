"use client";
import { useAuth } from "@/hooks/useAuth";
import React, { useEffect } from "react";
import { LogIn } from "lucide-react";

const Login = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const handleGoogleLoginForDeveloper = () => {
    if (!API_BASE_URL) {
      alert(
        "API_BASE_URL is not set. Please check your environment variables."
      );
      return;
    }
    window.location.href = `${API_BASE_URL}/developer/authorization/auth/google`;
  };

  const handleGoogleLoginForOrganizer = () => {
    if (!API_BASE_URL) {
      alert(
        "API_BASE_URL is not set. Please check your environment variables."
      );
      return;
    }
    window.location.href = `${API_BASE_URL}/organizer/authorization/auth/google`;
  };

  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [open]);

  if (!open) return null;

  if (user) {
    if (user.role === "developer") {
      window.location.href = "/developer/profile/" + user.id;
      return null;
    } else {
      window.location.href = "/organizer/profile/" + user.id;
      return null;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-gradient-to-br from-[#F8FBFD] via-[#FAFCFD] to-[#FFFFFF] rounded-3xl shadow-2xl border border-[#f3f4f6] max-w-lg w-full p-8 relative flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#062a47] hover:text-[#FF8A65] text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-[#FF8A65] flex items-center justify-center mb-2 shadow-lg">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#062a47] leading-tight mb-2">
            Login To DevZoku
          </h1>
        </div>
        <div className="flex flex-col gap-4 justify-center items-center w-full">
          <button
            onClick={handleGoogleLoginForDeveloper}
            className="px-8 py-4 bg-[#FF8A65] text-white font-bold rounded-2xl hover:bg-[#ff8965e5] transition-all cursor-pointer duration-300 shadow-lg hover:shadow-2xl w-full sm:w-auto"
          >
            Start as Developer
          </button>
          <button
            onClick={handleGoogleLoginForOrganizer}
            className="px-8 py-4 bg-white text-[#062a47] font-bold rounded-2xl border-2 border-[#062a47] hover:bg-[#062a47] hover:text-white transition-all duration-300 shadow-lg hover:shadow-2xl w-full sm:w-auto cursor-pointer"
          >
            Start as Organizer
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
