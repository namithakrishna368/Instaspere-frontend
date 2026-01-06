import { useEffect, useState } from "react";
import API from "../API/axios";
import { Link, useNavigate } from "react-router-dom";

export default function Profile() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/profile")
      .then((res) => setUser(res.data))
      .catch(() => navigate("/"));
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-4xl bg-white p-6">
       
        <div className="flex gap-10 items-center">
          <img
            src={
              user.profilePic
                ? `http://localhost:3000${user.profilePic}`
                : "https://via.placeholder.com/150"
            }
            className="w-36 h-36 rounded-full object-cover border"
          />

          <div className="flex-1">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold">{user.username}</h2>

              <Link
                to="/edit-profile"
                className="px-4 py-1 border rounded text-sm hover:bg-gray-100"
              >
                Edit Profile
              </Link>
            </div>

          
            <div className="flex gap-6 mt-4 text-sm">
              <span>
                <strong>{user.postsCount}</strong> posts
              </span>
              <span>
                <strong>{user.followersCount}</strong> followers
              </span>
              <span>
                <strong>{user.followingCount}</strong> following
              </span>
            </div>

           
            <div className="mt-3">
              <p className="text-sm">{user.bio || "No bio added yet"}</p>
              <p className="text-xs text-gray-500 mt-1">
                {user.isPrivate ? "🔒 Private Account" : "🌍 Public Account"}
              </p>
            </div>
          </div>
        </div>

        
        <div className="border-t mt-8 pt-6">
          <h3 className="text-center text-sm font-semibold text-gray-500">
            POSTS
          </h3>

          
          {user.postsCount === 0 ? (
            <div className="flex flex-col items-center mt-10 text-gray-400">
              <div className="w-20 h-20 border-2 border-gray-300 rounded-full flex items-center justify-center text-2xl">
                📷
              </div>
              <p className="mt-4 font-semibold">No Posts Yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 mt-6">
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
