import { ListSkeleton } from "@/components/PageSkeleton";

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="h-8 w-32 rounded-full bg-white/50 animate-pulse" />
      <ListSkeleton rows={5} />
    </div>
  );
}
