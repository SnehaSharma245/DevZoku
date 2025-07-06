"use client";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";

const Header = () => {
  const { user, handleLogout } = useAuth();
  const [open, setOpen] = useState(false); // sidebar open state

  const getInitial = () =>
    (user?.role === "developer"
      ? user?.firstName?.[0]
      : user?.profile?.organizationName?.[0]
    )?.toUpperCase() || "D";

  return (
    <header className="w-full bg-white shadow-sm px-6 py-4 flex items-center justify-between">
      {/* Left: Logo */}
      <Link href="/" className="text-xl font-bold text-blue-600">
        DevZoku
      </Link>

      {/* Center: Navigation Links */}
      <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-700">
        <Link href="/" className="hover:text-blue-600 transition-colors">
          Home
        </Link>
        <Link href="/about" className="hover:text-blue-600 transition-colors">
          About
        </Link>
        <Link href="/guide" className="hover:text-blue-600 transition-colors">
          Guide
        </Link>
      </nav>

      {/* Right: Auth or Avatar */}
      <div className="flex items-center gap-3">
        {user ? (
          <Sheet open={open} onOpenChange={setOpen}>
            <div onClick={() => setOpen(true)}>
              <Avatar className="w-9 h-9 cursor-pointer bg-blue-100 text-blue-700 font-semibold">
                <AvatarFallback>{getInitial()}</AvatarFallback>
              </Avatar>
            </div>

            <SheetContent side="right" className="w-72 sm:w-80 bg-white">
              <SheetHeader>
                <SheetTitle className="text-xl font-bold text-blue-600">
                  DevZoku
                </SheetTitle>
              </SheetHeader>

              <nav className="mt-6 flex flex-col gap-4 text-gray-700 text-sm font-medium">
                {user?.role === "developer" ? (
                  <>
                    <Link href="/profile" onClick={() => setOpen(false)}>
                      👤 Show Profile
                    </Link>
                    <Link
                      href="/developer/dashboard"
                      onClick={() => setOpen(false)}
                    >
                      📊 Dashboard
                    </Link>
                    <Link
                      href="/developer/teams"
                      onClick={() => setOpen(false)}
                    >
                      👥 Joined Teams
                    </Link>
                    <Link
                      href="/developer/create-team"
                      onClick={() => setOpen(false)}
                    >
                      ➕ Create a Team
                    </Link>
                    <Link href="/hackathons" onClick={() => setOpen(false)}>
                      🚀 Hackathons
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/profile" onClick={() => setOpen(false)}>
                      🏢 Show Profile
                    </Link>
                    <Link
                      href="/organizer/hackathons"
                      onClick={() => setOpen(false)}
                    >
                      📅 Show Hackathons
                    </Link>
                    <Link
                      href="/organizer/create-hackathon"
                      onClick={() => setOpen(false)}
                    >
                      ➕ Create Hackathon
                    </Link>
                  </>
                )}
              </nav>

              <div className="absolute bottom-6 left-6">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    handleLogout();
                    setOpen(false);
                  }}
                >
                  🔒 Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <>
            <Link href="/auth/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="sm">Signup</Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
