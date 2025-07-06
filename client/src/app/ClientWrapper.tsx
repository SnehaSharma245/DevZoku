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

  const { loading } = useAuth();

  // Check if the route matches specific paths
  const isPageWithoutNavbarAndFooter = pathname.startsWith("/auth/*");

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      {!isPageWithoutNavbarAndFooter && <Header />}
      <main>{children || <p>No children to render</p>}</main>
      {!isPageWithoutNavbarAndFooter && <Footer />}
    </>
  );
}
