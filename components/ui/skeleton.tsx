import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const skeletonVariants = cva(
    "animate-pulse rounded-md bg-muted",
    {
        variants: {
            variant: {
                default: "bg-muted",
                primary: "bg-primary/20",
                secondary: "bg-secondary",
            },
            shape: {
                default: "rounded-md",
                circle: "rounded-full",
                pill: "rounded-full",
            },
        },
        defaultVariants: {
            variant: "default",
            shape: "default",
        },
    }
);

interface SkeletonProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> { }

function Skeleton({ className, variant, shape, ...props }: SkeletonProps) {
    return (
        <div
            className={cn(skeletonVariants({ variant, shape, className }))}
            {...props}
        />
    );
}

// Post Card Skeleton
function PostCardSkeleton() {
    return (
        <div className="rounded-xl border bg-card p-4 space-y-4">
            <div className="flex items-center gap-3">
                <Skeleton shape="circle" className="h-12 w-12" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
            <Skeleton className="h-64 w-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="flex gap-4">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
            </div>
        </div>
    );
}

// Story Skeleton
function StorySkeleton() {
    return (
        <div className="flex min-w-[76px] flex-col items-center gap-2">
            <Skeleton shape="circle" className="h-20 w-20" />
            <Skeleton className="h-3 w-16" />
        </div>
    );
}

// Profile Skeleton
function ProfileSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Skeleton shape="circle" className="h-24 w-24" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <Skeleton className="h-32 w-full" />
        </div>
    );
}

export { Skeleton, PostCardSkeleton, StorySkeleton, ProfileSkeleton };
export type { SkeletonProps };