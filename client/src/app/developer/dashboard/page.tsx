"use client";
import React, { useEffect, useState } from "react";
import { withAuth } from "@/utils/withAuth";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

import { useRouter } from "next/navigation";
import { Popup } from "@/components/completeProfilePopup";

const DeveloperProfile = () => {
  const { user, handleLogout } = useAuth();
  const profile = user?.profile;
  const router = useRouter();
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

  return (
    <>
      <Popup open={showIncompleteModal} onOpenChange={setShowIncompleteModal} />
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">👩‍💻 Developer Profile</h1>

          <div className="mb-6 space-y-1">
            <p className="text-lg font-semibold">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-gray-600">Email: {user.email}</p>
            {user.profile.title && (
              <p className="text-gray-600">Title: {user.profile.title}</p>
            )}
            {profile?.bio && (
              <p className="text-gray-600">Bio: {profile?.bio}</p>
            )}
          </div>

          {/* Skills */}
          {profile &&
            "skills" in profile &&
            profile.skills &&
            profile.skills.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">🛠️ Skills:</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
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

          {/* Projects */}
          {profile &&
            "projects" in profile &&
            Array.isArray(profile?.projects) &&
            profile.projects.some(
              (project) =>
                project.title?.trim() ||
                project.description?.trim() ||
                (Array.isArray(project.techStack) &&
                  project.techStack.length > 0) ||
                project.repoUrl?.trim() ||
                project.demoUrl?.trim()
            ) && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">🚀 Projects:</h3>
                <div className="space-y-4">
                  {profile?.projects.map((project, idx) => (
                    <div key={idx} className="border p-4 rounded shadow-sm">
                      <h4 className="font-bold">{project.title}</h4>
                      <p className="text-sm text-gray-700">
                        {project.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {project.techStack.map((tech, i) => (
                          <span
                            key={i}
                            className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 space-x-4">
                        {project.repoUrl && (
                          <a
                            href={project.repoUrl}
                            target="_blank"
                            className="text-blue-500 underline"
                          >
                            Repo
                          </a>
                        )}
                        {project.demoUrl && (
                          <a
                            href={project.demoUrl}
                            target="_blank"
                            className="text-blue-500 underline"
                          >
                            Demo
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Location */}
          {profile?.location &&
            Object.values(profile?.location).some((val) => val?.trim()) && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">📍 Location:</h3>
                <p className="text-gray-700">
                  {profile.location.city}, {profile.location.state},{" "}
                  {profile.location.country}
                </p>
              </div>
            )}

          <button
            onClick={handleLogout}
            className="mt-6 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
      <Link href={"/developer/complete-profile"}>Complete Profile</Link>
    </>
  );
};

// 🔐 Wrap with HOC
export default withAuth(DeveloperProfile, "developer");
