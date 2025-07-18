"use client";
import { useAuth } from "@/hooks/useAuth";
import api from "@/utils/api";
import { formatDateTime } from "@/utils/formattedDate";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";

export interface Hackathon {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  tags: string[];
  poster: string;
  status: "upcoming" | "ongoing" | "completed";
}

function AllHackathons() {
  const { user } = useAuth();

  const [fetchedHackathons, setFetchedHackathons] = useState<Hackathon[]>([]);
  const [search, setSearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(""); // e.g. "24", "48"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<"upcoming" | "ongoing" | "all" | "">(
    "all"
  );
  const [mode, setMode] = useState(""); // e.g. "online", "offline"

  // 1. Page load par sab fetch karo (sirf ek baar)
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const res = await api.get("/hackathon/view-all-hackathons");

        const { status, data, message } = res.data;

        if (status === 200) {
          setFetchedHackathons(data);
        } else {
          toast.error(message || "Failed to fetch hackathons");
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
    fetchAll();
  }, []);

  // 2. Tag search par sirf button click par fetch karo
  const handleTagSearch = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (tagSearch) params.tags = tagSearch;
      if (duration) params.duration = duration;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      // Only send status if not "all"
      if (status && status !== "all") params.status = status;
      if (mode) params.mode = mode; // Add mode to params if it's set
      const query = new URLSearchParams(params).toString();
      const res = await api.get(
        `/hackathon/view-all-hackathons${query ? "?" + query : ""}`
      );
      setFetchedHackathons(res.data.data);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch hackathons"
      );
      setFetchedHackathons([]);
    } finally {
      setLoading(false);
    }
  };

  function normalize(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9]/gi, "");
  }

  // Local filter for title
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
        <button
          onClick={handleTagSearch}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* checkbox for status check for upcoming and ongoing hackathons */}
      <div className="flex gap-4 mb-4">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={status === "upcoming"}
            onChange={() =>
              setStatus(status === "upcoming" ? "all" : "upcoming")
            }
          />
          Upcoming
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={status === "ongoing"}
            onChange={() => setStatus(status === "ongoing" ? "all" : "ongoing")}
          />
          Ongoing
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={status === "all"}
            onChange={() => setStatus("all")}
          />
          All
        </label>
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
      {filteredHackathons.length === 0 && (
        <div className="text-gray-500">No hackathons found.</div>
      )}
      {filteredHackathons.map((hackathon) => (
        <div
          key={hackathon.id}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4"
        >
          <div className=" border-2 border-pink-400 m-2 p-4 rounded-lg shadow-lg">
            <div>
              <img
                className="  h-48 object-fit"
                src={hackathon.poster}
                alt={hackathon.title}
              />
            </div>
            <h3 className="font-semibold">{hackathon.title}</h3>
            <p>
              {formatDateTime(hackathon.startTime)} -{" "}
              {formatDateTime(hackathon.endTime)}
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
            <Link href={`/hackathon/view-all-hackathons/${hackathon.id}`}>
              View Details
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AllHackathons;
