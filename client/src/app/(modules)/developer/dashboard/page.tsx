"use client";
import { useEffect, useState } from "react";
import { Pie, Bar } from "react-chartjs-2";
import Chart from "chart.js/auto";
import { ArcElement } from "chart.js";
import { Card } from "@/components/ui/card";

Chart.register(ArcElement);

const Dashboard = () => {
  // Dummy data, replace with API data
  const [hackathonsJoined, setHackathonsJoined] = useState(5);
  const [totalPositions, setTotalPositions] = useState(2);
  const [projectsCompleted, setProjectsCompleted] = useState(3);
  const [projectsOngoing, setProjectsOngoing] = useState(2);

  // Participation rate calculation
  const participationRate = ((hackathonsJoined / 10) * 100).toFixed(1); // assuming 10 hackathons available

  // Pie chart data for projects
  const projectPieData = {
    labels: ["Completed", "Ongoing"],
    datasets: [
      {
        data: [projectsCompleted, projectsOngoing],
        backgroundColor: ["#2563eb", "#f75a2f"],
      },
    ],
  };

  // Bar chart data for positions
  const positionBarData = {
    labels: ["Positions Held"],
    datasets: [
      {
        label: "Total Positions",
        data: [totalPositions],
        backgroundColor: "#062a47",
      },
    ],
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-extrabold text-[#062a47] mb-4">
        Developer Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-6 flex flex-col items-center">
          <span className="text-lg font-semibold text-[#2563eb]">
            Hackathon Participation Rate
          </span>
          <span className="text-4xl font-bold mt-2">{participationRate}%</span>
          <span className="text-sm text-gray-500 mt-1">
            ({hackathonsJoined} joined / 10 total)
          </span>
        </Card>
        <Card className="p-6 flex flex-col items-center">
          <span className="text-lg font-semibold text-[#f75a2f]">
            Total Hackathons Joined
          </span>
          <span className="text-4xl font-bold mt-2">{hackathonsJoined}</span>
        </Card>
        <Card className="p-6 flex flex-col items-center">
          <span className="text-lg font-semibold text-[#062a47]">
            Total Positions Held
          </span>
          <span className="text-4xl font-bold mt-2">{totalPositions}</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <Card className="p-6">
          <span className="text-lg font-semibold text-[#2563eb] mb-4 block">
            Projects Status
          </span>
          <Pie data={projectPieData} />
        </Card>
        <Card className="p-6">
          <span className="text-lg font-semibold text-[#062a47] mb-4 block">
            Positions Overview
          </span>
          <Bar data={positionBarData} />
        </Card>
      </div>
    </div>
  );
};
export default Dashboard;
