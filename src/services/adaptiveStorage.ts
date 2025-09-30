import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebStorageService } from './webStorage';
import { Recipe, Category, AppState } from '../types';

// Service de stockage adaptatif qui utilise AsyncStorage sur mobile et localStorage sur web
export class AdaptiveStorageService {
  private static isWeb = Platform.OS === 'web';

  // Recipes
  static async getRecipes(): Promise<Recipe[]> {
    if (this.isWeb) {
      return WebStorageService.getRecipes();
    } else {
      // Import dynamique pour éviter les erreurs sur web
      const { StorageService } = await import('./storage');
      return StorageService.getRecipes();
    }
  }

  static async saveRecipes(recipes: Recipe[]): Promise<void> {
    if (this.isWeb) {
      return WebStorageService.saveRecipes(recipes);
    } else {
      const { StorageService } = await import('./storage');
      return StorageService.saveRecipes(recipes);
    }
  }

  static async addRecipe(recipe: Recipe): Promise<void> {
    if (this.isWeb) {
      return WebStorageService.addRecipe(recipe);
    } else {
      const { StorageService } = await import('./storage');
      return StorageService.addRecipe(recipe);
    }
  }

  static async updateRecipe(updatedRecipe: Recipe): Promise<void> {
    if (this.isWeb) {
      return WebStorageService.updateRecipe(updatedRecipe);
    } else {
      const { StorageService } = await import('./storage');
      return StorageService.updateRecipe(updatedRecipe);
    }
  }

  static async deleteRecipe(recipeId: string): Promise<void> {
    if (this.isWeb) {
      return WebStorageService.deleteRecipe(recipeId);
    } else {
      const { StorageService } = await import('./storage');
      return StorageService.deleteRecipe(recipeId);
    }
  }

  // Categories
  static async getCategories(): Promise<Category[]> {
    if (this.isWeb) {
      return WebStorageService.getCategories();
    } else {
      const { StorageService } = await import('./storage');
      return StorageService.getCategories();
    }
  }

  static async saveCategories(categories: Category[]): Promise<void> {
    if (this.isWeb) {
      return WebStorageService.saveCategories(categories);
    } else {
      const { StorageService } = await import('./storage');
      return StorageService.saveCategories(categories);
    }
  }

  static async addCategory(category: Category): Promise<void> {
    if (this.isWeb) {
      return WebStorageService.addCategory(category);
    } else {
      const { StorageService } = await import('./storage');
      return StorageService.addCategory(category);
    }
  }

  static async updateCategory(updatedCategory: Category): Promise<void> {
    if (this.isWeb) {
      return WebStorageService.updateCategory(updatedCategory);
    } else {
      const { StorageService } = await import('./storage');
      return StorageService.updateCategory(updatedCategory);
    }
  }

  static async deleteCategory(categoryId: string): Promise<void> {
    if (this.isWeb) {
      return WebStorageService.deleteCategory(categoryId);
    } else {
      const { StorageService } = await import('./storage');
      return StorageService.deleteCategory(categoryId);
    }
  }

  static async reorderCategories(categoryIds: string[]): Promise<void> {
    if (this.isWeb) {
      return WebStorageService.reorderCategories(categoryIds);
    } else {
      const { StorageService } = await import('./storage');
      return StorageService.reorderCategories(categoryIds);
    }
  }

  // App State
  static async getAppState(): Promise<AppState> {
    if (this.isWeb) {
      return WebStorageService.getAppState();
    } else {
      const { StorageService } = await import('./storage');
      return StorageService.getAppState();
    }
  }

  static async clearAllData(): Promise<void> {
    if (this.isWeb) {
      return WebStorageService.clearAllData();
    } else {
      const { StorageService } = await import('./storage');
      return StorageService.clearAllData();
    }
  }
}
