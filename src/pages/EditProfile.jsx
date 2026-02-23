import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import Sidebar from "../components/Sidebar";
import Toast, { useToast } from "../components/Toast";

export default function EditProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get("/users/me");
        setUsername(res.data.username || "");
        setBio(res.data.bio || "");
        setName(res.data.name || "");
        setIsPrivate(res.data.isPrivate || false);

        const avatarPath = res.data.avatar;
        // Helper to resolve image URL
        const getImageUrl = (path) => {
          if (!path) return null;
          if (path.startsWith("http") || path.startsWith("data:")) return path;
          const base = import.meta.env.VITE_API_URL || "http://localhost:5000";
          return `${base}/${path.replace(/\\/g, "/")}`;
        }
        setPreview(
          avatarPath
            ? getImageUrl(avatarPath)
            : "https://www.seekpng.com/png/detail/966-9665493_my-profile-icon-blank-profile-image-circle.png"
        );
      } catch (err) {
        console.error("Profile load failed", err);
      }
    };
    fetchProfile();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    if (username.length > 15) {
      showToast("Username must be 15 characters or less", "error");
      return;
    }
    if (name.length > 15) {
      showToast("Name must be 15 characters or less", "error");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("bio", bio);
      formData.append("name", name);
      formData.append("isPrivate", isPrivate); // Backend (Mongoose) will cast "true"/"false" string to boolean
      if (avatar) formData.append("avatar", avatar);

      await API.put("/users/edit", formData);
      navigate("/profile");
    } catch (error) {
      alert("Failed to update profile");
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-white min-h-screen font-sans">
      <Sidebar />

      <div className="flex-1 md:ml-72 mb-16 md:mb-0 pb-20 md:pb-0 bg-gray-50 flex justify-center py-10">
        <div className="bg-white border rounded-lg shadow-sm w-full max-w-2xl overflow-hidden flex flex-col h-fit">
          <h1 className="text-2xl font-bold p-8 border-b">Edit Profile</h1>

          <div className="p-8">
            {/* Profile Photo Section */}
            <div className="flex items-center gap-8 mb-8">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 cursor-pointer" onClick={() => fileInputRef.current.click()}>
                <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{username}</h2>
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="text-[#E0B0FF] font-bold text-sm hover:text-purple-700"
                >
                  Change Profile Photo
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*"
                />
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={submitHandler} className="space-y-6">

              {/* Name */}
              <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
                <label className="md:w-32 text-right font-semibold mt-2">Name</label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.length > 15) {
                        showToast("Name must be 15 characters or less", "error");
                      }
                      setName(val.slice(0, 15));
                    }}
                    maxLength={15}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                    placeholder="Name"
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">{name.length} / 15</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Help people discover your account by using the name you're known by: either your full name, nickname, or business name.
                  </p>
                </div>
              </div>

              {/* Username */}
              <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
                <label className="md:w-32 text-right font-semibold mt-2">Username</label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.length > 15) {
                        showToast("Username must be 15 characters or less", "error");
                      }
                      setUsername(val.slice(0, 15));
                    }}
                    maxLength={15}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                    placeholder="Username"
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">{username.length} / 15</p>
                </div>
              </div>

              {/* Bio */}
              <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
                <label className="md:w-32 text-right font-semibold mt-2">Bio</label>
                <div className="flex-1">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black h-20 resize-none"
                    placeholder="Bio"
                    maxLength="150"
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {bio.length} / 150
                  </p>
                </div>
              </div>

              {/* Private Account */}
              <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
                <label className="md:w-32 text-right font-semibold mt-2">Private</label>
                <div className="flex-1">
                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E0B0FF]"></div>
                    <span className="ml-3 text-sm font-medium hover:cursor-pointer">Private Account</span>
                  </label>

                  <p className="text-xs text-gray-500 mt-2">
                    When your account is private, only people you approve can see your photos and videos. Your existing followers won't be affected.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-8 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 bg-[#E0B0FF] text-white font-semibold rounded-lg hover:bg-purple-500 transition-colors ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {loading ? "Saving..." : "Submit"}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
      <Toast toast={toast} />
    </div>
  );
}
