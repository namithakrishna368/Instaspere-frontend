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
    const commentsEndRef = useRef(null);
    const inputRef = useRef(null);
    const currentUser = JSON.parse(localStorage.getItem("user"));
    const isLiked = likes.includes(currentUser?._id);

    // Sync comments when post changes
    useEffect(() => {
        if (post) {
            setComments(post.comments || []);
            setLikes(post.likes || []);
        }
    }, [post]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            // On mobile, listen for visualViewport resize (keyboard open/close)
            const handleResize = () => {
                // Force layout recalc when keyboard opens/closes
                if (inputRef.current) {
                    inputRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
            };
            window.visualViewport?.addEventListener("resize", handleResize);
            return () => {
                document.body.style.overflow = "";
                window.visualViewport?.removeEventListener("resize", handleResize);
            };
        }
    }, [isOpen]);

    // Scroll to bottom when new comment is added
    useEffect(() => {
        if (commentsEndRef.current) {
            commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [comments.length]);

    if (!isOpen || !post) return null;

    const handleSubmit = async () => {
        if (!commentText.trim()) return;
        try {
            const res = await API.post(`/posts/comment/${post._id}`, { text: commentText });
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
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60" onClick={onClose}>

            {/* Close Button - Desktop */}
            <button className="absolute top-4 right-4 text-white z-50 hidden md:block" onClick={onClose}>
                <X size={30} />
            </button>

            {/* Modal Container */}
            <div
                className="bg-white w-full h-[100dvh] md:h-[85vh] md:max-w-6xl md:rounded-xl flex flex-col md:flex-row overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Left: Image - Desktop only */}
                <div className="hidden md:flex md:w-[60%] bg-black items-center justify-center">
                    <img
                        src={post.images?.[0]}
                        className="w-full h-full object-contain"
                        alt="Post"
                    />
                </div>

                {/* Right: Details & Comments */}
                <div className="w-full md:w-[40%] flex flex-col h-full bg-white">

                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-shrink-0">
                        {/* Mobile close (left arrow style) */}
                        <button className="md:hidden mr-1" onClick={onClose}>
                            <X size={24} className="text-gray-700" />
                        </button>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px] flex-shrink-0">
                            <img
                                src={getAvatarUrl(post.user?.avatar)}
                                className="w-full h-full rounded-full object-cover border border-white"
                                alt={post.user?.username}
                            />
                        </div>
                        <span className="font-semibold text-sm text-gray-900 flex-1">Comments</span>
                    </div>

                    {/* Mobile: Post preview (small image + caption) */}
                    <div className="md:hidden flex items-start gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                        {post.images?.[0] && (
                            <img
                                src={post.images[0]}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                alt="Post thumbnail"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <span className="font-semibold text-sm text-gray-900">{post.user?.username}</span>
                            {post.caption && (
                                <p className="text-sm text-gray-600 truncate">{post.caption}</p>
                            )}
                        </div>
                    </div>

                    {/* Comments List - scrollable area */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 overscroll-contain">

                        {/* Caption as first 'comment' - Desktop only */}
                        {post.caption && (
                            <div className="hidden md:flex gap-3">
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
                        {comments.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <p className="text-lg font-semibold">No comments yet.</p>
                                <p className="text-sm">Start the conversation.</p>
                            </div>
                        )}
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
                                <div className="flex-1 text-sm min-w-0">
                                    <Link to={`/profile/${comment.user?.username}`} className="font-semibold mr-2 hover:opacity-50 transition text-gray-900">
                                        {comment.user?.username}
                                    </Link>
                                    {(() => {
                                        const words = (comment.text || "").split(" ");
                                        const isLong = words.length > 15;
                                        const isExpanded = expandedComments[comment._id || idx];
                                        return (
                                            <span className="text-gray-900 break-words">
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
                                <div className="pt-1 flex-shrink-0">
                                    <Heart
                                        size={14}
                                        className={`cursor-pointer ${comment.likes?.includes(currentUser._id) ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-gray-600"}`}
                                        onClick={() => handleCommentLike(comment._id)}
                                    />
                                </div>
                            </div>
                        ))}
                        <div ref={commentsEndRef} />
                    </div>

                    {/* Footer: Actions & Input - pinned to bottom */}
                    <div className="border-t border-gray-100 bg-white flex-shrink-0 safe-area-bottom">
                        {/* Like & share row */}
                        <div className="flex justify-between items-center px-4 pt-3 pb-1">
                            <div className="flex gap-4">
                                <Heart
                                    size={24}
                                    className={`cursor-pointer transition-transform active:scale-95 ${isLiked ? "fill-red-500 text-red-500" : "hover:text-gray-400"}`}
                                    onClick={() => onLikePost(post._id)}
                                />
                                <Send size={24} className="cursor-pointer hover:text-gray-400 -rotate-45" />
                            </div>
                        </div>
                        <div className="px-4 pb-1">
                            <div className="font-semibold text-sm text-gray-900">{likes.length} likes</div>
                            <div className="text-[10px] text-gray-400 uppercase mt-0.5">{formatTimeAgo(post.createdAt)}</div>
                        </div>

                        {/* Comment input */}
                        <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
                            <div className="w-7 h-7 flex-shrink-0 rounded-full overflow-hidden">
                                <img
                                    src={getAvatarUrl(currentUser?.avatar)}
                                    className="w-full h-full object-cover"
                                    alt="You"
                                />
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Add a comment..."
                                className="flex-1 outline-none text-sm bg-transparent py-2 text-gray-900 placeholder-gray-400"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                enterKeyHint="send"
                                autoComplete="off"
                            />
                            <button
                                className="text-[#0095F6] font-semibold text-sm disabled:opacity-30 hover:text-[#00376b] transition-colors"
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
