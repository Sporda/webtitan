import mongoose, { Schema, Document, Types, Model } from "mongoose";

export interface IArticle extends Document {
  title: string;
  slug: string;
  content: string;
  imageUrl?: string;
  categories: Types.ObjectId[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    imageUrl: { type: String },
    categories: [
      { type: Schema.Types.ObjectId, ref: "Category", required: true },
    ],
    tags: [{ type: String }],
  },
  { timestamps: true },
);

ArticleSchema.pre("validate", function (next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
  }
  next();
});

const Article =
  (mongoose.models.Article as Model<IArticle>) ||
  mongoose.model<IArticle>("Arcticle", ArticleSchema);

export default Article;
