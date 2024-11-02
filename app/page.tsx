"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Plus, Copy } from "lucide-react";
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

type Message = {
  role: "user" | "bot";
  content: string;
};

export default function Component() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      setMessages((prev) => [...prev, { role: "user", content: input }]);
      setIsExpanded(true);

      try {
        const response = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: input,
            context: "Provide any necessary context here",
          }),
        });
        const data = await response.json();

        if (data.answer) {
          setMessages((prev) => [
            ...prev,
            { role: "bot", content: data.answer },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "bot",
              content: "I couldn't find an answer. Please try again.",
            },
          ]);
        }
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            content: "Error occurred while fetching the response.",
          },
        ]);
      }

      setInput("");
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setIsExpanded(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700">
        <div className="flex justify-center items-center px-4 py-3 max-w-[1920px] mx-auto">
          <NextImage
            src={theme === "dark" ? "/hits-dark.svg" : "/hits-light.svg"}
            alt="University Logo"
            width={256}
            height={256}
            className=""
          />
          <div className="absolute right-4">
            <ModeToggle />
          </div>
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
                  className="flex-grow pl-4 pr-12 py-4 h-14 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-neutral-700 rounded-2xl"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black text-white dark:bg-white dark:text-black rounded-full"
                >
                  <Send className="h-5 w-5" />
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 w-full max-w-4xl mx-auto px-4 py-6">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`${
                      message.role === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    <div
                      className={`inline-block ${
                        message.role === "user"
                          ? "bg-gray-100 dark:bg-neutral-800"
                          : "bg-neutral-200 dark:bg-neutral-700"
                      } p-4 rounded-lg max-w-[90%]`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="w-full max-w-4xl mx-auto px-4 py-4">
              <form
                onSubmit={handleSubmit}
                className="relative flex items-center"
              >
                <Input
                  type="text"
                  placeholder="Type your message here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full pl-4 pr-12 py-4 h-14 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-neutral-700 rounded-2xl"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black text-white dark:bg-white dark:text-black"
                >
                  <Send className="h-5 w-5" />
                  <span className="sr-only">Send</span>
                </Button>
              </form>
            </div>
          </>
        )}
      </main>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            className="fixed bottom-4 right-4 rounded-full w-12 h-12 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
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
              Starting a new chat will delete the current conversation. This
              action cannot be undone.
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

      <footer className="py-2 text-center text-xs text-gray-400 dark:text-gray-500">
        <p>
          © 2024 Hindustan Institute of Technology and Science. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}
