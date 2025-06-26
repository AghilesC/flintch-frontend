// utils/CacheManager.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

interface CacheItem {
  data: any;
  timestamp: number;
  expiry: number; // durée en millisecondes
  accessCount?: number; // ✅ Nouveau: compteur d'accès
  lastAccess?: number; // ✅ Nouveau: dernier accès
}

class CacheManager {
  private static instance: CacheManager;
  private memoryCache: Map<string, CacheItem> = new Map();
  private maxMemoryItems = 50; // ✅ Limite mémoire pour éviter l'overflow

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // 🚀 CACHE MÉMOIRE ULTRA OPTIMISÉ
  setMemoryCache(key: string, data: any, expiry: number = 5 * 60 * 1000) {
    // ⚡ Si data est null/undefined, on supprime
    if (data === null || data === undefined) {
      this.memoryCache.delete(key);
      return;
    }

    // ✅ Vérifier la limite de mémoire
    if (this.memoryCache.size >= this.maxMemoryItems) {
      this.cleanOldestMemoryCache();
    }

    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      expiry,
      accessCount: 1,
      lastAccess: Date.now(),
    });

    console.log(`⚡ Memory cache SET: ${key} (${this.memoryCache.size} items)`);
  }

  getMemoryCache(key: string): any | null {
    const item = this.memoryCache.get(key);
    if (!item) {
      console.log(`❌ Memory cache MISS: ${key}`);
      return null;
    }

    const now = Date.now();

    // ✅ Vérifier expiration
    if (now - item.timestamp > item.expiry) {
      this.memoryCache.delete(key);
      console.log(`⏰ Memory cache EXPIRED: ${key}`);
      return null;
    }

    // ✅ Mettre à jour les stats d'accès
    item.accessCount = (item.accessCount || 0) + 1;
    item.lastAccess = now;
    this.memoryCache.set(key, item);

    console.log(`⚡ Memory cache HIT: ${key} (${item.accessCount} accesses)`);
    return item.data;
  }

  // ✅ NOUVEAU: Nettoyer les items mémoire les moins utilisés
  private cleanOldestMemoryCache() {
    if (this.memoryCache.size < this.maxMemoryItems) return;

    console.log("🧹 Cleaning oldest memory cache items...");

    // Convertir en array et trier par dernière utilisation
    const items = Array.from(this.memoryCache.entries())
      .map(([key, item]) => ({
        key,
        lastAccess: item.lastAccess || 0,
        accessCount: item.accessCount || 0,
      }))
      .sort((a, b) => {
        // Prioriser par dernière utilisation, puis par nombre d'accès
        if (a.lastAccess !== b.lastAccess) {
          return a.lastAccess - b.lastAccess; // Plus ancien d'abord
        }
        return a.accessCount - b.accessCount; // Moins utilisé d'abord
      });

    // Supprimer les 25% les plus anciens
    const toDelete = Math.ceil(this.memoryCache.size * 0.25);
    for (let i = 0; i < toDelete && i < items.length; i++) {
      this.memoryCache.delete(items[i].key);
      console.log(`🗑️ Removed from memory: ${items[i].key}`);
    }

    console.log(
      `✅ Memory cache cleaned: ${this.memoryCache.size} items remaining`
    );
  }

  // 🚀 CACHE PERSISTANT OPTIMISÉ
  async setPersistentCache(
    key: string,
    data: any,
    expiry: number = 30 * 60 * 1000
  ) {
    const cacheItem: CacheItem = {
      data,
      timestamp: Date.now(),
      expiry,
      accessCount: 1,
      lastAccess: Date.now(),
    };

    try {
      // ⚡ Mettre en cache mémoire D'ABORD (priorité)
      this.setMemoryCache(key, data, expiry);

      // ✅ Puis cache persistant en arrière-plan
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
      console.log(`💾 Persistent cache SET: ${key}`);
    } catch (error) {
      console.error("❌ Erreur cache persistant:", error);
    }
  }

  async getPersistentCache(key: string): Promise<any | null> {
    // 🚀 PRIORITÉ ABSOLUE AU CACHE MÉMOIRE
    const memoryData = this.getMemoryCache(key);
    if (memoryData !== null) {
      return memoryData; // Exit immédiat si en mémoire
    }

    try {
      const cached = await AsyncStorage.getItem(`cache_${key}`);
      if (!cached) {
        console.log(`❌ Persistent cache MISS: ${key}`);
        return null;
      }

      const item: CacheItem = JSON.parse(cached);
      const now = Date.now();

      // ✅ Vérifier expiration
      if (now - item.timestamp > item.expiry) {
        await AsyncStorage.removeItem(`cache_${key}`);
        console.log(`⏰ Persistent cache EXPIRED: ${key}`);
        return null;
      }

      console.log(`💾 Persistent cache HIT: ${key}`);

      // ⚡ IMPORTANT: Remettre en cache mémoire pour accès ultra-rapide
      this.setMemoryCache(key, item.data, item.expiry - (now - item.timestamp));

      return item.data;
    } catch (error) {
      console.error("❌ Erreur lecture cache persistant:", error);
      return null;
    }
  }

  // ✅ NOUVEAU: Précharger en cache mémoire
  preloadMemoryCache(key: string, data: any, expiry: number = 5 * 60 * 1000) {
    // Ne fait que mettre en cache mémoire, pas de persistant
    this.setMemoryCache(key, data, expiry);
  }

  // ✅ STATISTIQUES DU CACHE
  getMemoryCacheStats() {
    const stats = {
      totalItems: this.memoryCache.size,
      items: Array.from(this.memoryCache.entries()).map(([key, item]) => ({
        key,
        size: JSON.stringify(item.data).length,
        accessCount: item.accessCount || 0,
        lastAccess: item.lastAccess || 0,
        age: Date.now() - item.timestamp,
        remaining: item.expiry - (Date.now() - item.timestamp),
      })),
    };

    // Trier par accès
    stats.items.sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0));

    return stats;
  }

  // 🚀 NETTOYAGE OPTIMISÉ
  async cleanExpiredCache() {
    console.log("🧹 Cleaning expired cache...");

    // ✅ Nettoyer cache mémoire expiré
    const now = Date.now();
    let memoryCleanedCount = 0;

    for (const [key, item] of this.memoryCache.entries()) {
      if (now - item.timestamp > item.expiry) {
        this.memoryCache.delete(key);
        memoryCleanedCount++;
      }
    }

    console.log(`🧹 Memory: removed ${memoryCleanedCount} expired items`);

    // ✅ Nettoyer cache persistant expiré
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith("cache_"));
      let persistentCleanedCount = 0;

      for (const key of cacheKeys) {
        try {
          const cached = await AsyncStorage.getItem(key);
          if (cached) {
            const item: CacheItem = JSON.parse(cached);
            if (now - item.timestamp > item.expiry) {
              await AsyncStorage.removeItem(key);
              persistentCleanedCount++;
            }
          }
        } catch (error) {
          // Si erreur de parsing, supprimer l'item corrompu
          await AsyncStorage.removeItem(key);
          persistentCleanedCount++;
        }
      }

      console.log(
        `🧹 Persistent: removed ${persistentCleanedCount} expired items`
      );
    } catch (error) {
      console.error("❌ Erreur nettoyage cache persistant:", error);
    }
  }

  // 🚀 INVALIDATION INTELLIGENTE
  async invalidateCache(key: string) {
    // ⚡ Supprimer du cache mémoire en premier
    this.memoryCache.delete(key);

    // ✅ Puis du cache persistant
    try {
      await AsyncStorage.removeItem(`cache_${key}`);
      console.log(`🗑️ Cache invalidated: ${key}`);
    } catch (error) {
      console.error(`❌ Erreur invalidation cache ${key}:`, error);
    }
  }

  // 🚀 CLEAR OPTIMISÉ
  async clearAllCache() {
    console.log("🔥 Clearing ALL cache...");

    // ⚡ Clear cache mémoire immédiatement
    const memorySize = this.memoryCache.size;
    this.memoryCache.clear();
    console.log(`⚡ Memory cache cleared: ${memorySize} items`);

    // ✅ Clear cache persistant
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith("cache_"));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`💾 Persistent cache cleared: ${cacheKeys.length} items`);
    } catch (error) {
      console.error("❌ Erreur clear cache persistant:", error);
    }
  }

  // ✅ NOUVEAU: Check cache santé
  async checkCacheHealth() {
    const memoryStats = this.getMemoryCacheStats();

    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith("cache_"));

      const health = {
        memory: {
          items: memoryStats.totalItems,
          maxItems: this.maxMemoryItems,
          usage: (memoryStats.totalItems / this.maxMemoryItems) * 100,
        },
        persistent: {
          items: cacheKeys.length,
        },
        topAccessed: memoryStats.items.slice(0, 5).map((item) => ({
          key: item.key,
          accessCount: item.accessCount,
          age: Math.floor(item.age / 1000) + "s",
        })),
      };

      console.log("📊 Cache Health:", health);
      return health;
    } catch (error) {
      console.error("❌ Error checking cache health:", error);
      return null;
    }
  }

  // ✅ NOUVEAU: Auto-maintenance périodique
  startAutoMaintenance(intervalMinutes: number = 30) {
    console.log(
      `🔧 Starting auto-maintenance (${intervalMinutes}min interval)`
    );

    const interval = setInterval(async () => {
      console.log("🔧 Auto-maintenance running...");
      await this.cleanExpiredCache();
      this.checkCacheHealth();
    }, intervalMinutes * 60 * 1000);

    return interval; // Return pour pouvoir clear si besoin
  }
}

export default CacheManager.getInstance();
