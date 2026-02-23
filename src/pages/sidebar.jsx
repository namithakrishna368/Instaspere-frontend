import { Link, useLocation } from "react-router-dom";
import { FaHome, FaComment, FaPlus, FaUser, FaSignOutAlt } from "react-icons/fa";

export default function Sidebar() {
  const location = useLocation(); // To highlight active link

  const menuItems = [
    { name: "Home", icon: <FaHome />, path: "/home" },
    { name: "Message", icon: <FaComment />, path: "/messages" },
    { name: "Create", icon: <FaPlus />, path: "/create" },
    { name: "Profile", icon: <FaUser />, path: "/profile" },
    { name: "LogOut", icon: <FaSignOutAlt />, path: "/logout" },
  ];

  return (
    <div className="w-64 min-h-screen bg-purple-200 flex flex-col items-start p-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-start">
        <h1 className="text-purple-800 font-bold text-xl flex items-center gap-2">
          <span className="text-2xl">🎨</span> InstaSpere
        </h1>
        <p className="text-sm text-purple-700 ml-1">Capture. Connect. Explore</p>
      </div>

      {/* Menu */}
      <nav className="flex flex-col w-full space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 p-2 rounded cursor-pointer w-full text-purple-700 font-medium
                ${isActive ? "bg-purple-400" : "hover:bg-purple-300"}`}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
