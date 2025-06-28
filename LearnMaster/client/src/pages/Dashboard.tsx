import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import SubjectCard from "@/components/SubjectCard";
import { Card, CardContent } from "@/components/ui/card";
import { Star, BookOpen, Trophy, Target } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAuth } from "@/hooks/useAuth";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import type { Subject } from "@shared/schema";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const { preferences, updatePreferences } = useUserPreferences();
  const [starredSubjects, setStarredSubjects] = useLocalStorage<string[]>("starredSubjects", []);
  
  const { data: subjectsData, isLoading } = useQuery<{ subjects: Subject[] }>({
    queryKey: ["/api/subjects"],
  });

  // Sync starred subjects with server preferences when available
  useEffect(() => {
    if (isAuthenticated && preferences?.starredSubjects && Array.isArray(preferences.starredSubjects)) {
      setStarredSubjects(preferences.starredSubjects);
    }
  }, [isAuthenticated, preferences?.starredSubjects, setStarredSubjects]);

  const subjects = subjectsData?.subjects || [];
  const starred = subjects.filter(subject => starredSubjects.includes(subject.id));
  const unstarred = subjects.filter(subject => !starredSubjects.includes(subject.id));

  const toggleStar = async (subjectId: string) => {
    const newStarred = starredSubjects.includes(subjectId)
      ? starredSubjects.filter(id => id !== subjectId)
      : [...starredSubjects, subjectId];
    
    setStarredSubjects(newStarred);

    // Sync with server if authenticated
    if (isAuthenticated) {
      try {
        await updatePreferences({ starredSubjects: newStarred });
      } catch {
        // Ignore server sync errors
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
        <div className="animate-pulse">
          <div className="gradient-bg h-64"></div>
          <div className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-gray-200 dark:bg-gray-700 h-48 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 transition-colors">
      {/* Hero Section */}
      <section className="gradient-bg text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {isAuthenticated ? `Welcome back, ${user?.firstName}!` : "Your Brain Gym Awaits"}
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Master 3,000+ intelligent puzzles across 30 subjects
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Card className="bg-white/20 backdrop-blur border-0">
              <CardContent className="px-6 py-3 text-center">
                <div className="flex items-center justify-center mb-2">
                  <BookOpen className="w-6 h-6 text-blue-100" />
                </div>
                <div className="text-2xl font-bold">3,000+</div>
                <div className="text-sm text-blue-100">Total Puzzles</div>
              </CardContent>
            </Card>
            <Card className="bg-white/20 backdrop-blur border-0">
              <CardContent className="px-6 py-3 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Target className="w-6 h-6 text-blue-100" />
                </div>
                <div className="text-2xl font-bold">30</div>
                <div className="text-sm text-blue-100">Subjects</div>
              </CardContent>
            </Card>
            <Card className="bg-white/20 backdrop-blur border-0">
              <CardContent className="px-6 py-3 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Trophy className="w-6 h-6 text-blue-100" />
                </div>
                <div className="text-2xl font-bold">4</div>
                <div className="text-sm text-blue-100">Difficulty Levels</div>
              </CardContent>
            </Card>
          </div>
          {!isAuthenticated && (
            <div className="bg-white/10 backdrop-blur rounded-lg p-6 max-w-2xl mx-auto">
              <p className="text-lg text-blue-50 mb-4">
                Create an account to track your progress across devices and unlock advanced features!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Subjects Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Choose Your Challenge</h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Select from our comprehensive collection of subjects designed for competitive exams and skill development
            </p>
          </div>

          {/* Starred Subjects */}
          {starred.length > 0 && (
            <div className="mb-8">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Star className="w-5 h-5 text-yellow-400 mr-2 fill-current" />
                Your Starred Subjects
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {starred.map((subject) => (
                  <SubjectCard
                    key={subject.id}
                    subject={subject}
                    isStarred={true}
                    onToggleStar={toggleStar}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Subjects Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {unstarred.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                isStarred={false}
                onToggleStar={toggleStar}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
