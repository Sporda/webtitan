export interface ProjectData {
  _id: string;
  title: string;
  description: string;
  image: string;
  order: number;
  url?: string;
  technologies?: string[];
  category?: "web" | "e-shop" | "aplikace" | "rezervace" | "prezentace";
  featured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectInput {
  title: string;
  description: string;
  image: string;
  order: number;
  url?: string;
  technologies?: string[];
  category?: "web" | "e-shop" | "aplikace" | "rezervace" | "prezentace";
  featured?: boolean;
}

export interface ProjectFilterInput {
  category?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}
