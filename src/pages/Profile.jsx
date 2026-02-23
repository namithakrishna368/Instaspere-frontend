import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Grid, Bookmark, Layers, PlusCircle, Settings, Lock } from "lucide-react";
import API from "../api/axios";
import Sidebar from "../components/Sidebar";
import FollowListModal from "../components/FollowListModal";
import ProfilePostFeed from "../components/ProfilePostFeed";

export default function Profile() {
  const navigate = useNavigate();
  const { username } = useParams();

  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [showFeed, setShowFeed] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [followModal, setFollowModal] = useState({ open: false, type: "followers" });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        // 1. Get Current User (for "me" context)
        const meRes = await API.get("/users/me");
        setCurrentUser(meRes.data);

        let profileData;
        if (username && username !== meRes.data.username) {
          // Fetch other user
          const res = await API.get(`/users/${username}`);
          profileData = res.data;
        } else {
          // Fetch my profile
          profileData = meRes.data;
        }

        setUser(profileData);

        // 2. Fetch Posts if accessible
        // Accessible if: It's me OR (Not Private) OR (Private AND Following)
        const isOwner = profileData._id === meRes.data._id;
        const canView = isOwner || !profileData.isPrivate || profileData.isFollowing;

        if (canView) {
          const postRes = await API.get(`/posts/user/${profileData._id}`);
          setPosts(postRes.data);
        } else {
          setPosts([]);
        }

      } catch (err) {
        console.error(err);
        setError("User not found");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  /* OPTIMISTIC FOLLOW HANDLER */
  const handleFollow = async () => {
    if (!user) return;

    // Store previous state for rollback
    const previousUser = { ...user };

    // 1. Optimistic Update
    setUser(prev => {
      const isFollowing = prev.isFollowing;
      const isRequested = prev.isRequested;

      // Logic:
      // If Following -> Unfollow (isFollowing=false, count--)
      // If Private & Not Following -> Request (isRequested=true, count same)
      // If Public & Not Following -> Follow (isFollowing=true, count++)

      if (isFollowing) {
        return {
          ...prev,
          isFollowing: false,
          followersCount: Math.max(0, (prev.followersCount || 0) - 1)
        };
      } else if (prev.isPrivate) {
        return {
          ...prev,
          isRequested: !isRequested, // Toggle request
        };
      } else {
        return {
          ...prev,
          isFollowing: true,
          followersCount: (prev.followersCount || 0) + 1
        };
      }
    });

    try {
      // 2. API Call
      const { data } = await API.put(`/users/follow/${user._id}`);

      // 3. Sync with Server response (optional, but good for "isRequested" accuracy)
      // The server returns the final status.
      // If server response differs significantly (e.g. failure), we rollback or adjust.
      // But typically, we just trust our optimistic change unless it errors.

      // Let's just update "isRequested" specifically based on response because "Private" logic is tricky.
      if (data.status === "unrequested") {
        // Server confirmed request was cancelled
        setUser(prev => ({ ...prev, isRequested: false }));
      } else if (data.status === "requested" && !user.isPrivate) {
        // Edge case: user turned private mid-operation.
      }

    } catch (err) {
      console.error("Follow action failed", err);
      // 4. Rollback
      setUser(previousUser);
      alert("Something went wrong. Please try again.");
    }
  };

  const handlePostClick = (post) => {
    setSelectedPostId(post._id);
    setShowFeed(true);
  };

  if (loading) {
    return (
      <div className="flex bg-white min-h-screen font-sans">
        <Sidebar />
        <div className="flex-1 flex justify-center items-center ml-64">
          <div className="w-12 h-12 border-4 border-[#E0B0FF] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex bg-white min-h-screen font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col justify-center items-center ml-64 p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Sorry, this page isn't available.</h2>
          <p className="text-gray-500 mb-6">
            The link you followed may be broken, or the page may have been removed.
            <button
              onClick={() => navigate("/home")}
              className="text-[#0095F6] ml-1 hover:underline cursor-pointer"
            >
              Go back to Instagram.
            </button>
          </p>
        </div>
      </div>
    );
  }

  const isOwner = currentUser && user._id === currentUser._id;
  const showPosts = isOwner || !user.isPrivate || user.isFollowing;

  /* HELPER FOR IMAGES */
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    const base = import.meta.env.VITE_API_URL || "http://localhost:5000";
    return `${base}/${path.replace(/\\/g, "/")}`;
  };

  const profileImage = user.avatar
    ? getImageUrl(user.avatar)
    : "https://www.seekpng.com/png/detail/966-9665493_my-profile-icon-blank-profile-image-circle.png";

  return (
    <div className="flex bg-[#f8f9fa] min-h-screen font-sans">
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-72 mb-16 md:mb-0 pb-20 md:pb-0">
        {/* Top Header Bar */}
        <div className="h-12 md:h-16 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 border-b border-white/50 shadow-sm">
          <h2 className="text-lg md:text-xl font-bold tracking-wide text-[#1a1a1a] font-logo flex items-center gap-1">
            {user.isPrivate && <Lock size={14} className="mb-0.5" />}
            {user.username}
          </h2>
          <div className="flex gap-4 text-black dark:text-white">
            <PlusCircle className="cursor-pointer hover:opacity-75" size={24} />
            <Settings className="cursor-pointer hover:opacity-75" size={24} />
          </div>
        </div>

        {/* Profile Info Section */}
        <div className="max-w-4xl mx-auto px-4 py-6 md:px-12 md:py-10">

          {/* Mobile Header: Avatar Left, Stats Right */}
          <div className="flex flex-row md:flex-row items-center md:items-start mb-6 md:mb-12">

            {/* Avatar */}
            <div className="flex-shrink-0 mr-8 md:mr-16 md:flex md:flex-col md:items-center">
              <div className="w-20 h-20 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-yellow-400 to-purple-600 mb-2 md:mb-4">
                <img
                  src={profileImage}
                  alt="avatar"
                  className="w-full h-full rounded-full object-cover border-2 md:border-4 border-white"
                />
              </div>
              <p className="hidden md:block font-bold text-center text-lg text-[#1a1a1a]">{user.name || user.username}</p>
              <p className="hidden md:block text-sm text-center text-gray-600 whitespace-pre-line leading-relaxed max-w-[200px] mt-2 font-medium">
                {user.bio}
              </p>
            </div>

            {/* Stats (Mobile Right / Desktop Below) */}
            <div className="flex-1 flex justify-around md:justify-center md:gap-16 items-center">
              <div className="flex flex-col items-center">
                <span className="text-lg md:text-2xl font-bold text-[#1a1a1a]">{posts.length}</span>
                <span className="text-sm md:text-lg text-gray-500 font-medium">Posts</span>
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:text-[#B026FF] transition-colors" onClick={() => setFollowModal({ open: true, type: "followers" })}>
                <span className="text-lg md:text-2xl font-bold text-[#1a1a1a]">{user.followersCount || 0}</span>
                <span className="text-sm md:text-lg text-gray-500 font-medium">Followers</span>
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:text-[#B026FF] transition-colors" onClick={() => setFollowModal({ open: true, type: "following" })}>
                <span className="text-lg md:text-2xl font-bold text-[#1a1a1a]">{user.followingCount || 0}</span>
                <span className="text-sm md:text-lg text-gray-500 font-medium">Following</span>
              </div>
            </div>
          </div>

          {/* Bio + Buttons (Mobile Below Header) */}
          <div className="md:hidden mb-6">
            <p className="font-bold text-sm text-[#1a1a1a]">{user.name || user.username}</p>
            <p className="text-sm text-gray-800 whitespace-pre-line mt-1">{user.bio}</p>
          </div>

          <div className="flex gap-2 mb-8">
            {isOwner ? (
              <div className="flex w-full gap-2">
                <button
                  onClick={() => navigate("/edit-profile")}
                  className="flex-1 py-1.5 bg-gray-100 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  Edit Profile
                </button>
                <button
                  className="flex-1 py-1.5 bg-gray-100 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors md:hidden"
                >
                  Share Profile
                </button>
              </div>
            ) : (
              <div className="flex w-full gap-2">
                <button
                  onClick={handleFollow}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${user.isFollowing || user.isRequested
                    ? "bg-gray-100 text-black hover:bg-gray-200"
                    : "bg-[#0095F6] text-white hover:bg-[#1877F2]"
                    }`}
                >
                  {user.isFollowing ? "Following" : user.isRequested ? "Requested" : "Follow"}
                </button>
                <button
                  onClick={() => navigate(`/messages?user=${user._id}`)}
                  className="flex-1 py-1.5 bg-gray-100 text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  Message
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-slate-800 mb-4"></div>

          {/* Posts / Private Message */}
          {showPosts ? (
            showFeed ? (
              <ProfilePostFeed
                posts={posts}
                initialPostId={selectedPostId}
                onBack={() => { setShowFeed(false); setSelectedPostId(null); }}
                onPostsUpdate={(updated) => setPosts(updated)}
              />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-1">
                  {posts.map((post) => {
                    const imageSrc =
                      Array.isArray(post.images) && post.images.length > 0
                        ? getImageUrl(post.images[0])
                        : null;

                    return (
                      <div
                        key={post._id}
                        className="relative aspect-square bg-white cursor-pointer group hover:opacity-90 transition-opacity overflow-hidden rounded-xl"
                        onClick={() => handlePostClick(post)}
                      >
                        {imageSrc && (
                          <img
                            src={imageSrc}
                            alt="post"
                            className="w-full h-full object-cover"
                          />
                        )}
                        {post.images?.length > 1 && (
                          <Layers className="absolute top-2 right-2 text-white w-6 h-6 drop-shadow-lg" />
                        )}
                      </div>
                    );
                  })}
                </div>
                {posts.length === 0 && (
                  <div className="py-20 text-center text-gray-500">
                    <Grid className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No posts yet</p>
                  </div>
                )}
              </>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-20 border-t border-gray-100">
              <div className="w-24 h-24 rounded-full border-2 border-[#1a1a1a] flex items-center justify-center mb-4">
                <Lock size={48} className="text-[#1a1a1a]" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-[#1a1a1a] font-logo">This Account is Private</h3>
              <p className="text-gray-500">Follow to see their photos and videos.</p>
            </div>
          )}

        </div>
      </div>

      <FollowListModal
        isOpen={followModal.open}
        onClose={() => setFollowModal({ open: false, type: "followers" })}
        userId={user?._id}
        type={followModal.type}
        title={followModal.type === "followers" ? "Followers" : "Following"}
      />
    </div>
  );
}