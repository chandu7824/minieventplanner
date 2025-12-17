import { useState } from "react";
import { useAuth } from "./AuthContext";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonIcon from "@mui/icons-material/Person";

function EventCard({ event, onRSVP, currentUserId }) {
  const { user } = useAuth();
  const [isRSVPing, setIsRSVPing] = useState(false);
  const [error, setError] = useState("");

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isEventFull = event.attendees.length >= event.capacity;
  const isAlreadyRSVPed = event.attendees.some(
    (attendee) => attendee._id === currentUserId
  );
  const isCreator = event.createdBy._id === currentUserId;

  const handleRSVPClick = async () => {
    if (isAlreadyRSVPed || isEventFull || isCreator) return;

    setIsRSVPing(true);
    setError("");

    try {
      await onRSVP(event._id);
    } catch (err) {
      setError("Failed to RSVP. Please try again.");
    } finally {
      setIsRSVPing(false);
    }
  };

  const getRSVPButtonText = () => {
    if (isCreator) return "Your Event";
    if (isAlreadyRSVPed) return "Already Joined";
    if (isEventFull) return "Full";
    return "Join Event";
  };

  const getRSVPButtonClass = () => {
    if (isCreator || isAlreadyRSVPed || isEventFull) {
      return "bg-gray-300 text-gray-700 cursor-not-allowed";
    }
    return "bg-indigo-600 text-white hover:bg-indigo-700";
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Event Image */}
      <div className="h-48 bg-gray-200 relative overflow-hidden">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-blue-100">
            <EventIcon className="text-indigo-400" sx={{ fontSize: 80 }} />
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
            {event.category}
          </span>
        </div>

        {/* Capacity Indicator */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
          <div className="flex items-center space-x-1 text-sm">
            <PeopleIcon fontSize="small" />
            <span>
              {event.attendees.length}/{event.capacity}
            </span>
          </div>
        </div>
      </div>

      {/* Event Content */}
      <div className="p-5">
        {/* Title and Organizer */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
            {event.title}
          </h3>
          <div className="flex items-center text-gray-600 text-sm">
            <PersonIcon fontSize="small" className="mr-1" />
            <span>
              By {event.createdBy.userName || event.createdBy.firstName}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-6 line-clamp-3">{event.description}</p>

        {/* Event Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-gray-700">
            <CalendarMonthIcon
              className="text-indigo-500 mr-2"
              fontSize="small"
            />
            <span className="text-sm">{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <AccessTimeIcon className="text-indigo-500 mr-2" fontSize="small" />
            <span className="text-sm">{formatTime(event.time)}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <LocationOnIcon className="text-indigo-500 mr-2" fontSize="small" />
            <span className="text-sm line-clamp-1">{event.location}</span>
          </div>
        </div>

        {/* RSVP Button and Error */}
        <div>
          <button
            onClick={handleRSVPClick}
            disabled={isRSVPing || isAlreadyRSVPed || isEventFull || isCreator}
            className={`w-full py-2.5 rounded-lg font-medium transition-colors ${getRSVPButtonClass()} ${
              isRSVPing ? "opacity-75" : ""
            }`}
          >
            {isRSVPing ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </div>
            ) : (
              getRSVPButtonText()
            )}
          </button>

          {error && (
            <p className="mt-2 text-red-500 text-sm text-center">{error}</p>
          )}

          {/* Capacity Warning */}
          {isEventFull && !isCreator && (
            <p className="mt-2 text-red-500 text-sm text-center">
              This event has reached its capacity
            </p>
          )}
        </div>

        {/* Attendees Preview */}
        {event.attendees.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Attendees:</span>
              <span className="text-sm text-gray-700">
                {event.attendees.length} joined
              </span>
            </div>
            <div className="flex -space-x-2">
              {event.attendees.slice(0, 5).map((attendee) => (
                <div
                  key={attendee._id}
                  className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center"
                  title={attendee.userName || attendee.firstName}
                >
                  <span className="text-xs font-medium text-indigo-700">
                    {(attendee.userName || attendee.firstName)
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
              ))}
              {event.attendees.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700">
                    +{event.attendees.length - 5}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventCard;
