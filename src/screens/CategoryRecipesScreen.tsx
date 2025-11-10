import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../constants/colors';
import { Recipe, Category } from '../types';
import { AdaptiveStorageService as StorageService } from '../services/adaptiveStorage';

interface Props {
  navigation: any;
  route: {
    params: {
      category: Category;
    };
  };
}

const formatPrepTime = (minutes: number): string | null => {
  if (!minutes || minutes <= 0) {
    return null;
  }
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

interface RecipeItemProps {
  recipe: Recipe;
  onPress: () => void;
  onDelete: () => void;
}

const RecipeItem: React.FC<RecipeItemProps> = ({ recipe, onPress, onDelete }) => {
  const prepTimeText = formatPrepTime(recipe.prepTime);
  return (
    <TouchableOpacity style={styles.recipeCard} onPress={onPress}>
      <View style={styles.recipeImageContainer}>
        {recipe.image ? (
          <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="restaurant" size={24} color={colors.textSecondary} />
          </View>
        )}
      </View>
      
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeTitle} numberOfLines={2}>
          {recipe.title}
        </Text>
        
        <View style={styles.recipeMeta}>
          {prepTimeText && (
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.timeText}>{prepTimeText}</Text>
            </View>
          )}
          
          <View style={styles.ingredientsContainer}>
            <Ionicons name="list-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.ingredientsText}>{recipe.ingredients.length} ingrédients</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={onDelete}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={16} color={colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const CategoryRecipesScreen: React.FC<Props> = ({ navigation, route }) => {
  const { category } = route.params;
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadRecipes = async () => {
    try {
      const allRecipes = await StorageService.getRecipes();
      const categoryRecipes = allRecipes.filter(recipe => recipe.category === category.id);
      setRecipes(categoryRecipes);
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRecipes();
    }, [category.id])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRecipes();
    setRefreshing(false);
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    Alert.alert(
      'Supprimer la recette',
      'Êtes-vous sûr de vouloir supprimer cette recette ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteRecipe(recipeId);
              await loadRecipes();
            } catch (error) {
              console.error('Error deleting recipe:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la recette');
            }
          },
        },
      ]
    );
  };

  const handleAddRecipe = () => {
    navigation.navigate('RecipeForm', { 
      categoryId: category.id,
      categoryName: category.name 
    });
  };

  const filterRecipes = (recipes: Recipe[], query: string) => {
    if (!query.trim()) return recipes;
    
    const lowercaseQuery = query.toLowerCase();
    return recipes.filter(recipe => 
      recipe.title.toLowerCase().includes(lowercaseQuery) ||
      recipe.ingredients.some(ingredient => 
        ingredient.toLowerCase().includes(lowercaseQuery)
      ) ||
      recipe.instructions.some(instruction => 
        instruction.toLowerCase().includes(lowercaseQuery)
      )
    );
  };

  const filteredRecipes = filterRecipes(recipes, searchQuery);

  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <RecipeItem
      recipe={item}
      onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
      onDelete={() => handleDeleteRecipe(item.id)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="restaurant-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>Aucune recette</Text>
      <Text style={styles.emptySubtitle}>
        Commencez par ajouter votre première recette dans cette catégorie
      </Text>
      <TouchableOpacity style={styles.addButton} onPress={handleAddRecipe}>
        <Ionicons name="add" size={20} color={colors.text} />
        <Text style={styles.addButtonText}>Ajouter une recette</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={[styles.categoryColor, { backgroundColor: category.color }]} />
          <Text style={styles.headerTitle}>{category.name}</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddRecipe}>
          <Ionicons name="add" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher dans cette catégorie..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Recipes List */}
      <FlatList
        data={filteredRecipes}
        renderItem={renderRecipeItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  recipeCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    width: '48%',
    position: 'relative',
  },
  recipeImageContainer: {
    position: 'relative',
    height: 120,
  },
  recipeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeInfo: {
    padding: 12,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  recipeMeta: {
    flexDirection: 'column',
    gap: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginLeft: 4,
  },
  ingredientsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingredientsText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginLeft: 4,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
});

export default CategoryRecipesScreen;
