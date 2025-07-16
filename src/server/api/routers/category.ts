import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../trpc";
import Category from "../../db/models/Category";

export const categoryRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    return await (Category as any).find().sort({ name: 1 });
  }),
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Název kategorie musí mít alespoň 2 znaky"),
      }),
    )
    .mutation(async ({ input }) => {
      const slug = input.name
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");

      const exists = await Category.findOne({ slug });

      if (exists) throw new Error("Kategorie s tímto názvem již existuje");
      const category = new Category({ name: input.name, slug });
      await category.save();
      return category;
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await Category.findByIdAndDelete(input.id);
    }),
});
