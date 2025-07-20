"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/utils/api";
import { toast } from "sonner";
import AddProjectDialog from "@/components/popups/AddProject";
import { PlusCircle, FolderOpen, Trash } from "lucide-react";

interface Project {
  id: string;
  title: string;
  description?: string;
  techStack: string;
  repoUrl?: string;
  demoUrl?: string;
}

export default function ManageProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [addProjectDialogOpen, setAddProjectDialogOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await api.get("/developer/projects");
      // Console log shows: res.data.data is always an array
      const { status, data } = res.data;
      if (status === 201) {
        setProjects(Array.isArray(data) ? data : data.data || []);
      } else {
        setProjects([]);
      }
    } catch (error: any) {
      console.error("Error fetching projects:", error);
      setProjects([]);
      toast.error(error?.response?.data?.message || "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAddProject = async (project: {
    title: string;
    description?: string;
    techStack: string;
    repoUrl?: string;
    demoUrl?: string;
  }) => {
    try {
      // Convert techStack string to array if needed
      const payload = {
        ...project,
        techStack: Array.isArray(project.techStack)
          ? project.techStack
          : project.techStack
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
      };

      const res = await api.post("/developer/add-project", payload);
      const { status, data, message } = res.data;

      if (status === 201) {
        setProjects((prev) => [...prev, data]);
        toast.success(message);
      }
    } catch (error: any) {
      console.error("Error adding project:", error);
      toast.error(error?.response?.data?.message || "Failed to add project");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-white">
        Loading projects...
      </div>
    );
  }

  return (
    <>
      <AddProjectDialog
        open={addProjectDialogOpen}
        onClose={() => setAddProjectDialogOpen(false)}
        onAdd={handleAddProject}
      />
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FolderOpen className="w-8 h-8 text-[#a3e635]" />
            Your Projects
          </h1>
          <Button
            className="bg-[#a3e635] text-black font-bold rounded-xl hover:bg-lime-400 transition flex items-center gap-2"
            onClick={() => setAddProjectDialogOpen(true)}
          >
            <PlusCircle className="w-5 h-5" />
            Add Project
          </Button>
        </div>
        <div className="grid gap-6">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center gap-2">
              <div className="text-center text-gray-400 py-12 rounded-xl border border-[#23232b] w-full bg-[#23232b]">
                <FolderOpen className="w-10 h-10 mx-auto mb-4 text-[#a3e635]" />
                <span className="block mb-2 font-semibold text-white">
                  No projects yet
                </span>
                <span className="block mb-4 text-gray-400">
                  You haven't added any projects. Start by adding your first
                  project!
                </span>
                <Button
                  className="bg-[#a3e635] text-black font-bold rounded-xl hover:bg-lime-400 transition flex items-center gap-2 justify-self-center"
                  onClick={() => setAddProjectDialogOpen(true)}
                >
                  <PlusCircle className="w-5 h-5" />
                  Add Project
                </Button>
              </div>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="bg-[#23232b] border border-[#23232b] rounded-2xl shadow-xl p-6 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-extrabold text-white">
                    {project.title}
                  </h2>
                  <Trash className="w-5 h-5 text-[#fb923c] cursor-pointer" />
                </div>
                <div className="text-gray-300 mb-1">{project.description}</div>
                <div>
                  <span className="font-semibold text-white">Tech Stack:</span>{" "}
                  <span className="text-gray-400">{project.techStack}</span>
                </div>
                <div className="flex gap-4 mt-2">
                  {project.repoUrl && (
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#a3e635] underline font-semibold"
                    >
                      Repo
                    </a>
                  )}
                  {project.demoUrl && (
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#fb923c] underline font-semibold"
                    >
                      Demo
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
