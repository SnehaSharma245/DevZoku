"use client";
import React, { useEffect, useState } from "react";
import { withAuth } from "@/utils/withAuth";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Popup } from "@/components/CompleteProfilePopup";

const OrganizerDashboard = () => {
  const { user, handleLogout } = useAuth();
  const profile = user?.profile;
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

  if (user?.role !== "organizer") {
    window.location.href = "/auth/login";
    return null; // Prevent rendering if user is not an organizer
  }

  return (
    <>
      <Popup open={showIncompleteModal} onOpenChange={setShowIncompleteModal} />
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">🏢 Organization Profile</h1>

          <div className="mb-6 space-y-1">
            {profile &&
              "organizationName" in profile &&
              profile?.organizationName && (
                <p className="text-lg font-semibold">
                  {profile.organizationName}
                </p>
              )}

            <p className="text-gray-600">Personal Email: {user.email}</p>
            {profile && "companyEmail" in profile && profile?.companyEmail && (
              <p className="text-gray-600">
                Company Email: {profile.companyEmail}
              </p>
            )}
            {profile?.bio && (
              <p className="text-gray-600">Bio: {profile.bio}</p>
            )}
          </div>

          {/* Contact Info */}
          {profile &&
            (("companyEmail" in profile && profile.companyEmail?.trim()) ||
              ("phoneNumber" in profile && profile.phoneNumber?.trim()) ||
              ("website" in profile && profile.website?.trim())) && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">📞 Contact Info:</h3>
                <ul className="list-disc list-inside">
                  {profile?.companyEmail && (
                    <li className="text-gray-700">{profile.companyEmail}</li>
                  )}
                  {profile?.phoneNumber && (
                    <li className="text-gray-700">{profile.phoneNumber}</li>
                  )}
                  {profile?.website && (
                    <li className="text-gray-700">
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        {profile.website}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}

          {/* Social Links */}
          {profile?.socialLinks &&
            Object.values(profile.socialLinks).some((val) => val?.trim()) && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">🌐 Social Links:</h3>
                <ul className="list-disc list-inside text-blue-600">
                  {Object.entries(profile.socialLinks).map(
                    ([platform, url]) =>
                      url && (
                        <li key={platform}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {platform.charAt(0).toUpperCase() +
                              platform.slice(1)}
                          </a>
                        </li>
                      )
                  )}
                </ul>
              </div>
            )}

          {/* Location */}
          {profile?.location &&
            Object.values(profile?.location).some((val) => val?.trim()) && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">📍 Location:</h3>
                <p className="text-gray-700">
                  {profile?.location &&
                    [
                      profile.location.country?.trim(),
                      profile.location.state?.trim(),
                      profile.location.city?.trim(),
                      // Address add only if it exists (Organizer profile)
                      "address" in profile.location &&
                        profile.location.address?.trim(),
                    ]
                      .filter(Boolean)
                      .join(", ")}
                </p>
              </div>
            )}

          {/* Events Stats */}
          {profile &&
            "totalEventsOrganized" in profile &&
            profile.totalEventsOrganized !== undefined && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">🎟️ Events:</h3>
                <p className="text-gray-700">
                  Total Events Organized: {profile.totalEventsOrganized || 0}
                </p>
              </div>
            )}

          <div className="flex gap-4 mt-6">
            <Link
              href="/organizer/complete-profile"
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-center"
            >
              Edit Profile
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// 🔐 Wrap with HOC
export default withAuth(OrganizerDashboard, "organizer");
