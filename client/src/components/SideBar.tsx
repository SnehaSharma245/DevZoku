"use client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

const Sidebar = () => {
  const { user, handleLogout } = useAuth();

  const getInitial = () =>
    (user?.role === "developer"
      ? user?.firstName?.[0]
      : user?.profile?.organizationName?.[0]
    )?.toUpperCase() || "D";

  if (!user) return null;

  return (
    <Sheet>
      {/* ✅ Proper Trigger for ShadCN to recognize */}
      <SheetTrigger asChild>
        <Avatar className="w-9 h-9 cursor-pointer bg-blue-100 text-blue-700 font-semibold">
          <AvatarFallback>{getInitial()}</AvatarFallback>
        </Avatar>
      </SheetTrigger>

      {/* ✅ Right side sidebar */}
      <SheetContent side="right" className="w-72 sm:w-80 bg-white">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold text-blue-600">
            DevZoku
          </SheetTitle>
        </SheetHeader>

        <nav className="mt-6 flex flex-col gap-4 text-gray-700 text-sm font-medium">
          {user?.role === "developer" ? (
            <>
              <Link href="/profile">👤 Show Profile</Link>
              <Link href="/developer/dashboard">📊 Dashboard</Link>
              <Link href="/developer/teams">👥 Joined Teams</Link>
              <Link href="/developer/create-team">➕ Create a Team</Link>
              <Link href="/hackathons">🚀 Hackathons</Link>
            </>
          ) : (
            <>
              <Link href="/profile">🏢 Show Profile</Link>
              <Link href="/organizer/hackathons">📅 Show Hackathons</Link>
              <Link href="/organizer/create-hackathon">
                ➕ Create Hackathon
              </Link>
            </>
          )}
        </nav>

        {/* Logout button */}
        <div className="absolute bottom-6 left-6">
          <Button variant="destructive" size="sm" onClick={handleLogout}>
            🔒 Logout
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Sidebar;
