"use client";
import { useAuth } from "@/hooks/useAuth";
import React from "react";
import { LogIn } from "lucide-react";

const Login = () => {
  const handleGoogleLoginForDeveloper = () => {
    window.location.href =
      "http://localhost:8000/api/v1/developer/authorization/auth/google";
  };

  const handleGoogleLoginForOrganizer = () => {
    window.location.href =
      "http://localhost:8000/api/v1/organizer/authorization/auth/google";
  };

  const { user } = useAuth();

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
    <div className="min-h-screen flex items-center justify-center ">
      <div className="max-w-md w-full bg-[#23232b] rounded-2xl shadow-2xl p-8 border border-[#23232b] flex flex-col items-center">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-[#a3e635] flex items-center justify-center mb-2 shadow">
            <LogIn className="w-8 h-8 text-[#23232b]" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">
            DevZoku
          </h1>
          <p className="text-gray-400 text-sm">Sign in to continue</p>
        </div>
        <div className="space-y-4 w-full">
          <button
            onClick={handleGoogleLoginForDeveloper}
            className="w-full bg-[#a3e635] hover:bg-lime-400 text-black font-bold py-3 px-4 rounded-xl flex items-center justify-center transition"
          >
            <span>Login with Google as Developer</span>
          </button>

          <button
            onClick={handleGoogleLoginForOrganizer}
            className="w-full bg-[#23232b] border border-[#a3e635] hover:bg-[#23232b]/80 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition"
          >
            <span>Login with Google as Organizer</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
