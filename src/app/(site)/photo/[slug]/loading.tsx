import { Skeleton } from "@/components/ui/skeleton";

export default function PhotoLoading() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <Skeleton className="h-[520px] w-full rounded-2xl" />
      <Skeleton className="h-[520px] w-full rounded-2xl" />
    </div>
  );
}
