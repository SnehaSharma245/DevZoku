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
import { useEffect, useState } from "react";
import {
  Home,
  Info,
  BookOpen,
  LogIn,
  UserPlus,
  Bell,
  Users,
  Plus,
  Rocket,
  Building2,
  User,
  LayoutDashboard,
  BadgeCheck,
  Github,
  Linkedin,
  Globe,
  Twitter,
  Hash,
  Layers,
  LogOut,
} from "lucide-react";
import { set } from "react-hook-form";

const Header = () => {
  const { user, handleLogout, redBadge, setRedBadge } = useAuth();
  const [open, setOpen] = useState(false);

  const getInitial = () =>
    (user?.role === "developer"
      ? user?.firstName?.[0]
      : user?.profile?.organizationName?.[0]
    )?.toUpperCase() || "D";

  useEffect(() => {
    setRedBadge(true);
  }, []);

  return (
    <>
      <header className="w-full bg-[#18181e] shadow-lg px-6 py-4 flex items-center justify-between  border-b border-[#23232b]">
        {/* Left: Logo */}
        <Link
          href="/"
          className="text-2xl font-extrabold text-[#a3e635] flex items-center gap-2"
        >
          <LayoutDashboard className="w-7 h-7" />
          DevZoku
        </Link>

        {/* Right: Auth or Avatar */}
        <div className="flex items-center gap-3">
          {user ? (
            <Sheet open={open} onOpenChange={setOpen}>
              <div onClick={() => setOpen(true)}>
                <Avatar className="w-10 h-10 cursor-pointer bg-[#101011] text-[#a3e635] font-semibold border-2 border-[#a3e635]">
                  <AvatarFallback className="bg-[#272729] text-[#a3e635] font-semibold">
                    {getInitial()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <SheetContent
                side="right"
                className="w-72 sm:w-80 bg-[#18181e] border-l border-[#23232b]"
              >
                <SheetHeader>
                  <SheetTitle className="text-2xl font-extrabold text-[#a3e635] flex items-center gap-2">
                    <LayoutDashboard className="w-6 h-6" />
                    DevZoku
                  </SheetTitle>
                </SheetHeader>

                <nav className="mt-6 flex flex-col gap-4 text-white text-base font-medium">
                  {user?.role === "developer" ? (
                    <>
                      <Link
                        href={`/developer/profile/${user.id}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 hover:text-[#a3e635] transition-colors"
                      >
                        <User className="w-4 h-4" /> Show Profile
                      </Link>
                      <Link
                        href="/team/joined-teams"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 hover:text-[#a3e635] transition-colors"
                      >
                        <Users className="w-4 h-4" /> Joined Teams
                      </Link>
                      <Link
                        href="/team/create-team"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 hover:text-[#a3e635] transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Create a Team
                      </Link>
                      <Link
                        href="/hackathon/view-all-hackathons"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 hover:text-[#a3e635] transition-colors"
                      >
                        <Rocket className="w-4 h-4" /> Hackathons
                      </Link>
                      <Link
                        href="/team/view-all-teams"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 hover:text-[#a3e635] transition-colors"
                      >
                        <Layers className="w-4 h-4" /> View All Teams
                      </Link>
                      <Link
                        href="/developer/complete-profile"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 hover:text-[#a3e635] transition-colors"
                      >
                        <BadgeCheck className="w-4 h-4" /> Complete Profile
                      </Link>
                      <Link
                        href="/developer/manage-projects"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 hover:text-[#a3e635] transition-colors"
                      >
                        <Globe className="w-4 h-4" /> Manage Projects
                      </Link>
                      <Link
                        href="/developer/notifications"
                        onClick={() => {
                          setOpen(false);
                          setRedBadge(false);
                        }}
                        className="flex items-center gap-2 hover:text-[#a3e635] transition-colors"
                      >
                        <span className="relative">
                          <Bell className="w-4 h-4" />
                          {redBadge && (
                            <span
                              className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white shadow-md animate-pulse"
                              title="New notification"
                            />
                          )}
                        </span>
                        Notifications
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href={"/organizer/profile/" + user.id}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 hover:text-[#a3e635] transition-colors"
                      >
                        <Building2 className="w-4 h-4" /> Show Profile
                      </Link>
                      <Link
                        href="/hackathon/view-all-hackathons"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 hover:text-[#a3e635] transition-colors"
                      >
                        <Rocket className="w-4 h-4" /> Show Hackathons
                      </Link>
                      <Link
                        href="/hackathon/create-hackathon"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 hover:text-[#a3e635] transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Create Hackathon
                      </Link>
                      <Link
                        href="/organizer/complete-profile"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 hover:text-[#a3e635] transition-colors"
                      >
                        <BadgeCheck className="w-4 h-4" /> Complete Profile
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
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <>
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-[#23232b] border-[#23232b] text-white hover:bg-[#a3e635] hover:text-black rounded-xl"
                >
                  <LogIn className="w-4 h-4" /> Login
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  size="sm"
                  className="flex items-center gap-2 bg-[#a3e635] text-black rounded-xl font-bold"
                >
                  <UserPlus className="w-4 h-4" /> Signup
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
