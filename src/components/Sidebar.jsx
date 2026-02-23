import { Home, MessageCircle, PlusSquare, User, LogOut, Settings, Heart, Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import API from "../api/axios";
import Logo from "./Logo";

export default function Sidebar() {
    const location = useLocation();
    const { notifCount, messageCount, clearNotifCount, clearMessageCount } = useSocket();

    // Clear badges when visiting the relevant pages
    useEffect(() => {
        if (location.pathname === "/notifications") {
            clearNotifCount();
            API.put("/notifications/read").catch(() => { });
        }
        if (location.pathname === "/messages") {
            clearMessageCount();
        }
    }, [location.pathname]);

    const menuItems = [
        { name: "Home", icon: Home, path: "/home" },
        { name: "Search", icon: Search, path: "/search" },
        { name: "Notifications", icon: Heart, path: "/notifications", badge: notifCount, isMobileHidden: true },
        { name: "Create", icon: PlusSquare, path: "/create" },
        { name: "Message", icon: MessageCircle, path: "/messages", badge: messageCount, isMobileHidden: true },
        { name: "Profile", icon: User, path: "/profile" },
    ];

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 flex flex-row justify-around items-center md:flex-col md:justify-start md:items-stretch md:fixed md:top-0 md:left-0 md:h-screen md:w-72 md:bg-white/80 md:backdrop-blur-md md:border-r md:border-white/50 md:border-t-0">
            {/* Logo Section - Hidden on Mobile */}
            <div className="hidden md:flex pt-10 pb-8 justify-center">
                <Logo />
            </div>

            {/* Navigation */}
            <nav className="flex flex-row justify-around w-full md:flex-col md:w-auto md:flex-1 md:px-4 md:mt-6 md:space-y-2">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center justify-center md:justify-start gap-0 md:gap-5 p-2 md:px-6 md:py-4 rounded-2xl text-lg font-medium transition-all duration-300 relative group 
                            ${item.isMobileHidden ? "hidden md:flex" : "flex"} 
                            ${isActive
                                    ? "text-[#B026FF] md:bg-[#B026FF]/5 md:neon-text-glow"
                                    : "hover:bg-transparent md:hover:bg-gray-50 text-gray-500 hover:text-[#B026FF]"
                                }`}
                        >
                            <div className={`relative transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                                <item.icon
                                    size={isActive ? 28 : 24}
                                    className={`${isActive ? "text-[#B026FF] drop-shadow-[0_0_8px_rgba(176,38,255,0.5)]" : "text-gray-400 group-hover:text-[#B026FF]"} md:w-7 md:h-7`}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                {item.badge > 0 && (
                                    <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-[#00F0FF] text-white text-[10px] font-bold w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center shadow-[0_0_10px_#00F0FF]">
                                        {item.badge > 9 ? "9+" : item.badge}
                                    </div>
                                )}
                            </div>
                            <span className={`${isActive ? "font-bold font-logo tracking-wide" : "font-logo tracking-wide"} hidden md:block`}>{item.name}</span>
                        </Link>
                    );
                })}

                {/* Logout - Desktop */}
                <div className="hidden md:block mt-auto mb-6 px-4 space-y-2">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 px-6 py-3 rounded-xl text-lg font-medium hover:bg-red-50 text-gray-600 hover:text-red-600 w-full text-left transition-colors"
                    >
                        <LogOut size={24} />
                        <span className="font-logo">LogOut</span>
                    </button>
                </div>

                {/* Logout - Mobile (small icon in bottom nav) */}
                <button
                    onClick={handleLogout}
                    className="flex items-center justify-center p-2 md:hidden"
                >
                    <LogOut size={24} className="text-gray-400 hover:text-red-500 transition-colors" strokeWidth={2} />
                </button>
            </nav>
        </div>
    );
}
