import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Recipe, Category, AppState } from '../types';

interface ChefBookDB extends DBSchema {
  recipes: {
    key: string;
    value: Recipe;
  };
  categories: {
    key: string;
    value: Category;
  };
}

export class IndexedDBStorageService {
  private static db: IDBPDatabase<ChefBookDB> | null = null;

  private static async getDB(): Promise<IDBPDatabase<ChefBookDB>> {
    if (!this.db) {
      this.db = await openDB<ChefBookDB>('chefbook-db', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('recipes')) {
            db.createObjectStore('recipes', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('categories')) {
            db.createObjectStore('categories', { keyPath: 'id' });
          }
        },
      });
    }
    return this.db;
  }

  // Recipes
  static async getRecipes(): Promise<Recipe[]> {
    try {
      console.log('🗄️ IndexedDB: Getting recipes from IndexedDB');
      const db = await this.getDB();
      const recipes = await db.getAll('recipes');
      console.log('🗄️ IndexedDB: Found', recipes.length, 'recipes');
      recipes.forEach(recipe => {
        console.log('🗄️ IndexedDB: Recipe:', recipe.title, 'Image length:', recipe.image?.length || 0);
      });
      return recipes;
    } catch (error) {
      console.error('❌ IndexedDB: Error getting recipes:', error);
      return [];
    }
  }

  static async saveRecipes(recipes: Recipe[]): Promise<void> {
    try {
      console.log('💾 IndexedDB: Saving', recipes.length, 'recipes to IndexedDB');
      const db = await this.getDB();
      const tx = db.transaction('recipes', 'readwrite');
      await tx.store.clear();
      for (const recipe of recipes) {
        console.log('💾 IndexedDB: Saving recipe:', recipe.title, 'Image length:', recipe.image?.length || 0);
        await tx.store.put(recipe);
      }
      await tx.done;
      console.log('✅ IndexedDB: Recipes saved successfully');
    } catch (error) {
      console.error('❌ IndexedDB: Error saving recipes:', error);
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
      console.log('🗄️ IndexedDB: Getting categories from IndexedDB');
      const db = await this.getDB();
      const categories = await db.getAll('categories');
      console.log('🗄️ IndexedDB: Found', categories.length, 'categories');
      return categories
        .map(category => ({
          ...category,
          order: category.order || 0,
        }))
        .sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error('❌ IndexedDB: Error getting categories:', error);
      return [];
    }
  }

  static async saveCategories(categories: Category[]): Promise<void> {
    try {
      console.log('💾 IndexedDB: Saving', categories.length, 'categories to IndexedDB');
      const db = await this.getDB();
      const tx = db.transaction('categories', 'readwrite');
      await tx.store.clear();
      for (const category of categories) {
        await tx.store.put(category);
      }
      await tx.done;
      console.log('✅ IndexedDB: Categories saved successfully');
    } catch (error) {
      console.error('❌ IndexedDB: Error saving categories:', error);
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

      const remainingCategories = categories.filter(cat => !categoryIds.includes(cat.id));
      const allCategories = [...reorderedCategories, ...remainingCategories];

      await this.saveCategories(allCategories);
    } catch (error) {
      console.error('❌ IndexedDB: Error reordering categories:', error);
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
    try {
      const db = await this.getDB();
      await db.clear('recipes');
      await db.clear('categories');
      console.log('✅ IndexedDB: All data cleared');
    } catch (error) {
      console.error('❌ IndexedDB: Error clearing data:', error);
      throw error;
    }
  }
}
