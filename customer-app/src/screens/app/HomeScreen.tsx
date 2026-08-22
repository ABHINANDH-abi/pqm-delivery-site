import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { useCartStore, CartProduct } from '../../store/cart.store';
import { apiClient } from '../../api/client';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

interface Category {
  id: string;
  name: string;
  imageUrl?: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: string | number;
  imageUrl?: string;
  isVeg: boolean;
  isAvailable: boolean;
  categoryId: string;
  category?: {
    name: string;
  };
}

export default function HomeScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const { items, addItem, getItemCount, getTotal } = useCartStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const [catsRes, prodsRes] = await Promise.all([
        apiClient.get('/categories'),
        apiClient.get('/products'),
      ]);

      setCategories(catsRes.data.data);
      setProducts(prodsRes.data.data);
    } catch (err) {
      console.log('Failed to fetch menu data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  const handleAddToCart = (prod: Product) => {
    const cartProduct: CartProduct = {
      id: prod.id,
      name: prod.name,
      price: prod.price,
      imageUrl: prod.imageUrl,
      isVeg: prod.isVeg,
      categoryId: prod.categoryId,
    };
    addItem(cartProduct);
  };

  const getItemQuantity = (productId: string) => {
    const found = items.find((item) => item.product.id === productId);
    return found ? found.quantity : 0;
  };

  const filteredProducts = products.filter((item) => {
    const matchesCategory = !selectedCategoryId || item.categoryId === selectedCategoryId;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.isAvailable;
  });

  const cartCount = getItemCount();
  const cartTotal = getTotal();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Deliver to Home 📍</Text>
          <Text style={styles.userName}>{user?.name || 'Customer'}</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.ordersButton}
            onPress={() => navigation.navigate('OrderHistory')}
            activeOpacity={0.8}
          >
            <Text style={styles.ordersText}>Orders 📜</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search pizza, biryani, starters..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Category Horizontal Tabs */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategoryId && styles.categoryChipActive]}
            onPress={() => setSelectedCategoryId(null)}
          >
            <Text style={[styles.categoryChipText, !selectedCategoryId && styles.categoryChipTextActive]}>
              All Dishes
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, selectedCategoryId === cat.id && styles.categoryChipActive]}
              onPress={() => setSelectedCategoryId(cat.id)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategoryId === cat.id && styles.categoryChipTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Food Items Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Menu Items</Text>
          <Text style={styles.itemCount}>{filteredProducts.length} Items</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text style={styles.loadingText}>Fetching delicious food menu...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No dishes found</Text>
            <Text style={styles.emptySubtitle}>Try selecting a different category or search term.</Text>
          </View>
        ) : (
          <View style={styles.productGrid}>
            {filteredProducts.map((prod) => {
              const qty = getItemQuantity(prod.id);
              return (
                <View key={prod.id} style={styles.foodCard}>
                  <Image
                    source={{
                      uri:
                        prod.imageUrl ||
                        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
                    }}
                    style={styles.foodImage}
                  />

                  <View style={styles.cardContent}>
                    <View style={styles.cardHeaderRow}>
                      <View style={[styles.vegDotBorder, prod.isVeg ? styles.borderVeg : styles.borderNonVeg]}>
                        <View style={[styles.vegDot, prod.isVeg ? styles.bgVeg : styles.bgNonVeg]} />
                      </View>
                      <Text style={styles.categoryBadge}>{prod.category?.name}</Text>
                    </View>

                    <Text style={styles.foodName}>{prod.name}</Text>
                    <Text style={styles.foodDescription} numberOfLines={2}>
                      {prod.description}
                    </Text>

                    <View style={styles.cardFooter}>
                      <Text style={styles.foodPrice}>₹{prod.price}</Text>

                      <TouchableOpacity
                        style={[styles.addButton, qty > 0 && styles.addButtonAdded]}
                        activeOpacity={0.8}
                        onPress={() => handleAddToCart(prod)}
                      >
                        <Text style={[styles.addButtonText, qty > 0 && styles.addButtonTextAdded]}>
                          {qty > 0 ? `ADDED (${qty}) +` : 'ADD +'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Cart Bar */}
      {cartCount > 0 && (
        <View style={styles.floatingCartBar}>
          <View>
            <Text style={styles.cartBarCountText}>{cartCount} {cartCount === 1 ? 'ITEM' : 'ITEMS'}</Text>
            <Text style={styles.cartBarTotalText}>₹{cartTotal}</Text>
          </View>

          <TouchableOpacity
            style={styles.viewCartButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Cart')}
          >
            <Text style={styles.viewCartText}>View Cart 🛒 →</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ordersButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 8,
  },
  ordersText: {
    color: '#38BDF8',
    fontWeight: '700',
    fontSize: 12,
  },
  greeting: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
  },
  logoutText: {
    color: '#F87171',
    fontWeight: '700',
    fontSize: 12,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  itemCount: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  categoriesScroll: {
    marginBottom: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    marginRight: 10,
  },
  categoryChipActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  categoryChipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 13,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },
  productGrid: {
    gap: 16,
  },
  foodCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    flexDirection: 'row',
    height: 125,
  },
  foodImage: {
    width: 120,
    height: '100%',
    objectFit: 'cover',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justify.content: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justify.content: 'space-between',
  },
  vegDotBorder: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
  },
  borderVeg: {
    borderColor: '#10B981',
  },
  borderNonVeg: {
    borderColor: '#EF4444',
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bgVeg: {
    backgroundColor: '#10B981',
  },
  bgNonVeg: {
    backgroundColor: '#EF4444',
  },
  categoryBadge: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  foodName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  foodDescription: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justify.content: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  foodPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F59E0B',
  },
  addButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addButtonAdded: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  addButtonText: {
    color: '#F59E0B',
    fontWeight: '800',
    fontSize: 12,
  },
  addButtonTextAdded: {
    color: '#0F172A',
    fontWeight: '800',
  },
  floatingCartBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#F59E0B',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justify.content: 'space-between',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  cartBarCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
  },
  cartBarTotalText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  viewCartButton: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  viewCartText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
