import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Recipe, Category } from '../types';
import { colors } from '../constants/colors';
import { Dimensions } from 'react-native';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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

  static async shareRecipeAsPDF(recipe: Recipe, category?: Category): Promise<void> {
    try {
      const base64Pdf = await this.generateRecipePdf(recipe, category);
      const filePath = `${FileSystem.cacheDirectory}recipe_${recipe.id}_${Date.now()}.pdf`;
      await FileSystem.writeAsStringAsync(filePath, base64Pdf, {
        encoding: 'base64',
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/pdf',
          dialogTitle: `Partager la recette: ${recipe.title}`,
        });
      } else {
        throw new Error('Le partage n\'est pas disponible sur cet appareil');
      }
    } catch (error) {
      console.error('Error generating PDF recipe:', error);
      console.log('Falling back to text sharing...');
      await this.shareAsTextNative(recipe, category);
    }
  }

  private static formatPrepTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0 && remainingMinutes > 0) {
      return `${hours}h${remainingMinutes.toString().padStart(2, '0')}`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes} min`;
    }
  }

  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private static async generateRecipePdf(recipe: Recipe, category?: Category): Promise<string> {
    const pdfDoc = await PDFDocument.create();
    const pageSize: [number, number] = [595.28, 841.89];
    let page = pdfDoc.addPage(pageSize);
    const margin = 36;
    let cursorY = page.getHeight() - margin;

    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    const textColor = rgb(0.1, 0.1, 0.1);
    const secondaryColor = rgb(0.4, 0.4, 0.4);

    const addPage = () => {
      page = pdfDoc.addPage(pageSize);
      cursorY = page.getHeight() - margin;
    };

    const ensureSpace = (needed: number) => {
      if (cursorY - needed < margin) {
        addPage();
      }
    };

    const drawTextLine = (
      text: string,
      { font, size, color = textColor }: { font: any; size: number; color?: ReturnType<typeof rgb> },
    ) => {
      ensureSpace(size + 6);
      cursorY -= size;
      page.drawText(text, {
        x: margin,
        y: cursorY,
        size,
        font,
        color,
      });
      cursorY -= 6;
    };

    drawTextLine(recipe.title, { font: titleFont, size: 24 });

    const metaParts: string[] = [];
    if (category) {
      metaParts.push(category.name);
    }
    if (recipe.prepTime && recipe.prepTime > 0) {
      metaParts.push(this.formatPrepTime(recipe.prepTime));
    }
    if (metaParts.length > 0) {
      drawTextLine(metaParts.join(' • '), { font: italicFont, size: 12, color: secondaryColor });
    }

    if (recipe.image) {
      const embeddedImage = await this.embedImage(pdfDoc, recipe.image);
      if (embeddedImage) {
        const maxWidth = page.getWidth() - margin * 2;
        const maxHeight = 220;
        const { width: imgW, height: imgH } = embeddedImage.scale(1);
        const scale = Math.min(maxWidth / imgW, maxHeight / imgH, 1);
        const drawnWidth = imgW * scale;
        const drawnHeight = imgH * scale;

        ensureSpace(drawnHeight + 16);
        page.drawImage(embeddedImage, {
          x: margin,
          y: cursorY - drawnHeight,
          width: drawnWidth,
          height: drawnHeight,
        });
        cursorY -= drawnHeight + 24;
      }
    }

    drawTextLine('Ingrédients', { font: titleFont, size: 18 });
    for (const ingredient of recipe.ingredients) {
      const lines = this.wrapText(ingredient, regularFont, 12, page.getWidth() - margin * 2 - 14);
      lines.forEach((line, index) => {
        const prefix = index === 0 ? '• ' : '  ';
        drawTextLine(`${prefix}${line}`, { font: regularFont, size: 12 });
      });
    }

    cursorY -= 10;
    drawTextLine('Instructions', { font: titleFont, size: 18 });
    recipe.instructions.forEach((instruction, stepIndex) => {
      const lines = this.wrapText(instruction, regularFont, 12, page.getWidth() - margin * 2 - 20);
      lines.forEach((line, lineIndex) => {
        const prefix = lineIndex === 0 ? `${stepIndex + 1}. ` : '    ';
        drawTextLine(`${prefix}${line}`, { font: regularFont, size: 12 });
      });
    });

    ensureSpace(32);
    const footerY = margin + 12;
    page.drawLine({
      start: { x: margin, y: footerY + 6 },
      end: { x: page.getWidth() - margin, y: footerY + 6 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    page.drawText('RecetteApp', {
      x: margin,
      y: footerY,
      size: 10,
      font: regularFont,
      color: secondaryColor,
    });
    const dateText = new Date().toLocaleDateString('fr-FR');
    page.drawText(dateText, {
      x: page.getWidth() - margin - regularFont.widthOfTextAtSize(dateText, 10),
      y: footerY,
      size: 10,
      font: regularFont,
      color: secondaryColor,
    });

    return pdfDoc.saveAsBase64({ dataUri: false });
  }

  private static wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(candidate, fontSize);
      if (width <= maxWidth) {
        currentLine = candidate;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private static async embedImage(pdfDoc: PDFDocument, imageUri: string) {
    try {
      let base64: string | null = null;
      let mimeType: string | null = null;
      let tempFile: string | undefined;

      if (imageUri.startsWith('data:')) {
        const match = imageUri.match(/^data:(.+);base64,(.*)$/);
        if (match) {
          mimeType = match[1];
          base64 = match[2];
        }
      } else {
        let uriToRead = imageUri;

        base64 = await FileSystem.readAsStringAsync(uriToRead, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const extension = uriToRead.split('.').pop()?.toLowerCase();
        if (extension === 'png') {
          mimeType = 'image/png';
        } else {
          mimeType = 'image/jpeg';
        }
      }

      if (!base64) {
        return null;
      }

      if (mimeType === 'image/png') {
        return await pdfDoc.embedPng(base64);
      }
      return await pdfDoc.embedJpg(base64);
    } catch (error) {
      console.error('Error reading image for PDF:', error);
      return null;
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
    const metaParts: string[] = [];
    if (category) {
      metaParts.push(`📂 ${category.name}`);
    }
    if (recipe.prepTime && recipe.prepTime > 0) {
      metaParts.push(`⏱️ ${this.formatPrepTime(recipe.prepTime)}`);
    }

    const metaLine = metaParts.length > 0 ? metaParts.join(' • ') : '';

    return `
🍽️ ${recipe.title}
${metaLine}

📋 INGRÉDIENTS:
${recipe.ingredients.map((ingredient) => `• ${ingredient}`).join('\n')}

👨‍🍳 INSTRUCTIONS:
${recipe.instructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n')}

---
Créé avec RecetteApp
${new Date().toLocaleDateString('fr-FR')}
    `.trim();
  }
}
