import { Formik, Field, Form } from "formik";
import { Link } from "react-router-dom";
import * as yup from "yup";
import { useState, useEffect, useRef } from "react";
import Popup from "./Popup";
import Loading from "./Loading";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import EventIcon from "@mui/icons-material/Event";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

const signupSchema = yup.object().shape({
  firstName: yup
    .string()
    .matches(/^[A-Za-z\s]+$/, "Name cannot contain numbers")
    .required("First name is required"),
  lastName: yup
    .string()
    .matches(/^[A-Za-z\s]+$/, "Name cannot contain numbers")
    .required("Last name is required"),
  email: yup
    .string()
    .matches(
      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}(?:\.[A-Z]{2,})*$/i,
      "Invalid email format"
    )
    .trim()
    .required("Email is required")
    .test("unique-email", "Email already exists", async function (email) {
      if (!email) return false;
      try {
        const res = await fetch(
          `http://localhost:5000/api/check-email?email=${encodeURIComponent(
            email
          )}`
        );
        const data = await res.json();
        if (data.error) {
          return this.createError({
            message: "There was a server issue. Try again.",
          });
        }
        return !data.exists;
      } catch {
        return this.createError({ message: "Unable to connect. Try again." });
      }
    }),
  code: yup
    .number()
    .typeError("Verification code must be a number")
    .required("Verification code is required"),
  userName: yup
    .string()
    .required("Username is required")
    .test(
      "unique-username",
      "Username already exists",
      async function (userName) {
        if (!userName) return false;
        if (userName.trim() === "")
          return this.createError({ message: "Username cannot be empty" });
        try {
          const res = await fetch(
            `http://localhost:5000/api/check-username?userName=${encodeURIComponent(
              userName
            )}`
          );
          const data = await res.json();
          if (data.error) {
            return this.createError({
              message: data.error,
            });
          }
          return !data.exists;
        } catch {
          return this.createError({ message: "Unable to connect. Try again." });
        }
      }
    ),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .matches(
      /[!@#$%^&*()\-_=+{};:,<.>]/,
      "Password must contain at least one special character"
    ),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
});

function Signup() {
  const [popupMessage, setPopupMessage] = useState({
    success: "",
    message: "",
    type: "",
  });
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [resendTimer, setResendTimer] = useState(0);
  const [showResendButton, setShowResendButton] = useState(false);
  const timerRef = useRef(null);

  // Timer effect for resend code
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
    } else if (resendTimer === 0 && !canResend) {
      setCanResend(true);
      setShowResendButton(true);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [resendTimer, canResend]);

  // Start showing resend button after 10 seconds
  useEffect(() => {
    if (!canResend && resendTimer > 0) {
      const showResendTimer = setTimeout(() => {
        setShowResendButton(true);
      }, 10000); // Show after 10 seconds

      return () => clearTimeout(showResendTimer);
    }
  }, [canResend, resendTimer]);

  const startResendTimer = () => {
    setCanResend(false);
    setResendTimer(30); // 30 seconds timer
    setShowResendButton(false);
  };

  const sendDetails = async ({
    firstName,
    lastName,
    email,
    userName,
    password,
  }) => {
    if (!isEmailVerified) {
      setPopupMessage({
        success: false,
        message: "Please verify your email first",
      });
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          userName,
          password,
        }),
      });
      const data = await res.json();
      setIsCreating(false);
      setPopupMessage({
        success: data.success,
        message: data.message,
        type: "account_created",
      });

      setTimeout(() => {
        setPopupMessage({ success: "", message: "", type: "" });
      }, 4000);
    } catch (error) {
      setIsCreating(false);
      setPopupMessage({
        success: false,
        message: "Network error. Please try again.",
        type: "signup",
      });
    }
  };

  const sendVerificationCode = async (firstName, lastName, email) => {
    if (!firstName || !lastName || !email) {
      setPopupMessage({
        success: false,
        message: "Please fill in all required fields first",
      });
      return;
    }

    setSending(true);
    try {
      const res = await fetch("http://localhost:5000/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          type: "VERIFY_EMAIL",
        }),
      });

      const data = await res.json();

      setPopupMessage({
        success: data.success,
        message: data.message,
        type: data.type,
      });
      setSending(false);

      if (data.success) {
        setIsEmailVerified(false);
        startResendTimer();
      }
    } catch (error) {
      setSending(false);
      setPopupMessage({
        success: false,
        message: "Failed to send verification code. Please try again.",
        type: "verification",
      });
    }
  };

  const resendVerificationCode = async (firstName, lastName, email) => {
    if (!canResend) return;

    await sendVerificationCode(firstName, lastName, email);
  };

  const verifyCode = async (email, code) => {
    if (!email || !code) {
      setPopupMessage({
        success: false,
        message: "Please enter email and verification code",
      });
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, type: "VERIFY_EMAIL" }),
      });

      const data = await res.json();

      setPopupMessage({
        success: data.success,
        message: data.message,
        type: data.type,
      });

      if (data.success) {
        setIsEmailVerified(true);
        setCanResend(true);
        setResendTimer(0);
        setShowResendButton(false);
      }
    } catch (error) {
      setPopupMessage({
        success: false,
        message: "Failed to verify code. Please try again.",
        type: "verification",
      });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      {popupMessage.success !== "" && (
        <Popup
          message={popupMessage.message}
          success={popupMessage.success}
          type={popupMessage.type}
          onClose={() =>
            setPopupMessage({ success: "", message: "", type: "" })
          }
        />
      )}

      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <EventIcon className="text-indigo-600" sx={{ fontSize: 40 }} />
            <h1 className="text-3xl font-bold text-gray-800">EventHub</h1>
          </div>
          <h2 className="text-2xl font-semibold text-gray-700">
            Create Your Account
          </h2>
          <p className="text-gray-600 mt-2">Join our event community</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <Formik
            initialValues={{
              firstName: "",
              lastName: "",
              email: "",
              code: "",
              userName: "",
              password: "",
              confirmPassword: "",
            }}
            validationSchema={signupSchema}
            validateOnChange={false}
            validateOnBlur={true}
            onSubmit={async (values) => {
              await sendDetails(values);
            }}
          >
            {({ values, errors, touched, isSubmitting }) => (
              <Form className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <PersonIcon />
                      </div>
                      <Field
                        type="text"
                        name="firstName"
                        placeholder="Enter your first name"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                    {errors.firstName && touched.firstName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <PersonIcon />
                      </div>
                      <Field
                        type="text"
                        name="lastName"
                        placeholder="Enter your last name"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                    {errors.lastName && touched.lastName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <EmailIcon />
                    </div>
                    <Field
                      type="email"
                      name="email"
                      placeholder="Enter your email address"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                  {errors.email && touched.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Verification Section */}
                {values.email && !errors.email && (
                  <div className="space-y-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Verification Code
                        </label>
                        <div className="relative">
                          <Field
                            type="text"
                            name="code"
                            placeholder="Enter 6-digit code"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          />
                          {isEmailVerified && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                              ✓
                            </div>
                          )}
                        </div>
                        {errors.code && touched.code && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.code}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            sendVerificationCode(
                              values.firstName,
                              values.lastName,
                              values.email
                            )
                          }
                          disabled={
                            sending ||
                            !values.firstName ||
                            !values.lastName ||
                            isEmailVerified
                          }
                          className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition min-w-[120px]"
                        >
                          {sending ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Sending</span>
                            </div>
                          ) : (
                            "Get Code"
                          )}
                        </button>

                        {showResendButton && !isEmailVerified && (
                          <button
                            type="button"
                            onClick={() =>
                              resendVerificationCode(
                                values.firstName,
                                values.lastName,
                                values.email
                              )
                            }
                            disabled={!canResend}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                              canResend
                                ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                                : "bg-gray-100 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            {canResend
                              ? "Resend Code"
                              : `Resend in ${formatTime(resendTimer)}`}
                          </button>
                        )}

                        {resendTimer > 0 && !canResend && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <AccessTimeIcon fontSize="small" />
                            <span>
                              Resend available in {formatTime(resendTimer)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => verifyCode(values.email, values.code)}
                        disabled={!values.code || isEmailVerified}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        Verify Email
                      </button>
                    </div>
                  </div>
                )}

                {/* Username Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <PersonIcon />
                    </div>
                    <Field
                      type="text"
                      name="userName"
                      placeholder="Choose a username"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                  {errors.userName && touched.userName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.userName}
                    </p>
                  )}
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <LockIcon />
                      </div>
                      <Field
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Create a password"
                        className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
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

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <LockIcon />
                      </div>
                      <Field
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirm your password"
                        className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && touched.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !isEmailVerified}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-blue-700 focus:ring-4 focus:ring-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed transition duration-200"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating Account...
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </button>

                {/* Login Link */}
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-gray-600">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Log In
                    </Link>
                  </p>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>

      {isCreating && <Loading name="Creating Your Account" />}
    </div>
  );
}

export default Signup;
