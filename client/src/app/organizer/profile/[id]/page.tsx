"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/utils/api";
import { Card, CardContent } from "@/components";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FaLinkedin, FaGlobe, FaInstagram } from "react-icons/fa";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface OrganizerProfile {
  id: string;
  userId: string;
  organizationName: string;
  companyEmail: string;
  phoneNumber: string;
  website: string;
  bio: string;
  location: {
    country?: string;
    state?: string;
    city?: string;
    address?: string;
  };
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    website?: string;
  };
  totalEventsOrganized: number;
  createdAt: string;
  updatedAt: string;
}

export default function OrganizerProfilePage() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [location, setLocation] = useState<{
    country?: string;
    state?: string;
    city?: string;
    address?: string;
  }>({});
  const [loading, setLoading] = useState(true);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [organizedEvents, setOrganizedEvents] = useState<any[]>([]);

  useEffect(() => {
    if (user && user.isProfileComplete === false) {
      setShowIncompleteModal(true);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/organizer/profile/${user?.id}`);
        const { status, data, message } = res.data;

        if (status === 200) {
          setProfile(data.organizerProfile);
          setLocation(data.location);
        }
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Failed to load organizer profile"
        );
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchData();
  }, [user?.id]);

  const fetchEvents = async () => {
    try {
      const res = await api.get(`/organizer/organized-hackathons/${user?.id}`);
      const { status, data } = res.data;

      if (status === 200) {
        setOrganizedEvents(data.events);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to load organized events"
      );
    }
  };

  if (!user) {
    window.location.href = "/";
    return null;
  }

  if (user?.role !== "organizer") {
    window.location.href = "/";
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 mt-4">
      <div className="max-w-2xl w-full mx-auto">
        {/* Main Profile Card */}
        <Card className="rounded-3xl shadow-2xl border border-[#e3e8ee] bg-gradient-to-br from-white via-white to-[#fff9f5] p-8">
          <div className="flex flex-col items-center">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#FF9466] to-[#FF6F61] flex items-center justify-center text-white text-5xl font-extrabold shadow-xl border-4 border-white mb-4">
              {(profile?.organizationName &&
                profile.organizationName.charAt(0).toUpperCase()) ||
                "O"}
            </div>
            {/* Name */}
            <h2 className="text-3xl sm:text-4xl font-bold text-[#062a47] mb-2 text-center">
              {profile?.organizationName || "Organizer"}
            </h2>
            {/* Bio */}
            <div className="text-[#6B7A8F] mb-4 italic text-center">
              {profile?.bio || "Organizer"}
            </div>
            {/* Email */}
            <div className="text-[#6B7A8F] mb-4 italic text-center">
              {profile?.companyEmail}
            </div>

            {/* Details List */}
            <div className="w-full mt-2">
              <div className="flex flex-col gap-2">
                <div>
                  <span className="font-semibold">Phone Number:</span>{" "}
                  {profile?.phoneNumber || (
                    <span className="text-gray-400">Not set</span>
                  )}
                </div>
                <div>
                  <span className="font-semibold">Website:</span>{" "}
                  {profile?.website ? (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#f75a2f] underline"
                    >
                      {profile.website}
                    </a>
                  ) : (
                    <span className="text-gray-400">Not set</span>
                  )}
                </div>
                <div>
                  <span className="font-semibold">Location:</span>{" "}
                  {location ? (
                    [
                      location.country,
                      location.state,
                      location.city,
                      location.address,
                    ]
                      .filter(Boolean)
                      .join(", ") || (
                      <span className="text-gray-400">Not set</span>
                    )
                  ) : (
                    <span className="text-gray-400">Not set</span>
                  )}
                </div>
                <div>
                  <span className="font-semibold">Joined At:</span>{" "}
                  {profile?.createdAt ? (
                    new Date(profile.createdAt).toLocaleString()
                  ) : (
                    <span className="text-gray-400">Not set</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
        {/* Events Organized Card */}
        <Card className="mt-8 rounded-2xl shadow-lg border border-[#eaf6fb] bg-gradient-to-br from-white via-white to-[#fff9f5] p-6">
          <div className="flex flex-col items-center gap-2 mb-4">
            <span className="text-[#062a47] font-semibold text-lg">
              Events Organized
            </span>
            <span className="font-bold text-[#f75a2f] text-2xl">
              {profile?.totalEventsOrganized ?? 0}
            </span>
          </div>
          {/* Carousel for organized events */}
          {organizedEvents.length > 0 ? (
            <div className="w-full">
              <Carousel opts={{ loop: true }}>
                <CarouselContent>
                  {organizedEvents.map((event) => (
                    <CarouselItem key={event.id} className="px-2">
                      <div className="bg-gradient-to-r from-[#fff9f5] to-[#fff9f5] border border-[#fff9f5] rounded-2xl shadow flex flex-col p-4 h-full">
                        <div className="w-full aspect-[3/2] rounded-xl overflow-hidden mb-2 bg-[#fff9f5] border border-[#fff9f5]">
                          <img
                            className="w-full h-full object-cover"
                            src={event.poster}
                            alt={event.title}
                          />
                        </div>
                        <h3 className="font-semibold text-[#062a47] text-lg mb-1 truncate">
                          {event.title}
                        </h3>
                        <p className="text-xs text-[#6B7A8F] mb-1">
                          {event.startTime
                            ? new Date(event.startTime).toLocaleString()
                            : ""}
                          {" - "}
                          {event.endTime
                            ? new Date(event.endTime).toLocaleString()
                            : ""}
                        </p>
                        <p className="text-xs text-[#6B7A8F] mb-2">
                          {event.location}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {event.tags?.map((tag: string) => (
                            <span
                              key={tag}
                              className="bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white px-2 py-1 rounded-full text-xs border border-[#FF9466] shadow"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="mt-auto">
                          <span
                            className="inline-block px-2 py-1 rounded text-xs font-semibold"
                            style={{
                              background:
                                event.status === "upcoming"
                                  ? "#FF9466"
                                  : event.status === "ongoing"
                                  ? "#FF6F61"
                                  : event.status === "completed"
                                  ? "#6B7A8F"
                                  : "#fff9f5",
                              color:
                                event.status === "upcoming"
                                  ? "#fff"
                                  : event.status === "ongoing"
                                  ? "#fff"
                                  : event.status === "completed"
                                  ? "#fff"
                                  : "#062a47",
                            }}
                          >
                            {event.status}
                          </span>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-0 -translate-y-1/2 top-1/2 absolute" />
                <CarouselNext className="right-0 -translate-y-1/2 top-1/2 absolute" />
              </Carousel>
            </div>
          ) : (
            <div className="text-[#6B7A8F] text-center py-8 bg-gradient-to-br from-white via-white to-[#fff9f5] rounded-xl border border-[#fff9f5] shadow">
              No events organized yet.
            </div>
          )}
        </Card>
        {/* Social Links Card */}
        {profile?.socialLinks &&
          Object.values(profile.socialLinks).some(Boolean) && (
            <Card className="mt-8 rounded-2xl shadow-lg border border-[#eaf6fb] bg-gradient-to-br from-white via-white to-[#fff9f5] p-6">
              <CardHeader>
                <CardTitle className="text-[#062a47] font-bold text-xl text-center">
                  Reach Out
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6 flex-wrap justify-center items-center">
                  {profile.socialLinks.linkedin && (
                    <a
                      href={profile.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#062a47ea] hover:text-[#f75a2f] transition"
                    >
                      <FaLinkedin size={22} />
                      <span className="hidden md:inline">LinkedIn</span>
                    </a>
                  )}
                  {profile.socialLinks.website && (
                    <a
                      href={profile.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#062a47ea] hover:text-[#f75a2f] transition"
                    >
                      <FaGlobe size={22} />
                      <span className="hidden md:inline">Website</span>
                    </a>
                  )}
                  {profile.socialLinks.instagram && (
                    <a
                      href={profile.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#062a47ea] hover:text-[#f75a2f] transition"
                    >
                      <FaInstagram size={22} />
                      <span className="hidden md:inline">Instagram</span>
                    </a>
                  )}
                  {profile.socialLinks.twitter && (
                    <a
                      href={profile.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#062a47ea] hover:text-[#f75a2f] transition"
                    >
                      <span className="hidden md:inline">Twitter</span>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
}
