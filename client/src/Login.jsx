import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import login_image from "./assets/login_image.png";
import * as yup from "yup";
import { Formik, Field, Form } from "formik";
import PersonIcon from "@mui/icons-material/Person";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CloseIcon from "@mui/icons-material/Close";
import Popup from "./Popup";
import { useAuth } from "./AuthContext";
import EventIcon from "@mui/icons-material/Event";

const loginSchema = yup.object().shape({
  identifier: yup.string().required("Username or Email is required"),

  password: yup.string().required("Password is required"),
});

function Login() {
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginPopup, setLoginPopup] = useState({
    success: "",
    message: "",
    type: "",
  });
  const [close, setClose] = useState(false);
  const { setAuthData } = useAuth();
  const navigate = useNavigate();

  const sendLoginDetails = async (values) => {
    try {
      setClose(false);
      setSubmitting(true);

      const { identifier, password } = values;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (data.success && data.accessToken) {
        setAuthData(data.accessToken, data.user);
        setLoginPopup({
          success: data.success,
          message: data.message,
          type: "login",
        });
        localStorage.setItem("token", data.accessToken);
        setTimeout(() => {
          navigate("/home");
        }, 2000);
      } else {
        setLoginPopup({
          success: data.success,
          message: data.message,
          type: "login",
        });
      }
    } catch (err) {
      setLoginPopup({
        success: false,
        message: "Network error. Please try again.",
        type: "login",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center">
        {/* Header for mobile */}
        <div className="lg:hidden mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <EventIcon className="text-purple-600" sx={{ fontSize: 40 }} />
            <h1 className="text-3xl font-bold text-gray-800">EventHub</h1>
          </div>
          <h2 className="text-2xl font-semibold text-gray-700">Welcome Back</h2>
          <p className="text-gray-600 mt-2">Login in to manage your events</p>
        </div>

        {/* Error Popup */}
        {loginPopup.success === false && !close && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 flex items-center justify-between z-50">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-red-700">{loginPopup.message}</p>
            </div>
            <button
              onClick={() => setClose(true)}
              className="text-red-500 hover:text-red-700"
            >
              <CloseIcon />
            </button>
          </div>
        )}

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md lg:max-w-2xl lg:w-1/2 p-6 lg:p-10">
          {/* Header for desktop */}
          <div className="hidden lg:block mb-8">
            <div className="flex items-center gap-3 mb-4">
              <EventIcon className="text-purple-600" sx={{ fontSize: 40 }} />
              <h1 className="text-3xl font-bold text-gray-800">EventHub</h1>
            </div>
            <h2 className="text-2xl font-semibold text-gray-700">
              Welcome Back
            </h2>
            <p className="text-gray-600 mt-2">Login in to manage your events</p>
          </div>

          <Formik
            initialValues={{ identifier: "", password: "" }}
            validationSchema={loginSchema}
            validateOnBlur={true}
            validateOnChange={false}
            onSubmit={async (values) => {
              await sendLoginDetails(values);
            }}
          >
            {({ values, errors, touched, isSubmitting }) => {
              return (
                <Form className="space-y-6">
                  {/* Email/Username Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Username or Email
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <PersonIcon />
                      </div>
                      <Field
                        type="text"
                        name="identifier"
                        placeholder="Enter your username or email"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                    {errors.identifier && touched.identifier && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.identifier}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <Link
                        to="/forgotPassword"
                        className="text-sm text-purple-600 hover:text-purple-800"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Field
                        type={showLoginPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter your password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showLoginPassword ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </button>
                    </div>
                    {errors.password && touched.password && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 focus:ring-4 focus:ring-purple-200 disabled:opacity-70 transition duration-200 flex items-center justify-center"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                        Logging In...
                      </>
                    ) : (
                      "Log In"
                    )}
                  </button>

                  {/* Sign Up Link */}
                  <div className="text-center pt-4 border-t border-gray-200">
                    <p className="text-gray-600">
                      Don't have an account?{" "}
                      <Link
                        to="/signup"
                        className="font-semibold text-purple-600 hover:text-purple-800"
                      >
                        Sign up here
                      </Link>
                    </p>
                  </div>
                </Form>
              );
            }}
          </Formik>
        </div>

        {/* Image Panel - Hidden on small screens */}
        <div className="hidden lg:flex lg:w-1/2 lg:pl-12 items-center justify-center">
          <div className="relative">
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-purple-100 rounded-full"></div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-100 rounded-full"></div>
            <div className="relative bg-white p-8 rounded-2xl shadow-lg">
              <img
                src={login_image}
                alt="Event management illustration"
                className="w-full max-w-md h-auto"
              />
              <div className="mt-8 text-center">
                <h3 className="text-xl font-bold text-gray-800">
                  Manage Events Seamlessly
                </h3>
                <p className="text-gray-600 mt-2">
                  Create, organize, and track all your events in one place
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Popup */}
      {loginPopup.success !== "" && loginPopup.success === true && (
        <Popup
          message={loginPopup.message}
          success={loginPopup.success}
          type={loginPopup.type}
          onClose={() => setLoginPopup({ message: "", success: "", type: "" })}
        />
      )}
    </div>
  );
}

export default Login;
