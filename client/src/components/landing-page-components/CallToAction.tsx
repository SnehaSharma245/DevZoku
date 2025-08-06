import React from "react";

const CallToAction = () => (
  <div className="text-center mt-10 max-w-5xl mx-auto px-4 mb-10">
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
);

export default CallToAction;
