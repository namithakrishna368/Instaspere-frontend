import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import Logo from "../components/Logo";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
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
      alert(err.response?.data?.message || "Registration failed");
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

        <input name="username" placeholder="Username" value={form.username} onChange={handleChange} className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:border-[#B026FF] focus:ring-2 focus:ring-[#B026FF]/20 transition-all font-medium" />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:border-[#B026FF] focus:ring-2 focus:ring-[#B026FF]/20 transition-all font-medium" />
        <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:border-[#B026FF] focus:ring-2 focus:ring-[#B026FF]/20 transition-all font-medium" />

        <button className="w-full bg-gradient-to-r from-[#B026FF] to-[#7B2CBF] text-white py-3 rounded-xl font-bold shadow-[0_4px_15px_rgba(176,38,255,0.4)] hover:shadow-[0_6px_20px_rgba(176,38,255,0.6)] hover:scale-[1.02] transition-all duration-200 uppercase tracking-wide text-sm mt-2">Register</button>

        <p className="text-center text-sm font-medium text-gray-500 mt-4">
          Already have an account? <Link to="/" className="text-[#B026FF] hover:text-[#7B2CBF] font-bold">Login</Link>
        </p>
      </form>
    </div>
  );
}
