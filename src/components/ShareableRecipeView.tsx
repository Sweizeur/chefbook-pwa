import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { Recipe, Category } from '../types';
import { colors } from '../constants/colors';

const { width } = Dimensions.get('window');
const SHARE_WIDTH = 400;
const SHARE_HEIGHT = 800;

interface ShareableRecipeViewProps {
  recipe: Recipe;
  category?: Category;
}

const ShareableRecipeView: React.FC<ShareableRecipeViewProps> = ({ recipe, category }) => {
  const formatPrepTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0 && remainingMinutes > 0) {
      return `${hours}h${remainingMinutes.toString().padStart(2, '0')}`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes} min`;
    }
  };

  // Utiliser une hauteur fixe généreuse pour éviter les problèmes de capture
  const getOptimalHeight = (): number => {
    const baseHeight = 800; // Hauteur de base
    const ingredientsCount = recipe.ingredients.length;
    const instructionsCount = recipe.instructions.length;
    
    // Ajouter de la hauteur basée sur le nombre d'éléments
    const additionalHeight = (ingredientsCount * 30) + (instructionsCount * 40);
    
    // Limiter la hauteur maximale pour éviter les problèmes de capture
    const maxHeight = 2000;
    const calculatedHeight = baseHeight + additionalHeight;
    
    return Math.min(calculatedHeight, maxHeight);
  };

  const optimalHeight = getOptimalHeight();

  return (
    <View style={[styles.container, { height: optimalHeight }]}>
      {/* Header with neutral background */}
      <View style={styles.header}>
        <Text style={styles.title}>{recipe.title}</Text>
        <View style={styles.headerInfo}>
          <View style={styles.categoryContainer}>
            <View style={[styles.categoryDot, { backgroundColor: category?.color || colors.primary }]} />
            <Text style={styles.categoryText}>{category?.name || 'Sans catégorie'}</Text>
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeIcon}>⏱️</Text>
            <Text style={styles.timeText}>{formatPrepTime(recipe.prepTime)}</Text>
          </View>
        </View>
      </View>

      {/* Recipe Image - Full width */}
      {recipe.image ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderIcon}>🍽️</Text>
          <Text style={styles.placeholderText}>Aucune image</Text>
        </View>
      )}

      {/* Content Grid */}
      <View style={styles.contentGrid}>
        {/* Left Column - Ingredients */}
        <View style={styles.leftColumn}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📋</Text>
            <Text style={styles.sectionTitle}>Ingrédients</Text>
          </View>
          <View style={styles.ingredientsList}>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.ingredientText}>{ingredient}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Right Column - Instructions */}
        <View style={styles.rightColumn}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>👨‍🍳</Text>
            <Text style={styles.sectionTitle}>Instructions</Text>
          </View>
          <View style={styles.instructionsList}>
            {recipe.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Footer with branding */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <Text style={styles.footerBrand}>🍳 RecetteApp</Text>
          <Text style={styles.footerDate}>{new Date().toLocaleDateString('fr-FR')}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SHARE_WIDTH,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  header: {
    backgroundColor: colors.surface,
    padding: 20,
    paddingTop: 25,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  timeText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  imageContainer: {
    height: 180,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    height: 180,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  contentGrid: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  leftColumn: {
    flex: 1,
    marginRight: 8,
  },
  rightColumn: {
    flex: 1,
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  ingredientsList: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    flex: 1,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bullet: {
    color: colors.primary,
    fontSize: 14,
    marginRight: 6,
    marginTop: 2,
    fontWeight: 'bold',
  },
  ingredientText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
  instructionsList: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    flex: 1,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 1,
  },
  stepNumberText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  instructionText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
  footer: {
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerBrand: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  footerDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default ShareableRecipeView;
