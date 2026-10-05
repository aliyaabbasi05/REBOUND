import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  HelpCircle,
  Loader2,
  BookOpen,
  Target,
  RotateCcw,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { askAICoach } from '../../services/api';
import { ChatMessage } from '../../types';

const CHAT_STORAGE_KEY = 'rebound_academic_coach_messages_v1';

const readChatMessages = (): ChatMessage[] => {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((message): message is ChatMessage =>
      !!message && typeof message === 'object' &&
      ((message as ChatMessage).role === 'user' || (message as ChatMessage).role === 'assistant') &&
      typeof (message as ChatMessage).content === 'string' && typeof (message as ChatMessage).timestamp === 'string'
    ).slice(-100) : [];
  } catch {
    return [];
  }
};

export const AICoachView: React.FC = () => {
  const {
    profile,
    subjects,
    currentFocus,
    testHistory,
    recurringMistakes,
    curriculums,
    activeRecoveryPlan,
    practiceHistory,
    coachInitialQuery,
    setCoachInitialQuery,
  } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const stored = readChatMessages();
    if (stored.length) return stored;
    const hasData = subjects.length > 0 || testHistory.length > 0;
    return [
      {
        id: 'welcome-coach',
        role: 'assistant',
        content: `Hello${profile.name ? ` ${profile.name}` : ''}! I'm the REBOUND academic study assistant.

${profile.privacy?.personalizedAi === false
  ? 'Personalized context sharing is off. I will receive only your latest question, not saved profile, course, assessment, practice, or earlier chat details.'
  : hasData && currentFocus.topic && currentFocus.status !== 'Not Enough Data'
    ? `I can use relevant saved study records when you ask. The current recorded focus is **${currentFocus.topic}**; this is a study signal, not a guarantee of overall mastery.`
    : `There is not enough saved evidence yet for a personalized progress claim. You can still ask general academic questions.`}

How can I help?`,
        timestamp: new Date().toISOString(),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested questions from specification (Section 12)
  const suggestedPrompts = [
    'Why did I lose marks?',
    'Explain my weakest topic.',
    'Give me 5 practice questions.',
    'What should I revise next?',
    'Have I improved?',
    'Why do I keep making this mistake?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-100)));
    } catch {
      // Keep the active conversation usable if browser storage is unavailable.
    }
  }, [messages]);

  // If coachInitialQuery was passed from another screen
  useEffect(() => {
    if (coachInitialQuery) {
      handleSendMessage(coachInitialQuery);
      setCoachInitialQuery('');
    }
  }, [coachInitialQuery]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isSending) return;

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const historyPayload = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await askAICoach({
        messages: historyPayload,
        studentProfile: profile,
        currentFocus,
        subjects,
        testHistory,
        recurringMistakes,
        curriculums,
        activeRecoveryPlan,
        practiceHistory,
      });

      const assistantMsg: ChatMessage = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          role: 'assistant',
          content: 'AI Coach unavailable right now. No response was generated because the service could not be reached. Please try again when it is available.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-3xl border border-[#E2EAE4] shadow-xs overflow-hidden animate-fade-in">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-[#254533] bg-[#14281D] text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1C3527] text-[#B4F04C] border border-[#254533] flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">REBOUND AI Coach</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#1C3527] text-[#B4F04C] border border-[#254533] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B4F04C]" /> {profile.privacy?.personalizedAi === false ? 'Privacy mode' : 'Evidence-aware'}
              </span>
            </div>
            <p className="text-xs text-[#9BB0A3]">{profile.privacy?.personalizedAi === false ? 'Only your latest question is sent to the AI service.' : 'Replies may use this chat and relevant saved academic context.'}</p>
          </div>
        </div>

        {/* Quick Context Pill */}
        <div className="hidden sm:flex items-center gap-2 bg-[#1C3527] px-3 py-1.5 rounded-xl border border-[#254533] text-xs font-bold text-[#B4F04C]">
          <Target className="w-3.5 h-3.5 text-[#B4F04C]" />
          <span>{currentFocus.topic && currentFocus.status !== 'Not Enough Data' ? `Focus: ${currentFocus.topic}` : 'Focus: Not Enough Data'}</span>
        </div>
      </div>

      {/* Suggested Questions Drawer */}
      <div className="px-4 py-2.5 bg-[#F4F6F4] border-b border-[#E2EAE4] flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-black text-[#14281D] shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#14281D]" /> Quick Prompts:
        </span>
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSendMessage(prompt)}
            className="px-3 py-1 rounded-xl bg-white hover:bg-[#E8EFEA] border border-[#E2EAE4] text-[#14281D] text-xs font-bold whitespace-nowrap transition-colors shadow-2xs cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-[#14281D] text-[#B4F04C] flex items-center justify-center shrink-0 text-xs font-bold shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-[#14281D] text-white rounded-br-xs shadow-xs'
                    : 'bg-[#F4F6F4] border border-[#E2EAE4] text-[#14281D] rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-line space-y-2">{m.content}</div>
                <span
                  className={`block text-[10px] mt-2 font-medium ${
                    isUser ? 'text-[#9BB0A3] text-right' : 'text-gray-400'
                  }`}
                >
                  {Number.isNaN(new Date(m.timestamp).getTime()) ? m.timestamp : new Date(m.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex gap-3 items-center text-xs text-gray-500 p-2">
            <div className="w-8 h-8 rounded-xl bg-[#F4F6F4] text-[#14281D] flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <span>AI Coach analyzing your test history and curriculum context...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 sm:p-4 border-t border-gray-100 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your coach anything about your tests, concepts, or recovery plan..."
            className="flex-1 px-4 py-3 rounded-2xl bg-[#F4F6F4] border border-[#E2EAE4] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#14281D] focus:bg-white transition-all text-[#14281D] font-medium"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="w-11 h-11 rounded-2xl bg-[#B4F04C] hover:bg-[#c2f768] text-[#14281D] flex items-center justify-center shadow-xs disabled:opacity-40 transition-all shrink-0 active:scale-95 cursor-pointer"
            aria-label="Send message"
          >
            <Send className="w-4 h-4 stroke-[2.75]" />
          </button>
        </form>
      </div>
    </div>
  );
};
