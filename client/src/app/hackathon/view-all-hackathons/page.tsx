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
  // Track which hackathon type is currently shown
  const [hackathonType, setHackathonType] = useState<
    "all" | "organized" | "joined"
  >("all");
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const statusOptions = [
    "all",
    "upcoming",
    "Registration in Progress",
    "Registration ended",
    "ongoing",
    "completed",
  ] as const;

  type StatusType = (typeof statusOptions)[number];

  const [status, setStatus] = useState<StatusType>("all");
  const [mode, setMode] = useState("");

  // 1. Page load par sab fetch karo
  useEffect(() => {
    fetchHackathons();
    setHackathonType("all");
  }, []);

  // Main API call, pass organizerId or showParticipated if needed
  const fetchHackathons = async (params: any = {}) => {
    setLoading(true);
    try {
      const query = new URLSearchParams(params).toString();
      let endpoint = "/hackathon/view-all-hackathons";
      if (user) {
        endpoint = "/hackathon/view-all-hackathons-auth";
      }
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

  // Tag search/filter par fetch karo, respect hackathonType
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
    if (
      hackathonType === "organized" &&
      user?.role === "organizer" &&
      user?.id
    ) {
      params.organizerId = user.id;
    }
    if (hackathonType === "joined" && user?.role === "developer" && user?.id) {
      params.showParticipated = true;
    }
    await fetchHackathons(params);
  };

  // Toggle between all and organized hackathons (organizer)
  const handleToggleHackathonTypeOrganizer = async () => {
    if (hackathonType === "all") {
      setHackathonType("organized");
      await fetchHackathons({ organizerId: user?.id });
    } else {
      setHackathonType("all");
      await fetchHackathons();
    }
  };

  // Toggle between all and joined hackathons (developer)
  const handleToggleHackathonTypeDeveloper = async () => {
    if (hackathonType === "all") {
      setHackathonType("joined");
      await fetchHackathons({ showParticipated: true });
    } else {
      setHackathonType("all");
      await fetchHackathons();
    }
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

  // Filters content for reuse
  const FiltersContent = (
    <div className="bg-gradient-to-br from-white via-white to-[#fff9f5] border border-[#fff9f5] rounded-2xl shadow-xl p-6 flex flex-col gap-6 h-full overflow-y-auto">
      {/* Organizer-only toggle button */}
      {user?.role === "organizer" && (
        <button
          onClick={handleToggleHackathonTypeOrganizer}
          className="w-full bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white font-bold rounded-xl hover:opacity-90 transition py-2 mb-2 shadow"
          disabled={loading}
        >
          {loading
            ? "Loading..."
            : hackathonType === "all"
            ? "Show Organized Hackathons"
            : "Show All Hackathons"}
        </button>
      )}
      {/* Developer-only toggle button */}
      {user?.role === "developer" && (
        <button
          onClick={handleToggleHackathonTypeDeveloper}
          className="w-full bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white font-bold rounded-xl hover:opacity-90 transition py-2 mb-2 shadow"
          disabled={loading}
        >
          {loading
            ? "Loading..."
            : hackathonType === "all"
            ? "Show Joined Hackathons"
            : "Show All Hackathons"}
        </button>
      )}
      {/* Apply Filters button for all */}
      <button
        onClick={handleFilterSearch}
        className="w-full bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white font-bold rounded-xl hover:opacity-90 transition py-2 mb-2 shadow"
        disabled={loading}
      >
        {loading ? "Searching..." : "Apply Filters"}
      </button>
      {/* Tag input as dropdown */}
      <div className="relative">
        <label className="block text-[#062a47] font-semibold mb-1">Tags</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, idx) => (
            <span
              key={tag + idx}
              className="flex items-center bg-gradient-to-r from-[#fff9f5] to-[#fff9f5] text-[#FF6F61] px-3 py-1 rounded-full text-sm border border-[#FF9466] shadow"
            >
              {tag}
              <button
                type="button"
                className="ml-2 text-[#FF6F61] hover:text-red-400"
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
          className="flex items-center gap-2 bg-gradient-to-r from-[#fff9f5] to-[#fff9f5] text-[#062a47] border border-[#FF9466] rounded-xl px-3 py-2 hover:bg-[#FF9466]/10 transition shadow"
          onClick={() => setTagDropdownOpen((v) => !v)}
        >
          <ChevronDown className="w-4 h-4" />
          {tags.length === 0 ? "Select tags" : "Add more tags"}
        </button>
        {tagDropdownOpen && (
          <div className="absolute z-20 mt-2 w-full max-h-72 overflow-y-auto bg-gradient-to-br from-white via-white to-[#fff9f5] border border-[#FF9466] rounded-xl shadow-xl p-2">
            {tagSections.map((section, idx) => (
              <div key={section.label}>
                <div className="text-xs font-bold text-[#FF9466] px-2 py-1">
                  {section.label}
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {section.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        tags.includes(tag)
                          ? "bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white border-[#FF9466] cursor-not-allowed"
                          : "bg-gradient-to-r from-[#fff9f5] to-[#fff9f5] text-[#062a47] border-[#fff9f5] hover:border-[#FF9466] hover:bg-[#FF9466]/10"
                      }`}
                      disabled={tags.includes(tag)}
                      onClick={() => handleSelectTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {idx !== tagSections.length - 1 && (
                  <Separator className="my-2 bg-[#fff9f5]" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Status filter */}
      <div>
        <label className="block text-[#062a47] font-semibold mb-1">
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                status === option
                  ? "bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white border-[#FF9466]"
                  : "bg-gradient-to-r from-[#fff9f5] to-[#fff9f5] text-[#062a47] border-[#fff9f5] hover:border-[#FF9466]"
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
          <label className="block text-[#062a47] font-semibold mb-1">
            Duration
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full bg-gradient-to-r from-[#fff9f5] to-[#fff9f5] text-[#062a47] border-none rounded-xl focus:ring-2 focus:ring-[#FF9466] px-3 py-2"
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
          <label className="block text-[#062a47] font-semibold mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-gradient-to-r from-[#fff9f5] to-[#fff9f5] text-[#062a47] border-none rounded-xl focus:ring-2 focus:ring-[#FF9466] px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-[#062a47] font-semibold mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-gradient-to-r from-[#fff9f5] to-[#fff9f5] text-[#062a47] border-none rounded-xl focus:ring-2 focus:ring-[#FF9466] px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-[#062a47] font-semibold mb-1">
            Mode
          </label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full bg-gradient-to-r from-[#fff9f5] to-[#fff9f5] text-[#062a47] border-none rounded-xl focus:ring-2 focus:ring-[#FF9466] px-3 py-2"
          >
            <option value="">All Modes</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {user?.role === "developer" && (
        <label className="flex items-center gap-2 text-[#062a47] mt-2">
          <input
            type="checkbox"
            checked={showParticipated}
            onChange={() => setShowParticipated((v) => !v)}
            className="accent-[#FF9466]"
          />
          Show only hackathons I have participated in
        </label>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row gap-8 px-2 py-8 ">
      {/* Filters Sidebar (desktop only) */}
      <aside className="hidden md:block w-full md:w-80 mb-8 md:mb-0 md:mr-8">
        {FiltersContent}
      </aside>
      {/* Mobile Filters Button */}
      <div className="md:hidden mb-4 flex justify-end">
        <button
          onClick={() => setShowFiltersMobile(true)}
          className="bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white font-bold rounded-xl px-4 py-2 shadow"
        >
          Filters
        </button>
      </div>
      {/* Mobile Filters Modal (centered dialog) */}
      {showFiltersMobile && (
        <>
          {/* Centered Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xl">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 flex flex-col ">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h2 className="text-lg font-bold text-[#062a47]">Filters</h2>
                <button
                  onClick={() => setShowFiltersMobile(false)}
                  className="text-[#FF6F61] font-bold"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[80vh]">
                {FiltersContent}
              </div>
            </div>
          </div>
        </>
      )}
      {/* Main Content */}
      <main className="flex-1">
        {/* Recommended Hackathons Carousel */}
        {user?.role === "developer" && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#062a47] mb-4">
              Recommended Hackathons
            </h2>
            <div className="relative">
              <Carousel opts={{ loop: true }}>
                <CarouselContent>
                  {recommendedHackathons.length === 0 ? (
                    <CarouselItem>
                      <div className="text-[#6B7A8F] text-center py-8 bg-gradient-to-br from-white via-white to-[#fff9f5] rounded-xl border border-[#fff9f5] shadow">
                        No recommended hackathons found.
                      </div>
                    </CarouselItem>
                  ) : (
                    recommendedHackathons.map((hackathon) => (
                      <CarouselItem
                        key={hackathon.id}
                        className="md:basis-1/2 lg:basis-1/3 px-2"
                      >
                        <div className="bg-gradient-to-r from-[#fff9f5] to-[#fff9f5] border border-[#fff9f5] rounded-2xl shadow-lg flex flex-row items-center justify-center p-4 h-full gap-4 w-full">
                          {/* Image Left */}
                          <div className="w-24 h-16 rounded-lg overflow-hidden bg-[#fff9f5] border border-[#fff9f5] flex-shrink-0 flex items-center justify-center">
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
                              <h3 className="font-semibold text-[#062a47] text-lg mb-1 truncate w-full hover:underline">
                                {hackathon.title}
                              </h3>
                            </Link>
                            <p className="text-xs text-[#6B7A8F] mb-1 truncate w-full">
                              {formatDateTime(hackathon?.startTime)} -{" "}
                              {formatDateTime(hackathon?.endTime)}
                            </p>
                            <p className="text-xs text-[#6B7A8F] mb-2 truncate w-full">
                              {hackathon.location}
                            </p>
                            <div className="mt-auto flex items-center gap-2 justify-center w-full">
                              <span
                                className="inline-block px-2 py-1 rounded text-xs font-semibold"
                                style={{
                                  background:
                                    hackathon.status === "upcoming"
                                      ? "#FF9466"
                                      : hackathon.status === "ongoing"
                                      ? "#FF6F61"
                                      : hackathon.status === "completed"
                                      ? "#6B7A8F"
                                      : "#fff9f5",
                                  color:
                                    hackathon.status === "upcoming"
                                      ? "#fff"
                                      : hackathon.status === "ongoing"
                                      ? "#fff"
                                      : hackathon.status === "completed"
                                      ? "#fff"
                                      : "#062a47",
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
          className="bg-gradient-to-r from-[#fff9f5] to-[#fff9f5] text-[#062a47] border-none rounded-xl focus:ring-2 focus:ring-[#FF9466] placeholder:text-[#6B7A8F] px-3 py-2 mb-4 w-full shadow"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredHackathons.length !== 0 ? (
            filteredHackathons.map((hackathon) => (
              <div
                key={hackathon.id}
                className="bg-gradient-to-r from-[#fff9f5] to-[#fff9f5] border border-[#fff9f5] rounded-2xl shadow-lg flex flex-col p-4"
              >
                <div className="w-full aspect-[3/2] rounded-xl overflow-hidden mb-2 bg-[#fff9f5] border border-[#fff9f5]">
                  <img
                    className="w-full h-full object-cover"
                    src={hackathon.poster}
                    alt={hackathon.title}
                  />
                </div>
                <h3 className="font-semibold text-[#062a47] text-lg mb-1">
                  {hackathon.title}
                </h3>
                <p className="text-xs text-[#6B7A8F] mb-1">
                  {formatDateTime(hackathon?.startTime)} -{" "}
                  {formatDateTime(hackathon?.endTime)}
                </p>
                <p className="text-xs text-[#6B7A8F] mb-2">
                  {hackathon.location}
                </p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {hackathon.tags.map((tag) => (
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
                        hackathon.status === "upcoming"
                          ? "#FFE2D1"
                          : hackathon.status === "ongoing"
                          ? "#FFC7A6"
                          : hackathon.status === "completed"
                          ? "#FFA883"
                          : hackathon.status === "Registration in Progress"
                          ? "#FFD5BB"
                          : hackathon.status === "Registration ended"
                          ? "#FFBA94"
                          : "#E6B89C",
                      color: "#062a47",
                    }}
                  >
                    {hackathon.status}
                  </span>
                </div>
                <Link
                  href={`/hackathon/view-all-hackathons/${hackathon.id}`}
                  className="mt-3 underline text-[#FF6F61] font-semibold"
                >
                  View Details
                </Link>
              </div>
            ))
          ) : (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 flex flex-col items-center justify-center py-12 bg-gradient-to-br from-white via-white to-[#fff9f5] rounded-xl border border-[#fff9f5] shadow-lg">
              <h3 className="text-xl font-semibold text-[#FF6F61] mb-2 p-3">
                No Results Found
              </h3>

              <p className="text-[#6B7A8F] text-sm p-3">
                Try adjusting your filters or search terms.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AllHackathons;
