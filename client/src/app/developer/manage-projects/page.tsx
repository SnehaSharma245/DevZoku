"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/utils/api";
import { toast } from "sonner";
import AddProjectDialog from "@/components/popups/AddProject";

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
      const res = await api.post("/developer/add-project", project);
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
        <h1 className="text-3xl font-bold text-white mb-8">Your Projects</h1>
        <div className="grid gap-6">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center gap-2">
              <div className="text-center text-gray-400">
                No projects yet. Add one!
              </div>
              <Button onClick={() => setAddProjectDialogOpen(true)}>
                Add Project
              </Button>
            </div>
          ) : (
            projects.map((project) => (
              <Card
                key={project.id}
                className="bg-[#23232b] rounded-2xl border-none"
              >
                <CardHeader>
                  <CardTitle className="text-white">{project.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-gray-300">{project.description}</div>
                  <div>
                    <span className="font-semibold text-white">
                      Tech Stack:
                    </span>{" "}
                    <span className="text-gray-400">{project.techStack}</span>
                  </div>
                  <div className="flex gap-4 mt-2">
                    {project.repoUrl && (
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#a3e635] underline"
                      >
                        Repo
                      </a>
                    )}
                    {project.demoUrl && (
                      <a
                        href={project.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#fb923c] underline"
                      >
                        Demo
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        {projects.length > 0 && (
          <Button
            className="mt-6"
            onClick={() => setAddProjectDialogOpen(true)}
          >
            Add Project
          </Button>
        )}
      </div>
    </>
  );
}
