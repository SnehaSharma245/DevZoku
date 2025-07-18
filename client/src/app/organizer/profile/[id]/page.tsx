"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/utils/api";
import { Button, Card, CardContent } from "@/components";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Popup } from "@/components/CompleteProfilePopup";

interface OrganizerProfile {
  id: string;
  userId: string;
  organizationName: string;
  companyEmail: string;
  phoneNumber: string;
  website: string;
  bio: string;
  isProfileComplete: boolean;
  isVerified: boolean;
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
  const [loading, setLoading] = useState(true);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);

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
          setProfile(data);
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

  if (!user) {
    window.location.href = "/auth/login";
    return null;
  }

  if (user?.role !== "organizer") {
    window.location.href = "/auth/login";
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
    <>
      <Popup open={showIncompleteModal} onOpenChange={setShowIncompleteModal} />
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Organizer Profile
        </h1>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div>
                <span className="font-semibold">Organization Name:</span>{" "}
                {profile?.organizationName || (
                  <span className="text-gray-400">Not set</span>
                )}
              </div>
              <div>
                <span className="font-semibold">Company Email:</span>{" "}
                {profile?.companyEmail || (
                  <span className="text-gray-400">Not set</span>
                )}
              </div>
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
                    className="text-blue-600 underline"
                  >
                    {profile.website}
                  </a>
                ) : (
                  <span className="text-gray-400">Not set</span>
                )}
              </div>
              <div>
                <span className="font-semibold">Bio:</span>{" "}
                {profile?.bio || <span className="text-gray-400">Not set</span>}
              </div>
              <div>
                <span className="font-semibold">Location:</span>{" "}
                {profile?.location ? (
                  [
                    profile.location.city,
                    profile.location.state,
                    profile.location.country,
                    profile.location.address,
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
              <div>
                <span className="font-semibold">Total Events Organized:</span>{" "}
                {profile?.totalEventsOrganized ?? (
                  <span className="text-gray-400">Not set</span>
                )}
              </div>
              <div>
                <span className="font-semibold">Profile Status:</span>{" "}
                {profile?.isProfileComplete ? (
                  <span className="text-green-600 font-semibold">Complete</span>
                ) : (
                  <span className="text-red-500 font-semibold">Incomplete</span>
                )}
              </div>
              <div>
                <span className="font-semibold">Verified:</span>{" "}
                {profile?.isVerified ? (
                  <span className="text-green-600 font-semibold">Yes</span>
                ) : (
                  <span className="text-gray-500">No</span>
                )}
              </div>
              <div>
                <span className="font-semibold">Created At:</span>{" "}
                {profile?.createdAt ? (
                  new Date(profile.createdAt).toLocaleString()
                ) : (
                  <span className="text-gray-400">Not set</span>
                )}
              </div>
              <div>
                <span className="font-semibold">Updated At:</span>{" "}
                {profile?.updatedAt ? (
                  new Date(profile.updatedAt).toLocaleString()
                ) : (
                  <span className="text-gray-400">Not set</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
