"use client";
import { useState } from "react";
import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/trpc/react";

type Category = RouterOutputs["category"]["getAll"][number];
const AdminCategoriesPage = () => {
  const utils = api.useUtils();
  const { data: categories, isLoading } = api.category.getAll.useQuery();
  const createCategory = api.category.create.useMutation({
    onSuccess: () => {
      utils.category.getAll.invalidate();
      setName("");
    },
  });
  const deleteCategory = api.category.delete.useMutation({
    onSuccess: () => utils.category.getAll.invalidate(),
  });
  const [name, setName] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.length < 2) return;
    createCategory.mutate({ name });
  };

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Správa kategorií</h1>
      <form onSubmit={handleAdd} className="mb-6 flex gap-2">
        <input
          className="flex-1 rounded border px-2 py-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Název kategorie"
          aria-label="Název kategorie"
        />
        <button
          className="rounded bg-blue-600 px-4 py-1 text-white"
          type="submit"
          disabled={createCategory.isPending}
        >
          Přidat
        </button>
      </form>
      {isLoading ? (
        <div>Načítám...</div>
      ) : (
        <ul className="space-y-2">
          {categories?.map((cat: Category) => (
            <li
              key={cat._id}
              className="flex items-center justify-between border-b py-1"
            >
              <span>{cat.name}</span>
              <button
                className="text-red-600"
                onClick={() => deleteCategory.mutate({ id: cat._id })}
                aria-label={`Smazat kategorii ${cat.name}`}
              >
                Smazat
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminCategoriesPage;
