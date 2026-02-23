import { useState, useEffect } from "react";
import { Search as SearchIcon } from "lucide-react";
import SidebarComponent from "../components/Sidebar";
import API from "../api/axios";
import { Link } from "react-router-dom";
import { getAvatarUrl } from "../utils/imageUtils";

export default function Search() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // Debounce search
    useEffect(() => {
        const fetchUsers = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const res = await API.get(`/users/search?query=${query}`);
                setResults(res.data);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            if (query) fetchUsers();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleFollow = async (userId) => {
        try {
            const res = await API.put(`/users/follow/${userId}`);

            setResults(prev => prev.map(user => {
                if (user._id === userId) {
                    if (res.data.status === "followed") {
                        return { ...user, isFollowing: true, isRequested: false };
                    } else if (res.data.status === "requested") {
                        return { ...user, isRequested: true };
                    } else if (res.data.status === "unfollowed") {
                        return { ...user, isFollowing: false, isRequested: false };
                    }
                }
                return user;
            }));
        } catch (err) {
            console.error("Follow failed", err);
        }
    };

    return (
        <div className="flex bg-white min-h-screen">
            <SidebarComponent />

            <div className="flex-1 md:ml-72 mb-16 md:mb-0 p-4 pb-20 md:pb-4 max-w-4xl mx-auto w-full">
                <div className="w-full max-w-[600px] py-8 px-4">
                    <h1 className="text-2xl font-bold mb-6">Search</h1>

                    <div className="relative mb-6">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search"
                            className="w-full pl-10 pr-4 py-3 bg-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-300 transition-all placeholder-gray-500"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        {loading ? (
                            <div className="p-8 flex justify-center">
                                <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
                            </div>
                        ) : results.length > 0 ? (
                            results.map((user) => (
                                <div key={user._id} className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50">
                                    {user.username ? (
                                        <Link to={`/profile/${user.username}`} className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                                                <img
                                                    src={getAvatarUrl(user.avatar)}
                                                    className="w-full h-full object-cover"
                                                    alt={user.username}
                                                />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{user.username}</p>
                                                <p className="text-gray-500 text-xs">{user.name}</p>
                                            </div>
                                        </Link>
                                    ) : (
                                        <div className="flex items-center gap-3 opacity-50">
                                            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                                                <img
                                                    src="https://www.seekpng.com/png/detail/966-9665493_my-profile-icon-blank-profile-image-circle.png"
                                                    className="w-full h-full object-cover"
                                                    alt="Unknown"
                                                />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">Unknown User</p>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${user.isFollowing || user.isRequested
                                            ? "bg-gray-100 text-black hover:bg-gray-200"
                                            : "bg-[#0095F6] text-white hover:bg-[#0086d9]"
                                            }`}
                                        onClick={() => handleFollow(user._id)}
                                    >
                                        {user.isFollowing
                                            ? "Following"
                                            : user.isRequested
                                                ? "Requested"
                                                : "Follow"}
                                    </button>
                                </div>
                            ))
                        ) : query && (
                            <div className="p-8 text-center text-gray-500">
                                No users found.
                            </div>
                        )}
                        {!query && (
                            <div className="p-12 text-center text-gray-400">
                                <h3 className="font-semibold text-lg mb-2">Search for friends</h3>
                                <p>Find and connect with people you know.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
