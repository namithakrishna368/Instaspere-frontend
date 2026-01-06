import { useState } from "react";
import API from "../API/axios";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();

    const res = await API.post("/login", {
      email: identifier,
      username: identifier,
      password,
    });

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
          placeholder="Email or Username"
          onChange={(e) => setIdentifier(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <button className="w-full bg-purple-600 text-white py-2 rounded">
          Login
        </button>

        <p className="text-center text-sm">
          New here?{" "}
          <Link to="/register" className="text-purple-600">
            Create account
          </Link>
        </p>
      </form>
    </div>
  );
}
