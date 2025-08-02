"use client";
import Link from "next/link";
import { LayoutDashboard, Home, Info, BookOpen } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-[#F8FBFD] via-[#FAFCFD] to-[#FFFFFF] border-t border-[#f3f4f6] py-8 px-4 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-2xl font-extrabold flex items-center gap-2 tracking-tight">
          <LayoutDashboard className="w-7 h-7 text-[#FF8A65]" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9466] to-[#FF6F61]">
            DevZoku
          </span>
        </div>

        <div className="flex gap-8 text-base font-semibold">
          <Link
            href="/"
            className="text-[#062a47] hover:text-[#FF8A65] transition-colors flex items-center gap-1"
          >
            <Home className="w-5 h-5" /> Home
          </Link>
          <Link
            href="/about"
            className="text-[#062a47] hover:text-[#FF8A65] transition-colors flex items-center gap-1"
          >
            <Info className="w-5 h-5" /> About
          </Link>
          <Link
            href="/guide"
            className="text-[#062a47] hover:text-[#FF8A65] transition-colors flex items-center gap-1"
          >
            <BookOpen className="w-5 h-5" /> Guide
          </Link>
        </div>

        <div className="text-sm text-gray-400 text-center md:text-right">
          © {new Date().getFullYear()} DevZoku. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
