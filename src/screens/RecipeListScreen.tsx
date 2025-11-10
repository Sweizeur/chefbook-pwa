import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  RefreshControl,
  TextInput,
  FlatList,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { Recipe, Category } from '../types';
import { AdaptiveStorageService as StorageService } from '../services/adaptiveStorage';
import { RootStackParamList } from '../navigation/AppNavigator';
import { StackNavigationProp } from '@react-navigation/stack';

type RecipeListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: RecipeListScreenNavigationProp;
}

interface RecipeItemProps {
  recipe: Recipe;
  categories: Category[];
  onPress: () => void;
  onDelete: () => void;
}

interface CategoryHeaderProps {
  category: Category;
  recipeCount: number;
  isCollapsed: boolean;
  onToggle: () => void;
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

const CategoryHeader: React.FC<CategoryHeaderProps> = ({ category, recipeCount, isCollapsed, onToggle }) => {
  const navigation = useNavigation();
  
  return (
    <View style={styles.categoryHeader}>
      <TouchableOpacity 
        style={styles.categoryHeaderInfo}
        onPress={() => navigation.navigate('CategoryRecipes', { category })}
      >
        <Text style={styles.categoryHeaderName}>{category.name}</Text>
        <Text style={styles.categoryHeaderCount}>{recipeCount}</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.categoryToggleButton} 
        onPress={onToggle}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons 
          name={isCollapsed ? "chevron-down" : "chevron-up"} 
          size={16} 
          color={colors.textSecondary} 
        />
      </TouchableOpacity>
    </View>
  );
};

const RecipeItem: React.FC<RecipeItemProps> = ({ recipe, categories, onPress, onDelete }) => {
  const category = categories.find(cat => cat.id === recipe.category);
  const prepTimeText = formatPrepTime(recipe.prepTime);
  
  return (
    <TouchableOpacity style={styles.recipeCard} onPress={onPress}>
      <View style={styles.recipeImageContainer}>
        {recipe.image ? (
          <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="restaurant" size={20} color={colors.textSecondary} />
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

const RecipeListScreen: React.FC<Props> = ({ navigation }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      const [recipesData, categoriesData] = await Promise.all([
        StorageService.getRecipes(),
        StorageService.getCategories(),
      ]);
      
      // Trier les recettes par catégorie selon l'ordre des catégories
      const sortedRecipes = recipesData.sort((a, b) => {
        const categoryA = categoriesData.find(cat => cat.id === a.category);
        const categoryB = categoriesData.find(cat => cat.id === b.category);
        
        if (!categoryA && !categoryB) return 0;
        if (!categoryA) return 1;
        if (!categoryB) return -1;
        
        return categoryA.order - categoryB.order;
      });
      
      setRecipes(sortedRecipes);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDeleteRecipe = (recipeId: string) => {
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
              await loadData();
            } catch (error) {
              console.error('Error deleting recipe:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la recette');
            }
          },
        },
      ]
    );
  };

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
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

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <RecipeItem
      recipe={item}
      categories={categories}
      onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
      onDelete={() => handleDeleteRecipe(item.id)}
    />
  );

  // Grouper les recettes par catégorie
  const groupedRecipes = recipes.reduce((acc, recipe) => {
    const categoryId = recipe.category;
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(recipe);
    return acc;
  }, {} as Record<string, Recipe[]>);

  // Rendu d'une recette pour la grille
  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <RecipeItem
      recipe={item}
      categories={categories}
      onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
      onDelete={() => handleDeleteRecipe(item.id)}
    />
  );

  // Créer la liste des éléments à afficher (en-têtes + grilles de recettes)
  const renderItems = () => {
    const items: JSX.Element[] = [];
    
    // Filtrer les recettes selon la recherche
    const filteredRecipes = filterRecipes(recipes, searchQuery);
    
    // Ajouter les recettes sans catégorie en premier
    const uncategorizedRecipes = filteredRecipes.filter(recipe => !recipe.category);
    if (uncategorizedRecipes.length > 0) {
      items.push(
        <CategoryHeader
          key="uncategorized"
          category={{ id: 'uncategorized', name: 'Sans catégorie', color: colors.textSecondary, order: -1, hidden: false, createdAt: new Date() }}
          recipeCount={uncategorizedRecipes.length}
          isCollapsed={collapsedCategories.has('uncategorized')}
          onToggle={() => toggleCategory('uncategorized')}
        />
      );
      
      if (!collapsedCategories.has('uncategorized')) {
        items.push(
          <FlatList
            key="uncategorized-recipes"
            data={uncategorizedRecipes}
            renderItem={renderRecipeItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recipesHorizontalList}
          />
        );
      }
    }

    // Ajouter les catégories dans l'ordre
    const sortedCategories = categories.sort((a, b) => a.order - b.order);
    
    sortedCategories.forEach(category => {
      const categoryRecipes = filteredRecipes.filter(recipe => recipe.category === category.id);
      if (categoryRecipes.length > 0) {
        items.push(
          <CategoryHeader
            key={category.id}
            category={category}
            recipeCount={categoryRecipes.length}
            isCollapsed={collapsedCategories.has(category.id)}
            onToggle={() => toggleCategory(category.id)}
          />
        );
        
        if (!collapsedCategories.has(category.id)) {
          items.push(
            <FlatList
              key={`${category.id}-recipes`}
              data={categoryRecipes}
              renderItem={renderRecipeItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recipesHorizontalList}
            />
          );
        }
      }
    });

    return items;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="restaurant-outline" size={80} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>Aucune recette</Text>
      <Text style={styles.emptySubtitle}>
        Commencez par ajouter votre première recette
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('RecipeForm', {})}
      >
        <Ionicons name="add" size={24} color={colors.text} />
        <Text style={styles.addButtonText}>Ajouter une recette</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une recette..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={recipes.length === 0 ? styles.emptyContainer : styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {recipes.length === 0 ? renderEmptyState() : renderItems()}
      </ScrollView>
      
      {recipes.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('RecipeForm', {})}
        >
          <Ionicons name="add" size={28} color={colors.text} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  recipeCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginRight: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    width: 180,
  },
  recipesHorizontalList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  recipeImageContainer: {
    position: 'relative',
    height: 100,
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
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  recipeInfo: {
    padding: 12,
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
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
  emptyState: {
    alignItems: 'center',
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 4,
    marginHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryHeaderName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  categoryHeaderCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryToggleButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RecipeListScreen;
