"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import LoadingScreen from "@/components/LoadingScreen";

export const withAuth = (
  Component: React.ComponentType,
  requiredRole?: "developer" | "organizer"
) => {
  const AuthenticatedComponent = (props: any) => {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
      // Only run this effect once
      if (!authChecked) {
        // If we're done loading and there's no user, redirect to login
        if (!loading && !user) {
          router.push("/");
          return;
        }

        // If role checking is required and user has wrong role
        if (!loading && user && requiredRole && user.role !== requiredRole) {
          router.push("/unauthorized");
          return;
        }

        setAuthChecked(true);
      }
    }, [loading, user, router, authChecked, isAuthenticated]);

    if (loading || !authChecked) {
      return <LoadingScreen />;
    }

    if (!isAuthenticated) {
      return null;
    }

    // Check role before rendering component
    if (requiredRole && user?.role !== requiredRole) {
      return null;
    }

    // All good, render the component
    return <Component {...props} />;
  };

  return AuthenticatedComponent;
};
