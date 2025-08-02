"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/utils/api";
import { toast } from "sonner";
import AddProjectDialog from "@/components/popups/AddProject";
import { PlusCircle, FolderOpen, Trash } from "lucide-react";
import { withAuth } from "@/utils/withAuth";

interface Project {
  id: string;
  title: string;
  description?: string;
  techStack: string;
  repoUrl?: string;
  demoUrl?: string;
}

function ManageProjectsPage() {
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
      <div className="flex justify-center items-center min-h-screen text-[#062a47]">
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
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl w-full mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-[#062a47] tracking-tight flex items-center gap-3">
              <FolderOpen className="w-8 h-8 text-[#f75a2f]" />
              Your Projects
            </h1>
            <Button
              className="bg-gradient-to-r from-[#f75a2f] to-[#FF6F61] text-white font-bold rounded-xl hover:shadow-lg transition flex items-center gap-2"
              onClick={() => setAddProjectDialogOpen(true)}
            >
              <PlusCircle className="w-5 h-5" />
              Add Project
            </Button>
          </div>

          <div className="grid gap-6">
            {projects.length === 0 ? (
              <Card className="rounded-2xl shadow-lg border border-[#eaf6fb] bg-gradient-to-br from-white via-white to-[#fff9f5]">
                <CardContent className="text-center py-12">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 text-[#f75a2f]" />
                  <h3 className="text-xl font-bold text-[#062a47] mb-2">
                    No projects yet
                  </h3>
                  <p className="text-[#6B7A8F] mb-6">
                    You haven't added any projects. Start by adding your first
                    project!
                  </p>
                  <Button
                    className="bg-gradient-to-r from-[#f75a2f] to-[#FF6F61] text-white font-bold rounded-xl hover:shadow-lg transition flex items-center gap-2 mx-auto"
                    onClick={() => setAddProjectDialogOpen(true)}
                  >
                    <PlusCircle className="w-5 h-5" />
                    Add Project
                  </Button>
                </CardContent>
              </Card>
            ) : (
              projects.map((project) => (
                <Card
                  key={project.id}
                  className="rounded-2xl shadow-lg border border-[#eaf6fb] bg-gradient-to-r from-[#eaf6fb] to-[#fff]"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-[#062a47]">
                        {project.title}
                      </h2>
                      <Trash className="w-5 h-5 text-[#f75a2f] cursor-pointer hover:text-[#FF6F61] transition" />
                    </div>

                    <div className="text-[#6B7A8F] mb-4">
                      {project.description}
                    </div>

                    <div className="mb-4">
                      <span className="font-semibold text-[#062a47] block mb-2">
                        Tech Stack:
                      </span>
                      <div className="flex gap-2 flex-wrap">
                        {typeof project.techStack === "string"
                          ? project.techStack.split(",").map((tech, idx) => (
                              <Badge
                                key={idx}
                                className="bg-gradient-to-r from-[#2563eb] to-[#f75a2f] text-white shadow"
                              >
                                {tech.trim()}
                              </Badge>
                            ))
                          : null}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      {project.repoUrl && (
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#062a47] hover:text-[#f75a2f] underline font-semibold transition"
                        >
                          Repo
                        </a>
                      )}
                      {project.demoUrl && (
                        <a
                          href={project.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#062a47] hover:text-[#f75a2f] underline font-semibold transition"
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
        </div>
      </div>
    </>
  );
}
export default withAuth(ManageProjectsPage, "developer");
