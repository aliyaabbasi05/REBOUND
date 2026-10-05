import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Loader2,
  Trophy,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generatePracticeQuestions } from '../../services/api';
import { PracticeQuestion, PracticeQuestionResult } from '../../types';

export const PracticeQuizModal: React.FC = () => {
  const {
    isPracticeModalOpen,
    setIsPracticeModalOpen,
    practiceTopic,
    practiceTopicId,
    activeRecoveryPlan,
    recordPracticeResult,
    subjects,
    curriculums,
    recurringMistakes,
    profile,
  } = useApp();

  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [questionResults, setQuestionResults] = useState<PracticeQuestionResult[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const topicToUse = practiceTopic || activeRecoveryPlan?.topic || '';
  const topicIdToUse = practiceTopicId || activeRecoveryPlan?.topicId || '';
  const topicMatches = useMemo(() => subjects.flatMap((subject) => subject.topics
    .filter((topic) => topicIdToUse ? topic.id === topicIdToUse || topic.canonicalId === topicIdToUse : topic.name.trim().toLocaleLowerCase() === topicToUse.trim().toLocaleLowerCase())
    .map((topic) => ({ subject, topic }))), [subjects, topicIdToUse, topicToUse]);
  const topicOwner = topicMatches.length === 1 ? topicMatches[0].subject : undefined;
  const targetTopic = topicMatches.length === 1 ? topicMatches[0].topic : undefined;
  const activeSubject = topicOwner?.name || activeRecoveryPlan?.subject || '';
  const activeSubjectId = topicOwner?.id || activeRecoveryPlan?.subjectId;
  const activeCurriculum = Object.values(curriculums).find((curriculum) => curriculum.subjectId === activeSubjectId) || curriculums[activeSubject];
  const unitIdToUse = targetTopic?.unitId || activeRecoveryPlan?.unitId;
  const topicMistakes = useMemo(
    () => recurringMistakes.filter((mistake) => mistake.subjectId === activeSubjectId && mistake.topicId === targetTopic?.id),
    [recurringMistakes, activeSubjectId, targetTopic?.id]
  );

  useEffect(() => {
    if (!isPracticeModalOpen) return;

    let mounted = true;
    setLoading(true);
    setErrorMessage(null);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setQuestionResults([]);
    setQuizFinished(false);

    if (!topicToUse || !activeSubject || !targetTopic || !activeCurriculum) {
      setErrorMessage(topicMatches.length > 1
        ? 'Not Enough Data — this topic name appears in more than one unit. Open practice from a specific curriculum topic so its ID is selected.'
        : 'Not Enough Data — choose a topic from a confirmed curriculum or saved recovery plan before starting practice.');
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    generatePracticeQuestions({
      topic: topicToUse,
      subject: activeSubject,
      subjectId: activeSubjectId,
      topicId: targetTopic.id,
      unitId: unitIdToUse,
      count: 5,
      curriculum: activeCurriculum,
      personalizedAi: profile.privacy?.personalizedAi !== false,
      relevantMistakes: profile.privacy?.personalizedAi === false ? [] : topicMistakes,
    })
      .then((data) => {
        if (mounted && data?.questions?.length === 5) {
          setQuestions(data.questions);
        } else if (mounted) {
          setErrorMessage('Not Enough Data — the coach could not produce exactly five validated questions for this topic.');
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error(err);
          setErrorMessage(err instanceof Error ? `Practice unavailable: ${err.message}` : 'Practice unavailable. No practice result was recorded.');
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isPracticeModalOpen, practiceTopic, practiceTopicId, activeSubject, activeSubjectId, activeCurriculum, topicMistakes, topicToUse, topicIdToUse, unitIdToUse, targetTopic, topicMatches.length]);

  if (!isPracticeModalOpen) return null;

  const currentQ = questions[currentIndex];

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswerSubmitted(true);
    if (selectedOption === currentQ.correctIndex) setScore((prev) => prev + 1);
  };

  const handleNextQuestion = () => {
    if (!currentQ || selectedOption === null) return;
    const answer: PracticeQuestionResult = {
      questionId: currentQ.id,
      question: currentQ.question,
      selectedIndex: selectedOption,
      correctIndex: currentQ.correctIndex,
      isCorrect: selectedOption === currentQ.correctIndex,
      answeredAt: new Date().toISOString(),
    };
    const allResults = [...questionResults, answer];
    setQuestionResults(allResults);
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      if (!activeSubjectId || !targetTopic) {
        setErrorMessage('Not Enough Data — this result cannot be saved without a confirmed subject and topic ID.');
        return;
      }
      const finalScore = allResults.filter((result) => result.isCorrect).length;
      setScore(finalScore);
      setQuizFinished(true);
      // Save practice result into persistent state
      recordPracticeResult({
        topic: topicToUse,
        subject: activeSubject,
        subjectId: activeSubjectId,
        topicId: targetTopic.id,
        unitId: unitIdToUse,
        score: finalScore,
        totalQuestions: questions.length,
        date: new Date().toISOString(),
        questionResults: allResults,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#254533]/20 overflow-hidden my-6">
        {/* Top Header */}
        <div className="p-6 border-b border-[#254533] flex items-center justify-between bg-[#14281D] text-white">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-[#B4F04C] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#B4F04C]" /> 5-Question Targeted Practice Session
            </span>
            <h3 className="text-lg font-black text-white mt-0.5">
              {practiceTopic || activeRecoveryPlan?.topic || 'Practice Session'} ({activeSubject})
            </h3>
          </div>
          <button
            onClick={() => setIsPracticeModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#9BB0A3] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-7">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-[#14281D] animate-spin mb-3" />
              <p className="text-sm font-bold text-gray-900">
                Generating 5 targeted practice questions...
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Customized for {practiceTopic || 'your recovery topic'} based on your curriculum.
              </p>
            </div>
          ) : errorMessage ? (
            <div className="py-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
              <p className="text-sm font-bold text-gray-900">{errorMessage}</p>
              <button
                onClick={() => setIsPracticeModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#14281D] text-[#B4F04C] font-bold text-xs"
              >
                Close
              </button>
            </div>
          ) : quizFinished ? (
            <div className="text-center py-6 space-y-5 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-[#14281D] text-[#B4F04C] flex items-center justify-center mx-auto shadow-md">
                <Trophy className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-xl font-black text-[#14281D]">Practice Drill Completed!</h4>
                <p className="text-sm text-[#557361] mt-1 font-medium">
                  You scored <span className="font-black text-[#14281D]">{score}</span> out of{' '}
                  <span className="font-black text-[#14281D]">{questions.length}</span> questions ({Math.round((score / questions.length) * 100)}%).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#E2EAE4] text-left text-xs space-y-1.5">
                <p className="font-bold text-[#14281D]">Drill Summary saved to your history:</p>
                <p className="text-[#557361]">
                  • This five-question attempt and its score are saved to your practice history.
                </p>
                <p className="text-[#557361]">
                  • Practice performance is separate from curriculum mastery until there is enough evidence.
                </p>
              </div>

              <button
                onClick={() => setIsPracticeModalOpen(false)}
                className="w-full py-3 rounded-2xl bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          ) : currentQ ? (
            <div className="space-y-5">
              {/* Question Progress bar */}
              <div className="flex items-center justify-between text-xs font-bold text-[#14281D]">
                <span>
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-[#557361]">Score: {score}</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#14281D] h-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Question text */}
              <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#E2EAE4]">
                <p className="text-sm font-bold text-[#14281D] leading-relaxed">
                  {currentQ.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQ.correctIndex;

                  let btnStyle = 'border-gray-200 bg-white text-gray-800 hover:border-gray-300';
                  if (isSelected) {
                    btnStyle = 'border-[#14281D] bg-[#14281D] text-white font-bold';
                  }
                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                    } else if (isSelected && !isCorrect) {
                      btnStyle = 'border-rose-500 bg-rose-50 text-rose-900';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={isAnswerSubmitted}
                      className={`w-full text-left p-3.5 rounded-2xl border text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                    >
                      <span>{option}</span>
                      {isAnswerSubmitted && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation when submitted */}
              {isAnswerSubmitted && (
                <div className="p-4 rounded-2xl bg-[#14281D] text-white text-xs space-y-1.5 animate-fade-in">
                  <p className="font-black text-[#B4F04C]">Concept Explanation:</p>
                  <p className="text-white/90 leading-relaxed">{currentQ.conceptExplanation}</p>
                  {currentQ.commonTrap && (
                    <p className="text-amber-300 font-medium pt-1">
                      ⚠️ Watch out: {currentQ.commonTrap}
                    </p>
                  )}
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-end pt-3">
                {!isAnswerSubmitted ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={selectedOption === null}
                    className="px-5 py-2.5 rounded-xl bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] font-extrabold text-xs shadow-xs disabled:opacity-40 cursor-pointer"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="px-5 py-2.5 rounded-xl bg-[#B4F04C] hover:bg-[#c2f768] text-[#14281D] font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>
                      {currentIndex + 1 < questions.length ? 'Next Question' : 'Finish Quiz'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
