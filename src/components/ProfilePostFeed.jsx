import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, ArrowLeft } from "lucide-react";
import API from "../api/axios";
import { formatTimeAgo } from "../utils/dateUtils";
import { getAvatarUrl } from "../utils/imageUtils";

export default function ProfilePostFeed({ posts, initialPostId, onBack, onPostsUpdate }) {
    const [feedPosts, setFeedPosts] = useState(posts);
    const postRefs = useRef({});
    const currentUser = JSON.parse(localStorage.getItem("user"));

    // Auto-scroll to clicked post
    useEffect(() => {
        if (initialPostId && postRefs.current[initialPostId]) {
            setTimeout(() => {
                postRefs.current[initialPostId].scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        }
    }, [initialPostId]);

    // Sync with parent
    useEffect(() => {
        setFeedPosts(posts);
    }, [posts]);

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith("http") || path.startsWith("data:")) return path;
        const base = import.meta.env.VITE_API_URL || "http://localhost:5000";
        return `${base}/${path.replace(/\\/g, "/")}`;
    };

    const handleLike = async (postId) => {
        const userId = currentUser?._id;
        setFeedPosts(prev => {
            const updated = prev.map(p => {
                if (p._id === postId) {
                    const isLiked = p.likes.includes(userId);
                    return {
                        ...p,
                        likes: isLiked ? p.likes.filter(id => id !== userId) : [...p.likes, userId]
                    };
                }
                return p;
            });
            onPostsUpdate?.(updated);
            return updated;
        });
        try {
            await API.put(`/posts/like/${postId}`);
        } catch (err) {
            console.error("Like failed", err);
        }
    };

    const [commentTexts, setCommentTexts] = useState({});
    const [expandedComments, setExpandedComments] = useState({});
    const [expandedCommentTexts, setExpandedCommentTexts] = useState({});

    const handleComment = async (postId) => {
        const text = commentTexts[postId]?.trim();
        if (!text) return;
        try {
            const res = await API.post(`/posts/comment/${postId}`, { text });
            setFeedPosts(prev => {
                const updated = prev.map(p =>
                    p._id === postId ? { ...p, comments: res.data } : p
                );
                onPostsUpdate?.(updated);
                return updated;
            });
            setCommentTexts(prev => ({ ...prev, [postId]: "" }));
        } catch (err) {
            console.error("Comment failed", err);
        }
    };

    return (
        <div className="py-4">
            {/* Back button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft size={20} />
                Back to posts
            </button>

            {/* Feed */}
            <div className="flex flex-col gap-6 max-w-[470px] mx-auto">
                {feedPosts.map((post) => {
                    const isLiked = post.likes?.includes(currentUser?._id);
                    const postUser = post.user || {};
                    const visibleComments = expandedComments[post._id]
                        ? post.comments
                        : (post.comments || []).slice(-2);

                    return (
                        <article
                            key={post._id}
                            ref={(el) => (postRefs.current[post._id] = el)}
                            className="bg-white border-none rounded-3xl overflow-hidden shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(176,38,255,0.1)] transition-shadow duration-300"
                        >
                            {/* Post Header */}
                            <div className="flex items-center justify-between px-4 py-3">
                                <Link to={`/profile/${postUser.username}`} className="flex items-center gap-3">
                                    <img
                                        src={getAvatarUrl(postUser.avatar)}
                                        alt={postUser.username}
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                    <div>
                                        <span className="font-semibold text-sm text-[#1a1a1a]">{postUser.username}</span>
                                        <span className="text-gray-400 text-xs ml-2 font-medium">
                                            {formatTimeAgo(post.createdAt)}
                                        </span>
                                    </div>
                                </Link>
                                <MoreHorizontal size={20} className="text-gray-500 cursor-pointer" />
                            </div>

                            {/* Post Image */}
                            {post.images && post.images.length > 0 && (
                                <div className="relative">
                                    <img
                                        src={getImageUrl(post.images[0])}
                                        alt="Post"
                                        className="w-full object-cover"
                                        onDoubleClick={() => handleLike(post._id)}
                                    />
                                    {post.images.length > 1 && (
                                        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                                            1/{post.images.length}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="px-4 pt-3 pb-1">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => handleLike(post._id)}>
                                            <Heart
                                                size={24}
                                                className={`transition-colors ${isLiked
                                                    ? "fill-[#B026FF] text-[#B026FF] drop-shadow-[0_0_10px_rgba(176,38,255,0.5)]"
                                                    : "text-gray-800 hover:text-[#B026FF]"
                                                    }`}
                                            />
                                        </button>
                                        <button onClick={() => {
                                            const el = document.getElementById(`comment-input-${post._id}`);
                                            el?.focus();
                                        }}>
                                            <MessageCircle size={24} className="text-gray-800 hover:text-[#B026FF] transition-colors" />
                                        </button>
                                        <Share2 size={22} className="text-gray-800 hover:text-[#B026FF] cursor-pointer transition-colors" />
                                    </div>
                                    <Bookmark size={24} className="text-gray-800 hover:text-[#B026FF] cursor-pointer transition-colors" />
                                </div>

                                {/* Likes count */}
                                <p className="font-bold text-sm mb-1 text-[#1a1a1a]">
                                    {post.likes?.length || 0} {post.likes?.length === 1 ? "like" : "likes"}
                                </p>

                                {/* Caption */}
                                {post.caption && (
                                    <p className="text-sm mb-2 text-gray-600">
                                        <Link to={`/profile/${postUser.username}`} className="font-bold mr-1 text-[#1a1a1a]">
                                            {postUser.username}
                                        </Link>
                                        {post.caption}
                                    </p>
                                )}

                                {/* Comments */}
                                {post.comments?.length > 2 && !expandedComments[post._id] && (
                                    <button
                                        onClick={() => setExpandedComments(prev => ({ ...prev, [post._id]: true }))}
                                        className="text-gray-400 text-sm mb-2 hover:text-gray-600"
                                    >
                                        View all {post.comments.length} comments
                                    </button>
                                )}

                                {visibleComments.map((comment, idx) => (
                                    <div key={comment._id || idx} className="text-sm mb-1 text-gray-900 dark:text-gray-300">
                                        <Link
                                            to={`/profile/${comment.user?.username}`}
                                            className="font-semibold mr-1 text-gray-900 dark:text-white"
                                        >
                                            {comment.user?.username}
                                        </Link>
                                        <span>
                                            {(() => {
                                                const words = (comment.text || "").split(" ");
                                                const isLong = words.length > 15;
                                                const key = comment._id || `${post._id}-${idx}`;
                                                const isExpanded = expandedCommentTexts[key];
                                                return (
                                                    <>
                                                        {isLong && !isExpanded
                                                            ? words.slice(0, 15).join(" ") + "... "
                                                            : comment.text + " "}
                                                        {isLong && !isExpanded && (
                                                            <button
                                                                className="text-gray-400"
                                                                onClick={() => setExpandedCommentTexts(prev => ({ ...prev, [key]: true }))}
                                                            >
                                                                more
                                                            </button>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </span>
                                    </div>
                                ))}

                                {/* Timestamp */}
                                <p className="text-[10px] text-gray-400 uppercase mt-2 mb-2">
                                    {formatTimeAgo(post.createdAt)}
                                </p>
                            </div>

                            {/* Comment Input */}
                            <div className="flex items-center border-t border-gray-200 dark:border-slate-800 px-4 py-3 gap-3">
                                <input
                                    id={`comment-input-${post._id}`}
                                    type="text"
                                    placeholder="Add a comment..."
                                    value={commentTexts[post._id] || ""}
                                    onChange={(e) =>
                                        setCommentTexts(prev => ({ ...prev, [post._id]: e.target.value }))
                                    }
                                    onKeyDown={(e) => e.key === "Enter" && handleComment(post._id)}
                                    className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400 text-[#1a1a1a]"
                                />
                                <button
                                    onClick={() => handleComment(post._id)}
                                    disabled={!commentTexts[post._id]?.trim()}
                                    className="text-[#B026FF] font-bold text-sm disabled:opacity-30 hover:text-[#7B2CBF] transition-colors"
                                >
                                    Post
                                </button>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
