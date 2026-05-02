import { CardGridSkeleton } from "@/components/PageSkeleton";

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="h-8 w-48 rounded-full bg-white/50 animate-pulse" />
      <CardGridSkeleton columns={3} rows={3} />
    </div>
  );
}
