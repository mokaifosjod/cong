import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { LoginRequest, RegisterRequest, User } from "@shared/schema";

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
}

interface AuthResponse {
  user: AuthUser;
  token: string;
  message: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return null;
      
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          localStorage.removeItem('authToken');
          return null;
        }
        
        const data = await response.json();
        return data.user;
      } catch {
        localStorage.removeItem('authToken');
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<AuthResponse> => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('authToken', data.token);
      queryClient.setQueryData(["/api/auth/me"], data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterRequest): Promise<AuthResponse> => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('authToken', data.token);
      queryClient.setQueryData(["/api/auth/me"], data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const logout = () => {
    localStorage.removeItem('authToken');
    queryClient.setQueryData(["/api/auth/me"], null);
    queryClient.clear();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    loginError: loginMutation.error?.message,
    registerError: registerMutation.error?.message,
  };
}