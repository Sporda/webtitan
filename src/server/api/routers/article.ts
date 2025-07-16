import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import Article from "../../db/models/Article";
import Category from "../../db/models/Category";
import mongoose from "mongoose";

const articleInput = z.object({
  title: z.string().min(3, "Titulek musí mít alespoň 3 znaky"),
  content: z.string().min(10, "Obsah musí mít alespoň 10 znaků"),
  imageUrl: z.string().url("Neplatná URL obrázku").optional().or(z.literal("")),
  categories: z
    .array(z.string().min(1))
    .min(1, "Musíte vybrat alespoň jednu kategorii"),
  tags: z.array(z.string()).optional(),
});

export const articleRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    return await Article.find().populate("categories").sort({ createdAt: -1 });
  }),
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      if (!mongoose.Types.ObjectId.isValid(input.id)) {
        throw new Error("Neplatný ID článku");
      }
      const article = await Article.findById(input.id).populate("categories");
      if (!article) throw new Error("Článek nebyl nalezen");
      return article;
    }),
  create: publicProcedure.input(articleInput).mutation(async ({ input }) => {
    const slug = input.title
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
    const exists = await Article.findOne({ slug });
    if (exists) throw new Error("Článek s tímto titulkem již existuje");
    const categoriesExist = await Category.find({
      _id: { $in: input.categories },
    });
    if (categoriesExist.length !== input.categories.length) {
      throw new Error("Některé zadané kategorie nebyly nalezeny");
    }
    const article = new Article({ ...input, slug });
    await article.save();
    return await article.populate("categories");
  }),
  update: publicProcedure
    .input(articleInput.extend({ id: z.string() }))
    .mutation(async ({ input }) => {
      if (!mongoose.Types.ObjectId.isValid(input.id)) {
        throw new Error("Neplatný ID článku");
      }
      const categoriesExist = await Category.find({
        _id: { $in: input.categories },
      });
      if (categoriesExist.length !== input.categories.length) {
        throw new Error("Některé zadané kategorie nebyly nalezeny");
      }
      const slug = input.title
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
      const article = await Article.findByIdAndUpdate(
        input.id,
        { ...input, slug },
        { new: true },
      ).populate("categories");
      if (!article) throw new Error("Článek nebyl nalezen");
      return article;
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      if (!mongoose.Types.ObjectId.isValid(input.id)) {
        throw new Error("Neplatný ID článku");
      }
      await Article.findByIdAndDelete(input.id);
      return { success: true };
    }),
});
