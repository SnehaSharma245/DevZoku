"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

export const withAuth = (
  Component: React.ComponentType,
  requiredRole?: "developer" | "organizer"
) => {
  const AuthenticatedComponent = (props: any) => {
    const { user, loading, error } = useAuth();
    const router = useRouter();
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
      // Only run this effect once
      if (!authChecked) {
        // If we're done loading and there's no user, redirect to login
        if (!loading && !user) {
          router.push("/auth/login");
        }

        // If role checking is required and user has wrong role
        if (!loading && user && requiredRole && user.role !== requiredRole) {
          router.push("/");
        }

        setAuthChecked(true);
      }
    }, [loading, user, router, authChecked]);

    if (loading) {
      return (
        <div className="min-h-screen flex justify-center items-center">
          <p>Loading...</p>
        </div>
      );
    }

    // Show error message if any
    if (error) {
      return (
        <div className="min-h-screen flex justify-center items-center">
          <p className="text-red-500">{error}</p>
        </div>
      );
    }

    // If we need a specific role and user doesn't have it
    if (user && requiredRole && user.role !== requiredRole) {
      return (
        <div className="min-h-screen flex justify-center items-center">
          <p className="text-red-500">
            You don't have permission to access this page
          </p>
        </div>
      );
    }

    // All good, render the component
    return <Component {...props} />;
  };

  return AuthenticatedComponent;
};
