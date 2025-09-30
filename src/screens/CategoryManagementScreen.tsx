import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { Category } from '../types';
import { AdaptiveStorageService as StorageService } from '../services/adaptiveStorage';
import { NotificationService } from '../services/notificationService';

interface CategoryItemProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
  onMoveUp: (categoryId: string) => void;
  onMoveDown: (categoryId: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ 
  category, 
  onEdit, 
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast
}) => {
  return (
    <View style={styles.categoryCard}>
      <View style={styles.categoryInfo}>
        <View style={[styles.categoryColor, { backgroundColor: category.color }]} />
        <Text style={styles.categoryName}>{category.name}</Text>
      </View>
      
      <View style={styles.categoryActions}>
        {/* Move Up Button */}
        {!isFirst && (
          <TouchableOpacity
            style={styles.moveButton}
            onPress={() => onMoveUp(category.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-up" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        
        {/* Move Down Button */}
        {!isLast && (
          <TouchableOpacity
            style={styles.moveButton}
            onPress={() => onMoveDown(category.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        
        {/* Edit Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onEdit(category)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        
        {/* Delete Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onDelete(category.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const CategoryManagementScreen: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState(colors.categoryColors[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await StorageService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      NotificationService.showError('Erreur', 'Impossible de charger les catégories');
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setSelectedColor(colors.categoryColors[0]);
    setShowModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setSelectedColor(category.color);
    setShowModal(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    NotificationService.confirm(
      'Supprimer la catégorie',
      'Êtes-vous sûr de vouloir supprimer cette catégorie ? Les recettes associées ne seront pas supprimées.',
      async () => {
        try {
          await StorageService.deleteCategory(categoryId);
          await loadCategories();
        } catch (error) {
          console.error('Error deleting category:', error);
          NotificationService.showError('Erreur', 'Impossible de supprimer la catégorie');
        }
      }
    );
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      NotificationService.showError('Erreur', 'Le nom de la catégorie est requis');
      return;
    }

    setLoading(true);
    try {
      const categoryData: Category = {
        id: editingCategory?.id || Date.now().toString(),
        name: categoryName.trim(),
        color: selectedColor,
        order: editingCategory?.order || categories.length,
        createdAt: editingCategory?.createdAt || new Date(),
      };

      if (editingCategory) {
        await StorageService.updateCategory(categoryData);
      } else {
        await StorageService.addCategory(categoryData);
      }

      setShowModal(false);
      await loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      NotificationService.showError('Erreur', 'Impossible de sauvegarder la catégorie');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveUp = async (categoryId: string) => {
    try {
      const currentIndex = categories.findIndex(cat => cat.id === categoryId);
      if (currentIndex > 0) {
        const newCategories = [...categories];
        [newCategories[currentIndex], newCategories[currentIndex - 1]] = 
        [newCategories[currentIndex - 1], newCategories[currentIndex]];
        
        // Mettre à jour les ordres
        newCategories.forEach((cat, index) => {
          cat.order = index;
        });
        
        await StorageService.saveCategories(newCategories);
        setCategories(newCategories);
      }
    } catch (error) {
      console.error('Error moving category up:', error);
      NotificationService.showError('Erreur', 'Impossible de déplacer la catégorie');
    }
  };

  const handleMoveDown = async (categoryId: string) => {
    try {
      const currentIndex = categories.findIndex(cat => cat.id === categoryId);
      if (currentIndex < categories.length - 1) {
        const newCategories = [...categories];
        [newCategories[currentIndex], newCategories[currentIndex + 1]] = 
        [newCategories[currentIndex + 1], newCategories[currentIndex]];
        
        // Mettre à jour les ordres
        newCategories.forEach((cat, index) => {
          cat.order = index;
        });
        
        await StorageService.saveCategories(newCategories);
        setCategories(newCategories);
      }
    } catch (error) {
      console.error('Error moving category down:', error);
      NotificationService.showError('Erreur', 'Impossible de déplacer la catégorie');
    }
  };


  const renderCategory = ({ item, index }: { item: Category; index: number }) => (
    <CategoryItem
      category={item}
      onEdit={handleEditCategory}
      onDelete={handleDeleteCategory}
      onMoveUp={handleMoveUp}
      onMoveDown={handleMoveDown}
      isFirst={index === 0}
      isLast={index === categories.length - 1}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="grid-outline" size={80} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>Aucune catégorie</Text>
      <Text style={styles.emptySubtitle}>
        Créez votre première catégorie pour organiser vos recettes
      </Text>
      <TouchableOpacity style={styles.addButton} onPress={handleAddCategory}>
        <Ionicons name="add" size={24} color={colors.text} />
        <Text style={styles.addButtonText}>Créer une catégorie</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={categories.length === 0 ? styles.emptyContainer : styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
      
      {categories.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleAddCategory}>
          <Ionicons name="add" size={28} color={colors.text} />
        </TouchableOpacity>
      )}

      {/* Category Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
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
            onPress={() => setShowModal(false)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Category Name */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Nom de la catégorie</Text>
                <TextInput
                  style={styles.textInput}
                  value={categoryName}
                  onChangeText={setCategoryName}
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
                        selectedColor === color && styles.selectedColor,
                      ]}
                      onPress={() => setSelectedColor(color)}
                    >
                      {selectedColor === color && (
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
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleSaveCategory}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                </Text>
              </TouchableOpacity>
            </View>
            </View>
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
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeCategoryCard: {
    backgroundColor: colors.surfaceVariant,
    transform: [{ scale: 1.02 }],
    shadowOpacity: 0.2,
    elevation: 8,
  },
  draggingCard: {
    backgroundColor: colors.surfaceVariant,
    transform: [{ scale: 1.05 }],
    shadowOpacity: 0.3,
    elevation: 10,
    zIndex: 1000,
  },
  moveButton: {
    padding: 8,
    marginLeft: 4,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryColor: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 16,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dragHandle: {
    padding: 8,
    marginRight: 8,
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
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
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});

export default CategoryManagementScreen;
