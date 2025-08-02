import React, { useState } from "react";

const HeroSection: React.FC = () => {
  const [loginOpen, setLoginOpen] = useState(false);
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="text-center space-y-8">
          {/* Main heading */}
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#062a47] leading-tight">
              Hackathons Made Effortless for{" "}
              <span
                className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9466] to-[#FF6F61]

"
              >
                Makers and Managers
              </span>
            </h1>

            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Join DevZoku - the ultimate platform where developers collaborate,
              organizers create amazing events, and innovation thrives in every
              hackathon.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              className="px-8 py-4 bg-[#FF8A65] text-white font-bold rounded-2xl hover:bg-[#062a47] transition-all duration-300 shadow-lg hover:shadow-2xl"
              onClick={() => setLoginOpen(true)}
            >
              Start as Developer
            </button>

            <button
              className="px-8 py-4 bg-white text-[#062a47] font-bold rounded-2xl border-2 border-[#062a47] hover:bg-[#062a47] hover:text-white transition-all duration-300 shadow-lg hover:shadow-2xl"
              onClick={() => setLoginOpen(true)}
            >
              Start as Organizer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
