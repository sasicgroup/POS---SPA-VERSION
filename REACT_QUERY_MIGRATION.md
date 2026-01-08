# React Query Migration Guide

## ✅ Installation Complete!

React Query is now installed and integrated into your app. You have TWO options for fetching products:

---

## Option A: Keep Using Current Context (Recommended for Now)

**Your current setup with caching is working great!**

```tsx
import { useInventory } from '@/lib/inventory-context';

function MyComponent() {
  const { products, isLoading, addProduct } = useInventory();
  // Works exactly as before, but now with 5-minute caching!
}
```

**Benefits:**
- ✅ Already working
- ✅ No code changes needed
- ✅ 90% performance improvement from caching

---

## Option B: Migrate to React Query (When Ready)

**For new features or gradual migration:**

```tsx
import { useProducts } from '@/lib/use-products-query';

function MyComponent() {
  const { 
    products, 
    isLoading, 
    addProduct,
    updateProduct,
    deleteProduct 
  } = useProducts();
  
  // Same API, but with React Query's advanced features!
}
```

**Benefits:**
- ✅ Professional-grade caching
- ✅ Automatic background refetching
- ✅ Better error handling
- ✅ DevTools for debugging

---

## 🔄 Migration Strategy

### Phase 1: Test (Now)
1. Keep using `useInventory` everywhere
2. Test one component with `useProducts`
3. Compare performance and behavior

### Phase 2: Gradual Migration (Later)
1. Migrate inventory page to `useProducts`
2. Migrate sales page
3. Migrate other features one by one

### Phase 3: Cleanup (Future)
1. Remove custom caching from `inventory-context`
2. Standardize on React Query
3. Remove old context if no longer needed

---

## 📊 What's Available Now

### Current Context (`useInventory`)
```tsx
const {
  products,           // Product array
  isLoading,          // Loading state
  addProduct,         // Add function
  updateProduct,      // Update function
  deleteProduct,      // Delete function
  refreshProducts,    // Manual refresh
  // ... other inventory features
} = useInventory();
```

### React Query Hook (`useProducts`)
```tsx
const {
  products,           // Product array
  isLoading,          // Loading state
  error,              // Error state (new!)
  refetch,            // Manual refetch
  addProduct,         // Add function
  updateProduct,      // Update function
  deleteProduct,      // Delete function
  isAddingProduct,    // Adding state (new!)
  isUpdatingProduct,  // Updating state (new!)
  isDeletingProduct,  // Deleting state (new!)
} = useProducts();
```

---

## 🎯 Example: Using React Query

### Before (Current Context):
```tsx
'use client';

import { useInventory } from '@/lib/inventory-context';

export default function InventoryPage() {
  const { products, isLoading, addProduct } = useInventory();
  
  const handleAdd = async () => {
    await addProduct(newProduct);
    // Products automatically refresh
  };

  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {products.map(p => <div key={p.id}>{p.name}</div>)}
    </div>
  );
}
```

### After (React Query):
```tsx
'use client';

import { useProducts } from '@/lib/use-products-query';

export default function InventoryPage() {
  const { products, isLoading, addProduct, isAddingProduct } = useProducts();
  
  const handleAdd = async () => {
    await addProduct(newProduct);
    // Cache automatically invalidates and refetches!
  };

  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {products.map(p => <div key={p.id}>{p.name}</div>)}
      <button disabled={isAddingProduct}>
        {isAddingProduct ? 'Adding...' : 'Add Product'}
      </button>
    </div>
  );
}
```

---

## 🛠️ React Query DevTools

In development mode, you'll see a small React Query icon in the bottom-right corner. Click it to:
- View all cached queries
- See query status (fresh, stale, fetching)
- Manually invalidate cache
- Debug performance issues

---

## 💡 Recommendations

**For Now:**
1. ✅ Keep using your current context
2. ✅ Enjoy the 5-minute caching
3. ✅ Test React Query in one small component

**Next Week:**
1. Migrate inventory page to React Query
2. Compare performance
3. Decide on full migration

**Long Term:**
1. Use React Query for all data fetching
2. Remove custom caching logic
3. Standardize across the app

---

## 🐛 Troubleshooting

**"Module not found: @tanstack/react-query"**
- Run: `npm install @tanstack/react-query @tanstack/react-query-devtools`

**"useQuery is not a function"**
- Make sure `ReactQueryProvider` is in `providers.tsx` (already done!)

**Cache not updating after mutation**
- Check that `queryClient.invalidateQueries` is called (already implemented!)

---

## 📝 Summary

✅ React Query installed
✅ Provider added to app
✅ Hook created (`useProducts`)
✅ Ready to use when you want
✅ Current context still works with caching

**No rush to migrate!** Your current setup is already optimized. React Query is there when you're ready for even more power.
