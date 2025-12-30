import Landing from "./Landing";
import Login from "./Login";
import Signup from "./Signup";
import Home from "./Home";
import ForgotPassword from "./ForgotPassword";
import { Route, Routes, Link, useLocation } from "react-router-dom";
import "./App.css";
import ProtectedRoute from "./ProtectedRoute";
import NotFound from "./NotFound";
import Profile from "./Profile";

function App() {
  const location = useLocation();

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
