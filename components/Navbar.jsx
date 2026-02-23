import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="w-full bg-gray-100 p-4 flex justify-between">
      <Link to="/" className="font-bold text-xl">InstaSpere</Link>
      <div className="flex gap-4">
        <Link to="/profile">Profile</Link>
        <Link to="/login">Login</Link>
      </div>
    </nav>
  );
}
