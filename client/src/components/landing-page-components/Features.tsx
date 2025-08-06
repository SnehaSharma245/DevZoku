"use client";
import React from "react";
import {
  Users,
  Trophy,
  Rocket,
  Search,
  User,
  Calendar,
  BarChart3,
  Settings,
  Globe,
  Target,
  Zap,
  Heart,
} from "lucide-react";
import CallToAction from "./CallToAction";

const Features = () => {
  const developerFeatures = [
    {
      icon: <Search className="w-8 h-8" />,
      title: "Smart Hackathon Discovery",
      description:
        "Find hackathons tailored to your skills with AI-powered recommendations and advanced filtering options.",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Effortless Team Formation",
      description:
        "Connect with like-minded developers based on skills, send invitations, and build your dream team seamlessly.",
    },
    {
      icon: <User className="w-8 h-8" />,
      title: "Professional Profile Showcase",
      description:
        "Create a comprehensive developer profile with projects, skills, social links, and hackathon achievements.",
    },
    {
      icon: <Rocket className="w-8 h-8" />,
      title: "Project Portfolio Management",
      description:
        "Showcase your best work with detailed project descriptions, tech stacks, and live demo links.",
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: "Achievement Tracking",
      description:
        "Track your hackathon participation, wins, and positions with detailed statistics and progress insights.",
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Skill-Based Matching",
      description:
        "Get matched with hackathons and teams that align with your technical expertise and interests.",
    },
  ];

  const organizerFeatures = [
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Complete Hackathon Management",
      description:
        "Easily create and manage hackathons with custom phases, registration windows, and team size limits.",
    },
    {
      icon: <Settings className="w-8 h-8" />,
      title: "Flexible Event Configuration",
      description:
        "Set team limits, modes, tags, domains, posters, and multiple competition phases with ease.",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Team & Participant Management",
      description:
        "Track registrations live, view teams, and manage applications effortlessly.",
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: "Winner Declaration System",
      description:
        "Select winners and send automated email notifications to all participants.",
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Professional Organization Profile",
      description:
        "Build detailed profiles with bio, social links, and showcase past events.",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Event Discovery & Promotion",
      description:
        "Boost visibility with smart filters, tag-based search, and upcoming event highlights.",
    },
  ];

  const FeatureCard = ({
    icon,
    title,
    description,
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
  }) => (
    <div className="rounded-2xl p-6 border border-[#e3e8ee] shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#FF9466] to-[#FF6F61] flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-[#062a47] mb-3 leading-tight">
        {title}
      </h3>
      <p className="text-[#6B7A8F] leading-relaxed text-sm">{description}</p>
    </div>
  );

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background shapes for Features */}
      <div className="pointer-events-none select-none" aria-hidden="true">
        <div className="absolute top-[8%] left-[12%] w-14 h-14 bg-[#FF9466]/10 rotate-12 rounded-lg z-0"></div>
        <div className="absolute top-[25%] right-[15%] w-20 h-20 bg-[#FF6F61]/10 rounded-full z-0"></div>
        <div className="absolute bottom-[18%] left-[18%] w-10 h-10 bg-[#FF9466]/20 rotate-45 rounded-lg z-0"></div>
        <div className="absolute bottom-[10%] right-[10%] w-16 h-16 bg-[#FF6F61]/15 rounded-full z-0"></div>
        <div className="absolute top-[55%] left-[30%] w-8 h-8 bg-[#FF9466]/20 rounded-full z-0"></div>
        <div className="absolute top-[40%] right-[25%] w-12 h-12 bg-[#FF6F61]/15 rotate-12 rounded-lg z-0"></div>
      </div>
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-[#062a47] mb-6 leading-tight">
            Everything You Need to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9466] to-[#FF6F61]">
              Succeed
            </span>
          </h2>
          <p className="text-xl text-[#6B7A8F] max-w-3xl mx-auto leading-relaxed">
            Whether you're a developer looking to showcase your skills or an
            organizer creating the next big hackathon, DevZoku has all the tools
            you need.
          </p>
        </div>

        {/* Developer Features */}
        <div className="mb-20">
          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF9466] to-[#FF6F61] flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-[#062a47]">
                For Developers
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {developerFeatures.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>

        {/* Organizer Features */}
        <div>
          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF9466] to-[#FF6F61] flex items-center justify-center shadow-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-[#062a47]">
                For Organizers
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {organizerFeatures.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
