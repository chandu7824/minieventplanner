import { useState } from "react";
import { Formik, Form, Field } from "formik";
import * as yup from "yup";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

const eventSchema = yup.object().shape({
  title: yup
    .string()
    .required("Event title is required")
    .max(100, "Title too long"),
  description: yup
    .string()
    .required("Description is required")
    .min(20, "Description should be at least 20 characters")
    .max(500, "Description too long"),
  date: yup
    .date()
    .required("Date is required")
    .min(new Date(), "Date must be in the future"),
  time: yup.string().required("Time is required"),
  location: yup.string().required("Location is required"),
  category: yup.string().required("Category is required"),
  capacity: yup
    .number()
    .required("Capacity is required")
    .min(1, "Minimum capacity is 1")
    .max(1000, "Maximum capacity is 1000"),
  image: yup.mixed().nullable(),
});

function CreateEventModal({ onClose, onSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Test server connection function
  const testServerConnection = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/health");
      const data = await response.json();
      console.log("✅ Server health check:", data);
      alert(
        `✅ Server Status: ${data.status}\n✅ MongoDB: ${data.mongoStatus}`
      );
    } catch (error) {
      console.error("❌ Server connection test failed:", error);
      alert(
        `❌ Cannot connect to server: ${error.message}\n\nMake sure:\n1. Backend server is running (npm start in backend folder)\n2. Server is on http://localhost:5000`
      );
    }
  };

  const handleImageChange = (event, setFieldValue) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should be less than 5MB");
        return;
      }

      setFieldValue("image", file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    console.log("📝 Submitting event form with values:", {
      title: values.title,
      date: values.date,
      time: values.time,
      hasImage: !!values.image,
      capacity: values.capacity,
    });

    setSubmitting(true);
    setErrors({});

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      console.log("🔑 Token found, creating FormData...");

      const formData = new FormData();

      // Append all fields to FormData
      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("date", values.date);
      formData.append("time", values.time);
      formData.append("location", values.location);
      formData.append("category", values.category || "General");
      formData.append("capacity", values.capacity.toString());

      // Append image if exists
      if (values.image) {
        console.log("📸 Adding image to form data");
        formData.append("image", values.image);
      }

      // Debug: Log FormData contents
      for (let [key, value] of formData.entries()) {
        console.log(`📦 FormData: ${key} =`, value);
      }

      console.log("🚀 Sending request to /api/events...");

      const response = await fetch("http://localhost:5000/api/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // DO NOT set Content-Type for FormData - browser will set it automatically
        },
        body: formData,
      });

      console.log("📡 Response status:", response.status);
      console.log(
        "📡 Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      // Get response text first to see what's coming
      const responseText = await response.text();
      console.log("📡 Response body:", responseText);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || responseText;
        } catch {
          errorMessage = responseText || `Server error ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      // Parse successful response
      const data = JSON.parse(responseText);
      console.log("✅ Event created successfully:", data);

      // Show success message
      alert("🎉 Event created successfully!");

      // Call success callback
      onSuccess();
    } catch (error) {
      console.error("❌ Create event error:", error);
      console.error("❌ Error stack:", error.stack);

      let errorMessage =
        error.message || "Failed to create event. Please try again.";

      if (error.message.includes("Failed to fetch")) {
        errorMessage =
          "Cannot connect to server. Make sure backend is running on http://localhost:5000";
      } else if (
        error.message.includes("401") ||
        error.message.includes("403")
      ) {
        errorMessage = "Authentication failed. Please login again.";
      } else if (error.message.includes("400")) {
        errorMessage = `Invalid data: ${error.message}`;
      }

      setErrors({
        submit: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    "Technology",
    "Business",
    "Arts",
    "Sports",
    "Education",
    "Networking",
    "Social",
    "Other",
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Create New Event
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Fill in the details for your event
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Server Test Button */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                Having connection issues?
              </span>
              <button
                onClick={testServerConnection}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
              >
                Test Server Connection
              </button>
            </div>
          </div>

          <Formik
            initialValues={{
              title: "",
              description: "",
              date: "",
              time: "",
              location: "",
              category: "",
              capacity: 50,
              image: null,
            }}
            validationSchema={eventSchema}
            onSubmit={handleSubmit}
          >
            {({
              values,
              errors,
              touched,
              setFieldValue,
              isSubmitting,
              isValid,
            }) => (
              <Form className="space-y-6">
                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Event Image (Optional)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-500 transition">
                    <div className="space-y-1 text-center">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="mx-auto h-48 w-full object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setFieldValue("image", null);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          >
                            <CloseIcon fontSize="small" />
                          </button>
                        </div>
                      ) : (
                        <CloudUploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                      )}

                      <div className="flex text-sm text-gray-600 justify-center">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                          <span className="px-3 py-1">
                            {imagePreview ? "Change image" : "Upload an image"}
                          </span>
                          <input
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={(e) =>
                              handleImageChange(e, setFieldValue)
                            }
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG up to 5MB (Optional)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Title and Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Event Title *
                    </label>
                    <Field
                      type="text"
                      name="title"
                      placeholder="Enter event title"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {errors.title && touched.title && (
                      <p className="text-red-500 text-sm">{errors.title}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Category *
                    </label>
                    <Field
                      as="select"
                      name="category"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </Field>
                    {errors.category && touched.category && (
                      <p className="text-red-500 text-sm">{errors.category}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description *
                  </label>

                  <Field
                    as="textarea"
                    name="description"
                    rows={4}
                    placeholder="Describe your event..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-red-500">
                      {errors.description &&
                        touched.description &&
                        errors.description}
                    </span>
                    <span className="text-gray-500">
                      {values.description.length}/500
                    </span>
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Date *
                    </label>
                    <Field
                      type="date"
                      name="date"
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {errors.date && touched.date && (
                      <p className="text-red-500 text-sm">{errors.date}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Time *
                    </label>
                    <Field
                      type="time"
                      name="time"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {errors.time && touched.time && (
                      <p className="text-red-500 text-sm">{errors.time}</p>
                    )}
                  </div>
                </div>

                {/* Location and Capacity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Location *
                    </label>
                    <Field
                      type="text"
                      name="location"
                      placeholder="Enter event location"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {errors.location && touched.location && (
                      <p className="text-red-500 text-sm">{errors.location}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Capacity *
                    </label>
                    <Field
                      type="number"
                      name="capacity"
                      min="1"
                      max="1000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {errors.capacity && touched.capacity && (
                      <p className="text-red-500 text-sm">{errors.capacity}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Maximum number of attendees
                    </p>
                  </div>
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <div className="font-medium">Error creating event:</div>
                    <div className="text-sm mt-1">{errors.submit}</div>
                  </div>
                )}

                {/* Debug Info (only in development) */}
                {process.env.NODE_ENV === "development" && (
                  <div className="bg-gray-50 p-4 rounded-lg text-xs">
                    <div className="font-medium">Debug Info:</div>
                    <div>Date value: {values.date}</div>
                    <div>Time value: {values.time}</div>
                    <div>
                      Image: {values.image ? "Selected" : "Not selected"}
                    </div>
                    <div>Form valid: {isValid ? "Yes" : "No"}</div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      "Create Event"
                    )}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}

export default CreateEventModal;
