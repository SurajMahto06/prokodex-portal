"use client";

import { use, useState, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, ChevronRight, CheckCircle, RotateCcw, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { topicsService } from "@/services/topics";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export default function MCQPage({ params }: { params: Promise<{ topicId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const { data: topic, isLoading } = useQuery({
    queryKey: ['topics', resolvedParams.topicId],
    queryFn: () => topicsService.getTopicById(resolvedParams.topicId),
    enabled: !!resolvedParams.topicId,
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
        <p className="text-zinc-400">Loading quiz...</p>
      </div>
    );
  }

  if (!topic) return notFound();

  const questions = topic.mcqs
    ? [...topic.mcqs].sort((a: any, b: any) => {
      if (a.order !== undefined && b.order !== undefined && a.order !== b.order) {
        return (a.order ?? 0) - (b.order ?? 0);
      }
      const numA = parseInt(a.question?.match(/^(\d+)\./)?.[1] || "0", 10);
      const numB = parseInt(b.question?.match(/^(\d+)\./)?.[1] || "0", 10);
      if (numA && numB) return numA - numB;
      return 0;
    })
    : [];
  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <p className="text-zinc-400">No MCQs available for this topic yet.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const sortedOptions = currentQuestion.options
    ? [...currentQuestion.options].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
    : [];
  const isCorrect = selectedOption === currentQuestion.correctOptionId;
  const progressPercentage = ((currentQuestionIndex) / questions.length) * 100;

  const handleSubmit = () => {
    if (!selectedOption) return;
    setIsSubmitted(true);
    if (isCorrect) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      setShowResults(true);
    }
  };

  if (showResults) {
    const finalPercentage = Math.round((score / questions.length) * 100);
    const isPassed = finalPercentage >= 70;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full py-16 px-4"
      >
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 shadow-2xl relative overflow-hidden text-center">
          <div className={`absolute top-0 left-0 w-full h-2 ${isPassed ? 'bg-green-500' : 'bg-red-500'}`}></div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center mb-8 border-4 ${isPassed ? 'bg-green-50 border-green-500/50 text-green-700 dark:bg-green-950/30 dark:border-green-500/50 dark:text-green-400' : 'bg-red-50 border-red-500/50 text-red-700 dark:bg-red-950/30 dark:border-red-500/50 dark:text-red-400'}`}
          >
            <span className="text-2xl font-bold tracking-tight">{finalPercentage}%</span>
          </motion.div>

          <h2 className="text-base font-bold tracking-tight text-white mb-4">
            {isPassed ? "Outstanding Work!" : "Keep Practicing!"}
          </h2>
          <p className="text-[13px] text-zinc-400 mb-10">
            You scored <span className="text-white font-bold">{score}</span> out of {questions.length} questions correctly.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={() => {
                setCurrentQuestionIndex(0);
                setScore(0);
                setShowResults(false);
                setSelectedOption(null);
                setIsSubmitted(false);
              }}
              className="h-10 px-5 rounded-lg text-xs sm:text-[13px] lg:text-sm font-semibold bg-zinc-800 text-white hover:bg-zinc-700 transition-colors flex items-center w-full sm:w-auto justify-center cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake Quiz
            </button>
            <Link
              href={`/topic/${topic.id}/interview`}
              className="h-10 px-5 rounded-lg text-xs sm:text-[13px] lg:text-sm font-semibold bg-cyan-400 text-zinc-950 hover:bg-cyan-500 transition-colors flex items-center w-full sm:w-auto justify-center shadow-[0_0_15px_rgba(8,145,178,0.25)]"
            >
              Continue to Interview Prep
              <ChevronRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full pb-24 ">
      <Link href={`/topic/${topic.id}`} className="inline-flex items-center text-[13px] font-medium text-zinc-400 hover:text-cyan-400 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Link>

      {/* Modern Progress Bar */}
      <div className="mb-6 sm:mb-8">
        <div className="flex justify-between text-xs sm:text-[13px] font-medium text-zinc-400 mb-2.5">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>{Math.round(progressPercentage)}% Completed</span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 sm:p-7 md:p-8 shadow-xl backdrop-blur-sm"
        >
          <h2 className="text-sm sm:text-base md:text-lg font-bold text-white mb-6 leading-snug">
            {currentQuestion.question}
          </h2>

          <div className="space-y-3 mb-6">
            {sortedOptions.map((option: any, idx: number) => {
              const isSelected = selectedOption === option.id;
              const isCorrectOption = option.id === currentQuestion.correctOptionId;

              let containerStyle = "bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-300";
              let letterStyle = "bg-zinc-800 text-zinc-400";

              if (isSubmitted) {
                if (isCorrectOption) {
                  containerStyle = "bg-green-50 border-green-500 text-green-900 dark:bg-green-950/30 dark:border-green-500/50 dark:text-green-300";
                  letterStyle = "bg-green-600 dark:bg-green-500 text-[#ffffff]";
                } else if (isSelected && !isCorrectOption) {
                  containerStyle = "bg-red-50 border-red-500 text-red-900 dark:bg-red-950/30 dark:border-red-500/50 dark:text-red-300";
                  letterStyle = "bg-red-600 dark:bg-red-500 text-[#ffffff]";
                }
              } else if (isSelected) {
                containerStyle = "bg-cyan-50 border-cyan-500 text-cyan-900 dark:bg-cyan-950/30 dark:border-cyan-500 dark:text-cyan-300 shadow-[0_0_15px_rgba(8,145,178,0.2)]";
                letterStyle = "bg-cyan-500 text-[#ffffff]";
              }

              return (
                <button
                  key={option.id}
                  onClick={() => !isSubmitted && setSelectedOption(option.id)}
                  disabled={isSubmitted}
                  className={`w-full text-left px-4 py-3 sm:px-4.5 sm:py-3.5 rounded-xl border transition-all duration-200 flex items-center group cursor-pointer ${containerStyle}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs mr-3.5 shrink-0 transition-colors ${letterStyle}`}>
                    {LETTERS[idx]}
                  </div>
                  <span className="text-xs sm:text-[13px] lg:text-sm font-medium flex-1 leading-normal">{option.text}</span>

                  {isSubmitted && isCorrectOption && <CheckCircle className="w-5 h-5 text-green-500 ml-3 shrink-0" />}
                  {isSubmitted && isSelected && !isCorrectOption && <XCircle className="w-5 h-5 text-red-500 ml-3 shrink-0" />}
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {isSubmitted && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 sm:p-5 rounded-xl mb-6 border ${isCorrect ? 'bg-green-50/90 border-green-200 text-green-950 dark:bg-green-950/20 dark:border-green-900/30' : 'bg-red-50/90 border-red-200 text-red-950 dark:bg-red-950/20 dark:border-red-900/30'}`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-1.5 rounded-full ${isCorrect ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                    {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className={`text-sm sm:text-base font-bold mb-1.5 ${isCorrect ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                      {isCorrect ? 'Excellent! That is correct.' : 'Not quite right.'}
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-300 text-xs sm:text-[13px] leading-relaxed">{currentQuestion.explanation}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end pt-4 mt-2 border-t border-zinc-800/40">
            {!isSubmitted ? (
              <button
                onClick={handleSubmit}
                disabled={!selectedOption}
                className={`h-10 px-5 rounded-lg text-xs sm:text-[13px] lg:text-sm font-semibold transition-all flex items-center justify-center w-full sm:w-auto ${selectedOption
                  ? "bg-cyan-400 text-zinc-950 hover:bg-cyan-500 shadow-[0_0_15px_rgba(8,145,178,0.25)]"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  } cursor-pointer`}
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="h-10 px-5 rounded-lg text-xs sm:text-[13px] lg:text-sm font-semibold bg-white text-black hover:bg-zinc-200 transition-all flex items-center justify-center w-full sm:w-auto cursor-pointer"
              >
                {currentQuestionIndex < questions.length - 1 ? 'Continue' : 'View Results'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
