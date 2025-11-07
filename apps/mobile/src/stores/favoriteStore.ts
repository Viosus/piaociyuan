import { create } from 'zustand';
import type { Post } from '@piaoyuzhou/shared';

interface FavoriteState {
  favoritePostIds: Set<number>;
  favoritePosts: Post[];
  addFavorite: (postId: number) => void;
  removeFavorite: (postId: number) => void;
  isFavorite: (postId: number) => boolean;
  setFavoritePosts: (posts: Post[]) => void;
  clearFavorites: () => void;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favoritePostIds: new Set(),
  favoritePosts: [],

  addFavorite: (postId) => {
    set((state) => {
      const newFavoriteIds = new Set(state.favoritePostIds);
      newFavoriteIds.add(postId);
      return { favoritePostIds: newFavoriteIds };
    });
  },

  removeFavorite: (postId) => {
    set((state) => {
      const newFavoriteIds = new Set(state.favoritePostIds);
      newFavoriteIds.delete(postId);

      const newFavoritePosts = state.favoritePosts.filter(
        (post) => post.id !== postId
      );

      return {
        favoritePostIds: newFavoriteIds,
        favoritePosts: newFavoritePosts
      };
    });
  },

  isFavorite: (postId) => {
    return get().favoritePostIds.has(postId);
  },

  setFavoritePosts: (posts) => {
    const favoritePostIds = new Set(posts.map((post) => post.id));
    set({ favoritePosts: posts, favoritePostIds });
  },

  clearFavorites: () => {
    set({ favoritePostIds: new Set(), favoritePosts: [] });
  },
}));
