import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Popup({ message, success, type, onClose }) {
  const navigate = useNavigate();
  const [time, setTime] = useState(3);
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (
      (type === "account_created" || type === "UPDATED_PASSWORD") &&
      success
    ) {
      const timer = setInterval(() => {
        setTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setShow(false);
            if (onClose) onClose();
            if (type === "account_created") {
              navigate("/login");
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      // Auto-close for other popups after 3 seconds
      const timer = setTimeout(() => {
        setShow(false);
        if (onClose) onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [type, success, navigate, onClose]);

  if (!show) return null;

  return (
    <div
      className="popup h-[100px] w-[450px] flex items-center justify-center
                  fixed top-8 left-1/2 -translate-x-1/2 
                  rounded-lg bg-white shadow-lg z-[9999] border border-gray-200"
      style={{
        color: success ? "green" : "red",
        animation: "rise 0.3s ease forwards",
      }}
    >
      {success ? (
        <CheckCircleIcon className="text-5xl" />
      ) : (
        <CancelIcon className="text-5xl" />
      )}
      <div className="ml-3 text-xl font-semibold pt-[15px] flex flex-col">
        <span>{message}</span>
        {(type === "account_created" || type === "UPDATED_PASSWORD") &&
          success && (
            <span className="text-sm text-gray-600 mt-1">
              Redirecting in {time}s
            </span>
          )}
      </div>
    </div>
  );
}

export default Popup;
