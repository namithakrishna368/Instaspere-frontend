import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import { GoogleLogin } from "@react-oauth/google";
import Logo from "../components/Logo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/users/login", { email, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      window.dispatchEvent(new Event("auth-update"));

      navigate("/home");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }

  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse;
      const res = await API.post("/users/google-login", { access_token: credential });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      window.dispatchEvent(new Event("auth-update"));
      navigate("/home");
    } catch (err) {
      alert(err.response?.data?.message || "Google Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden px-4 sm:px-6">
      {/* Neon Background Accents */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#B026FF]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#00F0FF]/10 rounded-full blur-[100px] pointer-events-none" />

      <form onSubmit={login} className="bg-white/80 backdrop-blur-xl w-full max-w-[420px] p-6 sm:p-10 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] space-y-4 border border-white z-10">
        <div className="flex justify-center mb-6">
          <Logo variant="full" size="normal" />
        </div>

        <input
          className="w-full border border-gray-200 p-3 mt-4 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:border-[#B026FF] focus:ring-2 focus:ring-[#B026FF]/20 transition-all font-medium"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border border-gray-200 p-3 mt-2 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:border-[#B026FF] focus:ring-2 focus:ring-[#B026FF]/20 transition-all font-medium"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-gradient-to-r from-[#B026FF] to-[#7B2CBF] text-white py-3 rounded-xl font-bold shadow-[0_4px_15px_rgba(176,38,255,0.4)] hover:shadow-[0_6px_20px_rgba(176,38,255,0.6)] hover:scale-[1.02] transition-all duration-200 uppercase tracking-wide text-sm mt-4">
          Sign In
        </button>

        <div className="mt-4 flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => console.log("Login Failed")}
            ux_mode="popup"
            useOneTap={false}
            auto_select={false}
          />
        </div>

        <p className="text-center text-sm mt-5 text-gray-500 font-medium">
          No account? <Link to="/register" className="text-[#B026FF] hover:text-[#7B2CBF] font-bold">Register</Link>
        </p>
      </form>
    </div>
  );
}
