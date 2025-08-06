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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden ">
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 max-w-md w-full text-center relative z-10">
        <div className="flex justify-center mb-6 ">
          <img
            src="https://cdn-icons-png.flaticon.com/512/561/561127.png"
            alt="Email Sent"
            className="w-16 h-16"
          />
        </div>

        <h2 className="text-3xl font-bold text-[#062a47] mb-3">
          Registration Successful
        </h2>

        <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6">
          Your team has been registered for the hackathon.
          <br />A confirmation email will be sent to all team members shortly.
        </p>

        <button
          onClick={handleRedirect}
          className="px-8 py-4 bg-[#FF8A65] text-white font-bold rounded-2xl hover:bg-[#062a47] transition-all duration-300 shadow-lg hover:shadow-2xl"
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
