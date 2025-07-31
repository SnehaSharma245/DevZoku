"use client";
import { useAuth } from "@/hooks/useAuth";
import api from "@/utils/api";
import { formatDateTime } from "@/utils/formattedDate";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Hackathon } from "@/types/hackathon.types";
import { X, ChevronDown } from "lucide-react";
import { tagSections } from "@/constants/const";
import { Separator } from "@/components/ui/separator";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

function AllHackathons() {
  const { user } = useAuth();
  const [showParticipated, setShowParticipated] = useState(false);
  const [showMine, setShowMine] = useState(false);
  const [fetchedHackathons, setFetchedHackathons] = useState<Hackathon[]>([]);
  const [recommendedHackathons, setRecommendedHackathons] = useState<
    Hackathon[]
  >([]);
  const [search, setSearch] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(""); // e.g. "24", "48"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const statusOptions = [
    "all",
    "upcoming",
    "Registration in Progress",
    "Registration ended",
    "ongoing",
    "completed",
    "unknown",
  ] as const;

  type StatusType = (typeof statusOptions)[number];

  const [status, setStatus] = useState<StatusType>("all");
  const [mode, setMode] = useState("");

  // 1. Page load par sab fetch karo
  useEffect(() => {
    fetchHackathons();
  }, []);

  const fetchHackathons = async (params: any = {}) => {
    setLoading(true);
    try {
      const query = new URLSearchParams(params).toString();
      const endpoint = user
        ? "/hackathon/view-all-hackathons-auth"
        : "/hackathon/view-all-hackathons";
      const res = await api.get(`${endpoint}${query ? "?" + query : ""}`);
      const { status, data, message } = res.data;
      if (status === 200) {
        setFetchedHackathons(data);
      } else {
        toast.error(message || "Failed to fetch hackathons");
        setFetchedHackathons([]);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch hackathons"
      );
      setFetchedHackathons([]);
    } finally {
      setLoading(false);
    }
  };

  // 2. Tag search/filter par fetch karo
  const handleFilterSearch = async () => {
    const params: any = {};
    if (tags.length > 0) params.tags = tags.join(",");
    if (duration) params.duration = duration;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (status && status !== "all") params.status = status;
    if (mode) params.mode = mode;
    if (showMine && user?.role === "organizer" && user?.id) {
      params.organizerId = user.id;
    }
    if (showParticipated && user?.role === "developer" && user?.id) {
      params.showParticipated = true;
    }
    fetchHackathons(params);
  };

  function normalize(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9]/gi, "");
  }

  const filteredHackathons = fetchedHackathons.filter((hackathon) =>
    normalize(hackathon.title).includes(normalize(search))
  );

  const handleRemoveTag = (idx: number) => {
    setTags(tags.filter((_, i) => i !== idx));
  };

  // Tag selection dropdown handler
  const handleSelectTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagDropdownOpen(false);
  };

  const handleShowRecommendedHackathons = async () => {
    try {
      const res = await api.get("/developer/recommended-hackathons");

      const { status, data, message } = res.data;

      if (status === 200) {
        setRecommendedHackathons(data);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to fetch recommended hackathons"
      );
      setFetchedHackathons([]);
    }
  };

  useEffect(() => {
    if (user?.role === "developer") {
      handleShowRecommendedHackathons();
    }
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row gap-8 px-2 py-8">
      {/* Filters */}
      <aside className="w-full md:w-80 mb-8 md:mb-0 md:mr-8">
        <div className="bg-[#23232b] border border-[#23232b] rounded-2xl shadow-xl p-6 flex flex-col gap-6 sticky top-8">
          <button
            onClick={handleFilterSearch}
            className="w-full bg-[#a3e635] text-black font-bold rounded-xl hover:bg-lime-400 transition py-2 mb-2"
            disabled={loading}
          >
            {loading ? "Searching..." : "Apply Filters"}
          </button>

          {/* Tag input as dropdown */}
          <div className="relative">
            <label className="block text-white font-semibold mb-1">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, idx) => (
                <span
                  key={tag + idx}
                  className="flex items-center bg-[#18181e] text-white px-3 py-1 rounded-full text-sm border border-[#a3e635]"
                >
                  {tag}
                  <button
                    type="button"
                    className="ml-2 text-gray-400 hover:text-red-400"
                    onClick={() => handleRemoveTag(idx)}
                    tabIndex={-1}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <button
              type="button"
              className="flex items-center gap-2 bg-[#18181e] text-white border border-[#a3e635] rounded-xl px-3 py-2 hover:bg-[#23232b]/80 transition"
              onClick={() => setTagDropdownOpen((v) => !v)}
            >
              <ChevronDown className="w-4 h-4" />
              {tags.length === 0 ? "Select tags" : "Add more tags"}
            </button>
            {tagDropdownOpen && (
              <div className="absolute z-20 mt-2 w-full max-h-72 overflow-y-auto bg-[#23232b] border border-[#a3e635] rounded-xl shadow-xl p-2">
                {tagSections.map((section, idx) => (
                  <div key={section.label}>
                    <div className="text-xs font-bold text-[#a3e635] px-2 py-1">
                      {section.label}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {section.tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            tags.includes(tag)
                              ? "bg-[#a3e635] text-black border-[#a3e635] cursor-not-allowed"
                              : "bg-[#18181e] text-white border-[#23232b] hover:border-[#a3e635] hover:bg-[#23232b]"
                          }`}
                          disabled={tags.includes(tag)}
                          onClick={() => handleSelectTag(tag)}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    {idx !== tagSections.length - 1 && (
                      <Separator className="my-2 bg-[#23232b]" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-white font-semibold mb-1">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    status === option
                      ? "bg-[#a3e635] text-black border-[#a3e635]"
                      : "bg-[#18181e] text-white border-[#23232b] hover:border-[#a3e635]"
                  }`}
                  onClick={() => setStatus(option)}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Duration, Dates, Mode */}
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-white font-semibold mb-1">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-[#18181e] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] px-3 py-2"
              >
                <option value="">All Durations</option>
                <option value="7">≤ 7 Hours</option>
                <option value="24">≤ 24 Hours</option>
                <option value="48">≤ 48 Hours</option>
                <option value="72">≤ 72 Hours</option>
                <option value="gt72">{">72 Hours"}</option>
              </select>
            </div>
            <div>
              <label className="block text-white font-semibold mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#18181e] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#18181e] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-1">
                Mode
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full bg-[#18181e] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] px-3 py-2"
              >
                <option value="">All Modes</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>

          {/* Organizer/Developer filters */}
          {user?.role === "organizer" && (
            <label className="flex items-center gap-2 text-white mt-2">
              <input
                type="checkbox"
                checked={showMine}
                onChange={() => setShowMine((v) => !v)}
                className="accent-[#a3e635]"
              />
              Show only hackathons created by me
            </label>
          )}
          {user?.role === "developer" && (
            <label className="flex items-center gap-2 text-white mt-2">
              <input
                type="checkbox"
                checked={showParticipated}
                onChange={() => setShowParticipated((v) => !v)}
                className="accent-[#a3e635]"
              />
              Show only hackathons I have participated in
            </label>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {/* Recommended Hackathons Carousel */}

        {user?.role === "developer" && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Recommended Hackathons
            </h2>
            <div className="relative">
              <Carousel opts={{ loop: true }}>
                <CarouselContent>
                  {recommendedHackathons.length === 0 ? (
                    <CarouselItem>
                      <div className="text-gray-400 text-center py-8">
                        No recommended hackathons found.
                      </div>
                    </CarouselItem>
                  ) : (
                    recommendedHackathons.map((hackathon) => (
                      <CarouselItem
                        key={hackathon.id}
                        className="md:basis-1/2 lg:basis-1/3 px-2"
                      >
                        <div className="bg-[#23232b] border border-[#23232b] rounded-2xl shadow-lg flex flex-row items-center justify-center p-4 h-full gap-4 w-full">
                          {/* Image Left */}
                          <div className="w-24 h-16 rounded-lg overflow-hidden bg-[#18181e] border border-[#23232b] flex-shrink-0 flex items-center justify-center">
                            <img
                              className="w-full h-full object-cover"
                              src={hackathon.poster}
                              alt={hackathon.title}
                            />
                          </div>
                          {/* Content Right */}
                          <div className="flex flex-col flex-1 min-w-0 items-center text-center">
                            <Link
                              href={`/hackathon/view-all-hackathons/${hackathon.id}`}
                            >
                              <h3 className="font-semibold text-white text-lg mb-1 truncate w-full">
                                {hackathon.title}
                              </h3>
                            </Link>

                            <p className="text-xs text-gray-400 mb-1 truncate w-full">
                              {formatDateTime(hackathon?.startTime)} -{" "}
                              {formatDateTime(hackathon?.endTime)}
                            </p>
                            <p className="text-xs text-gray-400 mb-2 truncate w-full">
                              {hackathon.location}
                            </p>

                            <div className="mt-auto flex items-center gap-2 justify-center w-full">
                              <span
                                className="inline-block px-2 py-1 rounded text-xs font-semibold"
                                style={{
                                  background:
                                    hackathon.status === "upcoming"
                                      ? "#fbbf24"
                                      : hackathon.status === "ongoing"
                                      ? "#a3e635"
                                      : hackathon.status === "completed"
                                      ? "#f87171"
                                      : "#e5e7eb",
                                  color:
                                    hackathon.status === "upcoming"
                                      ? "#92400e"
                                      : hackathon.status === "ongoing"
                                      ? "#23232b"
                                      : hackathon.status === "completed"
                                      ? "#7f1d1d"
                                      : "#374151",
                                }}
                              >
                                {hackathon.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CarouselItem>
                    ))
                  )}
                </CarouselContent>
                <CarouselPrevious className="left-0 -translate-y-1/2 top-1/2 absolute" />
                <CarouselNext className="right-0 -translate-y-1/2 top-1/2 absolute" />
              </Carousel>
            </div>
          </div>
        )}

        {/* Title search (local filter) */}
        <input
          type="text"
          placeholder="Search hackathon by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888] px-3 py-2 mb-4 w-full"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredHackathons.map((hackathon) => (
            <div
              key={hackathon.id}
              className="bg-[#23232b] border border-[#23232b] rounded-2xl shadow-lg flex flex-col p-4"
            >
              <div className="w-full aspect-[3/2] rounded-xl overflow-hidden mb-2 bg-[#18181e] border border-[#23232b]">
                <img
                  className="w-full h-full object-cover"
                  src={hackathon.poster}
                  alt={hackathon.title}
                />
              </div>
              <h3 className="font-semibold text-white text-lg mb-1">
                {hackathon.title}
              </h3>
              <p className="text-xs text-gray-400 mb-1">
                {formatDateTime(hackathon?.startTime)} -{" "}
                {formatDateTime(hackathon?.endTime)}
              </p>
              <p className="text-xs text-gray-400 mb-2">{hackathon.location}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {hackathon.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-[#18181e] text-[#a3e635] px-2 py-1 rounded-full text-xs border border-[#a3e635]"
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
                      hackathon.status === "upcoming"
                        ? "#fbbf24"
                        : hackathon.status === "ongoing"
                        ? "#a3e635"
                        : hackathon.status === "completed"
                        ? "#f87171"
                        : "#e5e7eb",
                    color:
                      hackathon.status === "upcoming"
                        ? "#92400e"
                        : hackathon.status === "ongoing"
                        ? "#23232b"
                        : hackathon.status === "completed"
                        ? "#7f1d1d"
                        : "#374151",
                  }}
                >
                  {hackathon.status}
                </span>
              </div>
              <Link
                href={`/hackathon/view-all-hackathons/${hackathon.id}`}
                className="mt-3 underline text-[#a3e635] font-semibold"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default AllHackathons;
