import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
// import API from ""
import { GoogleLogin } from "@react-oauth/google";
import Logo from "../components/Logo";
import API from "../api/axios";
import toast from "react-hot-toast";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!form.email) {
      newErrors.email = "Email is required";
    }
    if (!form.password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const login = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    const loadingToast = toast.loading("Signing in...");
    try {
      const res = await API.post("/users/login", { email: form.email, password: form.password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      window.dispatchEvent(new Event("auth-update"));
      toast.success("Welcome back!", { id: loadingToast });
      navigate("/home");
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      toast.error(message, { id: loadingToast });
      if (message.includes("email") || message.includes("Email")) {
        setErrors(prev => ({ ...prev, email: message }));
      } else if (message.includes("password") || message.includes("Password")) {
        setErrors(prev => ({ ...prev, password: message }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    const loadingToast = toast.loading("Signing in with Google...");
    try {
      const { credential } = credentialResponse;
      const res = await API.post("/users/google-login", { access_token: credential });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      window.dispatchEvent(new Event("auth-update"));
      toast.success("Welcome back!", { id: loadingToast });
      navigate("/home");
    } catch (err) {
      toast.error(err.response?.data?.message || "Google Login failed", { id: loadingToast });
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

        <div className="space-y-1">
          <input
            name="email"
            className={`w-full border p-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 outline-none transition-all font-medium ${errors.email ? 'border-red-500 ring-1 ring-red-500/20' : 'border-gray-200 focus:border-[#B026FF] focus:ring-2 focus:ring-[#B026FF]/20'}`}
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />
          {errors.email && <p className="text-red-500 text-xs pl-1 font-medium">{errors.email}</p>}
        </div>

        <div className="space-y-1">
          <input
            name="password"
            className={`w-full border p-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 outline-none transition-all font-medium ${errors.password ? 'border-red-500 ring-1 ring-red-500/20' : 'border-gray-200 focus:border-[#B026FF] focus:ring-2 focus:ring-[#B026FF]/20'}`}
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
          />
          {errors.password && <p className="text-red-500 text-xs pl-1 font-medium">{errors.password}</p>}
        </div>

        <button
          disabled={loading}
          className={`w-full bg-gradient-to-r from-[#B026FF] to-[#7B2CBF] text-white py-3 rounded-xl font-bold shadow-[0_4px_15px_rgba(176,38,255,0.4)] hover:shadow-[0_6px_20px_rgba(176,38,255,0.6)] hover:scale-[1.02] transition-all duration-200 uppercase tracking-wide text-sm mt-4 flex items-center justify-center ${loading ? 'opacity-70' : ''}`}
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : "Sign In"}
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
