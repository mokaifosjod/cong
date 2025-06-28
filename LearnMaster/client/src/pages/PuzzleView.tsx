import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Lightbulb, SkipForward, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Puzzle } from "@shared/schema";

type PuzzleViewParams = {
  subject: string;
  difficulty?: string;
};

export default function PuzzleView() {
  const params = useParams<PuzzleViewParams>();
  const [, setLocation] = useLocation();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>(params.difficulty || "");
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [chancesRemaining, setChancesRemaining] = useState(3);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [progress, setProgress] = useLocalStorage(`progress_${params.subject}`, {});

  const difficulties = [
    { id: "novice", name: "Novice", description: "Foundation Level", color: "green" },
    { id: "adept", name: "Adept", description: "Intermediate Level", color: "blue" },
    { id: "expert", name: "Expert", description: "Advanced Level", color: "purple" },
    { id: "master", name: "Master", description: "Expert Level", color: "red" }
  ];

  const { data: puzzlesData, isLoading } = useQuery<{ puzzles: Puzzle[]; total: number }>({
    queryKey: ["/api/puzzles", params.subject, selectedDifficulty],
    queryFn: async () => {
      const url = selectedDifficulty 
        ? `/api/puzzles/${params.subject}?difficulty=${selectedDifficulty}`
        : `/api/puzzles/${params.subject}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch puzzles');
      return response.json();
    },
    enabled: !!selectedDifficulty
  });

  const puzzles = puzzlesData?.puzzles || [];
  const currentPuzzle = puzzles[currentPuzzleIndex];

  useEffect(() => {
    if (params.difficulty && !selectedDifficulty) {
      setSelectedDifficulty(params.difficulty);
    }
  }, [params.difficulty, selectedDifficulty]);

  const selectDifficulty = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
    setCurrentPuzzleIndex(0);
    resetPuzzleState();
    setLocation(`/puzzle/${params.subject}/${difficulty}`);
  };

  const resetPuzzleState = () => {
    setSelectedAnswer("");
    setChancesRemaining(3);
    setHintsUsed(0);
    setShowSolution(false);
    setShowHint(false);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !currentPuzzle) return;

    const isCorrect = selectedAnswer === currentPuzzle.correctAnswer;

    if (isCorrect) {
      // Correct answer - move to next puzzle
      setTimeout(() => {
        nextPuzzle();
      }, 1500);
    } else {
      // Incorrect answer
      const newChances = chancesRemaining - 1;
      setChancesRemaining(newChances);

      if (newChances === 0) {
        setShowSolution(true);
      }
    }
  };

  const showHintHandler = () => {
    if (hintsUsed < (currentPuzzle?.hints.length || 0)) {
      setHintsUsed(hintsUsed + 1);
      setShowHint(true);
    }
  };

  const nextPuzzle = () => {
    if (currentPuzzleIndex < puzzles.length - 1) {
      setCurrentPuzzleIndex(currentPuzzleIndex + 1);
      resetPuzzleState();
      
      // Update progress
      const newProgress = {
        ...progress,
        [selectedDifficulty]: currentPuzzleIndex + 2
      };
      setProgress(newProgress);
    }
  };

  const skipPuzzle = () => {
    nextPuzzle();
  };

  const progressPercentage = puzzles.length > 0 ? ((currentPuzzleIndex + 1) / puzzles.length) * 100 : 0;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/")}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
            {selectedDifficulty && puzzles.length > 0 && (
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="capitalize font-medium">
                  {params.subject} - {selectedDifficulty}
                </span>
                <span>
                  Puzzle {currentPuzzleIndex + 1} of {puzzles.length}
                </span>
              </div>
            )}
          </div>
          
          {puzzles.length > 0 && (
            <Progress value={progressPercentage} className="h-2" />
          )}
        </CardContent>
      </Card>

      {/* Difficulty Selector */}
      {!selectedDifficulty && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Difficulty Level</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {difficulties.map((difficulty) => (
                <Button
                  key={difficulty.id}
                  variant="outline"
                  className="h-auto p-4 flex-col items-center"
                  onClick={() => selectDifficulty(difficulty.id)}
                >
                  <div className="text-lg font-semibold">{difficulty.name}</div>
                  <div className="text-sm text-gray-600">{difficulty.description}</div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Puzzle Content */}
      {currentPuzzle && (
        <Card>
          <CardContent className="p-8">
            {/* Question */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {currentPuzzle.question}
              </h2>
            </div>

            {/* Options */}
            <div className="mb-8">
              <RadioGroup 
                value={selectedAnswer} 
                onValueChange={setSelectedAnswer}
                className="space-y-3"
              >
                {currentPuzzle.options.map((option) => (
                  <div
                    key={option.label}
                    className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-all"
                  >
                    <RadioGroupItem value={option.label} id={option.label} />
                    <Label htmlFor={option.label} className="flex-1 cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={showHintHandler}
                  disabled={hintsUsed >= (currentPuzzle.hints.length || 0)}
                  className="bg-amber-100 text-amber-800 hover:bg-amber-200"
                >
                  <Lightbulb className="w-5 h-5 mr-2" />
                  Hint ({(currentPuzzle.hints.length || 0) - hintsUsed})
                </Button>
                <Button variant="outline" onClick={skipPuzzle}>
                  <SkipForward className="w-5 h-5 mr-2" />
                  Skip
                </Button>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Chances: <span className="font-semibold">{chancesRemaining}</span>/3
                </div>
                <Button 
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer || showSolution}
                  className="bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600"
                >
                  Submit Answer
                </Button>
              </div>
            </div>

            {/* Hint Display */}
            {showHint && hintsUsed > 0 && (
              <Card className="mb-6 bg-amber-50 border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <Lightbulb className="w-5 h-5 text-amber-600 mr-2 mt-0.5" />
                    <div>
                      <div className="font-medium text-amber-800 mb-1">Hint:</div>
                      <div className="text-amber-700">
                        {currentPuzzle.hints[hintsUsed - 1]}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Solution Display */}
            {showSolution && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <Info className="w-6 h-6 text-blue-600 mr-3 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-blue-800 mb-2">Solution & Explanation:</div>
                      <div className="text-blue-700 space-y-2">
                        <p><strong>Correct Answer:</strong> {currentPuzzle.correctAnswer}) {
                          currentPuzzle.options.find(opt => opt.label === currentPuzzle.correctAnswer)?.text
                        }</p>
                        <div dangerouslySetInnerHTML={{ __html: currentPuzzle.explanation }} />
                      </div>
                      <Button 
                        onClick={nextPuzzle}
                        className="mt-4 bg-blue-600 hover:bg-blue-700"
                        disabled={currentPuzzleIndex >= puzzles.length - 1}
                      >
                        Next Puzzle →
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
