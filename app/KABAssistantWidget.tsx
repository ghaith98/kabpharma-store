"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  Bot,
  ExternalLink,
  Send,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useLanguage } from "../context/LanguageContext";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  needsHuman?: boolean;
  needsSignup?: boolean;
};

type AuthState = "checking" | "guest" | "authenticated";

const CHAT_STORAGE_KEY = "kab_ai_chat";
const GUEST_NOTICE_STORAGE_KEY = "kab_ai_guest_notice_shown";

const copy = {
  ar: {
    online: "مساعد KAB الذكي",
    title: "كيف يمكنني مساعدتكِ؟",
    intro:
      "أهلاً بكِ في KAB Pharma. اسأليني عن منتجات الموقع، المكونات، طريقة الاستخدام، السعر أو التوفر.",
    placeholder: "اكتبي سؤالكِ هنا...",
    send: "إرسال",
    thinking: "أتحقق من معلومات KAB...",
    human: "التواصل مع فريق KAB",
    signup: "إنشاء حساب",
    guestNotice:
      "أنشئي حساباً أو سجّلي الدخول أولاً لتتمكني من الدردشة معي ومساعدتكِ بمنتجات KAB.",
    whatsappNote: "هل تحتاجين مساعدة مباشرة؟ فريقنا متاح عبر واتساب.",
    error: "تعذر إرسال الرسالة الآن. يرجى المحاولة مجدداً.",
    assistant: "مساعد KAB",
  },
  en: {
    online: "KAB AI Assistant",
    title: "How can I help?",
    intro:
      "Welcome to KAB Pharma. Ask about website products, ingredients, use, price, or availability.",
    placeholder: "Type your question...",
    send: "Send",
    thinking: "Checking KAB information...",
    human: "Contact KAB team",
    signup: "Create an account",
    guestNotice:
      "Please create an account or sign in first so you can chat with me and I can help with KAB products.",
    whatsappNote: "Need direct help? Our team is available on WhatsApp.",
    error: "Your message could not be sent. Please try again.",
    assistant: "KAB Assistant",
  },
} as const;

export default function KABAssistantWidget({
  placement = "floating",
}: {
  placement?: "floating" | "banner";
}) {
  const { lang } = useLanguage();
  const isArabic = lang === "ar";
  const t = copy[lang];

  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [authState, setAuthState] = useState<AuthState>("checking");

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkCustomerSession() {
      try {
        const response = await fetch("/api/customer/me", {
          cache: "no-store",
        });
        const data = await response.json();

        setAuthState(
          response.ok && data?.authenticated
            ? "authenticated"
            : "guest"
        );
      } catch {
        setAuthState("guest");
      }
    }

    void checkCustomerSession();
  }, []);

  useEffect(() => {
    if (authState !== "authenticated") {
      if (authState === "guest") {
        sessionStorage.removeItem(CHAT_STORAGE_KEY);
        setMessages([]);
      }

      return;
    }

    try {
      const savedMessages = sessionStorage.getItem(CHAT_STORAGE_KEY);

      sessionStorage.removeItem(GUEST_NOTICE_STORAGE_KEY);

      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages) as Message[];

        if (Array.isArray(parsedMessages)) {
          const customerMessages = parsedMessages
            .filter((message) => !message.needsSignup)
            .slice(-20);

          sessionStorage.setItem(
            CHAT_STORAGE_KEY,
            JSON.stringify(customerMessages)
          );
          setMessages(customerMessages);
        }
      }
    } catch {
      sessionStorage.removeItem(CHAT_STORAGE_KEY);
    }
  }, [authState]);

  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify(messages.slice(-20))
      );
    }
  }, [messages]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [isOpen, isSending, messages]);

  useEffect(() => {
    if (
      !isOpen ||
      isSending ||
      authState !== "authenticated"
    ) {
      return;
    }

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [authState, isOpen, isSending, messages]);

  useEffect(() => {
    if (
      !isOpen ||
      authState !== "guest" ||
      sessionStorage.getItem(GUEST_NOTICE_STORAGE_KEY)
    ) {
      return;
    }

    sessionStorage.setItem(GUEST_NOTICE_STORAGE_KEY, "true");
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: t.guestNotice,
        needsSignup: true,
      },
    ]);
  }, [authState, isOpen, t.guestNotice]);

  const whatsappUrl = useMemo(() => {
    const message = isArabic
      ? "مرحباً فريق KAB Pharma، أحتاج مساعدة من خدمة العملاء."
      : "Hello KAB Pharma team, I need help from customer service.";

    return `https://wa.me/963958088969?text=${encodeURIComponent(message)}`;
  }, [isArabic]);

  function openChat() {
    setIsOpen(true);

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 160);
  }

  async function sendMessage(
    event?: FormEvent,
    suggestedQuestion?: string
  ) {
    event?.preventDefault();

    const content = (suggestedQuestion || draft).trim();

    if (!content || isSending) {
      return;
    }

    if (authState !== "authenticated") {
      return;
    }

    const previousMessages = messages;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setIsSending(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          language: lang,
          history: previousMessages
            .slice(-8)
            .map(({ role, content: historyContent }) => ({
              role,
              content: historyContent,
            })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || t.error);
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: String(data.answer || t.error),
          needsHuman: data.needsHuman === true,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: t.error,
          needsHuman: true,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  const chatPanel = (
    <section
      aria-label={t.assistant}
      className={`fixed bottom-4 right-4 z-[10001] flex h-[min(610px,calc(100vh-9rem))] w-[calc(100vw-2rem)] max-w-[390px] origin-bottom-right flex-col overflow-hidden rounded-[26px] bg-[#fcfcf8] shadow-[0_24px_70px_rgba(10,48,33,0.28)] ring-1 ring-black/5 transition-all duration-300 md:bottom-6 md:right-6 ${
        isOpen
          ? "visible translate-y-0 scale-100 opacity-100"
          : "pointer-events-none invisible translate-y-5 scale-95 opacity-0"
      }`}
    >
      <header className="relative overflow-hidden bg-[#0a583b] px-5 pb-5 pt-5 text-white">
        <div className="absolute -right-8 -top-7 h-32 w-32 rounded-full bg-[#d8e8d5]/15" />
        <div className="absolute -bottom-12 left-8 h-28 w-28 rounded-full border border-white/10" />

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className={`absolute top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 ${
            isArabic ? "left-4" : "right-4"
          }`}
          aria-label="Close"
        >
          <X size={17} />
        </button>

        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f7f2e8] text-[#0a583b] shadow-lg">
            <Sparkles size={21} />
          </div>

          <div>
            <p className="text-[11px] font-medium text-[#dbeed9]">
              {t.online}
            </p>
            <h2 className="mt-0.5 text-lg font-bold">{t.title}</h2>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="rounded-2xl rounded-tr-md bg-[#eef4ec] p-4 text-sm leading-6 text-[#31443a]">
            <div className="mb-2 flex items-center gap-2 font-semibold text-[#0a583b]">
              <Bot size={16} />
              {t.assistant}
            </div>
            {t.intro}
          </div>
        )}

        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "flex justify-start"
                  : "flex justify-end"
              }
            >
              <div
                className={`max-w-[88%] rounded-2xl p-3.5 text-sm leading-6 ${
                  message.role === "user"
                    ? "rounded-tr-md bg-[#0a583b] text-white"
                    : "rounded-tl-md bg-[#eef4ec] text-[#31443a]"
                }`}
              >
                <div
                  className={`mb-1 flex items-center gap-1.5 text-[10px] font-bold ${
                    message.role === "user"
                      ? "text-white/70"
                      : "text-[#58816b]"
                  }`}
                >
                  {message.role === "user" ? (
                    <UserRound size={12} />
                  ) : (
                    <Bot size={12} />
                  )}
                  {message.role === "user"
                    ? isArabic
                      ? "أنتِ"
                      : "You"
                    : t.assistant}
                </div>

                <p className="whitespace-pre-line">{message.content}</p>

                {message.needsSignup && (
                  <a
                    href="/signup"
                    className="mt-3 flex items-center justify-center rounded-xl bg-[#0a583b] px-3 py-2.5 text-xs font-bold text-white"
                  >
                    {t.signup}
                  </a>
                )}

                {message.needsHuman && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#25d366] px-3 py-2.5 text-xs font-bold text-white"
                  >
                    <FaWhatsapp className="text-base" />
                    {t.human}
                  </a>
                )}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex justify-end">
              <div className="rounded-2xl rounded-tl-md bg-[#eef4ec] px-4 py-3 text-xs font-medium text-[#55705f]">
                <span className="inline-flex gap-1">
                  <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#0a583b] [animation-delay:-0.3s]" />
                  <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#0a583b] [animation-delay:-0.15s]" />
                  <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#0a583b]" />
                </span>
                <span className="mx-1">{t.thinking}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-[#e1e8df] bg-white px-3 py-3">
        <form
          onSubmit={(event) => sendMessage(event)}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={700}
            disabled={isSending || authState !== "authenticated"}
            placeholder={t.placeholder}
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-[#1b382a] outline-none placeholder:text-[#9aa79d]"
          />

          <button
            type="submit"
            disabled={
              !draft.trim() ||
              isSending ||
              authState !== "authenticated"
            }
            aria-label={t.send}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0a583b] text-white transition hover:bg-[#07432e] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send
              size={17}
              className={isArabic ? "rotate-180" : ""}
            />
          </button>
        </form>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-[#6b7e70] hover:text-[#0a583b]"
        >
          <FaWhatsapp className="text-[#25d366]" />
          {t.whatsappNote}
          <ExternalLink size={11} />
        </a>
      </div>
    </section>
  );

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={
        placement === "banner"
          ? "relative z-30 mt-4 w-fit"
          : "fixed bottom-24 right-4 z-[80] md:bottom-6 md:right-6"
      }
    >
      {typeof document !== "undefined" &&
        createPortal(chatPanel, document.body)}

      <button
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : openChat())}
        aria-expanded={isOpen}
        aria-label={
          isOpen
            ? "Close KAB Assistant"
            : "Open KAB Assistant"
        }
        className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-[#0a583b] text-white shadow-[0_12px_35px_rgba(10,88,59,0.38)] transition duration-300 hover:-translate-y-1 hover:bg-[#07432e] hover:shadow-[0_16px_40px_rgba(10,88,59,0.45)]"
      >
        {!isOpen && (
          <span className="absolute inset-0 animate-ping rounded-full bg-[#79b980] opacity-20" />
        )}

        <span className="relative">
          {isOpen ? <X size={25} /> : <Sparkles size={25} />}
        </span>

        {!isOpen && (
          <span
            className={`absolute -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#f3b43f] px-1 text-[10px] font-extrabold text-[#19412e] ${
              isArabic ? "-left-1" : "-right-1"
            }`}
          >
            AI
          </span>
        )}
      </button>
    </div>
  );
}
