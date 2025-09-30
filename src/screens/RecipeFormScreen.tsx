import React, { useState, useEffect } from 'react';
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
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../constants/colors';
import { Recipe, Category } from '../types';
import { AdaptiveStorageService as StorageService } from '../services/adaptiveStorage';
import { ImageCompressionService } from '../services/imageCompression';
import { NotificationService } from '../services/notificationService';
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
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState<string[]>(['']);
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
        setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : ['']);
        setInstructions(recipe.instructions.length > 0 ? recipe.instructions : ['']);
        setSelectedCategoryId(recipe.category);
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
      NotificationService.showError('Erreur', 'Impossible de charger la recette');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      NotificationService.showError('Permission requise', 'Permission d\'accès à la galerie requise');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1.0, // Qualité maximale pour la compression manuelle
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      
      // Compresser l'image si on est sur web
      if (Platform.OS === 'web') {
        try {
          console.log('🖼️ Compressing image for web storage...');
          const compressedImage = await ImageCompressionService.compressImage(imageUri, {
            maxWidth: 800,
            maxHeight: 600,
            quality: 0.8,
            maxSizeKB: 500,
          });
          console.log('✅ Image compressed successfully');
          setImage(compressedImage);
        } catch (error) {
          console.error('❌ Error compressing image:', error);
          NotificationService.showError('Erreur', 'Impossible de compresser l\'image');
          setImage(imageUri); // Utiliser l'image originale en cas d'erreur
        }
      } else {
        setImage(imageUri);
      }
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      const newIngredients = ingredients.filter((_, i) => i !== index);
      setIngredients(newIngredients);
    }
  };

  const updateIngredient = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    
    // Si on commence à taper dans le dernier ingrédient et qu'il n'est pas vide, ajouter un nouvel ingrédient
    if (index === ingredients.length - 1 && value.trim() !== '' && ingredients[ingredients.length - 1] === '') {
      newIngredients.push('');
    }
    
    // Si on efface le contenu et que le champ suivant est vide, supprimer le champ suivant
    if (value.trim() === '' && index < ingredients.length - 1 && ingredients[index + 1] === '') {
      newIngredients.splice(index + 1, 1);
    }
    
    setIngredients(newIngredients);
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      const newInstructions = instructions.filter((_, i) => i !== index);
      setInstructions(newInstructions);
    }
  };

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    
    // Si on commence à taper dans la dernière instruction et qu'elle n'est pas vide, ajouter une nouvelle instruction
    if (index === instructions.length - 1 && value.trim() !== '' && instructions[instructions.length - 1] === '') {
      newInstructions.push('');
    }
    
    // Si on efface le contenu et que l'instruction suivante est vide, supprimer l'instruction suivante
    if (value.trim() === '' && index < instructions.length - 1 && instructions[index + 1] === '') {
      newInstructions.splice(index + 1, 1);
    }
    
    setInstructions(newInstructions);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      NotificationService.showError('Erreur', 'Le titre est requis');
      return false;
    }
    const hours = prepTimeHours ? Number(prepTimeHours) : 0;
    const minutes = prepTimeMinutes ? Number(prepTimeMinutes) : 0;
    const totalMinutes = hours * 60 + minutes;
    
    if (totalMinutes <= 0) {
      NotificationService.showError('Erreur', 'Le temps de préparation doit être supérieur à 0');
      return false;
    }
    if (!selectedCategoryId) {
      NotificationService.showError('Erreur', 'Veuillez sélectionner une catégorie');
      return false;
    }
    const validIngredients = ingredients.filter(ing => ing.trim());
    if (validIngredients.length === 0) {
      NotificationService.showError('Erreur', 'Au moins un ingrédient est requis');
      return false;
    }
    const validInstructions = instructions.filter(inst => inst.trim());
    if (validInstructions.length === 0) {
      NotificationService.showError('Erreur', 'Au moins une instruction est requise');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const validIngredients = ingredients.filter(ing => ing.trim());
      const validInstructions = instructions.filter(inst => inst.trim());
      
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
        ingredients: validIngredients,
        instructions: validInstructions,
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
      NotificationService.showError('Erreur', 'Impossible de sauvegarder la recette');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewCategory = async () => {
    if (!newCategoryName.trim()) {
      NotificationService.showError('Erreur', 'Le nom de la catégorie est requis');
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
      NotificationService.showError('Erreur', 'Impossible de créer la catégorie');
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
          <Text style={styles.sectionTitle}>Temps de préparation *</Text>
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ingrédients *</Text>
            <TouchableOpacity onPress={addIngredient} style={styles.addButton}>
              <Ionicons name="add" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {ingredients.map((ingredient, index) => (
            <View key={index} style={styles.listItem}>
              <TextInput
                style={styles.listInput}
                value={ingredient}
                onChangeText={(value) => updateIngredient(index, value)}
                placeholder={`Ingrédient ${index + 1}`}
                placeholderTextColor={colors.textSecondary}
              />
              {ingredients.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeIngredient(index)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close" size={20} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          {/* Add ingredient button at bottom */}
          <TouchableOpacity onPress={addIngredient} style={styles.addButtonBottom}>
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={styles.addButtonText}>Ajouter un ingrédient</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Instructions *</Text>
            <TouchableOpacity onPress={addInstruction} style={styles.addButton}>
              <Ionicons name="add" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {instructions.map((instruction, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
              <TextInput
                style={[styles.listInput, styles.instructionInput]}
                value={instruction}
                onChangeText={(value) => updateInstruction(index, value)}
                placeholder={`Étape ${index + 1}`}
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
              {instructions.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeInstruction(index)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close" size={20} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          {/* Add instruction button at bottom */}
          <TouchableOpacity onPress={addInstruction} style={styles.addButtonBottom}>
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={styles.addButtonText}>Ajouter une étape</Text>
          </TouchableOpacity>
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
  instructionInput: {
    minHeight: 80,
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
