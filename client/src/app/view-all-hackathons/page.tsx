"use client";
import { useAuth } from "@/hooks/useAuth";
import api from "@/utils/api";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";

export interface Hackathon {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  tags: string[];
}

function AllHackathons() {
  const { user } = useAuth();
  const [fetchedHackathons, setFetchedHackathons] = useState<Hackathon[]>([]);
  const [search, setSearch] = useState("");

  const fetchHackathons = async () => {
    try {
      const res = await api.get("/users/view-all-hackathons");
      setFetchedHackathons(res.data.data);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch hackathons"
      );
      console.error("Error fetching hackathons:", error);
    }
  };

  useEffect(() => {
    fetchHackathons();
  }, []);

  if (fetchedHackathons.length === 0) {
    return <div className="text-gray-500">No Hackathon found</div>;
  }

  function normalize(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9]/gi, "");
  }

  const filteredHackathons = fetchedHackathons.filter((hackathon) =>
    normalize(hackathon.title).includes(normalize(search))
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Search hackathon by title..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border px-3 py-2 rounded mb-4 w-full"
      />
      {filteredHackathons.length === 0 && (
        <div className="text-gray-500">No hackathons found.</div>
      )}
      {filteredHackathons.map((hackathon) => (
        <div key={hackathon.id}>{hackathon.title}</div>
      ))}
    </div>
  );
}

export default AllHackathons;
