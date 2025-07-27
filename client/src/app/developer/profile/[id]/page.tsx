"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/utils/api";
import { Button, Card, CardContent } from "@/components";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { set } from "react-hook-form";
import {
  FaGithub,
  FaLinkedin,
  FaGlobe,
  FaTwitter,
  FaDev,
  FaInstagram,
} from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHashnode } from "@fortawesome/free-brands-svg-icons";

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
  const [stats, setStats] = useState<{
    participatedHackathonsCount?: number;
    hackathonsWithPositionCount?: number;
    winnerCount?: number;
    firstRunnerUpCount?: number;
    secondRunnerUpCount?: number;
  }>({});

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        // Fetch developer profile
        const profileRes = await api.get(`/developer/developer-profile/${id}`);

        const { status, data, message } = profileRes.data;
        console.log("Profile data:", data);
        if (status === 200) {
          setProfile(data);
          setHackathons(data.participatedHackathons || []);
          setStats({
            participatedHackathonsCount: data.participatedHackathonsCount,
            hackathonsWithPositionCount: data.hackathonsWithPositionCount,
            winnerCount: data.winnerCount,
            firstRunnerUpCount: data.firstRunnerUpCount,
            secondRunnerUpCount: data.secondRunnerUpCount,
          });
        }
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
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Modern Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-8 bg-gradient-to-r from-[#eaf6fb] to-[#fff] rounded-3xl shadow-lg p-8 mb-8">
          <div className="flex-shrink-0 w-32 h-32 rounded-full bg-[#2563eb] flex items-center justify-center text-white text-4xl font-bold shadow-lg">
            {(user?.firstName && user.firstName.charAt(0)) ||
              (user?.lastName && user.lastName.charAt(0)) ||
              "U"}
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-extrabold text-[#062a47] mb-2">
              {user?.firstName}
            </h2>
            <div className="text-lg text-[#2563eb] font-semibold mb-1">
              {profile?.title || "Developer"}
            </div>
            <div className="text-gray-600 mb-4">{profile?.bio}</div>
            <div className="flex gap-4 flex-wrap mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#f75a2f]">
                  {hackathons.length}
                </span>
                <span className="text-gray-500">Participated Hackathon</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#2563eb]">
                  {profile?.projects?.length || 0}
                </span>
                <span className="text-gray-500">Projects</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#062a47]">
                  {profile?.skills?.length || 0}
                </span>
                <span className="text-gray-500">Skills</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap mt-2">
              {profile?.skills?.map((s) => (
                <Badge
                  key={s}
                  className="bg-[#eaf6fb] text-[#062a47] font-semibold"
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Social Links Section */}
        {profile?.socialLinks &&
          Object.values(profile.socialLinks).some(Boolean) && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Let's Connect</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 flex-wrap items-center">
                  {profile.socialLinks.github && (
                    <a
                      href={profile.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#333] hover:text-[#2563eb] transition"
                    >
                      <FaGithub size={22} />
                      <span className="hidden md:inline">GitHub</span>
                    </a>
                  )}
                  {profile.socialLinks.linkedin && (
                    <a
                      href={profile.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#0077b5] hover:text-[#2563eb] transition"
                    >
                      <FaLinkedin size={22} />
                      <span className="hidden md:inline">LinkedIn</span>
                    </a>
                  )}
                  {profile.socialLinks.portfolio && (
                    <a
                      href={profile.socialLinks.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#2563eb] hover:text-[#062a47] transition"
                    >
                      <FaGlobe size={22} />
                      <span className="hidden md:inline">Portfolio</span>
                    </a>
                  )}
                  {profile.socialLinks.twitter && (
                    <a
                      href={profile.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#1da1f2] hover:text-[#2563eb] transition"
                    >
                      <FaTwitter size={22} />
                      <span className="hidden md:inline">Twitter</span>
                    </a>
                  )}
                  {profile.socialLinks.hashnode && (
                    <a
                      href={profile.socialLinks.hashnode}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#2962ff] hover:text-[#2563eb] transition"
                    >
                      <FontAwesomeIcon icon={faHashnode} size="lg" />
                      <span className="hidden md:inline">Hashnode</span>
                    </a>
                  )}
                  {profile.socialLinks.devto && (
                    <a
                      href={profile.socialLinks.devto}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#0a0a0a] hover:text-[#2563eb] transition"
                    >
                      <FaDev size={22} />
                      <span className="hidden md:inline">Dev.to</span>
                    </a>
                  )}
                  {profile.socialLinks.instagram && (
                    <a
                      href={profile.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#e1306c] hover:text-[#2563eb] transition"
                    >
                      <FaInstagram size={22} />
                      <span className="hidden md:inline">Instagram</span>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        {/* Experience & Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 flex flex-col items-center">
            <span className="text-lg font-semibold text-[#2563eb]">
              Hackathons Participated
            </span>
            <span className="text-4xl font-bold mt-2">
              {stats.participatedHackathonsCount ?? hackathons.length}
            </span>
          </Card>
          <Card className="p-6 flex flex-col items-center">
            <span className="text-lg font-semibold text-[#f75a2f]">
              Hackathons with Position
            </span>
            <span className="text-4xl font-bold mt-2">
              {stats.hackathonsWithPositionCount ?? 0}
            </span>
            <div className="flex gap-2 mt-2 text-sm">
              <span className="text-green-700">
                🏆 {stats.winnerCount ?? 0}
              </span>
              <span className="text-orange-600">
                🥈 {stats.firstRunnerUpCount ?? 0}
              </span>
              <span className="text-blue-700">
                🥉 {stats.secondRunnerUpCount ?? 0}
              </span>
            </div>
          </Card>
          <Card className="p-6 flex flex-col items-center">
            <span className="text-lg font-semibold text-[#f75a2f]">
              Projects
            </span>
            <span className="text-4xl font-bold mt-2">
              {profile?.projects?.length || 0}
            </span>
          </Card>
          <Card className="p-6 flex flex-col items-center">
            <span className="text-lg font-semibold text-[#062a47]">Skills</span>
            <span className="text-4xl font-bold mt-2">
              {profile?.skills?.length || 0}
            </span>
          </Card>
        </div>

        {/* Projects Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.projects && profile.projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.projects.map((project, idx) => (
                  <div
                    key={idx}
                    className="border rounded p-4 flex flex-col gap-2 bg-[#f3f4f6]"
                  >
                    <div className="font-semibold text-lg text-[#062a47]">
                      {project.title}
                    </div>
                    <div className="text-sm text-gray-600">
                      {project.description}
                    </div>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {project.techStack.map((tech) => (
                        <Badge key={tech} className="bg-[#2563eb] text-white">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {project.repoUrl && (
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline text-sm"
                        >
                          Repo
                        </a>
                      )}
                      {project.demoUrl && (
                        <a
                          href={project.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 underline text-sm"
                        >
                          Demo
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">No projects added yet.</div>
            )}
          </CardContent>
        </Card>

        {/* Hackathon Domains/Tags Section */}
        {hackathons && hackathons.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Hackathon Domains</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {[
                  ...new Set(
                    hackathons.flatMap((h: any) => h.tags || []).filter(Boolean)
                  ),
                ].map((tag: string) => (
                  <Badge
                    key={tag}
                    className="bg-[#eaf6fb] text-[#2563eb] font-semibold"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

export default DeveloperDashboard;
