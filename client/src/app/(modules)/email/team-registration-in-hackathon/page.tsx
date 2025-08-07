"use client";

import { useAuth } from "@/hooks/useAuth";
import { withAuth } from "@/utils/withAuth";
import { useRouter } from "next/navigation";
import React from "react";

function RegistrationSuccess() {
  const router = useRouter();
  const { user } = useAuth();
  const handleRedirect = () => {
    router.push(`/developer/profile/${user?.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-6 animate-bounce">
          <img
            src="https://cdn-icons-png.flaticon.com/512/561/561127.png"
            alt="Email Sent"
            className="w-16 h-16"
          />
        </div>

        <h2 className="text-3xl font-bold text-blue-800 mb-3">
          🎉 Registration Successful
        </h2>

        <p className="text-gray-600 text-base leading-relaxed mb-6">
          Your team has been registered for the hackathon.
          <br />A confirmation email will be sent to all team members shortly.
        </p>

        <button
          onClick={handleRedirect}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition duration-300 shadow-md"
        >
          Go to Dashboard
        </button>

        <p className="text-xs text-gray-400 mt-6">
          If you don’t receive an email in a few minutes, please check your spam
          folder.
        </p>
      </div>
    </div>
  );
}

export default withAuth(RegistrationSuccess, "developer");
