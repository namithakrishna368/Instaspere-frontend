import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import GoogleLogin from "../GoogleLogin";
import API from "../API/axios";

export default function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // NORMAL LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post("/login", {
        email: identifier,
        username: identifier,
        password,
      });

      localStorage.setItem("token", res.data.token);
      navigate("/profile");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // GOOGLE LOGIN
  const handleGoogleLogin = async (googleUser) => {
    try {
      const res = await API.post("/google-login", {
        email: googleUser.email,
        username: googleUser.name,
        googleId: googleUser.googleId,
      });

      localStorage.setItem("token", res.data.token);
      navigate("/profile");
    } catch (err) {
      alert("Google login failed");
    }
  };

  return (
    <div className="min-h-screen flex bg-[#eecbff]">
      {/* LEFT SIDE */}
      <div className="hidden md:block w-1/4 bg-[#eecbff]" />

      {/* CENTER CARD */}
      <div className="flex w-full md:w-2/4 items-center justify-center bg-white">
        <div className="w-full max-w-md px-8 py-10 text-center">
          {/* LOGO */}
          <h1 className="text-4xl font-bold text-pink-500 mb-1">
            InstaSpere
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Capture. Connect. Explore
          </p>

          {/* GOOGLE LOGIN */}
          <div className="mb-6">
            <GoogleLogin onSuccess={handleGoogleLogin} />
          </div>

          <p className="text-gray-500 text-sm mb-4">
            Login to your account
          </p>

          {/* LOGIN FORM */}
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              placeholder="Email or Username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-3 border rounded bg-gray-100 focus:outline-none"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded bg-gray-100 focus:outline-none"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-3 rounded text-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Sign In"}
            </button>
          </form>

          {/* REGISTER LINK */}
          <p className="text-sm text-gray-600 mt-6">
            Don’t have an account?{" "}
            <Link to="/register" className="text-blue-500 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="hidden md:block w-1/4 bg-[#eecbff]" />
    </div>
  );
}
