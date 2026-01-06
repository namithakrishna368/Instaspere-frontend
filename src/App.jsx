import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
      </Routes>
    </BrowserRouter>
  );
}
