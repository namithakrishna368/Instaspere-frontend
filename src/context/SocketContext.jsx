import { createContext, useContext, useEffect, useState, useCallback } from "react";
import io from "socket.io-client";
import API from "../api/axios";

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
    const [notifCount, setNotifCount] = useState(0);
    const [messageCount, setMessageCount] = useState(0);

    // Listen for login/logout changes
    useEffect(() => {
        const handleStorageChange = () => {
            setUser(JSON.parse(localStorage.getItem("user")));
        };
        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("auth-update", handleStorageChange);
        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("auth-update", handleStorageChange);
        };
    }, []);

    // ✅ Fetch initial unread counts from DB on login / page refresh
    useEffect(() => {
        if (!user) {
            setNotifCount(0);
            setMessageCount(0);
            return;
        }

        const fetchInitialCounts = async () => {
            try {
                const [notifRes, msgRes] = await Promise.all([
                    API.get("/notifications/counts"),
                    API.get("/messages/unread-count"),
                ]);
                setNotifCount(notifRes.data.unreadCount || 0);
                setMessageCount(msgRes.data.count || 0);
            } catch (err) {
                // Silently fail — badges just show 0
            }
        };

        fetchInitialCounts();
    }, [user?._id]);

    // 🔌 Setup socket connection and real-time badge listeners
    useEffect(() => {
        if (user) {
            const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:5000");
            setSocket(newSocket);
            newSocket.emit("join", user._id);

            // 🔔 New notification received (like, comment, follow, etc.)
            newSocket.on("notification", () => {
                setNotifCount(prev => prev + 1);
            });

            // 🔔 Acceptor's follow_request → follow (Instagram style)
            newSocket.on("notification:update", () => {
                setNotifCount(prev => prev + 1);
            });

            // 💬 New message received
            newSocket.on("receive_message", () => {
                setMessageCount(prev => prev + 1);
            });

            // ✅ When I open a chat, messages are marked read → reset count from server
            newSocket.on("messages_read", async () => {
                try {
                    const res = await API.get("/messages/unread-count");
                    setMessageCount(res.data.count || 0);
                } catch { /* silent */ }
            });

            return () => {
                newSocket.close();
                setSocket(null);
            };
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user?._id]);

    // Clear badge when navigating to /notifications
    const clearNotifCount = useCallback(() => {
        setNotifCount(0);
        API.put("/notifications/read").catch(() => { });
    }, []);

    // Clear badge when navigating to /messages
    const clearMessageCount = useCallback(() => setMessageCount(0), []);

    return (
        <SocketContext.Provider value={{ socket, notifCount, messageCount, clearNotifCount, clearMessageCount }}>
            {children}
        </SocketContext.Provider>
    );
};
