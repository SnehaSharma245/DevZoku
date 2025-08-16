"use client";
import React from "react";
import {
  LayoutDashboard,
  Github,
  Linkedin,
  Twitter,
  Mail,
  Coffee,
} from "lucide-react";

function Footer() {
  const socialLinks = [
    {
      name: "GitHub",
      icon: <Github className="w-4 h-4" />,
      href: "https://github.com/celersneha",
    },
    {
      name: "LinkedIn",
      icon: <Linkedin className="w-4 h-4" />,
      href: "https://www.linkedin.com/in/celersneha/",
    },
    {
      name: "Twitter",
      icon: <Twitter className="w-4 h-4" />,
      href: "https://twitter.com/celersneha",
    },
    {
      name: "Buy me a coffee",
      icon: <Coffee className="w-4 h-4" />,
      href: "https://buymeacoffee.com/celersneha",
    },
    {
      name: "Email",
      icon: <Mail className="w-4 h-4" />,
      href: "mailto:celersneha@gmail.com",
    },
  ];

  return (
    <footer className="relative bg-transparent py-8 px-4 mt-12 border-t border-[#FF8A65]/20 z-10 overflow-hidden">
      {/* Decorative Shapes - bubble style, no straight lines, varied sizes */}
      <div
        className="pointer-events-none select-none absolute inset-0 z-0"
        aria-hidden="true"
      >
        {/* Top left small orange bubble */}
        <div className="absolute top-2 left-4 w-8 h-8 bg-[#FF8A65]/20 rounded-full"></div>
        {/* Top mid-left medium blue bubble */}
        <div className="absolute top-8 left-32 w-16 h-16 bg-[#2563eb]/15 rounded-full"></div>
        {/* Top right large orange bubble */}
        <div className="absolute top-0 right-10 w-24 h-24 bg-[#FF9466]/15 rounded-full"></div>
        {/* Mid left small blue bubble */}
        <div className="absolute top-1/2 left-12 w-10 h-10 bg-[#2563eb]/10 rounded-full -translate-y-1/2"></div>
        {/* Mid right small orange bubble */}
        <div className="absolute top-1/2 right-20 w-8 h-8 bg-[#FF6F61]/15 rounded-full -translate-y-1/2"></div>
        {/* Bottom left medium orange bubble */}
        <div className="absolute bottom-8 left-20 w-14 h-14 bg-[#FF8A65]/15 rounded-full"></div>

        {/* Bottom right small orange bubble */}
        <div className="absolute bottom-6 right-40 w-10 h-10 bg-[#2563eb]/10  rounded-full"></div>
      </div>
      {/* Footer Content */}
      <div className="relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start">
            {/* Left side - Social Links and Copyright */}
            <div className="flex flex-col items-center order-2 md:order-1 mt-8">
              {/* Social Links */}
              <div className="flex space-x-3 mb-4">
                {socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-[#f3f4f6] hover:bg-[#FF8A65] rounded-full transition-all duration-200 hover:scale-110 text-[#062a47] hover:text-white"
                    aria-label={link.name}
                  >
                    {link.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Right side - Logo and Website Name */}
            <div className="order-1 md:order-2">
              <div className="flex items-center space-x-3 mb-2 md:mb-0">
                <div className="flex flex-col items-center">
                  <img
                    src={"/logo-2.png"}
                    className="w-12 h-12 sm:w-24 sm:h-24 mb-1"
                  />
                  <span className="text-[#7b8794] text-xs">
                    Smart Hackathons, Smarter Teams.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Copyright */}
        <div className="text-center text-[#7b8794] text-xs pt-3">
          <p>© 2025 DevZoku. All rights reserved.</p>
          <p className="mt-1 text-[#FF8A65]">
            DevZoku | Your Hackathon Manager 2.0
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
