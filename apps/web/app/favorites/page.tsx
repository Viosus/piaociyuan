// app/favorites/page.tsx
import { Suspense } from "react";
import UnifiedFavoritesClient from "./ui/UnifiedFavoritesClient";

export default function FavoritesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>加载中...</p></div>}>
      <UnifiedFavoritesClient />
    </Suspense>
  );
}
