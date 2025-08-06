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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#F8FBFD] via-[#FAFCFD] to-[#FFFFFF] relative overflow-hidden">
      {/* Background decorative elements */}
      {pathname !== "/" && (
        <>
          {" "}
          <div className="absolute top-[5%] left-[5%] w-16 h-16 bg-[#f75a2f]/10 rotate-45 rounded-lg"></div>
          <div className="absolute top-[15%] right-[10%] w-20 h-20 bg-[#2563eb]/10 rounded-full"></div>
          <div className="absolute bottom-[10%] left-[8%] w-12 h-12 bg-[#f75a2f]/20 rotate-12 rounded-lg"></div>
          <div className="absolute bottom-[20%] right-[12%] w-8 h-8 bg-[#2563eb]/20 rounded-full"></div>
          <div className="absolute top-[50%] left-[7%] w-6 h-6 bg-[#f75a2f]/30 rounded-full"></div>
          <div className="absolute top-[33%] right-[7%] w-10 h-10 bg-[#2563eb]/15 rotate-45 rounded-lg"></div>
          <div className="absolute top-[70%] left-[40%] w-14 h-14 bg-[#2563eb]/10 rounded-full"></div>
          <div className="absolute bottom-[25%] right-[40%] w-10 h-10 bg-[#f75a2f]/15 rounded-lg"></div>
        </>
      )}

      {!isPageWithoutNavbarAndFooter && <Header />}
      <main className="flex-1 mb-3 relative z-10">
        {children || <p>No children to render</p>}
      </main>
      {!isPageWithoutNavbarAndFooter && <Footer />}
    </div>
  );
}
