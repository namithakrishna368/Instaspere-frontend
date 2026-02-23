import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import API from "../api/axios";
import { getAvatarUrl } from "../utils/imageUtils";

export default function FollowListModal({ isOpen, onClose, userId, type, title }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !userId) return;

        const fetchList = async () => {
            setLoading(true);
            try {
                const res = await API.get(`/users/${userId}/${type}`);
                setUsers(res.data);
            } catch (err) {
                console.error(`Failed to fetch ${type}`, err);
            } finally {
                setLoading(false);
            }
        };
        fetchList();
    }, [isOpen, userId, type]);

    const handleFollow = async (targetId) => {
        try {
            const res = await API.put(`/users/follow/${targetId}`);
            setUsers(prev =>
                prev.map(u => {
                    if (u._id === targetId) {
                        return {
                            ...u,
                            isFollowing:
                                res.data.status === "followed" ||
                                res.data.status === "requested",
                        };
                    }
                    return u;
                })
            );
        } catch (err) {
            console.error("Follow failed", err);
        }
    };

    if (!isOpen) return null;

    const currentUser = JSON.parse(localStorage.getItem("user"));

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-[400px] rounded-xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 h-11 border-b">
                    <span />
                    <h2 className="font-semibold text-base">{title || type}</h2>
                    <button onClick={onClose} className="hover:opacity-60">
                        <X size={22} />
                    </button>
                </div>

                {/* List */}
                <div className="max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            No {type} yet
                        </div>
                    ) : (
                        users.map((user) => (
                            <div
                                key={user._id}
                                className="flex items-center justify-between px-4 py-2 hover:bg-gray-50"
                            >
                                <Link
                                    to={`/profile/${user.username}`}
                                    className="flex items-center gap-3 min-w-0 flex-1"
                                    onClick={onClose}
                                >
                                    <img
                                        src={getAvatarUrl(user.avatar)}
                                        alt={user.username}
                                        className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm truncate">
                                            {user.username}
                                        </p>
                                        {user.name && (
                                            <p className="text-gray-500 text-xs truncate">
                                                {user.name}
                                            </p>
                                        )}
                                    </div>
                                </Link>

                                {/* Follow/Unfollow button (hide for self) */}
                                {currentUser?._id !== user._id && (
                                    <button
                                        onClick={() => handleFollow(user._id)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 ${user.isFollowing
                                                ? "bg-gray-100 text-black hover:bg-gray-200"
                                                : "bg-[#0095F6] text-white hover:bg-[#0086d9]"
                                            }`}
                                    >
                                        {user.isFollowing ? "Following" : "Follow"}
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
