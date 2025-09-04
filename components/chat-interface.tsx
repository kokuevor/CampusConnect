"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, ArrowLeft, MapPin, Package, Phone, MoreVertical } from "lucide-react"

interface Message {
  id: number
  senderId: string
  senderName: string
  content: string
  timestamp: string
  type: "text" | "system" | "location" | "delivery_update"
  metadata?: any
}

interface ChatInterfaceProps {
  conversation: {
    id: number
    name: string
    avatar: string
    status: "online" | "offline" | "away"
    deliveryContext?: {
      type: "request" | "trip"
      title: string
      from: string
      to: string
      status: string
      reward?: string
    }
  }
  onBack: () => void
}

export function ChatInterface({ conversation, onBack }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      senderId: "system",
      senderName: "System",
      content: `You're now connected with ${conversation.name} for delivery coordination.`,
      timestamp: "2 hours ago",
      type: "system",
    },
    {
      id: 2,
      senderId: conversation.name.toLowerCase().replace(" ", ""),
      senderName: conversation.name,
      content: "Hi! I saw your delivery request. I can help with that!",
      timestamp: "2 hours ago",
      type: "text",
    },
    {
      id: 3,
      senderId: "current_user",
      senderName: "You",
      content: "Great! When would be a good time for pickup?",
      timestamp: "2 hours ago",
      type: "text",
    },
    {
      id: 4,
      senderId: conversation.name.toLowerCase().replace(" ", ""),
      senderName: conversation.name,
      content: "I'm available around 3 PM today. Does that work for you?",
      timestamp: "1 hour ago",
      type: "text",
    },
    {
      id: 5,
      senderId: "current_user",
      senderName: "You",
      content: "Perfect! I'll be at the main library entrance.",
      timestamp: "1 hour ago",
      type: "text",
    },
    {
      id: 6,
      senderId: conversation.name.toLowerCase().replace(" ", ""),
      senderName: conversation.name,
      content: "I'm on my way to pick up your lunch!",
      timestamp: "2 min ago",
      type: "text",
    },
  ])

  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const message: Message = {
      id: messages.length + 1,
      senderId: "current_user",
      senderName: "You",
      content: newMessage,
      timestamp: "Just now",
      type: "text",
    }

    setMessages([...messages, message])
    setNewMessage("")

    // Simulate typing indicator and response
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const responses = [
        "Thanks for the update!",
        "Sounds good to me.",
        "I'll be there in a few minutes.",
        "Perfect, see you soon!",
        "Got it, thanks!",
      ]
      const response: Message = {
        id: messages.length + 2,
        senderId: conversation.name.toLowerCase().replace(" ", ""),
        senderName: conversation.name,
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: "Just now",
        type: "text",
      }
      setMessages((prev) => [...prev, response])
    }, 2000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "away":
        return "bg-yellow-500"
      default:
        return "bg-gray-400"
    }
  }

  const formatTime = (timestamp: string) => {
    if (timestamp === "Just now") return timestamp
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col h-[600px] max-w-4xl mx-auto">
      {/* Chat Header */}
      <Card className="rounded-b-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="relative">
                <Avatar>
                  <AvatarImage src={conversation.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {conversation.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(conversation.status)}`}
                />
              </div>
              <div>
                <CardTitle className="text-lg">{conversation.name}</CardTitle>
                <p className="text-sm text-muted-foreground capitalize">{conversation.status}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Delivery Context */}
          {conversation.deliveryContext && (
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{conversation.deliveryContext.title}</span>
                </div>
                <Badge variant="outline">{conversation.deliveryContext.status}</Badge>
              </div>
              <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>
                    {conversation.deliveryContext.from} → {conversation.deliveryContext.to}
                  </span>
                </div>
                {conversation.deliveryContext.reward && (
                  <span className="font-medium text-primary">{conversation.deliveryContext.reward}</span>
                )}
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Messages Area */}
      <Card className="flex-1 rounded-none border-t-0">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                {message.type === "system" ? (
                  <div className="flex justify-center">
                    <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div className={`flex ${message.senderId === "current_user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`flex items-end space-x-2 max-w-[70%] ${message.senderId === "current_user" ? "flex-row-reverse space-x-reverse" : ""}`}
                    >
                      {message.senderId !== "current_user" && (
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={conversation.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">
                            {conversation.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`px-3 py-2 rounded-lg ${
                          message.senderId === "current_user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${message.senderId === "current_user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                        >
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-end space-x-2 max-w-[70%]">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={conversation.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">
                      {conversation.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted px-3 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </Card>

      {/* Message Input */}
      <Card className="rounded-t-none border-t-0">
        <CardContent className="p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button type="submit" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
