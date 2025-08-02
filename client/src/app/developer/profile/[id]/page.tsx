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
  FaDev,
  FaInstagram,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

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
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
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
    const fetchData = async () => {
      try {
        // Fetch developer profile
        const profileRes = await api.get(`/developer/developer-profile/${id}`);

        const { status, data, message } = profileRes.data;

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
  }, [id]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 mt-4">
      <div className="max-w-3xl w-full mx-auto">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-white via-white to-[#fff9f5] rounded-3xl shadow-2xl border border-[#e3e8ee] p-8 mb-10 flex flex-col items-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#FF9466] to-[#FF6F61] flex items-center justify-center text-white text-5xl font-extrabold shadow-xl border-4 border-white mb-4 ">
            {(profile?.user?.firstName && profile.user.firstName.charAt(0)) ||
              (profile?.user?.lastName && profile.user.lastName.charAt(0)) ||
              "U"}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#062a47] mb-2 text-center">
            {profile?.user?.firstName || "Developer"}
          </h2>
          <div className="text-xl text-[#062a47] font-semibold mb-1 text-center">
            {profile?.title || "Developer"}
          </div>
          <div className="text-[#6B7A8F] mb-4 italic text-center">
            {profile?.bio}
          </div>
          <div className="flex gap-6 flex-wrap justify-center mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#f75a2f] text-xl">
                {hackathons.length}
              </span>
              <span className="text-[#6B7A8F]">Hackathons</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#f75a2f] text-xl">
                {profile?.projects?.length || 0}
              </span>
              <span className="text-[#6B7A8F]">Projects</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#f75a2f] text-xl">
                {profile?.skills?.length || 0}
              </span>
              <span className="text-[#6B7A8F]">Skills</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap justify-center mt-2">
            {profile?.skills?.map((s) => (
              <Badge
                key={s}
                className="bg-gradient-to-r from-[#FFB899] to-[#FF6F61] text-white font-semibold shadow
"
              >
                {s}
              </Badge>
            ))}
          </div>
        </div>

        {/* Social Links Section */}
        {profile?.socialLinks &&
          Object.values(profile.socialLinks).some(Boolean) && (
            <Card className="mb-10 rounded-2xl shadow-lg border border-[#eaf6fb] bg-gradient-to-br from-white via-white to-[#fff9f5]">
              <CardHeader>
                <CardTitle className="text-[#062a47] font-bold text-xl text-center">
                  Let's Connect
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6 flex-wrap justify-center items-center">
                  {profile.socialLinks.github && (
                    <a
                      href={profile.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#062a47ea] hover:text-[#f75a2f] transition"
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
                      className="flex items-center gap-2 text-[#062a47ea] hover:text-[#f75a2f] transition"
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
                      className="flex items-center gap-2 text-[#062a47ea] hover:text-[#f75a2f] transition"
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
                      className="flex items-center gap-2 text-[#062a47ea] hover:text-[#f75a2f] transition"
                    >
                      <FaXTwitter size={22} />
                      <span className="hidden md:inline">Twitter</span>
                    </a>
                  )}
                  {profile.socialLinks.hashnode && (
                    <a
                      href={profile.socialLinks.hashnode}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#062a47ea] hover:text-[#f75a2f] transition"
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
                      className="flex items-center gap-2 text-[#062a47ea] hover:text-[#f75a2f] transition"
                    >
                      <FaDev size={22} />
                      <span className="hidden md:inline">Dev.to</span>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        {/* Experience & Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <Card className="p-8 flex flex-col items-center rounded-xl shadow-md border border-[#eaf6fb] bg-gradient-to-br from-white via-white to-[#fff9f5]">
            <span className="text-lg font-semibold text-[#062a47]">
              Hackathons Participated
            </span>
            <span className="text-4xl font-bold mt-2 text-[#f75a2f] drop-shadow">
              {stats.participatedHackathonsCount ?? hackathons.length}
            </span>
          </Card>
          <Card className="p-8 flex flex-col items-center rounded-xl shadow-md border border-[#eaf6fb] bg-gradient-to-br from-white via-white to-[#fff9f5]">
            <span className="text-lg font-semibold text-[#062a47]">
              Hackathons with Position
            </span>
            <span className="text-4xl font-bold mt-2 text-[#f75a2f] drop-shadow">
              {stats.hackathonsWithPositionCount ?? 0}
            </span>
            <div className="flex gap-2 mt-2 text-sm">
              <span className="text-[#6B7A8F]">
                🏆 {stats.winnerCount ?? 0}
              </span>
              <span className="text-[#6B7A8F]">
                🥈 {stats.firstRunnerUpCount ?? 0}
              </span>
              <span className="text-[#6B7A8F]">
                🥉 {stats.secondRunnerUpCount ?? 0}
              </span>
            </div>
          </Card>
        </div>

        {/* Projects Section */}
        <Card className="mb-10 rounded-2xl shadow-lg border border-[#eaf6fb] bg-gradient-to-br from-white via-white to-[#fff9f5]">
          <CardHeader>
            <CardTitle className="text-[#062a47] font-bold text-xl text-center">
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.projects && profile.projects.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {profile.projects.map((project, idx) => (
                  <div
                    key={idx}
                    className="border rounded-xl p-6 flex flex-col gap-2 bg-gradient-to-r from-[#eaf6fb] to-[#fff] shadow"
                  >
                    <div className="font-semibold text-lg text-[#062a47]">
                      {project.title}
                    </div>
                    <div className="text-sm text-[#6B7A8F]">
                      {project.description}
                    </div>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {project.techStack.map((tech) => (
                        <Badge
                          key={tech}
                          className="bg-gradient-to-r from-[#2563eb] to-[#f75a2f] text-white shadow"
                        >
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
                          className="text-[#062a47] hover:text-[#f75a2f] underline text-sm font-semibold"
                        >
                          Repo
                        </a>
                      )}
                      {project.demoUrl && (
                        <a
                          href={project.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#062a47] hover:text-[#f75a2f] underline text-sm font-semibold"
                        >
                          Demo
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[#6B7A8F] text-center">
                No projects added yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hackathon Domains/Tags Section */}
        {hackathons && hackathons.length > 0 && (
          <Card className="mb-10 rounded-2xl shadow-lg border border-[#eaf6fb] bg-gradient-to-br from-white via-white to-[#eaf6fb]">
            <CardHeader>
              <CardTitle className="text-[#062a47] font-bold text-xl text-center">
                Hackathon Domains
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap justify-center">
                {[
                  ...new Set(
                    hackathons.flatMap((h: any) => h.tags || []).filter(Boolean)
                  ),
                ].map((tag: string) => (
                  <Badge
                    key={tag}
                    className="bg-gradient-to-r from-[#2563eb] to-[#f75a2f] text-white font-semibold shadow"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default DeveloperDashboard;
