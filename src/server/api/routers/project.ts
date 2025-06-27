import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import connectToMongoDB from "@/server/db/mongoose";
import Project from "@/server/db/models/Project";

export const projectRouter = createTRPCRouter({
  // Získání všech projektů (veřejné)
  getAll: publicProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          featured: z.boolean().optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      try {
        await connectToMongoDB();
      } catch (error) {
        // Fallback - vraťme prázdné pole, pokud DB není dostupná
        return [];
      }

      const filter: Record<string, any> = {};
      if (input?.category) {
        filter.category = input.category;
      }
      if (input?.featured !== undefined) {
        filter.featured = input.featured;
      }

      try {
        const projects = await (Project as any)
          .find(filter)
          .sort({ order: 1 })
          .limit(input?.limit ?? 50)
          .skip(input?.offset ?? 0);

        return projects.map((project: any) => ({
          _id: project._id.toString(),
          title: project.title,
          description: project.description,
          image: project.image,
          order: project.order,
          url: project.url,
          technologies: project.technologies,
          category: project.category,
          featured: project.featured,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        }));
      } catch (error) {
        throw new Error("Chyba při načítání projektů");
      }
    }),

  // Získání projektu podle ID
  getById: publicProcedure.input(z.string()).query(async ({ input }) => {
    await connectToMongoDB();

    try {
      const project = await (Project as any).findById(input);

      if (!project) {
        throw new Error("Projekt nebyl nalezen");
      }

      return {
        _id: project._id.toString(),
        title: project.title,
        description: project.description,
        image: project.image,
        order: project.order,
        url: project.url,
        technologies: project.technologies,
        category: project.category,
        featured: project.featured,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    } catch (error) {
      throw new Error("Projekt nebyl nalezen");
    }
  }),

  // Vytvoření nového projektu (chráněné)
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100),
        description: z.string().min(1).max(500),
        image: z.string(),
        order: z.number().min(1),
        url: z.string().optional(),
        technologies: z.array(z.string()).optional(),
        category: z
          .enum(["web", "e-shop", "aplikace", "rezervace", "prezentace"])
          .optional(),
        featured: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      await connectToMongoDB();

      try {
        const project = new Project(input);
        const savedProject = await project.save();

        return {
          _id: savedProject._id.toString(),
          title: savedProject.title,
          description: savedProject.description,
          image: savedProject.image,
          order: savedProject.order,
          url: savedProject.url,
          technologies: savedProject.technologies,
          category: savedProject.category,
          featured: savedProject.featured,
          createdAt: savedProject.createdAt,
          updatedAt: savedProject.updatedAt,
        };
      } catch (error) {
        throw new Error("Chyba při vytváření projektu");
      }
    }),

  // Aktualizace projektu (chráněné)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(100).optional(),
        description: z.string().min(1).max(500).optional(),
        image: z.string().optional(),
        order: z.number().min(1).optional(),
        url: z.string().optional(),
        technologies: z.array(z.string()).optional(),
        category: z
          .enum(["web", "e-shop", "aplikace", "rezervace", "prezentace"])
          .optional(),
        featured: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      await connectToMongoDB();

      try {
        const { id, ...updateData } = input;

        const project = await (Project as any).findByIdAndUpdate(
          id,
          updateData,
          {
            new: true,
            runValidators: true,
          },
        );

        if (!project) {
          throw new Error("Projekt nebyl nalezen");
        }

        return {
          _id: project._id.toString(),
          title: project.title,
          description: project.description,
          image: project.image,
          order: project.order,
          url: project.url,
          technologies: project.technologies,
          category: project.category,
          featured: project.featured,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        };
      } catch (error) {
        throw new Error("Chyba při aktualizaci projektu");
      }
    }),

  // Smazání projektu (chráněné)
  delete: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    await connectToMongoDB();

    try {
      const project = await (Project as any).findByIdAndDelete(input);

      if (!project) {
        throw new Error("Projekt nebyl nalezen");
      }

      return { success: true };
    } catch (error) {
      throw new Error("Chyba při mazání projektu");
    }
  }),

  // Získání statistik projektů
  getStats: protectedProcedure.query(async () => {
    await connectToMongoDB();

    try {
      const stats = await (Project as any).aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            featured: {
              $sum: { $cond: ["$featured", 1, 0] },
            },
          },
        },
      ]);

      const totalCount = await (Project as any).countDocuments();

      return {
        total: totalCount,
        byCategory: stats,
      };
    } catch (error) {
      throw new Error("Chyba při načítání statistik");
    }
  }),
});
