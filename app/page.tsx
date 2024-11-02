"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Plus, Copy } from "lucide-react";
import NextImage from "next/image";
import { ModeToggle } from "@/components/ui/mode-toggle";

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
      <header className="sticky top-0 z-50 bg-white dark:bg-[#202123] border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center px-4 py-3 max-w-[1920px] mx-auto">
          <div className="flex items-center gap-3 mx-auto">
            {" "}
            {/* Center align logo */}
            <NextImage
              src="/hits.svg"
              alt="University Logo"
              width={256}
              height={256}
              className=""
            />
          </div>
          <ModeToggle /> {/* Add the ModeToggle component here */}
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col">
        {!isExpanded ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 md:p-8 max-w-[1920px] mx-auto w-full">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-gray-100">
              What can I help with?
            </h2>
            <form onSubmit={handleSubmit} className="w-3/4 mb-8">
              {" "}
              {/* Adjusted to 75% width */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Message UniChat..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full pl-4 pr-12 py-4 h-14 bg-gray-100 dark:bg-[#40414f] border border-gray-300 dark:border-gray-600 focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-gray-600 rounded-2xl"
                />
                <Button
                  type="submit"
                  size="icon"
                  className={`absolute right-2 top-2 h-10 w-10 rounded-full ${
                    isExpanded ? "bg-white text-black" : "bg-black text-white"
                  }`}
                >
                  <Send className="h-5 w-5" />
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1">
              <div className="max-w-3xl mx-auto lg:max-w-4xl xl:max-w-6xl px-6 py-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`px-4 ${
                      message.role === "user" ? "flex justify-end my-4" : "py-8"
                    }`}
                  >
                    <div
                      className={`${
                        message.role === "user"
                          ? "bg-gray-100 dark:bg-[#40414F] rounded-3xl px-6 py-3 max-w-[90%] md:max-w-[80%] border border-gray-300 dark:border-gray-600"
                          : "max-w-3xl mx-auto border border-gray-300 dark:border-gray-600 px-6 py-3 rounded-3xl"
                      }`}
                    >
                      <div className="prose dark:prose-invert max-w-none">
                        {message.content}
                      </div>
                      {message.role === "bot" && (
                        <div className="flex items-center gap-3 mt-2 text-gray-400">
                          <button
                            onClick={() => copyToClipboard(message.content)}
                            className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="max-w-3xl mx-auto lg:max-w-4xl xl:max-w-5xl px-4 py-4">
              <form
                onSubmit={handleSubmit}
                className="relative w-3/4 mx-auto" // Adjusted to 75% width
              >
                <Input
                  type="text"
                  placeholder="Message UniChat..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full pl-4 pr-12 py-4 h-14 bg-gray-100 dark:bg-[#40414f] border border-gray-300 dark:border-gray-600 focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-gray-600 rounded-2xl"
                />
                <Button
                  type="submit"
                  size="icon"
                  className={`absolute right-2 top-2 h-10 w-10 rounded-full ${
                    isExpanded ? "bg-white text-black" : "bg-black text-white"
                  }`}
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
            className="fixed bottom-4 right-4 rounded-full w-12 h-12 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
            size="icon"
          >
            <Plus className="h-6 w-6" />
            <span className="sr-only">New Chat</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-white dark:bg-[#2a2b32] border border-gray-200 dark:border-gray-700">
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
            <AlertDialogCancel className="border border-gray-200 dark:border-gray-700">
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
