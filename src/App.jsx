import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import { Homepage } from "./pages/Homepage.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import VerifyOtp from "./pages/VerifyOtp.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Profile from "./pages/Profile.jsx";
import PublicProfile from "./pages/PublicProfile.jsx";
import { NovelPage } from "./components/NovelPage.jsx";
import SuggestNovel from "./pages/SuggestNovel.jsx";
import MySubmissions from "./pages/MySubmissions.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

export default function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/novel/:novelId" element={<NovelPage />} />
          <Route path="/novel/:novelId/suggest-edit" element={<SuggestNovel mode="edit" />} />
          <Route path="/suggest" element={<SuggestNovel mode="new" />} />
          <Route path="/submissions" element={<MySubmissions />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* BUG 8 FIX: Added /profile route so Header navigation doesn't 404 */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:username" element={<PublicProfile />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
  );
}
