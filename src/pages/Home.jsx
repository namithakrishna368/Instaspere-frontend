import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, MoreHorizontal } from "lucide-react";
import API from "../api/axios";
import SidebarComponent from "../components/Sidebar";
import CommentModal from "../components/CommentModal";
import { formatTimeAgo } from "../utils/dateUtils";
import { getAvatarUrl } from "../utils/imageUtils";
import { useSocket } from "../context/SocketContext";

export default function Home() {
    const navigate = useNavigate();
    const { notifCount, messageCount, clearNotifCount, clearMessageCount } = useSocket();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState(null);

    // ... (keep state logic same)

    const openCommentModal = (post) => {
        setSelectedPost(post);
    };

    const closeCommentModal = () => {
        setSelectedPost(null);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Parallel fetching for performance
                const postsRes = await API.get("/posts");
                setPosts(postsRes.data);
            } catch (err) {
                console.error("Failed to fetch feed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleLike = async (postId) => {
        try {
            // Optimistic update
            setPosts(prevPosts => prevPosts.map(post => {
                if (post._id === postId) {
                    const userId = JSON.parse(localStorage.getItem("user"))._id;
                    const isLiked = post.likes.includes(userId);
                    return {
                        ...post,
                        likes: isLiked
                            ? post.likes.filter(id => id !== userId)
                            : [...post.likes, userId]
                    };
                }
                return post;
            }));
            // API Call
            await API.put(`/posts/like/${postId}`);
        } catch (err) {
            console.error("Like failed", err);
        }
    };

    if (loading) {
        return (
            <div className="flex bg-white min-h-screen">
                <SidebarComponent />
                <div className="flex-1 flex justify-center items-center md:ml-72 mb-16 md:mb-0">
                    {/* Instagram-style spinner */}
                    <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex bg-[#f8f9fa] min-h-screen">
            <SidebarComponent />

            <div className="flex-1 md:ml-72 mb-16 md:mb-0 bg-[#f8f9fa] flex flex-col items-center pb-20 md:pb-0">

                {/* Mobile Header (Instagram Style) */}
                <div className="w-full md:hidden bg-white/80 backdrop-blur-md sticky top-0 z-50 px-4 h-[60px] border-b border-gray-200 flex items-center justify-between">
                    <div className="font-logo font-bold text-2xl tracking-wide bg-gradient-to-r from-[#B026FF] to-[#00F0FF] bg-clip-text text-transparent">
                        InstaSpere
                    </div>
                    <div className="flex items-center gap-5 text-gray-800">
                        <Link to="/notifications" className="relative cursor-pointer" onClick={clearNotifCount}>
                            <Heart size={26} strokeWidth={1.8} />
                            {notifCount > 0 && (
                                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                    {notifCount > 9 ? "9+" : notifCount}
                                </div>
                            )}
                        </Link>
                        <Link to="/messages" className="relative cursor-pointer" onClick={clearMessageCount}>
                            <MessageCircle size={26} strokeWidth={1.8} className="-rotate-12" />
                            {messageCount > 0 && (
                                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                    {messageCount > 9 ? "9+" : messageCount}
                                </div>
                            )}
                        </Link>
                    </div>
                </div>

                <div className="w-full max-w-[470px] md:max-w-[550px] py-4 md:py-8 space-y-4 px-2 md:px-0">
                    {posts.map((post) => {
                        const user = post.user || {};
                        const currentUserId = JSON.parse(localStorage.getItem("user"))?._id;
                        const isLiked = post.likes.includes(currentUserId);

                        return (
                            <article key={post._id} className="bg-white border-none rounded-3xl mb-8 text-sm shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(176,38,255,0.1)] transition-shadow duration-300 overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center justify-between p-3">
                                    {user && user.username ? (
                                        <Link to={`/profile/${user.username}`} className="flex items-center gap-3 cursor-pointer">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
                                                <img
                                                    src={getAvatarUrl(user.avatar)}
                                                    className="w-full h-full rounded-full object-cover border border-white"
                                                    alt={user.username}
                                                />
                                            </div>
                                            <span className="font-semibold text-gray-900 tracking-tight">{user.username}</span>
                                        </Link>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 p-[2px]">
                                                <img
                                                    src="https://www.seekpng.com/png/detail/966-9665493_my-profile-icon-blank-profile-image-circle.png"
                                                    className="w-full h-full rounded-full object-cover border border-white"
                                                    alt="Unknown"
                                                />
                                            </div>
                                            <span className="font-semibold text-gray-500">Instagram User</span>
                                        </div>
                                    )}
                                    <span className="text-gray-400 text-xs ml-auto mr-3 font-medium tracking-wide">• {formatTimeAgo(post.createdAt)}</span>
                                    <MoreHorizontal className="cursor-pointer text-gray-400 hover:text-gray-600" />
                                </div>

                                {/* Image */}
                                <div className="w-full aspect-square bg-black flex items-center justify-center overflow-hidden">
                                    {post.images && post.images.length > 0 && (
                                        <img src={post.images[0]} className="w-full object-cover" alt="Post" />
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="p-3 pb-1">
                                    <div className="flex justify-between mb-2">
                                        <div className="flex gap-6 pl-2">
                                            <Heart
                                                size={30}
                                                strokeWidth={1.8}
                                                className={`cursor-pointer transition-transform active:scale-90 ${isLiked ? "fill-[#B026FF] text-[#B026FF] drop-shadow-[0_0_10px_rgba(176,38,255,0.5)]" : "hover:text-[#B026FF]"}`}
                                                onClick={() => handleLike(post._id)}
                                            />
                                            <MessageCircle
                                                size={30}
                                                className="cursor-pointer hover:text-[#B026FF] transition-colors -rotate-90"
                                                onClick={() => openCommentModal(post)}
                                                strokeWidth={1.8}
                                            />
                                        </div>
                                    </div>

                                    <div className="font-semibold mb-1 text-[#1a1a1a] text-base px-2">{post.likes.length} likes</div>

                                    <div className="px-2">
                                        <Link to={`/profile/${user.username}`} className="font-bold mr-2 text-[#1a1a1a] text-base">{user.username}</Link>
                                        <span className="text-gray-700 leading-relaxed text-sm">{post.caption}</span>
                                    </div>

                                    {/* Comments Section Trigger */}
                                    <div className="mt-2 px-2 text-gray-500 text-sm cursor-pointer" onClick={() => openCommentModal(post)}>
                                        {post.comments.length > 0 ? `View all ${post.comments.length} comments` : "Add a comment..."}
                                    </div>
                                </div>
                            </article>
                        );
                    })}

                    {posts.length === 0 && (
                        <div className="text-center py-20 text-gray-400">
                            <p>Welcome to InstaSpere!</p>
                            <p className="text-sm">Follow people to see their posts here.</p>
                        </div>
                    )}
                </div>
            </div>

            <CommentModal
                post={selectedPost}
                isOpen={!!selectedPost}
                onClose={closeCommentModal}
                onLikePost={handleLike}
            />
        </div>
    );
}
