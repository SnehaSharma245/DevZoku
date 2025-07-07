"use client";
import { useAuth } from "@/hooks/useAuth";
import React from "react";

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
  console.log(user);

  if (user) {
    if (user.role === "developer") {
      window.location.href = "/developer/dashboard";
      return null;
    } else {
      window.location.href = "/organizer/dashboard";
      return null;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">DevZoku</h1>
        <div className="space-y-4">
          <button
            onClick={handleGoogleLoginForDeveloper}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded flex items-center justify-center"
          >
            <span>Login with Google as Developer</span>
          </button>

          <button
            onClick={handleGoogleLoginForOrganizer}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded flex items-center justify-center"
          >
            <span>Login with Google as Organizer</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
