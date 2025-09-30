import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, Category, AppState } from '../types';

const STORAGE_KEYS = {
  RECIPES: 'recipes',
  CATEGORIES: 'categories',
};

export class StorageService {
  // Recipes
  static async getRecipes(): Promise<Recipe[]> {
    try {
      const recipesJson = await AsyncStorage.getItem(STORAGE_KEYS.RECIPES);
      if (recipesJson) {
        const recipes = JSON.parse(recipesJson);
        return recipes.map((recipe: any) => ({
          ...recipe,
          createdAt: new Date(recipe.createdAt),
          updatedAt: new Date(recipe.updatedAt),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting recipes:', error);
      return [];
    }
  }

  static async saveRecipes(recipes: Recipe[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
    } catch (error) {
      console.error('Error saving recipes:', error);
      throw error;
    }
  }

  static async addRecipe(recipe: Recipe): Promise<void> {
    const recipes = await this.getRecipes();
    recipes.push(recipe);
    await this.saveRecipes(recipes);
  }

  static async updateRecipe(updatedRecipe: Recipe): Promise<void> {
    const recipes = await this.getRecipes();
    const index = recipes.findIndex(recipe => recipe.id === updatedRecipe.id);
    if (index !== -1) {
      recipes[index] = updatedRecipe;
      await this.saveRecipes(recipes);
    }
  }

  static async deleteRecipe(recipeId: string): Promise<void> {
    const recipes = await this.getRecipes();
    const filteredRecipes = recipes.filter(recipe => recipe.id !== recipeId);
    await this.saveRecipes(filteredRecipes);
  }

  // Categories
  static async getCategories(): Promise<Category[]> {
    try {
      const categoriesJson = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (categoriesJson) {
        const categories = JSON.parse(categoriesJson);
        return categories
          .map((category: any) => ({
            ...category,
            createdAt: new Date(category.createdAt),
            order: category.order || 0, // Fallback pour les anciennes catégories
          }))
          .sort((a: Category, b: Category) => a.order - b.order);
      }
      return [];
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  static async saveCategories(categories: Category[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving categories:', error);
      throw error;
    }
  }

  static async addCategory(category: Category): Promise<void> {
    const categories = await this.getCategories();
    categories.push(category);
    await this.saveCategories(categories);
  }

  static async updateCategory(updatedCategory: Category): Promise<void> {
    const categories = await this.getCategories();
    const index = categories.findIndex(category => category.id === updatedCategory.id);
    if (index !== -1) {
      categories[index] = updatedCategory;
      await this.saveCategories(categories);
    }
  }

  static async deleteCategory(categoryId: string): Promise<void> {
    const categories = await this.getCategories();
    const filteredCategories = categories.filter(category => category.id !== categoryId);
    await this.saveCategories(filteredCategories);
  }

  static async reorderCategories(categoryIds: string[]): Promise<void> {
    try {
      const categories = await this.getCategories();
      const reorderedCategories = categoryIds.map((id, index) => {
        const category = categories.find(cat => cat.id === id);
        if (category) {
          return { ...category, order: index };
        }
        return null;
      }).filter(Boolean) as Category[];

      // Ajouter les catégories qui ne sont pas dans la liste (au cas où)
      const remainingCategories = categories.filter(cat => !categoryIds.includes(cat.id));
      const allCategories = [...reorderedCategories, ...remainingCategories];

      await this.saveCategories(allCategories);
    } catch (error) {
      console.error('Error reordering categories:', error);
      throw error;
    }
  }


  // App State
  static async getAppState(): Promise<AppState> {
    const [recipes, categories] = await Promise.all([
      this.getRecipes(),
      this.getCategories(),
    ]);
    return { recipes, categories };
  }

  static async clearAllData(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.RECIPES),
      AsyncStorage.removeItem(STORAGE_KEYS.CATEGORIES),
    ]);
  }
}
