import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, ImageProps, View } from "react-native";

interface ImageCacheItem {
  uri: string;
  isLoaded: boolean;
  timestamp: number;
}

class ImageCacheManager {
  private static instance: ImageCacheManager;
  private cache: Map<string, ImageCacheItem> = new Map();
  private preloadQueue: Set<string> = new Set();

  static getInstance(): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager();
    }
    return ImageCacheManager.instance;
  }

  async preloadImage(uri: string): Promise<boolean> {
    if (this.cache.has(uri)) {
      return true;
    }

    if (this.preloadQueue.has(uri)) {
      return false;
    }

    this.preloadQueue.add(uri);

    return new Promise((resolve) => {
      Image.prefetch(uri)
        .then(() => {
          this.cache.set(uri, {
            uri,
            isLoaded: true,
            timestamp: Date.now(),
          });
          this.preloadQueue.delete(uri);
          resolve(true);
        })
        .catch(() => {
          this.preloadQueue.delete(uri);
          resolve(false);
        });
    });
  }

  async preloadImages(uris: string[]): Promise<void> {
    const promises = uris.map((uri) => this.preloadImage(uri));
    await Promise.allSettled(promises);
  }

  isImageCached(uri: string): boolean {
    const cached = this.cache.get(uri);
    if (!cached) return false;

    const isExpired = Date.now() - cached.timestamp > 3600000;
    if (isExpired) {
      this.cache.delete(uri);
      return false;
    }

    return cached.isLoaded;
  }

  cleanExpiredCache(): void {
    const now = Date.now();
    for (const [uri, item] of this.cache.entries()) {
      if (now - item.timestamp > 3600000) {
        this.cache.delete(uri);
      }
    }
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      preloading: this.preloadQueue.size,
    };
  }
}

const imageCache = ImageCacheManager.getInstance();

export function useImageCache(uri?: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!uri) return;

    if (imageCache.isImageCached(uri)) {
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    imageCache.preloadImage(uri).then((success) => {
      setIsLoaded(success);
      setIsLoading(false);
    });
  }, [uri]);

  return {
    isLoaded,
    isLoading,
    uri: isLoaded ? uri : undefined,
  };
}

export function useImagePreloader() {
  const preloadImages = useCallback(async (uris: string[]) => {
    if (uris.length === 0) return;

    console.log("Prechargement de " + uris.length + " images...");
    await imageCache.preloadImages(uris);
    console.log(uris.length + " images prechargees");
  }, []);

  const preloadProfileImages = useCallback(
    async (users: any[]) => {
      const imageUris = users
        .map((user) => user.photos?.[0] || user.profile_photo)
        .filter(Boolean);

      await preloadImages(imageUris);
    },
    [preloadImages]
  );

  return {
    preloadImages,
    preloadProfileImages,
    getCacheStats: () => imageCache.getCacheStats(),
  };
}

interface OptimizedImageProps extends Omit<ImageProps, "source"> {
  uri?: string;
  fallbackUri?: string;
  showLoader?: boolean;
  loaderColor?: string;
}

export function OptimizedImage(props: OptimizedImageProps) {
  const {
    uri,
    fallbackUri,
    showLoader = true,
    loaderColor = "#FF5135",
    style,
    ...imageProps
  } = props;
  const { isLoaded, isLoading, uri: cachedUri } = useImageCache(uri);
  const { isLoaded: fallbackLoaded } = useImageCache(fallbackUri);

  const imageSource = cachedUri
    ? { uri: cachedUri }
    : fallbackLoaded && fallbackUri
    ? { uri: fallbackUri }
    : undefined;

  if (!imageSource && showLoader && isLoading) {
    const viewStyle = {
      justifyContent: "center" as const,
      alignItems: "center" as const,
    };

    return React.createElement(
      View,
      {
        style: [style, viewStyle],
      },
      React.createElement(ActivityIndicator, {
        size: "small",
        color: loaderColor,
      })
    );
  }

  if (!imageSource) {
    return null;
  }

  return React.createElement(Image, {
    ...imageProps,
    source: imageSource,
    style: style,
  });
}

export default imageCache;
