import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IAdmin extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  password: string;
  email?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AdminSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Uživatelské jméno je povinné"],
      unique: true,
      trim: true,
      minlength: [3, "Uživatelské jméno musí mít alespoň 3 znaky"],
      maxlength: [30, "Uživatelské jméno může mít maximálně 30 znaků"],
    },
    password: {
      type: String,
      required: [true, "Heslo je povinné"],
      minlength: [6, "Heslo musí mít alespoň 6 znaků"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Email je volitelný
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Email musí být ve správném formátu",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Hash heslo před uložením
AdminSchema.pre<IAdmin>("save", async function (next) {
  // Pouze hash nové nebo změněné heslo
  if (!this.isModified("password")) return next();

  try {
    // Hash heslo s cost 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Metoda pro porovnání hesla
AdminSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Index pro rychlé vyhledávání
AdminSchema.index({ username: 1 });
AdminSchema.index({ email: 1 });

const Admin =
  mongoose.models.Admin || mongoose.model<IAdmin>("Admin", AdminSchema);

export default Admin as mongoose.Model<IAdmin>;
