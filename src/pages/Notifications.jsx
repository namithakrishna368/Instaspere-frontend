import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SidebarComponent from "../components/Sidebar";
import API from "../api/axios";
import { useSocket } from "../context/SocketContext";
import { ChevronRight } from "lucide-react";
import { formatTimeAgo } from "../utils/dateUtils";
import { getAvatarUrl } from "../utils/imageUtils";

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRequests, setShowRequests] = useState(false);
    const { socket } = useSocket();

    // Real-time notifications
    useEffect(() => {
        if (!socket) return;

        socket.on("notification", (newNotif) => {
            setNotifications((prev) => [newNotif, ...prev]);
        });

        // Fires when someone accepts OUR follow request (we get follow_accept)
        // OR when we accept someone's request → our follow_request becomes 'follow'
        socket.on("notification:update", async () => {
            // Refetch to get the updated notification (follow_request → follow)
            try {
                const res = await API.get("/notifications");
                setNotifications(res.data);
            } catch { /* silent */ }
        });

        socket.on("follow:responded", ({ notificationId, action }) => {
            if (action === "accept") {
                setNotifications((prev) =>
                    prev
                        .map((n) =>
                            n._id === notificationId
                                ? { ...n, type: "follow", createdAt: new Date().toISOString() }
                                : n
                        )
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                );
            } else {
                setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
            }
        });

        return () => {
            socket.off("notification");
            socket.off("notification:update");
            socket.off("follow:responded");
        };
    }, [socket]);

    // Fetch notifications on mount
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await API.get("/notifications");
                setNotifications(res.data);
            } catch (err) {
                console.error("Failed to fetch notifications", err);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    // Mark notifications as read when page is visited
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            API.put("/notifications/read").catch(() => { });
        }
    }, []);

    // Handle Accept / Reject follow request
    const handleRespond = async (notifId, requesterId, action) => {
        try {
            await API.put("/users/follow-respond", {
                requesterId,
                action,
                notificationId: notifId,
            });

            if (action === "accept") {
                // Instagram style: convert follow_request → follow in local state immediately
                setNotifications((prev) => {
                    return prev
                        .map((n) => {
                            if (n._id === notifId) {
                                return { ...n, type: "follow", createdAt: new Date().toISOString() };
                            }
                            return n;
                        })
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                });
            } else {
                // Reject: remove from UI immediately
                setNotifications((prev) => prev.filter((n) => n._id !== notifId));
            }
        } catch (err) {
            console.error("Failed to respond", err);
            // On error - remove to avoid stuck state
            setNotifications((prev) => prev.filter((n) => n._id !== notifId));
        }
    };

    // Handle follow-back from notification — Instagram-style logic
    const handleFollow = async (userId) => {
        // Snapshot previous state for rollback
        const prevNotifications = notifications;

        // Optimistic update
        setNotifications((prev) =>
            prev.map((n) => {
                if (n.sender?._id === userId) {
                    const sender = n.sender;
                    const isFollowing = sender.isFollowing;
                    const isRequested = sender.isRequested;
                    const isPrivate = sender.isPrivate;

                    if (isFollowing) {
                        // Unfollow
                        return { ...n, sender: { ...sender, isFollowing: false, isRequested: false } };
                    } else if (isPrivate && !isRequested) {
                        // Send follow request
                        return { ...n, sender: { ...sender, isRequested: true } };
                    } else if (isRequested) {
                        // Cancel follow request
                        return { ...n, sender: { ...sender, isRequested: false } };
                    } else {
                        // Follow (public)
                        return { ...n, sender: { ...sender, isFollowing: true } };
                    }
                }
                return n;
            })
        );

        try {
            const res = await API.put(`/users/follow/${userId}`);
            const status = res.data.status; // "followed" | "unfollowed" | "requested" | "unrequested"

            setNotifications((prev) =>
                prev.map((n) => {
                    if (n.sender?._id === userId) {
                        return {
                            ...n,
                            sender: {
                                ...n.sender,
                                isFollowing: status === "followed",
                                isRequested: status === "requested",
                            },
                        };
                    }
                    return n;
                })
            );
        } catch (err) {
            console.error("Follow failed", err);
            // Rollback
            setNotifications(prevNotifications);
        }
    };

    // Separate follow requests from other notifications
    const pendingRequests = notifications.filter((n) => n.type === "follow_request");
    const otherNotifications = notifications.filter((n) => n.type !== "follow_request");
    const groupedNotifications = groupNotifications(otherNotifications);

    return (
        <div className="flex bg-white min-h-screen">
            <SidebarComponent />

            <div className="flex-1 md:ml-72 mb-16 md:mb-0 p-0 md:p-4 pb-20 md:pb-4 max-w-2xl mx-auto flex justify-center bg-gray-50 w-full">
                <div className="w-full max-w-[600px] py-8 px-4">
                    <h1 className="text-2xl font-bold mb-6">Notifications</h1>

                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Follow Requests Section */}
                            {pendingRequests.length > 0 && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                                    <div
                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => setShowRequests(!showRequests)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
                                                    <div className="w-full h-full rounded-full bg-gray-200 overflow-hidden">
                                                        {pendingRequests[0].sender?.avatar ? (
                                                            <img
                                                                src={getAvatarUrl(pendingRequests[0].sender.avatar)}
                                                                className="w-full h-full object-cover"
                                                                alt=""
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gray-300" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
                                                    {pendingRequests.length}
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm">Follow requests</h3>
                                                <p className="text-gray-500 text-xs">
                                                    {pendingRequests[0].sender?.username || "Someone"} and{" "}
                                                    {pendingRequests.length > 1
                                                        ? `${pendingRequests.length - 1} others`
                                                        : ""}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight
                                            size={20}
                                            className={`text-gray-400 transition-transform ${showRequests ? "rotate-90" : ""
                                                }`}
                                        />
                                    </div>

                                    {showRequests && (
                                        <div className="border-t border-gray-200">
                                            {pendingRequests.map((notif) => (
                                                <NotificationItem
                                                    key={notif._id}
                                                    notif={notif}
                                                    onRespond={handleRespond}
                                                    onFollow={handleFollow}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Grouped Notifications */}
                            {otherNotifications.length > 0 ? (
                                Object.entries(groupedNotifications).map(([label, items]) =>
                                    items.length > 0 ? (
                                        <div key={label}>
                                            <h3 className="font-bold text-base mb-3 px-2">{label}</h3>
                                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                                {items.map((notif) => (
                                                    <NotificationItem
                                                        key={notif._id}
                                                        notif={notif}
                                                        onRespond={handleRespond}
                                                        onFollow={handleFollow}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ) : null
                                )
                            ) : (
                                pendingRequests.length === 0 && (
                                    <div className="p-12 text-center text-gray-400 bg-white rounded-lg border border-gray-200">
                                        <div className="text-4xl mb-3">💬</div>
                                        <p className="font-semibold text-gray-600">No notifications yet</p>
                                        <p className="text-sm mt-1">
                                            When someone likes or comments on your posts, you'll see it here.
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ============================
   NOTIFICATION ITEM COMPONENT
============================ */
function NotificationItem({ notif, onRespond, onFollow }) {
    if (!notif.sender) return null;

    const getNotifText = () => {
        switch (notif.type) {
            case "like":
                return "liked your post.";
            case "comment":
                return notif.commentText
                    ? `commented: "${notif.commentText}"`
                    : "commented on your post.";
            case "comment_like":
                return "liked your comment.";
            case "follow":
                return "started following you.";
            case "follow_request":
                return "requested to follow you.";
            case "follow_accept":
                return "accepted your follow request.";
            case "mention":
                return "mentioned you in a post.";
            case "message_request":
                return "sent you a message request.";
            case "story_like":
                return "liked your story.";
            default:
                return "sent you a notification.";
        }
    };

    return (
        <div className="flex items-center justify-between p-3 px-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Avatar */}
                <Link
                    to={`/profile/${notif.sender.username}`}
                    className="w-11 h-11 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden block"
                >
                    <img
                        src={getAvatarUrl(notif.sender.avatar)}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                </Link>

                {/* Text */}
                <div className="text-sm flex-1 min-w-0">
                    <span>
                        <Link
                            to={`/profile/${notif.sender.username}`}
                            className="font-semibold hover:underline"
                        >
                            {notif.sender.username || "User"}
                        </Link>{" "}
                        <span className="text-gray-600">{getNotifText()}</span>{" "}
                        <span className="text-gray-400 text-xs">
                            {formatTimeAgo(notif.createdAt)}
                        </span>
                    </span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                {notif.type === "follow_request" ? (
                    <>
                        <button
                            onClick={() => onRespond(notif._id, notif.sender?._id, "accept")}
                            className="bg-[#0095F6] text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#0086d9] transition-colors"
                        >
                            Confirm
                        </button>
                        <button
                            onClick={() => onRespond(notif._id, notif.sender?._id, "reject")}
                            className="bg-gray-100 text-black px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                        >
                            Delete
                        </button>
                    </>
                ) : (notif.type === "follow" || notif.type === "follow_accept") ? (
                    <button
                        onClick={() => onFollow(notif.sender?._id)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${notif.sender?.isFollowing
                            ? "bg-gray-100 text-black hover:bg-gray-200"
                            : notif.sender?.isRequested
                                ? "bg-gray-100 text-black hover:bg-gray-200"
                                : "bg-[#0095F6] text-white hover:bg-[#0086d9]"
                            }`}
                    >
                        {notif.sender?.isFollowing
                            ? "Following"
                            : notif.sender?.isRequested
                                ? "Requested"
                                : "Follow"}
                    </button>
                ) : null}

                {/* Post Thumbnail */}
                {notif.post &&
                    notif.post.images &&
                    notif.post.images[0] &&
                    (notif.type === "like" || notif.type === "comment" || notif.type === "comment_like") && (
                        <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                            {notif.post.images[0] && notif.post.images[0].trim() !== "" && (
                                <img
                                    src={notif.post.images[0]}
                                    alt="Post"
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                    )}
            </div>
        </div>
    );
}

/* ============================
   GROUP NOTIFICATIONS BY TIME
============================ */
const groupNotifications = (list) => {
    const groups = {
        Today: [],
        Yesterday: [],
        "This Week": [],
        "This Month": [],
        Earlier: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const lastWeek = today - 86400000 * 7;
    const lastMonth = today - 86400000 * 30;

    list.forEach((notif) => {
        const time = new Date(notif.createdAt).getTime();

        if (time >= today) {
            groups["Today"].push(notif);
        } else if (time >= yesterday) {
            groups["Yesterday"].push(notif);
        } else if (time >= lastWeek) {
            groups["This Week"].push(notif);
        } else if (time >= lastMonth) {
            groups["This Month"].push(notif);
        } else {
            groups["Earlier"].push(notif);
        }
    });

    return groups;
};
