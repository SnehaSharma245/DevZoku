"use client";
import Link from "next/link";
import { LayoutDashboard, Home, Info, BookOpen } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#18181e] border-t border-[#23232b] py-6 px-4   shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-lg font-extrabold text-[#a3e635] flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6" />
          DevZoku
        </div>

        <div className="flex gap-6 text-base text-white">
          <Link
            href="/"
            className="hover:text-[#a3e635] transition-colors flex items-center gap-1"
          >
            <Home className="w-4 h-4" /> Home
          </Link>
          <Link
            href="/about"
            className="hover:text-[#a3e635] transition-colors flex items-center gap-1"
          >
            <Info className="w-4 h-4" /> About
          </Link>
          <Link
            href="/guide"
            className="hover:text-[#a3e635] transition-colors flex items-center gap-1"
          >
            <BookOpen className="w-4 h-4" /> Guide
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
