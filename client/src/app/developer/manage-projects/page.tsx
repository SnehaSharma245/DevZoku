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
        console.log("Fetched projects:", data);

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

  const handleDeleteProject = async (projectId: string) => {
    try {
      const res = await api.delete("/developer/delete-project", {
        data: { projectId },
      });

      const { status, message } = res.data;
      if (status === 200) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        toast.success(message);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete project");
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
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-3xl w-full mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#062a47] tracking-tight flex items-center gap-2 sm:gap-3">
              <FolderOpen className="w-6 h-6 sm:w-8 sm:h-8 text-[#f75a2f]" />
              Your Projects
            </h1>
            <Button
              className="bg-gradient-to-r from-[#f75a2f] to-[#FF6F61] text-white font-bold rounded-xl hover:shadow-lg transition flex items-center gap-2 px-4 py-2 text-sm sm:text-base"
              onClick={() => setAddProjectDialogOpen(true)}
            >
              <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              Add Project
            </Button>
          </div>

          <div className="grid gap-4 sm:gap-6">
            {projects.length === 0 ? (
              <Card className="rounded-2xl shadow-lg border-2 border-[#f4e6d9] bg-gradient-to-br from-white via-[#fff9f5] to-[#fffdfc]">
                <CardContent className="text-center py-12 sm:py-16">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#FF9466] to-[#FF6F61] flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl border-4 border-white">
                    <FolderOpen className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#062a47] mb-2 sm:mb-3">
                    No projects yet
                  </h3>
                  <p className="text-[#6B7A8F] mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed text-sm sm:text-base px-4">
                    You haven't added any projects. Start by adding your first
                    project and showcase your amazing work!
                  </p>
                  <Button
                    className="bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white font-bold rounded-2xl px-6 py-2 sm:px-8 sm:py-3 hover:from-[#FF8456] hover:to-[#FF5F51] transition-all duration-200 shadow-lg hover:shadow-[#FF6F61]/25 flex items-center gap-2 mx-auto border-2 border-white text-sm sm:text-base"
                    onClick={() => setAddProjectDialogOpen(true)}
                  >
                    <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    Add Your First Project
                  </Button>
                </CardContent>
              </Card>
            ) : (
              projects.map((project, index) => (
                <Card
                  key={index}
                  className="rounded-2xl shadow-lg border-2 border-[#f4e6d9] bg-gradient-to-br from-white via-[#fff9f5] to-[#fffdfc] hover:shadow-xl transition-all duration-300 "
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h2 className="text-lg sm:text-xl font-bold text-[#062a47] mb-2 leading-tight">
                          {project.title}
                        </h2>
                        <div className="w-12 h-1 bg-gradient-to-r from-[#FF9466] to-[#FF6F61] rounded-full mb-3"></div>
                      </div>
                      <div
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fff5f0] to-[#fff9f5] border-2 border-[#f4e6d9] flex items-center justify-center hover:bg-gradient-to-br hover:from-[#ffebe0] hover:to-[#fff0e6] transition-all duration-200 cursor-pointer group"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        <Trash className="w-4 h-4 text-[#f75a2f] group-hover:text-[#FF6F61] transition-colors duration-200" />
                      </div>
                    </div>

                    {project.description && (
                      <div className="text-[#6B7A8F] mb-4 leading-relaxed text-sm sm:text-base">
                        {project.description}
                      </div>
                    )}

                    <div className="mb-4">
                      <span className="font-bold text-[#062a47] block mb-2 text-sm sm:text-base">
                        Tech Stack
                      </span>
                      <div className="flex gap-2 flex-wrap">
                        {(Array.isArray(project.techStack)
                          ? project.techStack
                          : project.techStack.split(",")
                        ).map((tech, idx) => (
                          <Badge
                            key={idx}
                            className="bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white shadow-lg hover:shadow-xl transition-shadow duration-200 px-2 py-1 text-xs font-semibold rounded-xl border border-white"
                          >
                            {typeof tech === "string" ? tech.trim() : tech}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-[#f4e6d9]">
                      {project.repoUrl && (
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#fff5f0] to-[#fff9f5] text-[#062a47] hover:text-[#f75a2f] border-2 border-[#f4e6d9] hover:border-[#f75a2f] font-bold px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-lg text-sm"
                        >
                          <svg
                            className="w-3 h-3 sm:w-4 sm:h-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                          </svg>
                          Repository
                        </a>
                      )}
                      {project.demoUrl && (
                        <a
                          href={project.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white hover:from-[#FF8456] hover:to-[#FF5F51] font-bold px-4 py-2 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-white text-sm"
                        >
                          <svg
                            className="w-3 h-3 sm:w-4 sm:h-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3m-2 16H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7Z" />
                          </svg>
                          Live Demo
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
