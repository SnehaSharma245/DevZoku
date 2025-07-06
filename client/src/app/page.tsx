"use client";
import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const Home = () => {
  return (
    <main className="bg-white text-gray-800">
      {/* 🚀 Hero Section */}
      <section className="min-h-screen flex items-center justify-center text-center px-6 py-24 bg-gradient-to-br from-blue-100 via-white to-purple-100">
        <div className="max-w-5xl">
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-6">
            Welcome to <span className="text-blue-600">DevZoku</span>
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-10">
            Your all-in-one platform for developers and organizers to connect,
            create, and compete in the ultimate hackathon experience.
          </p>
          <Link href="/auth/signup">
            <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg font-medium transition-all">
              Get Started
              <ChevronRight size={20} />
            </button>
          </Link>
        </div>
      </section>

      {/* 🧠 About Section */}
      <section className="py-20 bg-gray-50 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">About DevZoku</h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            DevZoku is more than a hackathon portal. It's a smart ecosystem that
            empowers developers to build impactful projects and organizers to
            host seamless, AI-powered events. From team formation to real-time
            chat and intelligent suggestions — DevZoku automates the boring
            stuff, so you can focus on innovating.
          </p>
        </div>
      </section>

      {/* 🎯 CTA Section */}
      <section className="py-24 px-6 bg-blue-600 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold mb-4">Ready to join the Zoku?</h3>
          <p className="text-lg mb-8">
            Whether you're building, competing, or organizing — DevZoku is your
            ultimate toolkit.
          </p>
          <Link href="/auth/signup">
            <button className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-6 py-3 rounded-lg transition-all">
              Create Your Account
            </button>
          </Link>
        </div>
      </section>

      {/* ❓ FAQ Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold">What is DevZoku?</h4>
              <p className="text-gray-700">
                DevZoku is a platform that connects developers and organizers
                for hackathons, providing tools like team formation, profile
                setup, and real-time communication.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold">Is DevZoku free to use?</h4>
              <p className="text-gray-700">
                Absolutely! Developers can join and participate for free.
                Organizers can also create hackathons with smart tools provided
                by DevZoku.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold">
                Can I use DevZoku to host a private hackathon?
              </h4>
              <p className="text-gray-700">
                Yes! DevZoku allows organizers to set custom rules, private
                participation links, and fully manage the event.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
