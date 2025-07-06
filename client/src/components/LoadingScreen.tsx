"use client";
import { Loader2 } from "lucide-react"; // icon for spinner
import React from "react";

const LoadingScreen = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
