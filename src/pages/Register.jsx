import { useState } from "react";
import API from "../API/axios";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();

    const res = await API.post("/register", form);
    localStorage.setItem("token", res.data.token);
    navigate("/profile");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={submit}
        className="bg-white p-8 w-96 rounded-xl shadow space-y-4"
      >
        <h1 className="text-2xl font-bold text-center">InstaSpere</h1>

        <input
          name="username"
          placeholder="Username"
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <button className="w-full bg-purple-600 text-white py-2 rounded">
          Register
        </button>

        <p className="text-center text-sm">
          Already have an account?{" "}
          <Link to="/" className="text-purple-600">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
