"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Project {
  id: string;
  name: string;
  github_repo: string | null;
}

interface ProjectContextType {
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [activeProject, setActiveProjectState] = useState<Project | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("nexus_active_project");
    if (stored) {
      try {
        setActiveProjectState(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse active project");
      }
    }
  }, []);

  const setActiveProject = (project: Project | null) => {
    setActiveProjectState(project);
    if (project) {
      localStorage.setItem("nexus_active_project", JSON.stringify(project));
    } else {
      localStorage.removeItem("nexus_active_project");
    }
  };

  return (
    <ProjectContext.Provider value={{ activeProject, setActiveProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
