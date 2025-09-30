import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Recipe, Category } from '../types';
import { colors } from '../constants/colors';
import { Dimensions } from 'react-native';
import ViewShot from 'react-native-view-shot';

const { width } = Dimensions.get('window');

export class ShareService {
  static async generateAndShareRecipe(recipe: Recipe, category?: Category): Promise<void> {
    try {
      const filePath = await this.generateRecipeImage(recipe, category);
      
      if (await Sharing.isAvailableAsync()) {
        // Determine MIME type based on file extension
        const mimeType = filePath.endsWith('.svg') ? 'image/svg+xml' : 'text/plain';
        
        await Sharing.shareAsync(filePath, {
          mimeType,
          dialogTitle: `Partager la recette: ${recipe.title}`,
        });
      } else {
        throw new Error('Le partage n\'est pas disponible sur cet appareil');
      }
    } catch (error) {
      console.error('Error sharing recipe:', error);
      throw error;
    }
  }

  static async captureAndShareRecipe(
    viewShotRef: React.RefObject<ViewShot>,
    recipe: Recipe,
    category?: Category
  ): Promise<void> {
    try {
      if (!viewShotRef.current) {
        throw new Error('ViewShot ref not available');
      }

      // Essayer de capturer avec différentes options
      const captureOptions = {
        format: 'png' as const,
        quality: 0.8,
        result: 'tmpfile' as const,
      };

      const uri = await viewShotRef.current.capture(captureOptions);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Partager la recette: ${recipe.title}`,
        });
      } else {
        throw new Error('Le partage n\'est pas disponible sur cet appareil');
      }
    } catch (error) {
      console.error('Error capturing and sharing recipe:', error);
      
      // Fallback vers le partage de texte si la capture d'image échoue
      console.log('Falling back to text sharing...');
      await this.shareAsTextNative(recipe, category);
    }
  }

  private static async generateRecipeImage(recipe: Recipe, category?: Category): Promise<string> {
    const { height: screenHeight } = Dimensions.get('window');
    const imageWidth = Math.min(width - 40, 400);
    const imageHeight = Math.min(screenHeight * 0.8, 600);

    // Create a more sophisticated SVG with better layout
    const svgContent = this.createRecipeSVG(recipe, category, imageWidth, imageHeight);

    // Save SVG to file with proper error handling
    const fileName = `recipe_${recipe.id}_${Date.now()}.svg`;
    const svgPath = `${FileSystem.documentDirectory}${fileName}`;
    
    try {
      await FileSystem.writeAsStringAsync(svgPath, svgContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      return svgPath;
    } catch (error) {
      console.error('Error writing SVG file:', error);
      // Fallback: create a text file instead
      const textContent = this.generateRecipeText(recipe, category);
      const textPath = `${FileSystem.documentDirectory}recipe_${recipe.id}_${Date.now()}.txt`;
      await FileSystem.writeAsStringAsync(textPath, textContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      return textPath;
    }
  }

  private static createRecipeSVG(recipe: Recipe, category?: Category, width: number, height: number): string {
    const headerHeight = 100;
    const imageHeight = 200;
    const padding = 20;
    const contentWidth = width - (padding * 2);
    
    // Calculate content height
    const ingredientsHeight = Math.max(recipe.ingredients.length * 25, 100);
    const instructionsHeight = Math.max(recipe.instructions.length * 40, 120);
    const totalContentHeight = headerHeight + imageHeight + ingredientsHeight + instructionsHeight + 200;
    
    const finalHeight = Math.max(totalContentHeight, height);

    return `
      <svg width="${width}" height="${finalHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0F0F0F;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1A1A1A;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="header" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:${category?.color || colors.primary};stop-opacity:0.2" />
            <stop offset="100%" style="stop-color:${category?.color || colors.primary};stop-opacity:0.1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="100%" height="100%" fill="url(#bg)"/>
        
        <!-- Header -->
        <rect x="0" y="0" width="100%" height="${headerHeight}" fill="url(#header)"/>
        <text x="${padding}" y="35" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="${colors.text}">${this.escapeXml(recipe.title)}</text>
        <text x="${padding}" y="65" font-family="Arial, sans-serif" font-size="16" fill="${colors.textSecondary}">${this.escapeXml(category?.name || 'Sans catégorie')} • ${recipe.prepTime} minutes</text>
        
        <!-- Recipe Image -->
        ${recipe.image ? `
          <image x="${padding}" y="${headerHeight + 20}" width="${contentWidth}" height="${imageHeight}" href="${recipe.image}" preserveAspectRatio="xMidYMid slice"/>
        ` : `
          <rect x="${padding}" y="${headerHeight + 20}" width="${contentWidth}" height="${imageHeight}" fill="${colors.surfaceVariant}" stroke="${colors.border}" stroke-width="2" stroke-dasharray="5,5"/>
          <text x="${width/2}" y="${headerHeight + 20 + imageHeight/2}" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="${colors.textSecondary}">Aucune image</text>
        `}
        
        <!-- Ingredients Section -->
        <text x="${padding}" y="${headerHeight + imageHeight + 60}" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="${colors.text}">Ingrédients</text>
        ${recipe.ingredients.map((ingredient, index) => `
          <text x="${padding + 20}" y="${headerHeight + imageHeight + 90 + index * 25}" font-family="Arial, sans-serif" font-size="14" fill="${colors.text}">• ${this.escapeXml(ingredient)}</text>
        `).join('')}
        
        <!-- Instructions Section -->
        <text x="${padding}" y="${headerHeight + imageHeight + ingredientsHeight + 120}" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="${colors.text}">Instructions</text>
        ${recipe.instructions.map((instruction, index) => `
          <text x="${padding + 20}" y="${headerHeight + imageHeight + ingredientsHeight + 150 + index * 40}" font-family="Arial, sans-serif" font-size="14" fill="${colors.text}">${index + 1}. ${this.escapeXml(instruction)}</text>
        `).join('')}
        
        <!-- Footer -->
        <rect x="0" y="${finalHeight - 40}" width="100%" height="40" fill="${colors.surface}"/>
        <text x="${padding}" y="${finalHeight - 15}" font-family="Arial, sans-serif" font-size="12" fill="${colors.textSecondary}">Créé avec RecetteApp</text>
        <text x="${width - padding}" y="${finalHeight - 15}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="${colors.textSecondary}">${new Date().toLocaleDateString('fr-FR')}</text>
      </svg>
    `;
  }

  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  static async shareAsText(recipe: Recipe, category?: Category): Promise<void> {
    const text = this.generateRecipeText(recipe, category);
    
    if (await Sharing.isAvailableAsync()) {
      // Create a temporary text file
      const textPath = `${FileSystem.documentDirectory}recipe_${recipe.id}_${Date.now()}.txt`;
      await FileSystem.writeAsStringAsync(textPath, text, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      await Sharing.shareAsync(textPath, {
        mimeType: 'text/plain',
        dialogTitle: `Partager la recette: ${recipe.title}`,
      });
    } else {
      throw new Error('Le partage n\'est pas disponible sur cet appareil');
    }
  }

  // Alternative method using React Native's built-in Share
  static async shareAsTextNative(recipe: Recipe, category?: Category): Promise<void> {
    const { Share } = require('react-native');
    const text = this.generateRecipeText(recipe, category);
    
    try {
      await Share.share({
        message: text,
        title: `Recette: ${recipe.title}`,
      });
    } catch (error) {
      console.error('Error sharing with native Share:', error);
      throw error;
    }
  }

  private static generateRecipeText(recipe: Recipe, category?: Category): string {
    return `
🍽️ ${recipe.title}
${category ? `📂 ${category.name}` : ''} • ⏱️ ${recipe.prepTime} minutes

📋 INGRÉDIENTS:
${recipe.ingredients.map((ingredient, index) => `• ${ingredient}`).join('\n')}

👨‍🍳 INSTRUCTIONS:
${recipe.instructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n')}

---
Créé avec RecetteApp
${new Date().toLocaleDateString('fr-FR')}
    `.trim();
  }
}
