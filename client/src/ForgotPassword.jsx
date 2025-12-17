import { useState, useEffect } from "react";
import { Formik, Field, Form } from "formik";
import * as yup from "yup";
import Popup from "./Popup";
import Loading from "./Loading";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const forgotPasswordSchema = yup.object().shape({
  email: yup
    .string()
    .matches(
      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}(?:\.[A-Z]{2,})*$/i,
      "Invalid Format"
    )
    .trim()
    .required("Email is required")
    .test(
      "Email Registration",
      "Email is not registered",
      async function (email) {
        if (!email) return false;
        try {
          const res = await fetch(
            `${
              import.meta.env.VITE_API_URL
            }/api/check-email?email=${encodeURIComponent(email)} `
          );
          const data = await res.json();
          if (data.error) {
            return this.createError({
              message: "There was a server issue. Try again.",
            });
          }
          return data.exists;
        } catch {
          return this.createError({ message: "Unable to connect. Try again." });
        }
      }
    ),
  code: yup
    .number()
    .typeError("Code must be number")
    .required("This field is required"),
  newPassword: yup
    .string()
    .required("Please Create a new password")
    .min(8, "Should contain atleast 8 characters")
    .matches(/[A-Z]/, "Must contain at least one uppercase letter")
    .matches(/[a-z]/, "Must contain at least one lowercase letter")
    .matches(/[0-9]/, "Must contain at least one number")
    .matches(/[!@#$%^&*()\-_=+{};:,<.>]/, "Must contain a special character"),
  confirmNewPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Password doesnot match")
    .required("Please confirm your password"),
});

function ForgotPassword() {
  const [sendingCode, setSendingCode] = useState(false);
  const [forgotPasswordPopup, setForgotPasswordPopup] = useState({
    success: "",
    message: "",
    type: "",
  });
  const [resendCodeAvailability, setResendCodeAvailability] = useState(false);
  const [resendCode, setResendCode] = useState(59);
  const [validating, setValidating] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!resendCodeAvailability) return;
    const timer = setInterval(() => {
      setResendCode((prev) => prev - 1);
    }, 1000);

    if (resendCode === 0) {
      setResendCodeAvailability(false);
      setResendCode(59);
      return;
    }

    return () => clearInterval(timer);
  }, [resendCode, resendCodeAvailability]);

  const sendCode = async (email) => {
    try {
      setSendingCode(true);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/verify-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, type: "FORGOT_PASSWORD" }),
        }
      );

      const data = await res.json();

      setForgotPasswordPopup({
        success: data.success,
        message: data.message,
        type: data.type,
      });

      if (data.success) {
        setResendCodeAvailability(true);
      }
    } catch {
      setForgotPasswordPopup({
        success: false,
        message: "Unable to send code. Try again.",
      });
    } finally {
      setSendingCode(false);
    }
  };

  const validateCode = async (email, code) => {
    setValidating(true);
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/verify-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, type: "FORGOT_PASSWORD" }),
    });

    const data = await res.json();

    if (data.success) setEmailVerified(true);

    if (data.message) {
      setValidating(false);
    }

    setForgotPasswordPopup({
      success: data.success,
      message: data.message,
      type: data.type,
    });

    setTimeout(() => {
      setForgotPasswordPopup({ success: "", message: "", type: "" });
    }, 4000);
  };

  const updatePassword = async ({ email, newPassword }) => {
    try {
      setUpdating(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/update-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, newPassword }),
        }
      );

      const data = await res.json();

      setForgotPasswordPopup({
        message: data.message,
        success: data.success,
        type: data.type,
      });

      setTimeout(() => {
        setForgotPasswordPopup({ message: "", success: "", type: "" });
      }, 4000);
    } catch {
      setForgotPasswordPopup({
        message: false,
        message: "Server is not responding... Please try again later.",
        type: "FORGOT_PASSWORD",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <div className="flex justify-center items-center h-auto py-16">
        {forgotPasswordPopup.success !== "" && (
          <Popup
            message={forgotPasswordPopup.message}
            success={forgotPasswordPopup.success}
            type={forgotPasswordPopup.type}
            onClose={() =>
              setForgotPasswordPopup({ message: "", success: "", type: "" })
            }
          />
        )}
        <div className="flex flex-col h-auto w-[600px] bg-white-500 shadow-2xl rounded-lg py-4">
          <div className="relative left-1/3">
            <p className="font-bold text-2xl">Forgot Password</p>
          </div>
          <div>
            <Formik
              initialValues={{
                email: "",
                code: "",
                newPassword: "",
                confirmNewPassword: "",
              }}
              validateOnBlur={true}
              validateOnChange={false}
              validationSchema={forgotPasswordSchema}
              onSubmit={async (values) => await updatePassword(values)}
            >
              {({ values, errors, touched, isSubmitting }) => (
                <Form>
                  <div className="px-16 py-4 flex flex-col">
                    <label className="font-bold py-2">
                      Enter your Registered Email
                    </label>
                    <Field
                      as="input"
                      name="email"
                      placeholder="Email"
                      className="border-2 border-lg h-[50px] rounded-lg px-6 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    ></Field>
                    <div className="py-2">
                      {errors.email && touched.email && (
                        <p className="text-red-500">{errors.email}</p>
                      )}
                      <button
                        className="btn w-full"
                        type="button"
                        disabled={sendingCode || resendCodeAvailability}
                        onClick={() => sendCode(values.email)}
                      >
                        {sendingCode ? "Sending...." : "Get Code"}
                      </button>
                      {resendCodeAvailability && (
                        <p className="text-green-500">
                          Request for another Code in 00:{resendCode}s
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="px-16 flex flex-col">
                    <label className="font-bold py-2">
                      Enter the Verificaiton Code
                    </label>
                    <Field
                      as="input"
                      name="code"
                      placeholder="Verification Code"
                      className="border-2 border-lg h-[50px] rounded-lg px-6 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.code && touched.code && (
                      <p className="text-red-500">{errors.code}</p>
                    )}
                    <div className="py-2">
                      <button
                        className="btn w-full"
                        type="button"
                        onClick={() => validateCode(values.email, values.code)}
                        disabled={validating}
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                  {emailVerified && (
                    <div>
                      <div className="flex flex-col px-16">
                        <label className="font-bold py-2">
                          Create a New Password
                        </label>
                        <div className="flex">
                          <Field
                            type={showNewPassword ? "text" : "password"}
                            name="newPassword"
                            placeholder="Enter your new password"
                            className="w-full border-2 border-lg h-[50px] rounded-lg px-6 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div
                            className="z-[50] absolute right-1/3 -translate-x-6 translate-y-3 cursor-pointer"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <VisibilityOffIcon />
                            ) : (
                              <VisibilityIcon />
                            )}
                          </div>
                        </div>
                        {errors.newPassword && touched.newPassword && (
                          <p className="text-red-500">{errors.newPassword}</p>
                        )}
                      </div>
                      <div className="flex flex-col px-16">
                        <label className="font-bold py-2">
                          Confirm Your New Password
                        </label>
                        <div className="flex">
                          <Field
                            type={showConfirmNewPassword ? "text" : "password"}
                            name="confirmNewPassword"
                            placeholder="Enter your Password Again"
                            className="w-full border-2 border-lg h-[50px] rounded-lg px-6 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div
                            className="z-[50] absolute right-1/3 -translate-x-6 translate-y-3 cursor-pointer"
                            onClick={() =>
                              setShowConfirmNewPassword(!showConfirmNewPassword)
                            }
                          >
                            {showConfirmNewPassword ? (
                              <VisibilityOffIcon />
                            ) : (
                              <VisibilityIcon />
                            )}
                          </div>
                        </div>
                        {errors.confirmNewPassword &&
                          touched.confirmNewPassword && (
                            <p className="text-red-500">
                              {errors.confirmNewPassword}
                            </p>
                          )}
                      </div>
                      <div className="px-16 py-6">
                        <button
                          type="submit"
                          className="btn w-full"
                          disabled={isSubmitting}
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  )}
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
      {updating && <Loading name="Updating your Password....." />}
    </>
  );
}

export default ForgotPassword;
