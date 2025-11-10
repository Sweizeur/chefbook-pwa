import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../constants/colors';
import { Recipe, Category } from '../types';
import { AdaptiveStorageService as StorageService } from '../services/adaptiveStorage';
import { RootStackParamList } from '../navigation/AppNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type RecipeFormScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RecipeForm'>;
type RecipeFormScreenRouteProp = RouteProp<RootStackParamList, 'RecipeForm'>;

interface Props {
  navigation: RecipeFormScreenNavigationProp;
  route: RecipeFormScreenRouteProp;
}

const RecipeFormScreen: React.FC<Props> = ({ navigation, route }) => {
  const { recipeId, categoryId, categoryName } = route.params || {};
  const isEditing = !!recipeId;

  const [title, setTitle] = useState('');
  const [image, setImage] = useState<string | undefined>();
  const [prepTimeHours, setPrepTimeHours] = useState('');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [instructionsText, setInstructionsText] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(colors.categoryColors[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
    if (isEditing) {
      loadRecipe();
    } else if (categoryId) {
      // Pré-remplir la catégorie si elle est fournie
      setSelectedCategoryId(categoryId);
    }
  }, [isEditing, recipeId, categoryId]);

  const loadCategories = async () => {
    try {
      const categoriesData = await StorageService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadRecipe = async () => {
    if (!recipeId) return;
    
    try {
      const recipes = await StorageService.getRecipes();
      const recipe = recipes.find(r => r.id === recipeId);
      if (recipe) {
        setTitle(recipe.title);
        setImage(recipe.image);
        // Convertir les minutes en heures et minutes
        const totalMinutes = recipe.prepTime;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        setPrepTimeHours(hours > 0 ? hours.toString() : '');
        setPrepTimeMinutes(minutes > 0 ? minutes.toString() : '');
        setIngredientsText(recipe.ingredients.join('\n'));
        setInstructionsText(recipe.instructions.join('\n'));
        setSelectedCategoryId(recipe.category);
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
      Alert.alert('Erreur', 'Impossible de charger la recette');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Permission d\'accès à la galerie requise');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const validateForm = useCallback((): boolean => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre est requis');
      return false;
    }
    const hours = prepTimeHours ? Number(prepTimeHours) : 0;
    const minutes = prepTimeMinutes ? Number(prepTimeMinutes) : 0;
    const totalMinutes = hours * 60 + minutes;

    if (Number.isNaN(totalMinutes) || totalMinutes < 0) {
      Alert.alert('Erreur', 'Le temps de préparation est invalide');
      return false;
    }
    if (!selectedCategoryId) {
      Alert.alert('Erreur', 'Veuillez sélectionner une catégorie');
      return false;
    }
    const validIngredients = ingredientsText
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean);
    if (validIngredients.length === 0) {
      Alert.alert('Erreur', 'Au moins un ingrédient est requis');
      return false;
    }
    const validInstructions = instructionsText
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean);
    if (validInstructions.length === 0) {
      Alert.alert('Erreur', 'Au moins une instruction est requise');
      return false;
    }
    return true;
  }, [title, prepTimeHours, prepTimeMinutes, selectedCategoryId, ingredientsText, instructionsText]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Calculer le temps total en minutes
      const hours = prepTimeHours ? Number(prepTimeHours) : 0;
      const minutes = prepTimeMinutes ? Number(prepTimeMinutes) : 0;
      const totalMinutes = hours * 60 + minutes;

      const recipeData: Recipe = {
        id: recipeId || Date.now().toString(),
        title: title.trim(),
        image,
        category: selectedCategoryId,
        prepTime: totalMinutes,
        ingredients: ingredientsText
          .split('\n')
          .map(item => item.trim())
          .filter(Boolean),
        instructions: instructionsText
          .split('\n')
          .map(item => item.trim())
          .filter(Boolean),
        createdAt: isEditing ? (await StorageService.getRecipes()).find(r => r.id === recipeId)?.createdAt || new Date() : new Date(),
        updatedAt: new Date(),
      };

      if (isEditing) {
        await StorageService.updateRecipe(recipeData);
      } else {
        await StorageService.addRecipe(recipeData);
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving recipe:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la recette');
    } finally {
      setLoading(false);
    }
  }, [
    validateForm,
    prepTimeHours,
    prepTimeMinutes,
    selectedCategoryId,
    ingredientsText,
    instructionsText,
    recipeId,
    isEditing,
    image,
    navigation,
  ]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Modifier la recette' : 'Nouvelle recette',
      headerRight: () =>
        isEditing ? (
          <TouchableOpacity
            style={[styles.headerSaveButton, loading && styles.headerSaveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="checkmark" size={20} color={colors.text} />
          </TouchableOpacity>
        ) : null,
    });
  }, [navigation, isEditing, handleSave, loading]);

  const handleCreateNewCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Erreur', 'Le nom de la catégorie est requis');
      return;
    }

    setLoading(true);
    try {
      const categoryData: Category = {
        id: Date.now().toString(),
        name: newCategoryName.trim(),
        color: newCategoryColor,
        order: categories.length,
        createdAt: new Date(),
      };

      await StorageService.addCategory(categoryData);
      setSelectedCategoryId(categoryData.id);
      setShowCreateCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryColor(colors.categoryColors[0]);
      await loadCategories();
    } catch (error) {
      console.error('Error creating category:', error);
      Alert.alert('Erreur', 'Impossible de créer la catégorie');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={20}
      >
        {/* Image Section */}
        <View style={[styles.section, styles.firstSection]}>
          <Text style={styles.sectionTitle}>Photo</Text>
          <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.recipeImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="camera" size={40} color={colors.textSecondary} />
                <Text style={styles.placeholderText}>Ajouter une photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Titre *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Nom de la recette"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Category Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catégorie *</Text>
          <TouchableOpacity
            style={styles.categorySelector}
            onPress={() => setShowCategoryModal(true)}
          >
            <View style={styles.categoryInfo}>
              {selectedCategory && (
                <View style={[styles.categoryColor, { backgroundColor: selectedCategory.color }]} />
              )}
              <Text style={styles.categoryText}>
                {selectedCategory ? selectedCategory.name : 'Sélectionner une catégorie'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Prep Time Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Temps de préparation</Text>
          <View style={styles.timePickerContainer}>
            <View style={styles.timePickerWrapper}>
              <Text style={styles.timeLabel}>Heures</Text>
              <Picker
                selectedValue={prepTimeHours}
                onValueChange={setPrepTimeHours}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                mode="dropdown"
              >
                {Array.from({ length: 25 }, (_, i) => (
                  <Picker.Item key={i} label={i.toString()} value={i.toString()} />
                ))}
              </Picker>
            </View>
            <View style={styles.timeSeparator}>
              <Text style={styles.timeSeparatorText}>:</Text>
            </View>
            <View style={styles.timePickerWrapper}>
              <Text style={styles.timeLabel}>Minutes</Text>
              <Picker
                selectedValue={prepTimeMinutes}
                onValueChange={setPrepTimeMinutes}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                mode="dropdown"
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <Picker.Item key={i} label={i.toString().padStart(2, '0')} value={i.toString().padStart(2, '0')} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Ingredients Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingrédients *</Text>
          <TextInput
            style={[styles.textArea, styles.listInput]}
            value={ingredientsText}
            onChangeText={setIngredientsText}
            placeholder={'Un ingrédient par ligne'}
            placeholderTextColor={colors.textSecondary}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Instructions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions *</Text>
          <TextInput
            style={[styles.textArea, styles.listInput, styles.instructionInput]}
            value={instructionsText}
            onChangeText={setInstructionsText}
            placeholder={'Décrire les étapes, une par ligne'}
            placeholderTextColor={colors.textSecondary}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.bottomSpacing} />
      </KeyboardAwareScrollView>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Sauvegarde...' : isEditing ? 'Modifier' : 'Créer'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity 
          style={styles.categoryModalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner une catégorie</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryItem}
                  onPress={() => {
                    setSelectedCategoryId(item.id);
                    setShowCategoryModal(false);
                  }}
                >
                  <View style={[styles.categoryColor, { backgroundColor: item.color }]} />
                  <Text style={styles.categoryItemText}>{item.name}</Text>
                  {selectedCategoryId === item.id && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
            
            {/* Create New Category Button */}
            <TouchableOpacity
              style={styles.createCategoryButton}
              onPress={() => {
                setShowCategoryModal(false);
                setShowCreateCategoryModal(true);
              }}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
              <Text style={styles.createCategoryButtonText}>Créer une nouvelle catégorie</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Create New Category Modal */}
      <Modal
        visible={showCreateCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateCategoryModal(false)}
      >
        <KeyboardAwareScrollView 
          style={styles.modalOverlay}
          contentContainerStyle={styles.modalOverlayContent}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          enableAutomaticScroll={true}
        >
          <TouchableOpacity 
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={() => setShowCreateCategoryModal(false)}
          >
            <TouchableOpacity 
              style={styles.modalContent}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nouvelle catégorie</Text>
                <TouchableOpacity onPress={() => setShowCreateCategoryModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                {/* Category Name */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Nom de la catégorie</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    placeholder="Ex: Desserts, Plats principaux..."
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                {/* Color Selection */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Couleur</Text>
                  <View style={styles.colorGrid}>
                    {colors.categoryColors.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          newCategoryColor === color && styles.selectedColor,
                        ]}
                        onPress={() => setNewCategoryColor(color)}
                      >
                        {newCategoryColor === color && (
                          <Ionicons name="checkmark" size={20} color={colors.text} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCreateCategoryModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                  onPress={handleCreateNewCategory}
                  disabled={loading}
                >
                  <Text style={styles.saveButtonText}>
                    {loading ? 'Création...' : 'Créer'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAwareScrollView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  firstSection: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  imageContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 8,
  },
  categorySelector: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  categoryText: {
    fontSize: 16,
    color: colors.text,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
    marginTop: 2,
  },
  listInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 160,
    paddingVertical: 20,
    lineHeight: 24,
  },
  instructionInput: {
    minHeight: 220,
    textAlignVertical: 'top',
  },
  addButton: {
    padding: 8,
  },
  addButtonBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  saveButtonContainer: {
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  headerSaveButton: {
    marginRight: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  headerSaveButtonDisabled: {
    opacity: 0.6,
  },
  bottomSpacing: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  modalOverlayContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  modalOverlayTouchable: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  categoryModalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryItemText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  createCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  createCategoryButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalBody: {
    padding: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 8,
  },
  timePickerWrapper: {
    alignItems: 'center',
    flex: 1,
    minHeight: 100,
    justifyContent: 'center',
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  picker: {
    height: 80,
    width: 100,
    color: colors.text,
    backgroundColor: 'transparent',
  },
  pickerItem: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    height: 40,
  },
  timeSeparator: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginHorizontal: 8,
    height: 100,
    paddingTop: 25,
  },
  timeSeparatorText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: colors.text,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

export default RecipeFormScreen;
