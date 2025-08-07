"use client";
import React, { useEffect } from "react";

import HeroSection from "@/components/landing-page-components/HeroSection";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Features from "@/components/landing-page-components/Features";
import CallToAction from "@/components/landing-page-components/CallToAction";
import UpcomingHackathonsCarousel from "@/components/landing-page-components/UpcomingHackathonsCarousel";
import FAQ from "@/components/landing-page-components/FAQ";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
      <Header />
      <HeroSection />
      <Features />
      <UpcomingHackathonsCarousel />
      <FAQ />
      <CallToAction />
      <Footer />
    </>
  );
};

export default Home;
