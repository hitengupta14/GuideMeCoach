'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { csrfFetch } from '@/lib/csrf-client'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  streaming?: boolean
}

interface ChatbotProps {
  conversationId?: string
}

export default function Chatbot({ conversationId: initialConversationId }: ChatbotProps) {
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [topic, setTopic] = useState<string | null>(null)
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = useCallback(async (conversationIdOverride?: string) => {
    const cid = conversationIdOverride ?? conversationId
    if (!cid || cid === 'null') return
    
    try {
      const response = await fetch(`/api/chat/messages?conversationId=${cid}`)
      if (!response.ok) {
        console.error('Error fetching messages:', response.statusText)
        return
      }
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }, [conversationId])

  // Fetch messages if conversation exists
  useEffect(() => {
    if (conversationId && conversationId !== 'null') {
      fetchMessages()
    }
  }, [conversationId, fetchMessages])

  const startConversation = async (selectedTopic: string) => {
    setTopic(selectedTopic)
    setLoading(true)

    try {
      const response = await csrfFetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          title: `${selectedTopic} Discussion`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create conversation')
      }

      const data = await response.json()
      setConversationId(data.id)
      await fetchMessages(data.id)
    } catch (error) {
      console.error('Error starting conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !conversationId || loading || isStreaming) return

    const userMessage = input
    setInput('')
    setLoading(true)

    // Add user message immediately
    const tempUserMessage: Message = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMessage])

    try {
      // Try streaming first
      const streamResponse = await csrfFetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content: userMessage,
        }),
      })

      if (streamResponse.ok && streamResponse.body) {
        setIsStreaming(true)
        setStreamingMessage('')

        const reader = streamResponse.body.getReader()
        const decoder = new TextDecoder()
        let accumulatedContent = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                // Persisted server-side by the streaming endpoint; refresh from DB.
                if (accumulatedContent.trim().length > 0) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `stream-${Date.now()}`,
                      role: 'assistant',
                      content: accumulatedContent,
                      createdAt: new Date().toISOString(),
                    },
                  ])
                }
                await fetchMessages(conversationId)
                break
              }

              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  accumulatedContent += parsed.content
                  setStreamingMessage(accumulatedContent)
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }

        setIsStreaming(false)
        setStreamingMessage('')
      } else {
        // Fallback to non-streaming
        const response = await csrfFetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            content: userMessage,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to send message')
        }

        const data = await response.json()

        setMessages((prev) => {
          // Remove temp user message and add real ones
          const filtered = prev.filter(m => m.id !== tempUserMessage.id)
          return [
            ...filtered,
            data.userMessage,
            data.assistantMessage,
          ]
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove temp message on error
      setMessages((prev) => prev.filter(m => m.id !== tempUserMessage.id))
    } finally {
      setLoading(false)
    }
	  }

	  // Topic selection view
	  if (!conversationId) {
	    return (
	      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Ask Your Fitness Coach</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => startConversation('exercise_form')}
            disabled={loading}
            className="p-6 border-2 border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-400 transition-colors disabled:opacity-50"
          >
            <div className="text-3xl mb-3"></div>
            <h3 className="font-bold text-gray-900 mb-2">Exercise Form</h3>
            <p className="text-sm text-gray-600">Get guidance on proper technique and form for any exercise</p>
          </button>

          <button
            onClick={() => startConversation('alternative_exercises')}
            disabled={loading}
            className="p-6 border-2 border-green-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition-colors disabled:opacity-50"
          >
            <div className="text-3xl mb-3"></div>
            <h3 className="font-bold text-gray-900 mb-2">Alternative Exercises</h3>
            <p className="text-sm text-gray-600">Find substitutes based on equipment, ability, or preference</p>
          </button>

          <button
            onClick={() => startConversation('safety')}
            disabled={loading}
            className="p-6 border-2 border-red-200 rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors disabled:opacity-50"
          >
            <div className="text-3xl mb-3"></div>
            <h3 className="font-bold text-gray-900 mb-2">Safety & Injuries</h3>
            <p className="text-sm text-gray-600">Learn about injury prevention and pain management</p>
          </button>

          <button
            onClick={() => startConversation('general')}
            disabled={loading}
            className="p-6 border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors disabled:opacity-50"
          >
            <div className="text-3xl mb-3"></div>
            <h3 className="font-bold text-gray-900 mb-2">General Questions</h3>
            <p className="text-sm text-gray-600">Ask about fitness principles, progression, and motivation</p>
          </button>
        </div>
      </div>
    )
  }

  // Chat view
  return (
    <div className="max-w-2xl mx-auto h-screen flex flex-col bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Fitness Coach</h2>
        <button
          onClick={() => {
            setConversationId(null)
            setTopic(null)
            setMessages([])
          }}
          className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
        >
          New Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Ask me anything about fitness, form, or training!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none prose-headings:mt-3 prose-headings:mb-2 prose-p:my-2">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        {isStreaming && streamingMessage && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg rounded-bl-none max-w-xs lg:max-w-md">
              <div className="prose prose-sm max-w-none prose-headings:mt-3 prose-headings:mb-2 prose-p:my-2">
                <ReactMarkdown>{streamingMessage}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
        {loading && !isStreaming && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg rounded-bl-none">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading || isStreaming}
          />
          <button
            type="submit"
            disabled={loading || isStreaming || !input.trim()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {isStreaming ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}
