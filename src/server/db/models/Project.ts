import mongoose, { Schema, Document } from "mongoose";

export interface IProject {
  title: string;
  description: string;
  image: string;
  order: number;
  url?: string;
  technologies?: string[];
  category?: string;
  featured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Název projektu je povinný"],
      trim: true,
      maxlength: [100, "Název může mít maximálně 100 znaků"],
    },
    description: {
      type: String,
      required: [true, "Popis projektu je povinný"],
      trim: true,
      maxlength: [500, "Popis může mít maximálně 500 znaků"],
    },
    image: {
      type: String,
      required: [true, "Obrázek je povinný"],
    },
    order: {
      type: Number,
      required: [true, "Pořadí je povinné"],
      min: [1, "Pořadí musí být minimálně 1"],
    },
    url: {
      type: String,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // URL je volitelné
          return /^https?:\/\/.+/.test(v);
        },
        message: "URL musí být ve správném formátu",
      },
    },
    technologies: [
      {
        type: String,
        trim: true,
      },
    ],
    category: {
      type: String,
      enum: ["web", "e-shop", "aplikace", "rezervace", "prezentace"],
      default: "web",
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Index pro rychlé vyhledávání
ProjectSchema.index({ order: 1 });
ProjectSchema.index({ featured: -1, order: 1 });
ProjectSchema.index({ category: 1, order: 1 });

// Model se automaticky vytvoří v databázi specifikované v mongoose připojení
const Project =
  mongoose.models.Project || mongoose.model("Project", ProjectSchema);

export default Project;
