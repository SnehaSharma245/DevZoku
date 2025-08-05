"use client";
import React, { useEffect } from "react";

import HeroSection from "@/components/landing-page-components/HeroSection";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

const Home = () => {
  const searchParams = useSearchParams();
  const toastMessage = searchParams.get("toast");

  useEffect(() => {
    if (toastMessage) {
      toast.error(toastMessage);
    }
  }, [toastMessage]);
  return (
    <>
      <HeroSection />
    </>
  );
};

export default Home;
