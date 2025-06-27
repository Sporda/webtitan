import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import connectToMongoDB from "@/server/db/mongoose";
import Admin from "@/server/db/models/Admin";
import Project from "@/server/db/models/Project";
import { createSession, deleteSession } from "@/lib/auth";

export const adminRouter = createTRPCRouter({
  // Přihlášení
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1, "Uživatelské jméno je povinné"),
        password: z.string().min(1, "Heslo je povinné"),
      }),
    )
    .mutation(async ({ input }) => {
      await connectToMongoDB();

      try {
        // Najít admina podle uživatelského jména
        const admin = await Admin.findOne({
          username: input.username,
          isActive: true,
        });

        if (!admin) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Neplatné přihlašovací údaje",
          });
        }

        // Ověřit heslo
        const isPasswordValid = await admin.comparePassword(input.password);

        if (!isPasswordValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Neplatné přihlašovací údaje",
          });
        }

        // Aktualizovat datum posledního přihlášení
        admin.lastLogin = new Date();
        await admin.save();

        // Vytvořit session - použijeme jose pro kompatibilitu s Edge Runtime
        const { SignJWT } = require("jose");
        const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

        const sessionToken = await new SignJWT({
          adminId: String(admin._id),
          username: admin.username,
        })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime("24h")
          .sign(secret);

        return {
          success: true,
          sessionToken, // Posíláme token do frontendu
          admin: {
            id: String(admin._id),
            username: admin.username,
            email: admin.email,
          },
        };
      } catch (error: any) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Chyba při přihlašování",
        });
      }
    }),

  // Odhlášení
  logout: protectedProcedure.mutation(async () => {
    await deleteSession();
    return { success: true };
  }),

  // Získat informace o aktuálně přihlášeném adminovi
  me: protectedProcedure.query(async ({ ctx }) => {
    await connectToMongoDB();

    try {
      const admin = await Admin.findById(ctx.session.adminId).select(
        "-password",
      );

      if (!admin) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Admin nebyl nalezen",
        });
      }

      return {
        id: String(admin._id),
        username: admin.username,
        email: admin.email,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      };
    } catch (error: any) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Chyba při načítání admin údajů",
      });
    }
  }),

  // CRUD operace pro projekty - získat všechny (s paginací)
  getProjects: protectedProcedure
    .input(
      z
        .object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(10),
          search: z.string().optional(),
          category: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      await connectToMongoDB();

      const page = input?.page ?? 1;
      const limit = input?.limit ?? 10;
      const skip = (page - 1) * limit;

      try {
        const filter: Record<string, any> = {};

        if (input?.search) {
          filter.$or = [
            { title: { $regex: input.search, $options: "i" } },
            { description: { $regex: input.search, $options: "i" } },
          ];
        }

        if (input?.category) {
          filter.category = input.category;
        }

        const [projects, total] = await Promise.all([
          Project.find(filter).sort({ order: 1 }).limit(limit).skip(skip),
          Project.countDocuments(filter),
        ]);

        return {
          projects: projects.map((project: any) => ({
            _id: String(project._id),
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
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Chyba při načítání projektů",
        });
      }
    }),

  // Smazat projekt
  deleteProject: protectedProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      await connectToMongoDB();

      try {
        const project = await Project.findByIdAndDelete(input);

        if (!project) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Projekt nebyl nalezen",
          });
        }

        return { success: true };
      } catch (error: any) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Chyba při mazání projektu",
        });
      }
    }),

  // Získat projekt podle ID
  getProject: protectedProcedure.input(z.string()).query(async ({ input }) => {
    await connectToMongoDB();

    try {
      const project = await Project.findById(input);

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Projekt nebyl nalezen",
        });
      }

      return {
        _id: String(project._id),
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
    } catch (error: any) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Chyba při načítání projektu",
      });
    }
  }),

  // Aktualizovat projekt
  updateProject: protectedProcedure
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

        const project = await Project.findByIdAndUpdate(id, updateData, {
          new: true,
          runValidators: true,
        });

        if (!project) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Projekt nebyl nalezen",
          });
        }

        return {
          _id: String(project._id),
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
      } catch (error: any) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Chyba při aktualizaci projektu",
        });
      }
    }),

  // Vytvořit nový projekt
  createProject: protectedProcedure
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
          _id: String(savedProject._id),
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
      } catch (error: any) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Chyba při vytváření projektu",
        });
      }
    }),

  // Reset hesla pomocí emailu
  resetPassword: publicProcedure
    .input(
      z.object({
        username: z.string().min(1, "Uživatelské jméno je povinné"),
        email: z.string().email("Neplatný email"),
        newPassword: z.string().min(6, "Nové heslo musí mít alespoň 6 znaků"),
        confirmPassword: z.string().min(6),
      }),
    )
    .mutation(async ({ input }) => {
      await connectToMongoDB();

      if (input.newPassword !== input.confirmPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Hesla se neshodují",
        });
      }

      try {
        const admin = await Admin.findOne({
          username: input.username,
          email: input.email,
          isActive: true,
        });

        if (!admin) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "Admin s tímto uživatelským jménem a emailem nebyl nalezen",
          });
        }

        // Manuálně hashovat nové heslo pro reset
        const bcrypt = require("bcryptjs");
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(input.newPassword, salt);

        // Nastavit hashované heslo přímo (aby se middleware nespustil)
        await Admin.findByIdAndUpdate(admin._id, {
          password: hashedPassword,
          updatedAt: new Date(),
        });

        return { success: true, message: "Heslo bylo úspěšně resetováno" };
      } catch (error: any) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Chyba při resetování hesla",
        });
      }
    }),

  // Zkontrolovat, zda existuje nějaký admin
  hasAdmin: publicProcedure.query(async () => {
    await connectToMongoDB();

    try {
      const adminCount = await Admin.countDocuments();
      return { hasAdmin: adminCount > 0 };
    } catch (error) {
      return { hasAdmin: false };
    }
  }),

  // Vytvořit prvního admina (pouze pokud neexistuje žádný)
  createFirstAdmin: publicProcedure
    .input(
      z.object({
        username: z.string().min(3).max(30),
        password: z.string().min(6),
        email: z.string().email().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      await connectToMongoDB();

      try {
        // Zkontrolovat, zda už existuje nějaký admin
        const existingAdmin = await Admin.findOne();

        if (existingAdmin) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin už existuje",
          });
        }

        // Vytvořit prvního admina
        const admin = new Admin(input);
        const savedAdmin = await admin.save();

        return {
          success: true,
          admin: {
            id: String(savedAdmin._id),
            username: savedAdmin.username,
            email: savedAdmin.email,
          },
        };
      } catch (error: any) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Chyba při vytváření admina",
        });
      }
    }),
});
