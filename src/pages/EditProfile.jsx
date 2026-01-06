import { useState } from "react";
import API from "../API/axios";
import { useNavigate } from "react-router-dom";

export default function EditProfile() {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profilePic, setProfilePic] = useState(null);

  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("username", username);
    data.append("bio", bio);
    if (profilePic) data.append("profilePic", profilePic);

    await API.put("/profile/edit", data);
    navigate("/profile");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center">
      <form
        onSubmit={submit}
        className="bg-white w-[380px] p-6 rounded-xl shadow space-y-4"
      >
        <h2 className="text-xl font-bold text-center">Edit Profile</h2>

        <input type="file" onChange={(e) => setProfilePic(e.target.files[0])} />

        <input
          placeholder="Username"
          className="w-full border p-2 rounded"
          onChange={(e) => setUsername(e.target.value)}
        />

        <textarea
          placeholder="Bio"
          className="w-full border p-2 rounded"
          onChange={(e) => setBio(e.target.value)}
        />

        <button className="w-full bg-purple-600 text-white py-2 rounded">
          Save
        </button>
      </form>
    </div>
  );
}
