import { ApiClient } from "../client";
import type { Project, ProjectTask } from "@erp/shared";

export const projectsApi = (client: ApiClient) => ({
  projects: {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
      client.list<Project>("/api/v1/projects", params),
    get: (id: string) => client.get<Project>(`/api/v1/projects/${id}`),
    create: (data: Partial<Project>) => client.post<Project>("/api/v1/projects", data),
    update: (id: string, data: Partial<Project>) => client.put<Project>(`/api/v1/projects/${id}`, data),
  },
  tasks: {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
      client.list<ProjectTask>("/api/v1/projects/tasks", params),
    get: (id: string) => client.get<ProjectTask>(`/api/v1/projects/tasks/${id}`),
    create: (data: Partial<ProjectTask>) => client.post<ProjectTask>("/api/v1/projects/tasks", data),
    update: (id: string, data: Partial<ProjectTask>) => client.put<ProjectTask>(`/api/v1/projects/tasks/${id}`, data),
  },
});
