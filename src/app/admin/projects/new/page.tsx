"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function NewProjectPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    order: 1,
    url: "",
    technologies: "",
    category: "web" as const,
    featured: false,
  });
  const [error, setError] = useState("");
  const router = useRouter();

  const createProjectMutation = api.admin.createProject.useMutation({
    onSuccess: () => {
      router.push("/admin/dashboard");
    },
    onError: (error) => {
      setError(error.message || "Chyba při vytváření projektu");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const technologiesArray = formData.technologies
      .split(",")
      .map((tech) => tech.trim())
      .filter((tech) => tech.length > 0);

    createProjectMutation.mutate({
      ...formData,
      technologies: technologiesArray,
      url: formData.url || undefined,
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Button
              onClick={() => router.push("/admin/dashboard")}
              variant="outline"
              size="sm"
              className="mr-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zpět
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Nový projekt</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="title">Název projektu *</Label>
                <Input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                  maxLength={100}
                  disabled={createProjectMutation.isPending}
                />
              </div>

              <div>
                <Label htmlFor="order">Pořadí *</Label>
                <Input
                  id="order"
                  type="number"
                  min="1"
                  value={formData.order}
                  onChange={(e) =>
                    handleInputChange("order", Number(e.target.value))
                  }
                  required
                  disabled={createProjectMutation.isPending}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Popis *</Label>
              <textarea
                id="description"
                className="min-h-[100px] w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                required
                maxLength={500}
                disabled={createProjectMutation.isPending}
              />
            </div>

            <div>
              <Label htmlFor="image">URL obrázku *</Label>
              <Input
                id="image"
                type="text"
                value={formData.image}
                onChange={(e) => handleInputChange("image", e.target.value)}
                required
                disabled={createProjectMutation.isPending}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <Label htmlFor="url">URL projektu (volitelné)</Label>
              <Input
                id="url"
                type="text"
                value={formData.url}
                onChange={(e) => handleInputChange("url", e.target.value)}
                disabled={createProjectMutation.isPending}
                placeholder="https://example.com"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="category">Kategorie</Label>
                <select
                  id="category"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.category}
                  onChange={(e) =>
                    handleInputChange("category", e.target.value)
                  }
                  disabled={createProjectMutation.isPending}
                >
                  <option value="web">Web</option>
                  <option value="e-shop">E-shop</option>
                  <option value="aplikace">Aplikace</option>
                  <option value="rezervace">Rezervace</option>
                  <option value="prezentace">Prezentace</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="featured"
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) =>
                    handleInputChange("featured", e.target.checked)
                  }
                  disabled={createProjectMutation.isPending}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="featured">Doporučený projekt</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="technologies">
                Technologie (oddělené čárkou)
              </Label>
              <Input
                id="technologies"
                type="text"
                value={formData.technologies}
                onChange={(e) =>
                  handleInputChange("technologies", e.target.value)
                }
                disabled={createProjectMutation.isPending}
                placeholder="React, TypeScript, Next.js"
              />
            </div>

            {error && (
              <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={createProjectMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createProjectMutation.isPending
                  ? "Ukládání..."
                  : "Vytvořit projekt"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/dashboard")}
                disabled={createProjectMutation.isPending}
              >
                Zrušit
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
