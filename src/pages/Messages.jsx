import { useState, useEffect, useRef } from "react";
import { Search, Send, Image as ImageIcon, ArrowLeft, Info, MoreHorizontal, Edit } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import SidebarComponent from "../components/Sidebar";
import API from "../api/axios";
import { useSocket } from "../context/SocketContext";
import { formatTimeAgo } from "../utils/dateUtils";
import { getAvatarUrl } from "../utils/imageUtils";

export default function Messages() {
    const navigate = useNavigate();
    const location = useLocation();
    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [activeTab, setActiveTab] = useState("primary"); // primary, general, requests
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const { socket, clearMessageCount } = useSocket();
    const scrollRef = useRef();
    const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem("user")));
    const [showNewMessageModal, setShowNewMessageModal] = useState(false);

    // Socket Connection managed in Context now
    // Just listen below

    // Listen for incoming messages
    useEffect(() => {
        if (!socket) return;

        socket.on("receive_message", (message) => {
            // If chat open with sender, append message
            if (selectedUser && (message.sender._id === selectedUser._id || message.sender === selectedUser._id)) {
                setMessages(prev => [...prev, message]);
            }
            // Refresh conversations to update preview/unread
            fetchConversations();
        });

        return () => socket.off("receive_message");
    }, [socket, selectedUser]);

    // Fetch initial data + clear message badge when entering Messages page
    useEffect(() => {
        fetchConversations();
        clearMessageCount();
    }, []);

    // Fetch messages when user selected
    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser._id);
        }
    }, [selectedUser]);

    // Auto-scroll
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const res = await API.get("/messages/conversations");
            setConversations(res.data);
        } catch (err) {
            console.error("Failed to load inbox", err);
        }
    };

    const fetchMessages = async (userId) => {
        try {
            const res = await API.get(`/messages/${userId}`);
            setMessages(res.data);
        } catch (err) {
            console.error("Failed to load chat", err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim()) || !selectedUser) return;

        try {
            const res = await API.post("/messages", {
                recipientId: selectedUser._id,
                text: newMessage
            });

            setMessages([...messages, res.data]);
            setNewMessage("");
            fetchConversations(); // Update sidebar
        } catch (err) {
            console.error("Send failed", err);
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            const res = await API.get(`/users/search?query=${query}`);
            setSearchResults(res.data);
        } catch (err) {
            console.error("Search failed", err);
        }
    };

    const startNewChat = (user) => {
        setSelectedUser(user);
        setSearchQuery("");
        setSearchResults([]);
        setShowNewMessageModal(false);
        // Check if conversation exists, if not it will be created on first message
    };

    // Filter Conversations based on Tab
    // "primary" -> !isRequest
    // "requests" -> isRequest
    // "general" -> For now same as primary or manual? 
    // User asked for "general, requested". Let's treat "Primary" as "General" for now 
    // OR split them if we had a flag. 
    // Backend only gives `isRequest`.
    // So: Primary = !isRequest, Requests = isRequest.
    // "General" is usually a secondary inbox. For MVP, let's just use Primary/General to mean "Inbox" vs "Requests".

    const filteredConversations = conversations.filter(conv => {
        if (activeTab === "requests") return conv.isRequest;
        return !conv.isRequest; // Primary/General
    });

    // Handle ?user=userId from Profile page
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const userId = params.get("user");
        if (userId) {
            // Check if we already have a conversation
            const existingConv = conversations.find(c => c.user._id === userId);
            if (existingConv) {
                setSelectedUser(existingConv.user);
            } else {
                // Fetch user details to start new temporary chat
                API.get(`/users/${userId}`).then(res => {
                    startNewChat(res.data);
                }).catch(err => console.error("Failed to load user for chat", err));
            }
        }
    }, [location.search, conversations, startNewChat]);

    const displayedConversations = searchQuery
        ? conversations.filter(c => c.user.username.toLowerCase().includes(searchQuery.toLowerCase()) || c.user.name?.toLowerCase().includes(searchQuery.toLowerCase()))
        : filteredConversations;

    return (
        <div className="flex bg-white h-screen overflow-hidden">
            <SidebarComponent />

            <div className="flex-1 md:ml-72 mb-16 md:mb-0 flex h-[calc(100vh-4rem)] md:h-screen bg-white">
                {/* Left Sidebar: Inbox List - Hidden on mobile if chat is open */}
                <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-96 border-r border-gray-200 flex-col bg-white`}>
                    {/* Header */}
                    <div className="p-4 flex items-center justify-between border-b border-gray-200 md:h-[75px]">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowNewMessageModal(true)}>
                            <h2 className="text-xl font-bold">{currentUser.username}</h2>
                            <MoreHorizontal size={20} />
                        </div>
                        <Edit className="cursor-pointer" size={24} onClick={() => setShowNewMessageModal(true)} />
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200">
                        <button
                            className={`flex-1 py-3 text-sm font-semibold text-center ${activeTab !== "requests" ? "border-b-2 border-black" : "text-gray-500"}`}
                            onClick={() => setActiveTab("primary")}
                        >
                            Messages
                        </button>
                        <button
                            className={`flex-1 py-3 text-sm font-semibold text-center ${activeTab === "requests" ? "border-b-2 border-black" : "text-gray-500"}`}
                            onClick={() => setActiveTab("requests")}
                        >
                            Requests
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="p-3 border-b border-gray-200">
                        <div className="bg-gray-100 rounded-lg flex items-center px-3 py-2">
                            <Search size={18} className="text-gray-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Search messages..."
                                className="bg-transparent border-none outline-none text-sm w-full"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-auto">
                        {displayedConversations.map((conv) => (
                            <div
                                key={conv.user._id}
                                onClick={() => setSelectedUser(conv.user)}
                                className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedUser?._id === conv.user._id ? "bg-gray-100" : ""}`}
                            >
                                <div className="w-14 h-14 rounded-full bg-gray-200 flex-shrink-0">
                                    <img
                                        src={getAvatarUrl(conv.user.avatar)}
                                        alt={conv.user.username}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm truncate">{conv.user.username}</h3>
                                    <p className={`text-sm truncate ${!conv.isRead ? "font-bold text-black" : "text-gray-500"}`}>
                                        {conv.user._id === currentUser._id ? "You: " : ""}{conv.lastMessage} · {formatTimeAgo(conv.createdAt)}
                                    </p>
                                </div>
                                {!conv.isRead && (
                                    <div className="w-2 h-2 bg-[#0095F6] rounded-full"></div>
                                )}
                            </div>
                        ))}

                        {displayedConversations.length === 0 && !searchQuery && (
                            <div className="p-8 text-center text-gray-400">
                                No {activeTab} messages.
                            </div>
                        )}

                        {/* Show Global Search Results if query exists but no conversations match */}
                        {searchQuery && displayedConversations.length === 0 && searchResults.length > 0 && (
                            <div className="pt-2 border-t border-gray-100">
                                <p className="px-4 py-2 text-xs font-semibold text-gray-500">More people</p>
                                {searchResults.map(user => (
                                    <div
                                        key={user._id}
                                        onClick={() => startNewChat(user)}
                                        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="w-14 h-14 rounded-full bg-gray-200 flex-shrink-0">
                                            <img src={getAvatarUrl(user.avatar)} className="w-full h-full rounded-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-sm truncate">{user.username}</h3>
                                            <p className="text-gray-500 text-sm truncate">{user.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {searchQuery && displayedConversations.length === 0 && searchResults.length === 0 && (
                            <div className="p-8 text-center text-gray-400">
                                No results found.
                            </div>
                        )}

                    </div>
                </div>

                {/* Right Panel: Chat Window - Hidden on mobile if list is shown (no user selected) */}
                {selectedUser ? (
                    <div className="flex-1 flex flex-col h-full w-full">
                        {/* Chat Header */}
                        <div className="h-[75px] border-b border-gray-200 flex items-center justify-between px-4 md:px-6 bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <ArrowLeft className="md:hidden cursor-pointer mr-2" onClick={() => setSelectedUser(null)} />
                                <Link to={`/profile/${selectedUser.username}`} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200">
                                        <img
                                            src={getAvatarUrl(selectedUser.avatar)}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    </div>
                                    <span className="font-semibold">{selectedUser.name || selectedUser.username}</span>
                                </Link>
                            </div>
                            <Info size={24} className="cursor-pointer text-black" />
                        </div>

                        {/* Request Overlay */}
                        {messages.length > 0 && activeTab === 'requests' && !messages.some(m => m.sender._id === currentUser._id || m.sender === currentUser._id) && (
                            <div className="p-4 bg-gray-50 border-b border-gray-200 text-center">
                                <p className="text-sm text-gray-600 mb-2">
                                    {selectedUser.username} wants to send you a message.
                                </p>
                                <p className="text-xs text-gray-500 mb-3">
                                    They won't know you've seen this until you accept.
                                </p>
                            </div>
                        )}

                        {/* Messages Body */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                            {messages.map((msg, idx) => {
                                const isMe = msg.sender._id === currentUser._id || msg.sender === currentUser._id;
                                return (
                                    <div key={msg._id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                        {!isMe && (
                                            <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 self-end">
                                                <img
                                                    src={getAvatarUrl(selectedUser.avatar)}
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${isMe
                                            ? "bg-[#3797F0] text-white rounded-br-none"
                                            : "bg-gray-100 text-black rounded-bl-none"
                                            }`}>
                                            {msg.text}
                                            {msg.image && (
                                                <img src={msg.image} className="mt-2 rounded-lg max-w-full" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={scrollRef} />
                        </div>

                        {/* Input Area - Only show if accepted or simply allow reply to accept */}
                        <div className="p-4 bg-white m-4 rounded-full border border-gray-200 flex items-center gap-3">
                            <ImageIcon size={24} className="cursor-pointer text-gray-500 hover:text-black transition-colors" />
                            <form className="flex-1 flex" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    placeholder={activeTab === 'requests' ? "Reply to accept..." : "Message..."}
                                    className="flex-1 outline-none text-sm"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                {newMessage && (
                                    <button type="submit" className="text-[#0095F6] font-semibold text-sm">Send</button>
                                )}
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-8">
                        <div className="w-24 h-24 rounded-full border-2 border-black flex items-center justify-center mb-4">
                            <Send size={48} className="text-black ml-2 -mt-1" />
                        </div>
                        <h2 className="text-xl font-light mb-2">Your Messages</h2>
                        <p className="text-gray-500 mb-6">Send private photos and messages to a friend or group.</p>
                        <button
                            onClick={() => setShowNewMessageModal(true)}
                            className="bg-[#0095F6] text-white px-6 py-1.5 rounded-lg font-semibold text-sm hover:bg-[#0086d9]"
                        >
                            Send Message
                        </button>
                    </div>
                )}
            </div>

            {/* New Message / Search Modal */}
            {
                showNewMessageModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-xl h-[400px] flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between p-3 border-b border-gray-200">
                                <ArrowLeft className="cursor-pointer" onClick={() => setShowNewMessageModal(false)} />
                                <span className="font-bold">New message</span>
                                <span className="w-6"></span>
                            </div>
                            <div className="p-2 border-b border-gray-200 flex items-center gap-2">
                                <span className="font-semibold text-base">To:</span>
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="flex-1 outline-none py-1"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto p-2">
                                {searchQuery && searchResults.length === 0 && (
                                    <p className="text-gray-500 text-center py-4">No account found.</p>
                                )}
                                {searchResults.map(user => (
                                    <div
                                        key={user._id}
                                        onClick={() => startNewChat(user)}
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer rounded-lg"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-200">
                                            <img src={getAvatarUrl(user.avatar)} className="w-full h-full rounded-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{user.username}</p>
                                            <p className="text-gray-500 text-xs">{user.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
