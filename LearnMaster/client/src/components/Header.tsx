import { useState } from "react";
import { useLocation } from "wouter";
import { Sun, Moon, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import AuthModal from "@/components/AuthModal";

export default function Header() {
  const [location, setLocation] = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const { user, isAuthenticated, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const openAuthModal = (tab: "login" | "register") => {
    setAuthTab(tab);
    setAuthModalOpen(true);
  };

  const handleLogout = () => {
    logout();
  };

  const getUserInitials = () => {
    if (!user) return "G";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                  CognoQuest
                </h1>
              </div>
              <nav className="hidden md:flex space-x-8">
                <Button
                  variant="ghost"
                  className={`${
                    isActive("/") 
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-1 font-medium rounded-none" 
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 pb-1 font-medium"
                  }`}
                  onClick={() => setLocation("/")}
                >
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  className={`${
                    isActive("/blog") 
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-1 font-medium rounded-none" 
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 pb-1 font-medium"
                  }`}
                  onClick={() => setLocation("/blog")}
                >
                  Blog
                </Button>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>

              {isAuthenticated ? (
                <>
                  {/* User Progress */}
                  <div className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                    <span>247</span> Puzzles Solved
                  </div>

                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {getUserInitials()}
                          </span>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="w-[200px] truncate text-sm text-gray-500 dark:text-gray-400">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                      <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                      <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                      <DropdownMenuItem 
                        onClick={handleLogout}
                        className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    onClick={() => openAuthModal("login")}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => openAuthModal("register")}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authTab}
      />
    </>
  );
}
