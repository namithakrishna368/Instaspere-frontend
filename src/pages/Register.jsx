import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import Logo from "../components/Logo";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error for this field when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validateForm = () => {
    let newErrors = {};

    // Email validation
    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!form.email.toLowerCase().endsWith("@gmail.com")) {
      newErrors.email = "Only @gmail.com emails are valid";
    }

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    if (!form.username) {
      newErrors.username = "Username is required";
    } else if (form.username.length < 3) {
      newErrors.username = "Minimum 3 characters";
    } else if (!usernameRegex.test(form.username)) {
      newErrors.username = "Only letters, numbers, _, and . allowed";
    }

    // Password validation
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Minimum 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await API.post("/users/register", form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify({
        _id: res.data._id,
        username: res.data.username,
        email: res.data.email
      }));

      navigate("/home");
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed";
      if (message.includes("Email")) {
        setErrors(prev => ({ ...prev, email: message }));
      } else if (message.includes("Username")) {
        setErrors(prev => ({ ...prev, username: message }));
      } else {
        setErrors(prev => ({ ...prev, general: message }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      {/* Neon Background Accents */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#B026FF]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#00F0FF]/10 rounded-full blur-[100px] pointer-events-none" />

      <form onSubmit={submit} className="bg-white/80 backdrop-blur-xl p-10 w-[420px] rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] space-y-4 border border-white z-10">
        <div className="flex justify-center mb-2">
          <Logo variant="full" size="normal" />
        </div>

        <div className="space-y-1">
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} className={`w-full border p-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 outline-none transition-all font-medium ${errors.email ? 'border-red-500 ring-1 ring-red-500/20' : 'border-gray-200 focus:border-[#B026FF] focus:ring-2 focus:ring-[#B026FF]/20'}`} />
          {errors.email && <p className="text-red-500 text-xs pl-1 font-medium">{errors.email}</p>}
        </div>

        <div className="space-y-1">
          <input name="username" placeholder="Username" value={form.username} onChange={handleChange} className={`w-full border p-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 outline-none transition-all font-medium ${errors.username ? 'border-red-500 ring-1 ring-red-500/20' : 'border-gray-200 focus:border-[#B026FF] focus:ring-2 focus:ring-[#B026FF]/20'}`} />
          {errors.username && <p className="text-red-500 text-xs pl-1 font-medium">{errors.username}</p>}
        </div>

        <div className="space-y-1">
          <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} className={`w-full border p-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 outline-none transition-all font-medium ${errors.password ? 'border-red-500 ring-1 ring-red-500/20' : 'border-gray-200 focus:border-[#B026FF] focus:ring-2 focus:ring-[#B026FF]/20'}`} />
          {errors.password && <p className="text-red-500 text-xs pl-1 font-medium">{errors.password}</p>}
        </div>

        {errors.general && <p className="text-red-500 text-center text-sm font-bold bg-red-50 p-2 rounded-lg">{errors.general}</p>}

        <button
          disabled={loading}
          className={`w-full bg-gradient-to-r from-[#B026FF] to-[#7B2CBF] text-white py-3 rounded-xl font-bold shadow-[0_4px_15px_rgba(176,38,255,0.4)] hover:shadow-[0_6px_20px_rgba(176,38,255,0.6)] hover:scale-[1.02] transition-all duration-200 uppercase tracking-wide text-sm mt-2 flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : "Register"}
        </button>

        <p className="text-center text-sm font-medium text-gray-500 mt-4">
          Already have an account? <Link to="/" className="text-[#B026FF] hover:text-[#7B2CBF] font-bold">Login</Link>
        </p>
      </form>
    </div>
  );
}
