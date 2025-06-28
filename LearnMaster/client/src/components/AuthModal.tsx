import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, registerSchema } from "@shared/schema";
import type { LoginRequest, RegisterRequest } from "@shared/schema";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "login" | "register";
}

export default function AuthModal({ isOpen, onClose, initialTab = "login" }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, isLoginLoading, isRegisterLoading } = useAuth();
  const { toast } = useToast();

  const loginForm = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterRequest>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const handleLogin = async (data: LoginRequest) => {
    try {
      await login(data);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      onClose();
      loginForm.reset();
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  const handleRegister = async (data: RegisterRequest) => {
    try {
      await register(data);
      toast({
        title: "Account created!",
        description: "Welcome to CognoQuest! Check your email to verify your account.",
      });
      onClose();
      registerForm.reset();
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const resetForms = () => {
    loginForm.reset();
    registerForm.reset();
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForms();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
              {activeTab === "login" ? "Welcome Back" : "Create Account"}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <Button
            variant="ghost"
            className={`flex-1 pb-2 ${
              activeTab === "login"
                ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
            onClick={() => {
              setActiveTab("login");
              resetForms();
            }}
          >
            Sign In
          </Button>
          <Button
            variant="ghost"
            className={`flex-1 pb-2 ${
              activeTab === "register"
                ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
            onClick={() => {
              setActiveTab("register");
              resetForms();
            }}
          >
            Sign Up
          </Button>
        </div>

        {/* Login Form */}
        {activeTab === "login" && (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
            <div>
              <Label htmlFor="login-email" className="text-gray-700 dark:text-gray-300">
                Email
              </Label>
              <Input
                id="login-email"
                type="email"
                placeholder="Enter your email"
                className="mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                {...loginForm.register("email")}
              />
              {loginForm.formState.errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="login-password" className="text-gray-700 dark:text-gray-300">
                Password
              </Label>
              <div className="relative mt-1">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white pr-10"
                  {...loginForm.register("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 dark:text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              disabled={isLoginLoading}
            >
              {isLoginLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        )}

        {/* Register Form */}
        {activeTab === "register" && (
          <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  placeholder="First name"
                  className="mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  {...registerForm.register("firstName")}
                />
                {registerForm.formState.errors.firstName && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {registerForm.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName" className="text-gray-700 dark:text-gray-300">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  placeholder="Last name"
                  className="mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  {...registerForm.register("lastName")}
                />
                {registerForm.formState.errors.lastName && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {registerForm.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="register-email" className="text-gray-700 dark:text-gray-300">
                Email
              </Label>
              <Input
                id="register-email"
                type="email"
                placeholder="Enter your email"
                className="mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                {...registerForm.register("email")}
              />
              {registerForm.formState.errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {registerForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="register-password" className="text-gray-700 dark:text-gray-300">
                Password
              </Label>
              <div className="relative mt-1">
                <Input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white pr-10"
                  {...registerForm.register("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 dark:text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {registerForm.formState.errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              disabled={isRegisterLoading}
            >
              {isRegisterLoading ? "Creating account..." : "Create Account"}
            </Button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}