import React from "react";

const CallToAction = () => (
  <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-[#F8FBFD] via-[#FAFCFD] to-[#FFFFFF]">
    {/* Decorative background shapes for CallToAction */}
    <div
      className="pointer-events-none select-none absolute inset-0 z-0"
      aria-hidden="true"
    >
      <div className="absolute top-[10%] left-[10%] w-18 h-18 bg-[#FF9466]/10 rotate-12 rounded-lg"></div>
      <div className="absolute top-[25%] right-[15%] w-22 h-22 bg-[#FF6F61]/10 rounded-full"></div>
      <div className="absolute bottom-[20%] left-[25%] w-16 h-16 bg-[#2563eb]/15 rotate-45 rounded-lg"></div>
      <div className="absolute bottom-[15%] right-[20%] w-20 h-20 bg-[#FF9466]/20 rounded-full"></div>
      <div className="absolute top-[55%] left-[5%] w-12 h-12 bg-[#FF6F61]/20 rounded-full"></div>
      <div className="absolute top-[75%] right-[8%] w-14 h-14 bg-[#2563eb]/20 rotate-45 rounded-lg"></div>
      <div className="absolute top-[40%] right-[40%] w-10 h-10 bg-[#FF9466]/15 rounded-full"></div>
    </div>

    <div className="text-center max-w-5xl mx-auto relative z-10">
      <div className="bg-gradient-to-r from-[#FF9466] to-[#FF6F61] rounded-3xl p-8 shadow-2xl">
        <h3 className="text-3xl font-bold text-white mb-4">
          Ready to Transform Your Hackathon Experience?
        </h3>
        <p className="text-white/90 text-lg mb-6 max-w-2xl mx-auto">
          Join thousands of developers and organizers who are already using
          DevZoku to create amazing hackathon experiences.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="px-8 py-4 bg-white text-[#FF6F61] font-bold rounded-2xl hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl">
            Get Started as Developer
          </button>
          <button className="px-8 py-4 bg-transparent text-white font-bold rounded-2xl border-2 border-white hover:bg-white hover:text-[#FF6F61] transition-all duration-300 shadow-lg">
            Get Started as Organizer
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default CallToAction;
