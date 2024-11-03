"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Plus, Loader } from "lucide-react";
import NextImage from "next/image";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { useTheme } from "next-themes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Message = {
  role: "user" | "bot";
  content: string;
};

export default function Component() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (navigator.vibrate) {
      navigator.vibrate(50); // Add subtle haptic feedback for mobile
    }

    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setIsExpanded(true);
    setIsLoading(true);
    setInput("");

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content:
            data.answer ||
            "I'm sorry, I couldn't find an answer. Please try again or ask something else.",
        },
      ]);
    } catch (error) {
      console.error("Error occurred while fetching response:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "An error occurred. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setIsExpanded(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700">
        <div className="flex justify-between items-center px-4 py-3 max-w-[1920px] mx-auto">
          <NextImage
            src={theme === "dark" ? "/hits-dark.svg" : "/hits-light.svg"}
            alt="University Logo"
            width={180}
            height={180}
            className="w-32 sm:w-40 md:w-48 lg:w-56 h-auto"
          />
          <ModeToggle />
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col items-center justify-center">
        {!isExpanded ? (
          <div className="flex flex-col items-center justify-center gap-6 p-4 md:p-8 w-full max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-gray-100 text-center">
              How can I assist you?
            </h2>
            <form onSubmit={handleSubmit} className="w-full max-w-2xl">
              <div className="relative flex items-center">
                <Input
                  type="text"
                  placeholder="Type your message here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-grow pl-3 pr-10 py-3 h-12 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-neutral-700 rounded-2xl text-sm"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black text-white dark:bg-white dark:text-black rounded-full"
                >
                  {isLoading ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </form>
            <Footer />
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 mb-24">
              <div className="space-y-2 leading-relaxed pr-2">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`${
                      message.role === "user" ? "text-right" : "text-left"
                    } w-full overflow-hidden`}
                  >
                    <div
                      className={`inline-block ${
                        message.role === "user"
                          ? "bg-gray-100 dark:bg-neutral-800"
                          : "bg-neutral-200 dark:bg-neutral-700"
                      } p-3 rounded-lg max-w-[85%] text-sm whitespace-pre-wrap overflow-hidden`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="text-center mt-2">
                    <Loader className="h-5 w-5 animate-spin" />
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="fixed bottom-0 left-0 right-0 z-20">
              <div className="relative">
                <div className="absolute -top-20 left-0 right-0 h-20 bg-gradient-to-t from-white/95 via-white/70 to-transparent dark:from-neutral-900/95 dark:via-neutral-900/70 dark:to-transparent" />
                
                <div className="max-w-4xl mx-auto px-4">
                  <div className="flex items-center justify-center gap-2 py-4 bg-white dark:bg-neutral-900">
                    <form
                      onSubmit={handleSubmit}
                      className="relative flex-grow flex items-center max-w-[calc(100%-3.5rem)]"
                    >
                      <Input
                        type="text"
                        placeholder="Type your message here..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        className="w-full pl-3 pr-10 py-3 h-12 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-neutral-700 rounded-2xl text-sm truncate"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black text-white dark:bg-white dark:text-black rounded-full"
                      >
                        {isLoading ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        <span className="sr-only">Send</span>
                      </Button>
                    </form>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          className="w-12 h-12 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black rounded-full"
                          size="icon"
                        >
                          <Plus className="h-6 w-6" />
                          <span className="sr-only">New Chat</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
                            Start a New Chat?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
                            Starting a new chat will delete the current
                            conversation. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border border-gray-200 dark:border-neutral-700">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction onClick={startNewChat}>
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Footer() {
  return (
    <footer className="py-2 text-center text-xs text-gray-400 dark:text-gray-500">
      © 2024 Hindustan Institute of Technology and Science. All rights reserved.{" "}
      <br />
      <HoverCard>
        <HoverCardTrigger asChild>
          <span className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-200 cursor-pointer font-medium">
            Developed by Beny Dishon K
          </span>
        </HoverCardTrigger>
        <HoverCardContent className="w-72 sm:w-80 p-3">
          <div className="flex space-x-4">
            <Avatar>
              <AvatarImage src="https://media.licdn.com/dms/image/v2/D5603AQHb4iGoBjuuwA/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1728841903516?e=1736380800&v=beta&t=2FC3oxpU2FT0DquNlTt9U_k0K6Wa39vJsIsLtxULbyA" />
              <AvatarFallback>BD</AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-left">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Beny Dishon K
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Software Engineer and Full Stack Developer. Passionate about
                innovation and learning. Actively building solutions that
                enhance lives worldwide.
              </p>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </footer>
  );
}
