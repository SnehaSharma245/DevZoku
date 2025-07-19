"use client";
import { useAuth } from "@/hooks/useAuth";
import api from "@/utils/api";
import { formatDateTime } from "@/utils/formattedDate";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Hackathon } from "@/types/hackathon.types";

function AllHackathons() {
  const { user } = useAuth();

  const [showParticipated, setShowParticipated] = useState(false);
  const [showMine, setShowMine] = useState(false);
  const [fetchedHackathons, setFetchedHackathons] = useState<Hackathon[]>([]);
  const [search, setSearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(""); // e.g. "24", "48"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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
      const res = await api.get(
        `/hackathon/view-all-hackathons${query ? "?" + query : ""}`
      );
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
    if (tagSearch) params.tags = tagSearch;
    if (duration) params.duration = duration;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (status && status !== "all") params.status = status;
    if (mode) params.mode = mode;
    if (showMine && user?.role === "organizer" && user?.id) {
      params.organizerId = user.id;
    }
    if (showParticipated && user?.role === "developer") {
      params.devId = user.id;
    }
    fetchHackathons(params);
  };

  function normalize(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9]/gi, "");
  }

  const filteredHackathons = fetchedHackathons.filter((hackathon) =>
    normalize(hackathon.title).includes(normalize(search))
  );

  return (
    <div>
      {/* Title search (local filter) */}
      <input
        type="text"
        placeholder="Search hackathon by title..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border px-3 py-2 rounded mb-2 w-full"
      />
      {/* Tag search (API filter) */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by tags (comma separated, e.g. ai, web)"
          value={tagSearch}
          onChange={(e) => setTagSearch(e.target.value)}
          className="border px-3 py-2 rounded w-full"
        />
      </div>

      {/* Status filter */}
      <div className="flex gap-4 mb-4 flex-wrap">
        {statusOptions.map((option) => (
          <label key={option} className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={status === option}
              onChange={() => setStatus(status === option ? "all" : option)}
            />
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </label>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        {/* Duration Filter */}
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="">All Durations</option>
          <option value="7">≤ 7 Hours</option>
          <option value="24">≤ 24 Hours</option>
          <option value="48">≤ 48 Hours</option>
          <option value="72">≤ 72 Hours</option>
          <option value="gt72">{">72 Hours"}</option>
        </select>
        {/* Start Date */}
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border px-3 py-2 rounded"
        />
        {/* End Date */}
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border px-3 py-2 rounded"
        />
        {/* Mode Filter */}
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="">All Modes</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      {user?.role === "organizer" && (
        <label className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={showMine}
            onChange={() => setShowMine((v) => !v)}
          />
          Show only hackathons created by me
        </label>
      )}

      {user?.role === "developer" && (
        <label className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={showParticipated}
            onChange={() => setShowParticipated((v) => !v)}
          />
          Show only hackathons I have participated in
        </label>
      )}

      <button
        onClick={handleFilterSearch}
        className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Searching..." : "Apply Filters"}
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
        {filteredHackathons.map((hackathon) => (
          <div
            key={hackathon.id}
            className="border-2 border-pink-400 m-2 p-4 rounded-lg shadow-lg flex flex-col"
          >
            <div>
              <img
                className="h-48 object-fit"
                src={hackathon.poster}
                alt={hackathon.title}
              />
            </div>
            <h3 className="font-semibold">{hackathon.title}</h3>
            <p>
              {formatDateTime(hackathon?.startTime)} -{" "}
              {formatDateTime(hackathon?.endTime)}
            </p>
            <p>{hackathon.location}</p>
            <div>
              {hackathon.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-pink-200 text-pink-800 px-2 py-1 rounded-full text-sm mr-2"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-2">
              <span
                className="inline-block px-2 py-1 rounded text-xs font-semibold"
                style={{
                  background:
                    hackathon.status === "upcoming"
                      ? "#fbbf24"
                      : hackathon.status === "ongoing"
                      ? "#34d399"
                      : hackathon.status === "completed"
                      ? "#f87171"
                      : "#e5e7eb",
                  color:
                    hackathon.status === "upcoming"
                      ? "#92400e"
                      : hackathon.status === "ongoing"
                      ? "#065f46"
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
              className="mt-2 underline text-blue-600"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AllHackathons;
