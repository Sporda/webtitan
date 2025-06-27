"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Trash2, Edit, Plus, LogOut, Search } from "lucide-react";

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  // Queries
  const { data: adminData } = api.admin.me.useQuery();
  const { data: projectsData, refetch: refetchProjects } =
    api.admin.getProjects.useQuery({
      page: currentPage,
      limit: 10,
      search: searchTerm || undefined,
    });

  // Mutations
  const logoutMutation = api.admin.logout.useMutation({
    onSuccess: () => {
      router.push("/admin");
    },
  });

  const deleteProjectMutation = api.admin.deleteProject.useMutation({
    onSuccess: () => {
      refetchProjects();
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm("Opravdu chcete smazat tento projekt?")) {
      deleteProjectMutation.mutate(projectId);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    refetchProjects();
  };

  if (!adminData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Načítání...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">Vítejte, {adminData.username}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              disabled={logoutMutation.isPending}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Odhlásit se
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Projects Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Správa projektů
            </h2>
            <Button
              onClick={() => router.push("/admin/projects/new")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nový projekt
            </Button>
          </div>

          {/* Search */}
          <Card className="p-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Vyhledat projekty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button type="submit" variant="outline">
                <Search className="mr-2 h-4 w-4" />
                Hledat
              </Button>
            </form>
          </Card>

          {/* Projects List */}
          <div className="grid gap-4">
            {projectsData?.projects.map((project) => (
              <Card key={project._id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      {project.image && (
                        <img
                          src={project.image}
                          alt={project.title}
                          className="h-16 w-16 rounded object-cover"
                        />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {project.title}
                        </h3>
                        <p className="mt-1 text-gray-600">
                          {project.description}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                          <span>Kategorie: {project.category}</span>
                          <span>Pořadí: {project.order}</span>
                          {project.featured && (
                            <span className="rounded bg-yellow-100 px-2 py-1 text-yellow-800">
                              Doporučený
                            </span>
                          )}
                        </div>
                        {project.technologies &&
                          project.technologies.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {project.technologies.map(
                                (tech: string, index: number) => (
                                  <span
                                    key={index}
                                    className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800"
                                  >
                                    {tech}
                                  </span>
                                ),
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        router.push(`/admin/projects/${project._id}/edit`)
                      }
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteProject(project._id)}
                      variant="outline"
                      size="sm"
                      disabled={deleteProjectMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {projectsData?.pagination && projectsData.pagination.pages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage <= 1}
                variant="outline"
              >
                Předchozí
              </Button>
              <span className="flex items-center px-4">
                Stránka {currentPage} z {projectsData.pagination.pages}
              </span>
              <Button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= projectsData.pagination.pages}
                variant="outline"
              >
                Další
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
