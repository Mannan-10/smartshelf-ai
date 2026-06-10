import { LogoutButton } from "@/components/ui/logout-button";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-muted/40 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-xl border bg-background p-8 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                SmartShelf AI
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                Dashboard
              </h1>
              <p className="mt-2 text-muted-foreground">
                Login flow is working. This route is protected by cookie-based
                authentication.
              </p>
            </div>

            <LogoutButton />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-5">
              <p className="text-sm text-muted-foreground">Products</p>
              <p className="mt-2 text-2xl font-bold">0</p>
            </div>

            <div className="rounded-lg border p-5">
              <p className="text-sm text-muted-foreground">Low stock</p>
              <p className="mt-2 text-2xl font-bold">0</p>
            </div>

            <div className="rounded-lg border p-5">
              <p className="text-sm text-muted-foreground">Expiry alerts</p>
              <p className="mt-2 text-2xl font-bold">0</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}