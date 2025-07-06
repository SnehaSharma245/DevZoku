"use client";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-gray-100 border-t py-6 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Logo or Brand Name */}
        <div className="text-lg font-semibold text-blue-600">DevZoku</div>

        {/* Center: Navigation Links */}
        <div className="flex gap-6 text-sm text-gray-600">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <Link href="/about" className="hover:text-blue-600 transition-colors">
            About
          </Link>
          <Link href="/guide" className="hover:text-blue-600 transition-colors">
            Guide
          </Link>
        </div>

        {/* Right: Copyright */}
        <div className="text-sm text-gray-500 text-center md:text-right">
          © {new Date().getFullYear()} DevZoku. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
