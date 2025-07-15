"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/utils/api";
import { Button, Card, CardContent } from "@/components";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Popup } from "@/components/CompleteProfilePopup";

interface Project {
  title: string;
  description: string;
  techStack: string[];
  repoUrl?: string;
  demoUrl?: string;
}

interface SocialLinks {
  github?: string;
  linkedin?: string;
  portfolio?: string;
  twitter?: string;
  hashnode?: string;
  devto?: string;
  instagram?: string;
}

interface Location {
  city?: string;
  state?: string;
  country?: string;
}

interface DeveloperProfile {
  title?: string;
  bio?: string;
  skills?: string[];
  isAvailable?: boolean;
  location?: Location;
  socialLinks?: SocialLinks;
  projects?: Project[];
}

interface Hackathon {
  id: string;
  title: string;
  status: string;
  startTime?: string;
  endTime?: string;
}

function DeveloperDashboard() {
  const { user, handleLogout } = useAuth();
  const userProfile = user?.profile;

  const [showIncompleteModal, setShowIncompleteModal] = useState(false);

  useEffect(() => {
    if (user && user.isProfileComplete === false) {
      setShowIncompleteModal(true); // ✨ show popup automatically
    }
  }, [user]);

  if (!user) {
    window.location.href = "/auth/login";
    return null; // Prevent rendering if user is not authenticated
  }

  if (user?.role !== "developer") {
    window.location.href = "/auth/login";
    return null; // Prevent rendering if user is not a developer
  }
  const router = useRouter();
  const { id } = useParams();

  const [profile, setProfile] = useState<DeveloperProfile | null>(null);

  const [hackathons, setHackathons] = useState<Hackathon[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        // Fetch developer profile
        const profileRes = await api.get(`/developer/developer-profile/${id}`);

        setProfile(profileRes.data.data);

        // Fetch hackathons (registered or participated)
        // const hackRes = await api.get(`/developer/hackathons`);
        // setHackathons(hackRes.data.data || []);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Failed to fetch data");
      }
    };
    fetchData();
  }, [user, id]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Please login to view your dashboard.
      </div>
    );
  }

  return (
    <>
      <Popup open={showIncompleteModal} onOpenChange={setShowIncompleteModal} />
      <div className="max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Developer Dashboard
        </h1>

        {/* Profile Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-2">
                <div>
                  <span className="font-semibold">Title:</span>{" "}
                  {profile?.title || (
                    <span className="text-gray-400">Not set</span>
                  )}
                </div>
                <div>
                  <span className="font-semibold">Bio:</span>{" "}
                  {profile?.bio || (
                    <span className="text-gray-400">Not set</span>
                  )}
                </div>
                <div>
                  <span className="font-semibold">Skills:</span>{" "}
                  {profile?.skills && profile.skills.length > 0 ? (
                    profile.skills.map((s) => (
                      <Badge key={s} className="mr-1">
                        {s}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-400">Not set</span>
                  )}
                </div>
                <div>
                  <span className="font-semibold">Available for Projects:</span>{" "}
                  {profile?.isAvailable ? (
                    <span className="text-green-600 font-semibold">Yes</span>
                  ) : (
                    <span className="text-gray-500">No</span>
                  )}
                </div>
                <div>
                  <span className="font-semibold">Location:</span>{" "}
                  {profile?.location ? (
                    [
                      profile.location.city,
                      profile.location.state,
                      profile.location.country,
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
                  <span className="font-semibold">Social Links:</span>{" "}
                  {profile?.socialLinks &&
                  Object.values(profile.socialLinks).some((v) => v) ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Object.entries(profile.socialLinks)
                        .filter(([_, v]) => v)
                        .map(([key, value]) => (
                          <a
                            key={key}
                            href={value as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline text-sm"
                          >
                            {key}
                          </a>
                        ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">Not set</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hackathons Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your Hackathons</CardTitle>
          </CardHeader>
          <CardContent>
            {hackathons.length === 0 ? (
              <div className="text-gray-500">
                You have not participated in any hackathons yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hackathons.map((hack) => (
                  <div
                    key={hack.id}
                    className="border rounded p-4 flex flex-col gap-2"
                  >
                    <div className="font-semibold text-lg">{hack.title}</div>
                    <div className="text-xs text-gray-500">
                      Status:{" "}
                      <span
                        className={
                          hack.status === "completed"
                            ? "text-gray-600"
                            : hack.status === "ongoing"
                            ? "text-green-600"
                            : "text-blue-600"
                        }
                      >
                        {hack.status.charAt(0).toUpperCase() +
                          hack.status.slice(1)}
                      </span>
                    </div>
                    {hack.startTime && hack.endTime && (
                      <div className="text-xs text-gray-500">
                        {new Date(hack.startTime).toLocaleString()} -{" "}
                        {new Date(hack.endTime).toLocaleString()}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        router.push(`/view-all-hackathons/${hack.id}`)
                      }
                    >
                      View Hackathon
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default DeveloperDashboard;
