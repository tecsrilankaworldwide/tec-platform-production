import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Bot, User, Sparkles, MessageCircle, Loader2 } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const AIChatPage = ({ token, user }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [selectedModel, setSelectedModel] = useState('anthropic');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Create a new chat session on component mount
    createSession();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const createSession = async () => {
    try {
      const response = await axios.post(`${API}/ai-chat/session`, {
        model_provider: selectedModel,
        subject: null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessionId(response.data.session_id);
      
      // Add welcome message
      setMessages([{
        id: 'welcome',
        type: 'ai',
        content: getWelcomeMessage(),
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Failed to create chat session:', error);
    }
  };

  const getWelcomeMessage = () => {
    const level = user?.learning_level || 'development';
    if (level === 'foundation') {
      return "👋 Hi there, little learner! I'm your AI Buddy! 🤖✨ I'm here to help you learn fun things! What would you like to know today?";
    } else if (level === 'mastery') {
      return "Welcome! I'm your AI Coach 🎯 Ready to help you prepare for your future career and explore advanced concepts. What would you like to discuss?";
    }
    return "Hi there! 👋 I'm your AI Mentor! 🧠 I'm here to help you think logically and solve problems. Ask me anything about AI, logic, or any topic you're curious about!";
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/ai-chat/message`, {
        session_id: sessionId,
        message: inputMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: response.data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(response.data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        content: "Oops! 😅 I had a little trouble understanding. Could you try asking again?",
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const switchModel = async (model) => {
    setSelectedModel(model);
    // Create new session with new model
    try {
      const response = await axios.post(`${API}/ai-chat/session`, {
        model_provider: model,
        subject: null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessionId(response.data.session_id);
      setMessages([{
        id: 'welcome-new',
        type: 'ai',
        content: `Switched to ${model === 'anthropic' ? 'Claude' : 'Gemini'}! 🔄 ${getWelcomeMessage()}`,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Failed to switch model:', error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 font-nunito">AI Tutor</h1>
              <p className="text-sm text-slate-500">Your personal learning assistant</p>
            </div>
          </div>
          
          {/* Model Selector */}
          <div className="flex items-center gap-2 bg-slate-100 rounded-full p-1">
            <button
              onClick={() => switchModel('anthropic')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedModel === 'anthropic'
                  ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
              data-testid="select-claude-btn"
            >
              Claude
            </button>
            <button
              onClick={() => switchModel('gemini')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedModel === 'gemini'
                  ? 'bg-gradient-to-r from-[#4facfe] to-[#00f2fe] text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
              data-testid="select-gemini-btn"
            >
              Gemini
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === 'user'
                    ? 'bg-slate-200'
                    : 'bg-gradient-to-br from-[#667eea] to-[#764ba2] shadow-md'
                }`}>
                  {message.type === 'user' ? (
                    <User className="w-5 h-5 text-slate-600" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-white" />
                  )}
                </div>
                
                {/* Message Bubble */}
                <div className={`rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-slate-100 text-slate-800 rounded-tr-sm'
                    : message.isError
                      ? 'bg-red-50 text-red-800 rounded-tl-sm border border-red-200'
                      : 'bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white rounded-tl-sm shadow-md'
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-slate-400' : 'text-white/70'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-2xl rounded-tl-sm px-4 py-3 shadow-md">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                    <span className="text-sm text-white">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 bg-slate-100 rounded-full p-2 pl-4">
            <MessageCircle className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="flex-1 bg-transparent border-none outline-none text-slate-700 placeholder-slate-400"
              disabled={isLoading}
              data-testid="chat-input"
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="w-10 h-10 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="send-message-btn"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Powered by {selectedModel === 'anthropic' ? 'Claude Sonnet 4.5' : 'Gemini 3 Flash'} • Your conversations help you earn points!
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;
