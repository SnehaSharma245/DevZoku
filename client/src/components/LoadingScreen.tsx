"use client";
import React from "react";

const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#F8FBFD] via-[#FAFCFD] to-[#FFFFFF] relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-[5%] left-[5%] w-16 h-16 bg-[#f75a2f]/10 rotate-45 rounded-lg"></div>
      <div className="absolute top-[15%] right-[10%] w-20 h-20 bg-[#2563eb]/10 rounded-full"></div>
      <div className="absolute bottom-[10%] left-[8%] w-12 h-12 bg-[#f75a2f]/20 rotate-12 rounded-lg"></div>
      <div className="absolute bottom-[20%] right-[12%] w-8 h-8 bg-[#2563eb]/20 rounded-full"></div>
      <div className="absolute top-[50%] left-[7%] w-6 h-6 bg-[#f75a2f]/30 rounded-full"></div>
      <div className="absolute top-[33%] right-[7%] w-10 h-10 bg-[#2563eb]/15 rotate-45 rounded-lg"></div>
      <div className="absolute top-[70%] left-[40%] w-14 h-14 bg-[#2563eb]/10 rounded-full"></div>
      <div className="absolute bottom-[25%] right-[40%] w-10 h-10 bg-[#f75a2f]/15 rounded-lg"></div>

      <div className="flex items-center justify-center h-screen relative z-10">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-4 border-orange-100   shadow-lg"></div>
            <div className="absolute top-0 left-0 h-20 w-20 rounded-full border-4 border-transparent border-t-[#f75a2f] border-r-[#f75a2f] animate-spin"></div>
            <div className="absolute top-2 left-2 h-16 w-16 rounded-full border-2 border-transparent border-t-orange-300 animate-spin animation-delay-200"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
