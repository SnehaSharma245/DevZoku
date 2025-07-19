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
  const { user, handleLogout, redBadge, setRedBadge } = useAuth();
  const [open, setOpen] = useState(false);

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
                    <Link
                      href={`/developer/profile/${user.id}`}
                      onClick={() => setOpen(false)}
                    >
                      👤 Show Profile
                    </Link>

                    <Link
                      href="/team/joined-teams"
                      onClick={() => setOpen(false)}
                    >
                      👥 Joined Teams
                    </Link>

                    <Link
                      href="/team/create-team"
                      onClick={() => setOpen(false)}
                    >
                      ➕ Create a Team
                    </Link>

                    <Link
                      href="/hackathon/view-all-hackathons"
                      onClick={() => setOpen(false)}
                    >
                      🚀 Hackathons
                    </Link>
                    <Link
                      href="/team/view-all-teams"
                      onClick={() => setOpen(false)}
                    >
                      🧩 View All Teams
                    </Link>
                    <Link
                      href="/developer/complete-profile"
                      onClick={() => setOpen(false)}
                    >
                      🧩 Complete Profile
                    </Link>
                    <Link
                      href="/developer/manage-projects"
                      onClick={() => setOpen(false)}
                    >
                      🧩 Manage Projects
                    </Link>
                    <Link
                      href="/developer/notifications"
                      onClick={() => {
                        setOpen(false);
                        setRedBadge(false); // badge ko hide kar do
                      }}
                      className="relative"
                    >
                      🔔 Notifications
                      {redBadge && (
                        <span
                          className="absolute -top-1 -right-2 h-3 w-3 rounded-full bg-red-500 border-2 border-white"
                          title="New notification"
                        />
                      )}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href={"/organizer/profile/" + user.id}
                      onClick={() => setOpen(false)}
                    >
                      🏢 Show Profile
                    </Link>
                    <Link
                      href="/hackathon/view-all-hackathons"
                      onClick={() => setOpen(false)}
                    >
                      📅 Show Hackathons
                    </Link>
                    <Link
                      href="/hackathon/create-hackathon"
                      onClick={() => setOpen(false)}
                    >
                      ➕ Create Hackathon
                    </Link>
                    <Link
                      href="/organizer/complete-profile"
                      onClick={() => setOpen(false)}
                    >
                      📅 Complete Profile
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
