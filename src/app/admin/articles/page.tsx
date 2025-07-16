"use client";
import { useState } from "react";
import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/trpc/react";
import TipTapEditor from "@/app/_components/TipTapEditor";

type Article = RouterOutputs["article"]["getAll"][number];
type Category = RouterOutputs["category"]["getAll"][number];

const AdminArticlesPage = () => {
  const utils = api.useUtils();
  const { data: articles, isLoading } = api.article.getAll.useQuery();
  const { data: categories } = api.category.getAll.useQuery();
  const createArticle = api.article.create.useMutation({
    onSuccess: () => {
      utils.article.getAll.invalidate();
      setForm({
        title: "",
        content: "",
        categories: [],
        tags: [],
        imageUrl: "",
      });
    },
  });
  const deleteArticle = api.article.delete.useMutation({
    onSuccess: () => utils.article.getAll.invalidate(),
  });

  const [form, setForm] = useState({
    title: "",
    content: "<p>Napište článek...</p>",
    categories: [] as string[],
    tags: [] as string[],
    imageUrl: "",
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content || form.categories.length === 0) return;
    createArticle.mutate({
      ...form,
      tags: form.tags.filter(Boolean),
    });
  };

  const handleDelete = (id: string) => {
    deleteArticle.mutate({ id });
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Správa článků</h1>
      <form onSubmit={handleAdd} className="mb-8 space-y-2 border-b pb-4">
        <input
          className="w-full rounded border px-2 py-1"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Titulek článku"
          aria-label="Titulek článku"
          required
        />
        <TipTapEditor
          value={form.content}
          onChange={(content) => setForm((f) => ({ ...f, content }))}
          placeholder="Napište článek..."
        />
        <select
          multiple
          className="w-full rounded border px-2 py-1"
          value={form.categories}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              categories: Array.from(e.target.selectedOptions, (o) => o.value),
            }))
          }
        >
          {categories?.map((cat: Category) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
        <input
          className="w-full rounded border px-2 py-1"
          value={form.imageUrl}
          onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
          placeholder="URL obrázku"
          aria-label="URL obrázku"
        />
        <input
          className="w-full rounded border px-2 py-1"
          value={form.tags.join(",")}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              tags: e.target.value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            }))
          }
          placeholder="Tagy (oddělené čárkou)"
          aria-label="Tagy"
        />
        <button
          className="rounded bg-blue-600 px-4 py-1 text-white"
          type="submit"
          disabled={createArticle.isPending}
        >
          {createArticle.isPending ? "Přidávání..." : "Přidat článek"}
        </button>
      </form>
      {isLoading ? (
        <p>Načítám články...</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr>
              <th className="border px-2 py-1">Titulek</th>
              <th className="border px-2 py-1">Kategorie</th>
              <th className="border px-2 py-1">Obrázek</th>
              <th className="border px-2 py-1">Tagy</th>
              <th className="border px-2 py-1">Akce</th>
            </tr>
          </thead>
          <tbody>
            {articles?.map((article: Article) => (
              <tr key={String(article._id)}>
                <td className="border px-2 py-1">{article.title}</td>
                <td className="border px-2 py-1">
                  {article.categories
                    .map((cat: Category) => cat.name)
                    .join(", ")}
                </td>
                <td className="border px-2 py-1">
                  {article.imageUrl && (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="h-20 w-20 object-cover"
                    />
                  )}
                </td>
                <td className="border px-2 py-1">{article.tags?.join(", ")}</td>
                <td className="border px-2 py-1">
                  <button
                    className="text-red-600"
                    onClick={() => handleDelete(String(article._id))}
                    aria-label="Smazat článek"
                    disabled={deleteArticle.isPending}
                  >
                    {deleteArticle.isPending ? "Smazávání..." : "Smazat"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminArticlesPage;
