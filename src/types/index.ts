export interface Recipe {
  id: string;
  title: string;
  image?: string;
  category: string;
  prepTime: number; // en minutes
  ingredients: string[];
  instructions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  order: number;
  createdAt: Date;
}

export interface AppState {
  recipes: Recipe[];
  categories: Category[];
}
