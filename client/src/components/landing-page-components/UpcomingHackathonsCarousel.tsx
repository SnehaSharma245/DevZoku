import React, { useEffect, useRef, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import api from "@/utils/api";
import { toast } from "sonner";
import Link from "next/link";

type Hackathon = {
  id: string;
  name: string;
  date: string;
  location: string;
  image: string;
  description: string;
};

const mockHackathons: Hackathon[] = [
  {
    id: "1",
    name: "CodeSprint 2024",
    date: "2024-07-15",
    location: "Online",
    image:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=400&q=80",
    description: "A global online hackathon for all skill levels.",
  },
  {
    id: "2",
    name: "AI Innovators",
    date: "2024-08-01",
    location: "Bangalore, India",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80",
    description: "Build the next big thing in AI.",
  },
  {
    id: "3",
    name: "Web3 Jam",
    date: "2024-08-20",
    location: "San Francisco, CA",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
    description: "Decentralized apps and blockchain innovation.",
  },
  {
    id: "4",
    name: "HealthTech Hack",
    date: "2024-09-05",
    location: "Online",
    image:
      "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
    description: "Innovate for healthcare and wellness.",
  },
  {
    id: "5",
    name: "FinTech Challenge",
    date: "2024-09-18",
    location: "London, UK",
    image:
      "https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=400&q=80",
    description: "Shape the future of finance.",
  },
];

const UpcomingHackathonsCarousel: React.FC = () => {
  const carouselRef = useRef<any>(null);
  const [hackathons, setHackathons] = useState<any[]>([]);

  const getUpcomingHackathons = async () => {
    try {
      const response = await api.get("/hackathon/upcoming-hackathons");
      const { status, data } = response.data;
      console.log("Upcoming Hackathons:", data);
      if (status === 200) {
        setHackathons(data);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch hackathons"
      );
    }
  };

  useEffect(() => {
    getUpcomingHackathons();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        carouselRef.current &&
        typeof carouselRef.current.next === "function"
      ) {
        carouselRef.current.next();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
      {/* Decorative background shapes for Carousel */}
      <div className="pointer-events-none select-none absolute inset-0 z-0">
        <div className="absolute top-[12%] left-[10%] w-20 h-20 bg-[#FF9466]/10 rotate-12 rounded-lg"></div>
        <div className="absolute top-[12%] right-[12%] w-24 h-24 bg-[#2563eb]/20 rounded-full"></div>
        <div className="absolute bottom-[18%] left-[22%] w-14 h-14 bg-[#FF9466]/20 rotate-45 rounded-lg"></div>
        <div className="absolute bottom-[8%] right-[20%] w-16 h-16 bg-[#2563eb]/20 rounded-full"></div>
        <div className="absolute top-[30%] left-[38%] w-10 h-10 bg-[#FF9466]/20 rounded-full"></div>
        <div className="absolute top-[25%] right-[28%] w-12 h-12 bg-[#FF6F61]/15 rotate-12 rounded-lg"></div>
      </div>
      <div className="mb-10 text-center relative ">
        <h2 className="text-3xl sm:text-4xl font-bold text-[#062a47] mb-2">
          Upcoming Hackathons
        </h2>
        <p className="text-[#6B7A8F] text-lg">
          Don&apos;t miss your chance to participate and innovate!
        </p>
      </div>
      <div className="relative flex flex-col items-center z-10">
        <div className="w-full flex justify-center">
          <div className="w-full max-w-5xl">
            <Carousel opts={{ loop: true }} ref={carouselRef}>
              <CarouselContent>
                {hackathons.map((hackathon) => (
                  <CarouselItem
                    key={hackathon.id}
                    className="basis-full md:basis-1/3 px-3"
                  >
                    <div
                      className="w-80 bg-white rounded-2xl shadow-lg border border-[#e3e8ee] overflow-hidden mx-auto flex flex-col"
                      style={{ width: "320px" }}
                    >
                      {/* Organization Initial Circle */}
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#FF9466] to-[#FF6F61] flex items-center justify-center text-white text-4xl font-extrabold shadow-lg mx-auto mt-6 mb-2">
                        {(hackathon.organizationName &&
                          hackathon.organizationName.charAt(0).toUpperCase()) ||
                          "O"}
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="text-xl font-bold text-[#062a47] mb-2">
                          {hackathon.title}
                        </h3>
                        <div className="flex items-center text-sm text-[#FF6F61] font-semibold mb-1">
                          <span className="mr-2">
                            📅{" "}
                            {hackathon.startTime
                              ? (() => {
                                  const d = new Date(hackathon.startTime);
                                  const day = String(d.getDate()).padStart(
                                    2,
                                    "0"
                                  );
                                  const month = String(
                                    d.getMonth() + 1
                                  ).padStart(2, "0");
                                  const year = d.getFullYear();
                                  return `${day}-${month}-${year}`;
                                })()
                              : ""}
                          </span>
                          <span>
                            {hackathon.mode === "online"
                              ? "🌐 Online"
                              : hackathon.location
                              ? `🌍 ${hackathon.location}`
                              : ""}
                          </span>
                        </div>
                        <p className="text-[#6B7A8F] text-sm mb-4 flex-1">
                          {hackathon.description}
                        </p>

                        <Link
                          href={`/hackathon/view-all-hackathons/${hackathon.id}`}
                          className="px-5 py-2 bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white font-bold rounded-xl hover:scale-105 transition-transform duration-200 shadow"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center gap-4 mt-6 h-12 items-center">
                <CarouselPrevious className="bg-[#FF9466] hover:bg-[#FF6F61] text-white rounded-full shadow-lg w-10 h-10 flex items-center justify-center transition static" />
                <CarouselNext className="bg-[#FF9466] hover:bg-[#FF6F61] text-white rounded-full shadow-lg w-10 h-10 flex items-center justify-center transition static" />
              </div>
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UpcomingHackathonsCarousel;
