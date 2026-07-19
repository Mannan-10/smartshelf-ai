import { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { CategoriesManager } from "@/components/categories/categories-manager";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Categories - SmartShelf AI",
    description: "Manage product categories for your inventory.",
};

export default async function CategoriesPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login?redirect=/categories");
    }

    return (
        <AppShell role={user.role} email={user.email}>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
                </div>
                <CategoriesManager />
            </div>
        </AppShell>
    );
}
