"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useSession } from "next-auth/react";
import { 
  sendMessageAction, 
  getMessagesAction, 
  getChatPartnersAction, 
  getPotentialPartnersAction 
} from "@/app/actions/message";
import { 
  Send, Search, MessageSquare, Plus, CheckCheck, 
  AlertCircle, ShieldAlert, Sparkles 
} from "lucide-react";

interface ChatPartner {
  id: string;
  name: string;
  email: string;
  role: string;
  isOnline: boolean;
}

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string | Date;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [partners, setPartners] = useState<ChatPartner[]>([]);
  const [potentialPartners, setPotentialPartners] = useState<ChatPartner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<ChatPartner | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Initial Load of Contacts & Potential Partners
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoadingContacts(true);
        const [partnersRes, potentialRes] = await Promise.all([
          getChatPartnersAction(),
          getPotentialPartnersAction()
        ]);

        if (partnersRes.success && partnersRes.partners) {
          setPartners(partnersRes.partners as ChatPartner[]);
          // Auto-select first partner if exists
          if (partnersRes.partners.length > 0) {
            setSelectedPartner(partnersRes.partners[0] as ChatPartner);
          }
        }
        if (potentialRes.success && potentialRes.users) {
          setPotentialPartners(potentialRes.users as ChatPartner[]);
        }
      } catch (err) {
        console.error("Failed to load contacts:", err);
        setErrorMsg("Failed to initialize conversation hub.");
      } finally {
        setLoadingContacts(false);
      }
    }

    if (currentUserId) {
      loadInitialData();
    }
  }, [currentUserId]);

  // 2. Load Messages when Selected Partner changes
  useEffect(() => {
    async function loadMessages() {
      if (!selectedPartner) return;
      try {
        setLoadingMessages(true);
        const res = await getMessagesAction(selectedPartner.id);
        if (res.success && res.messages) {
          setMessages(res.messages as any[]);
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    }
    loadMessages();
  }, [selectedPartner]);

  // Keep a ref so SSE handler always sees the current selectedPartner without re-subscribing
  const selectedPartnerRef = useRef<ChatPartner | null>(null);
  useEffect(() => { selectedPartnerRef.current = selectedPartner; }, [selectedPartner]);
  useEffect(() => {
    if (!currentUserId) return;

    const eventSource = new EventSource("/api/messages/stream");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.heartbeat || data.ping) return;

        // Use ref so we always have the latest selectedPartner without re-subscribing
        const activePartner = selectedPartnerRef.current;
        const isMsgFromActivePartner = activePartner && data.senderId === activePartner.id;
        const isMsgSentByMe = data.senderId === currentUserId;

        if (isMsgFromActivePartner || isMsgSentByMe) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.id)) return prev;
            return [...prev, data];
          });
        }

        refreshContacts();
      } catch (err) {
        console.error("Error parsing live message event:", err);
      }
    };

    return () => {
      eventSource.close();
    };
  // Only depends on currentUserId — selectedPartner is accessed via ref
  }, [currentUserId]);

  // 4. Helper to refresh contact list in background
  const refreshContacts = async () => {
    const res = await getChatPartnersAction();
    if (res.success && res.partners) {
      setPartners(res.partners as ChatPartner[]);
    }
  };

  // 5. Scroll to Bottom of Message Thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 6. Send Message Trigger
  const handleSendMessage = () => {
    if (!selectedPartner || !inputText.trim() || isPending) return;

    const textToSend = inputText.trim();
    setInputText("");

    startTransition(async () => {
      // Optimistic state injection to keep UI feeling ultra-snappy and real-time!
      const tempId = `optimistic-${Date.now()}`;
      const optimisticMsg: ChatMessage = {
        id: tempId,
        senderId: currentUserId!,
        receiverId: selectedPartner.id,
        content: textToSend,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      const res = await sendMessageAction(selectedPartner.id, textToSend);
      if (res.error) {
        setErrorMsg(res.error);
        // Roll back optimistic message if error occurs
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } else {
        // Swap optimistic message with the database saved message
        setMessages((prev) => prev.map((m) => m.id === tempId ? (res.message as ChatMessage) : m));
        refreshContacts();
      }
    });
  };

  // 7. Select a potential user from potential list to start a brand new conversation thread
  const handleStartChatWithPotential = (user: ChatPartner) => {
    setPartners((prev) => {
      if (prev.some((p) => p.id === user.id)) return prev;
      return [user, ...prev];
    });
    setSelectedPartner(user);
  };

  // 8. Filter partners by search query
  const filteredPartners = partners.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-2xl shadow-gray-100/50 flex flex-col md:flex-row" style={{ height: "calc(100dvh - var(--navbar-h, 4.5rem) - 3rem)" }}>
        
        {/* SIDEBAR: Contacts List */}
        <div className="w-full md:w-80 border-r border-gray-100 flex flex-col flex-shrink-0 bg-gray-50/50">
          <div className="p-5 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-xl text-gray-900 tracking-tight flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <span>Interactions</span>
              </h2>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find conversation..."
                className="w-full bg-gray-50 border border-gray-100 pl-10 pr-4 py-2.5 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          {/* Contacts Container */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {loadingContacts ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400">Syncing database...</span>
              </div>
            ) : filteredPartners.length > 0 ? (
              filteredPartners.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedPartner(conv)}
                  className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl transition-all text-left ${
                    selectedPartner?.id === conv.id
                      ? "bg-white border border-gray-100 shadow-lg shadow-gray-200/50"
                      : "hover:bg-gray-100/50 border border-transparent"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className={`w-11 h-11 bg-gradient-to-tr from-green-600 to-emerald-500 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-md`}>
                      {conv.name[0]}
                    </div>
                    {conv.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow shadow-green-500/50"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900 text-sm truncate">{conv.name}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-gray-400 capitalize">{conv.role.toLowerCase()}</span>
                      {conv.isOnline && (
                        <span className="text-[10px] text-green-500 font-mono tracking-tighter">online</span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 px-4">
                <ShieldAlert className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                <span className="text-xs text-gray-400 font-medium block">No active thread sessions.</span>
              </div>
            )}

            {/* POTENTIAL PARTNERS: "Start Chat" helper list */}
            {potentialPartners.length > 0 && (
              <div className="pt-4 mt-4 border-t border-gray-100">
                <div className="px-3 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-green-600 animate-pulse" />
                  <span className="text-[10px] font-extrabold text-gray-500 tracking-wider uppercase">Active Users</span>
                </div>
                <div className="space-y-1">
                  {potentialPartners
                    .filter((u) => !partners.some((p) => p.id === u.id))
                    .map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleStartChatWithPotential(user)}
                        className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-100/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7.5 h-7.5 bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {user.name[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-gray-900 truncate">{user.name}</div>
                            <div className="text-[10px] text-gray-400 capitalize">{user.role.toLowerCase()}</div>
                          </div>
                        </div>
                        <span className="p-1 bg-green-50 hover:bg-green-100 border border-green-500/10 text-green-600 rounded-lg transition-colors flex-shrink-0 cursor-pointer">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CHAT MAIN PANEL */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedPartner ? (
            <>
              {/* Chat Panel Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-tr from-green-700 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-base shadow-lg shadow-green-700/15">
                    {selectedPartner.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-base">{selectedPartner.name}</div>
                    <div className="text-xs text-gray-400 capitalize flex items-center gap-1.5 font-medium">
                      <span>{selectedPartner.role.toLowerCase()}</span>
                      <span>•</span>
                      {selectedPartner.isOnline ? (
                        <span className="text-green-500 font-bold">Online</span>
                      ) : (
                        <span>Offline</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Bar */}
              {errorMsg && (
                <div className="bg-red-50 border-y border-red-100 text-red-700 text-xs px-5 py-2.5 flex items-center gap-2 justify-between">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    {errorMsg}
                  </span>
                  <button onClick={() => setErrorMsg("")} className="text-red-400 hover:text-red-800 font-bold uppercase text-[10px]">dismiss</button>
                </div>
              )}

              {/* Chat Thread Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/20">
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <div className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-gray-400 font-medium">Decrypting conversation...</span>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => {
                    const isMe = msg.senderId === currentUserId;
                    const msgTime = new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fadeIn`}
                      >
                        <div className={`max-w-xs md:max-w-md lg:max-w-xl ${isMe ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
                          <div className={`px-4 py-3 text-sm leading-relaxed shadow-sm ${
                            isMe
                              ? "bg-green-700 text-white rounded-3xl rounded-br-none"
                              : "bg-white text-gray-800 border border-gray-100 rounded-3xl rounded-bl-none"
                          }`}>
                            {msg.content}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium px-1">
                            <span>{msgTime}</span>
                            {isMe && (
                              <CheckCheck className="w-3.5 h-3.5 text-green-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="w-16 h-16 bg-green-50 border border-green-100 text-green-600 rounded-3xl flex items-center justify-center mb-4">
                      <MessageSquare className="w-8 h-8" />
                    </div>
                    <h3 className="font-extrabold text-gray-900 text-base mb-1">Start of Chat Session</h3>
                    <p className="text-xs text-gray-400 max-w-xs font-medium">
                      All messages are securely encrypted. Type your message below to establish connection.
                    </p>
                  </div>
                )}
                {/* Scroll Target Anchor */}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Toolbar */}
              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    disabled={isPending}
                    placeholder="Write your secure response..."
                    className="flex-1 bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-all font-medium"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isPending || !inputText.trim()}
                    className="p-3.5 bg-green-700 hover:bg-green-800 disabled:opacity-40 disabled:hover:bg-green-700 text-white rounded-2xl transition-all shadow-md shadow-green-700/10 cursor-pointer flex-shrink-0 flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/20">
              <div className="w-16 h-16 bg-gray-100 border border-gray-200 text-gray-400 rounded-3xl flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 animate-bounce" />
              </div>
              <h3 className="font-extrabold text-gray-900 text-base mb-1">Secure Messaging Console</h3>
              <p className="text-xs text-gray-400 max-w-sm font-medium">
                Choose an active conversation from the sidebar or click <Plus className="inline w-3 h-3 text-green-600" /> next to active users to initialize a direct live chat.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
