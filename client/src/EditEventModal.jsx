import { useState } from "react";
import { Formik, Form, Field } from "formik";
import * as yup from "yup";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";

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
  date: yup.date().required("Date is required"),
  time: yup.string().required("Time is required"),
  location: yup.string().required("Location is required"),
  category: yup.string().required("Category is required"),
  capacity: yup
    .number()
    .required("Capacity is required")
    .min(1, "Minimum capacity is 1")
    .max(1000, "Maximum capacity is 1000")
    .test(
      "capacity-check",
      "Capacity cannot be less than current attendees",
      function (value) {
        const { attendees } = this.parent;
        return value >= attendees.length;
      }
    ),
  image: yup.mixed().nullable(),
});

function EditEventModal({ event, onClose, onSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(event.imageUrl);

  const handleImageChange = (e, setFieldValue) => {
    const file = e.target.files[0];
    if (file) {
      setFieldValue("image", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (setFieldValue) => {
    setFieldValue("image", null);
    setImagePreview(null);
  };

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    setSubmitting(true);
    setErrors({});

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      const formData = new FormData();

      // Append updated fields
      Object.keys(values).forEach((key) => {
        if (key === "image" && values[key]) {
          formData.append("image", values[key]);
        } else if (key === "date") {
          // values.date is already a string like "2024-01-15"
          formData.append(key, values[key]);
        } else if (
          key !== "_id" &&
          key !== "createdBy" &&
          key !== "attendees" &&
          values[key] !== undefined &&
          values[key] !== null
        ) {
          formData.append(key, values[key]);
        }
      });

      // Debug: Log FormData contents
      console.log("📤 Sending update with FormData:");
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/events/${event._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      // Get response text first
      const responseText = await response.text();
      console.log("📡 Update response:", response.status, responseText);

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
      console.log("✅ Event updated successfully:", data);

      alert("✅ Event updated successfully!");
      onSuccess();
    } catch (error) {
      console.error("❌ Update event error:", error);
      console.error("❌ Error stack:", error.stack);

      let errorMessage =
        error.message || "Failed to update event. Please try again.";

      if (error.message.includes("Failed to fetch")) {
        errorMessage =
          "Cannot connect to server. Make sure backend is running on ${import.meta.env.VITE_API_URL}";
      } else if (
        error.message.includes("401") ||
        error.message.includes("403")
      ) {
        errorMessage = "Authentication failed. Please login again.";
      } else if (error.message.includes("400")) {
        errorMessage = `Invalid data: ${error.message}`;
      }

      setErrors({ submit: errorMessage });
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

  const formatDateForInput = (dateString) => {
    return new Date(dateString).toISOString().split("T")[0];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Event</h2>
            <p className="text-gray-600 text-sm mt-1">
              Update your event details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="p-6">
          <Formik
            initialValues={{
              _id: event._id,
              title: event.title,
              description: event.description,
              date: formatDateForInput(event.date),
              time: event.time,
              location: event.location,
              category: event.category,
              capacity: event.capacity,
              image: null,
              createdBy: event.createdBy,
              attendees: event.attendees,
            }}
            validationSchema={eventSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, setFieldValue, isSubmitting }) => (
              <Form className="space-y-6">
                {/* Image Section */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Event Image
                  </label>
                  <div className="relative">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Event"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <div className="absolute top-2 right-2 flex space-x-2">
                          <label className="cursor-pointer bg-white/90 backdrop-blur-sm p-2 rounded-lg hover:bg-white transition">
                            <CloudUploadIcon className="text-indigo-600" />
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={(e) =>
                                handleImageChange(e, setFieldValue)
                              }
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(setFieldValue)}
                            className="bg-white/90 backdrop-blur-sm p-2 rounded-lg hover:bg-white transition"
                          >
                            <DeleteIcon className="text-red-600" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition">
                        <CloudUploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                            Upload Image
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
                      </div>
                    )}
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

                {/* Date, Time, Location, Capacity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Date *
                    </label>
                    <Field
                      type="date"
                      name="date"
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

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Location *
                    </label>
                    <Field
                      type="text"
                      name="location"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {errors.location && touched.location && (
                      <p className="text-red-500 text-sm">{errors.location}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Capacity *
                      <span className="ml-2 text-sm text-gray-500">
                        ({values.attendees.length} currently joined)
                      </span>
                    </label>
                    <Field
                      type="number"
                      name="capacity"
                      min={values.attendees.length}
                      max="1000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {errors.capacity && touched.capacity && (
                      <p className="text-red-500 text-sm">{errors.capacity}</p>
                    )}
                  </div>
                </div>

                {/* Attendees Info */}
                {values.attendees.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">
                      Current Attendees ({values.attendees.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {values.attendees.map((attendee) => (
                        <div
                          key={attendee._id}
                          className="bg-white px-3 py-1.5 rounded-full text-sm border border-gray-200"
                        >
                          {attendee.userName || attendee.firstName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {errors.submit}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}

export default EditEventModal;
