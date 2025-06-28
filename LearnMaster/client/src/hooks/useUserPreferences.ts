import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface UserPreferences {
  starredSubjects: string[];
  darkMode: boolean;
}

export function useUserPreferences() {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["/api/user/preferences", user?.id],
    queryFn: async () => {
      if (!isAuthenticated || !user) return null;
      
      const token = localStorage.getItem('authToken');
      if (!token) return null;

      const response = await fetch('/api/user/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!isAuthenticated && !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<UserPreferences>) => {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No auth token');

      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newPreferences),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user/preferences", user?.id], data);
    },
  });

  return {
    preferences,
    isLoading,
    updatePreferences: updatePreferencesMutation.mutateAsync,
    isUpdating: updatePreferencesMutation.isPending,
  };
}