// apps/frontend/components/logout-button.tsx

"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const { logout, isLoading } = useAuth();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={logout}
      disabled={isLoading}
    >
      {isLoading ? "Logging out..." : "Logout"}
    </Button>
  );
}