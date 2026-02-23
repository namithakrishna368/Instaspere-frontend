import { useRef, useState, useEffect } from "react";
import { X, Heart, Send } from "lucide-react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import { formatTimeAgo } from "../utils/dateUtils";
import { getAvatarUrl } from "../utils/imageUtils";

export default function CommentModal({ post, isOpen, onClose, onCommentSubmit, onLikePost }) {
    const [commentText, setCommentText] = useState("");
    const [comments, setComments] = useState(post?.comments || []);
    const [likes, setLikes] = useState(post?.likes || []);
    const [expandedComments, setExpandedComments] = useState({});
    const currentUser = JSON.parse(localStorage.getItem("user"));
    const isLiked = likes.includes(currentUser?._id);

    // Sync comments when post changes
    useEffect(() => {
        if (post) {
            setComments(post.comments || []);
            setLikes(post.likes || []);
        }
    }, [post]);

    if (!isOpen || !post) return null;

    const handleSubmit = async () => {
        if (!commentText.trim()) return;
        try {
            // Optimistic update
            const newComment = {
                user: {
                    _id: currentUser._id,
                    username: currentUser.username,
                    avatar: currentUser.avatar
                },
                text: commentText,
                createdAt: new Date().toISOString(),
                likes: []
            };

            const res = await API.post(`/posts/comment/${post._id}`, { text: commentText });

            // Update with server response to get real IDs etc
            setComments(res.data);
            setCommentText("");
        } catch (err) {
            console.error("Comment failed", err);
        }
    };

    const handleCommentLike = async (commentId) => {
        try {
            setComments(prev => prev.map(c => {
                if (c._id === commentId) {
                    const isLiked = c.likes.includes(currentUser._id);
                    return {
                        ...c,
                        likes: isLiked ? c.likes.filter(id => id !== currentUser._id) : [...c.likes, currentUser._id]
                    };
                }
                return c;
            }));
            await API.put(`/posts/comment/${post._id}/${commentId}/like`);
        } catch (err) {
            console.error("Comment like failed", err);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-8" onClick={onClose}>

            {/* Close Button */}
            <button className="absolute top-4 right-4 text-white z-50" onClick={onClose}>
                <X size={30} />
            </button>

            <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[90vh] sm:h-[85vh] flex rounded-md overflow-hidden transition-colors duration-300" onClick={(e) => e.stopPropagation()}>

                {/* Left: Image (Hidden on small screens if we wanted pure mobile style, but IG Web keeps it) */}
                <div className="hidden md:flex md:w-[60%] bg-black items-center justify-center">
                    <img
                        src={post.images?.[0]}
                        className="w-full h-full object-contain"
                        alt="Post"
                    />
                </div>

                {/* Right: Details & Comments */}
                <div className="w-full md:w-[40%] flex flex-col h-full relative bg-white">

                    {/* Header */}
                    <div className="flex items-center gap-3 p-4 border-b border-gray-100 p-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
                            <img
                                src={getAvatarUrl(post.user?.avatar)}
                                className="w-full h-full rounded-full object-cover border border-white"
                                alt={post.user?.username}
                            />
                        </div>
                        <span className="font-semibold text-sm text-gray-900">{post.user?.username}</span>
                        {/* Optional: Follow button */}
                    </div>

                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-white">

                        {/* Caption as first 'comment' */}
                        {post.caption && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 flex-shrink-0 rounded-full">
                                    <img
                                        src={getAvatarUrl(post.user?.avatar)}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 text-sm">
                                    <span className="font-semibold mr-2 text-gray-900">{post.user?.username}</span>
                                    <span className="text-gray-900">{post.caption}</span>
                                    <div className="text-xs text-gray-500 mt-1">{formatTimeAgo(post.createdAt)}</div>
                                </div>
                            </div>
                        )}

                        {/* Real Comments */}
                        {comments.map((comment, idx) => (
                            <div key={idx} className="flex gap-3 group">
                                <div className="w-8 h-8 flex-shrink-0">
                                    <Link to={`/profile/${comment.user?.username}`}>
                                        <img
                                            src={getAvatarUrl(comment.user?.avatar)}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    </Link>
                                </div>
                                <div className="flex-1 text-sm">
                                    <Link to={`/profile/${comment.user?.username}`} className="font-semibold mr-2 hover:opacity-50 transition text-gray-900">
                                        {comment.user?.username}
                                    </Link>
                                    {(() => {
                                        const words = (comment.text || "").split(" ");
                                        const isLong = words.length > 15;
                                        const isExpanded = expandedComments[comment._id || idx];
                                        return (
                                            <span className="text-gray-900">
                                                {isLong && !isExpanded
                                                    ? words.slice(0, 15).join(" ") + "... "
                                                    : comment.text + " "}
                                                {isLong && !isExpanded && (
                                                    <button
                                                        className="text-gray-400 text-sm"
                                                        onClick={() => setExpandedComments(prev => ({ ...prev, [comment._id || idx]: true }))}
                                                    >
                                                        more
                                                    </button>
                                                )}
                                            </span>
                                        );
                                    })()}

                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                        <span>{formatTimeAgo(comment.createdAt)}</span>
                                        {comment.likes?.length > 0 && (
                                            <span>{comment.likes.length} like{comment.likes.length > 1 ? 's' : ''}</span>
                                        )}
                                        <span className="cursor-pointer font-semibold text-gray-400 hover:text-gray-600">Reply</span>
                                    </div>
                                </div>
                                <div className="pt-1">
                                    <Heart
                                        size={14}
                                        className={`cursor-pointer ${comment.likes?.includes(currentUser._id) ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-gray-600"}`}
                                        onClick={() => handleCommentLike(comment._id)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer: Actions & Input */}
                    <div className="border-t border-gray-100 p-4 bg-white">
                        <div className="flex justify-between mb-2">
                            <div className="flex gap-4">
                                <Heart
                                    size={26}
                                    className={`cursor-pointer transition-transform active:scale-95 ${isLiked ? "fill-red-500 text-red-500" : "hover:text-gray-400"}`}
                                    onClick={() => onLikePost(post._id)}
                                />
                                <Send size={26} className="cursor-pointer hover:text-gray-400 -rotate-45" />
                            </div>
                            {/* Add Bookmark etc */}
                        </div>
                        <div className="font-semibold text-sm mb-2 text-gray-900">{likes.length} likes</div>
                        <div className="text-xs text-gray-400 uppercase mb-3">{formatTimeAgo(post.createdAt)}</div>

                        <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
                            <input
                                type="text"
                                placeholder="Add a comment..."
                                className="flex-1 outline-none text-sm bg-gray-50 p-2 rounded-md text-gray-900 placeholder-gray-400"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            />
                            <button
                                className="text-[#0095F6] font-semibold text-sm disabled:opacity-50 hover:text-[#00376b]"
                                disabled={!commentText.trim()}
                                onClick={handleSubmit}
                            >
                                Post
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
