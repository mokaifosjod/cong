import { useLocation } from "wouter";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Subject } from "@shared/schema";

interface SubjectCardProps {
  subject: Subject;
  isStarred: boolean;
  onToggleStar: (subjectId: string) => void;
}

const getSubjectIcon = (subjectId: string) => {
  const icons: Record<string, string> = {
    mathematics: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    physics: "M13 10V3L4 14h7v7l9-11h-7z",
    chemistry: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    compsci: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z",
    biology: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    history: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    geography: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
  };
  return icons[subjectId] || icons.mathematics;
};

export default function SubjectCard({ subject, isStarred, onToggleStar }: SubjectCardProps) {
  const [, setLocation] = useLocation();

  const handleCardClick = () => {
    setLocation(`/puzzle/${subject.id}`);
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleStar(subject.id);
  };

  // Mock progress for demo - in real app this would come from user progress data
  const progress = Math.floor(Math.random() * 100);

  return (
    <Card 
      className={`subject-card-hover cursor-pointer border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors ${subject.gradient}`}
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${subject.gradient.replace('from-', 'bg-').replace('to-', '').split(' ')[0]}`}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={getSubjectIcon(subject.id)} />
            </svg>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-50 hover:opacity-100 transition-opacity text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={handleStarClick}
          >
            <Star 
              className={`w-5 h-5 ${isStarred ? 'text-yellow-400 fill-current' : 'text-gray-400 dark:text-gray-500'}`} 
            />
          </Button>
        </div>
        
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{subject.name}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{subject.description}</p>
        
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span>{subject.totalPuzzles} Puzzles</span>
          <span>{progress}% Complete</span>
        </div>
        
        <Progress value={progress} className="h-2" />
      </CardContent>
    </Card>
  );
}
