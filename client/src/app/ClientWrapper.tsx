"use client";
import Header from "@/components/Header";
import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";

export default function ClientWrapper({
  children,
}: {
  children?: React.ReactNode;
}) {
  const pathname = usePathname();

  const { loading, user } = useAuth();

  // Check if the route matches specific paths

  let isPageWithoutNavbarAndFooter = false;

  if (
    user &&
    user.isProfileComplete === false &&
    pathname !== "/complete-profile"
  ) {
    isPageWithoutNavbarAndFooter =
      pathname.startsWith("/auth/*") || pathname.includes("/complete-profile");
  }
  if (!user && pathname.startsWith("/auth/") && !pathname.includes("/signup")) {
    isPageWithoutNavbarAndFooter =
      pathname.startsWith("/auth/*") || pathname.includes("/complete-profile");
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#101012] via-[#18181e] to-[#23232b]">
      {!isPageWithoutNavbarAndFooter && <Header />}
      <main className="flex-1 mb-3">
        {children || <p>No children to render</p>}
      </main>
      {!isPageWithoutNavbarAndFooter && <Footer />}
    </div>
  );
}
