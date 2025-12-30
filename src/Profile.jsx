import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EventNoteIcon from "@mui/icons-material/EventNote"; // Added this import
import EditEventModal from "./EditEventModal";

function Profile() {
  const { user } = useAuth();
  const [userEvents, setUserEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchUserEvents();
  }, []);

  const fetchUserEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/events/my-events",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setUserEvents(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user events:", error);
      setLoading(false);
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowEditModal(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/events/${eventId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        fetchUserEvents(); // Refresh events
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                <PersonIcon className="text-indigo-600" sx={{ fontSize: 40 }} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {user?.userName || "User"}
                </h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center text-gray-600">
                    <EmailIcon className="mr-2" fontSize="small" />
                    <span>{user?.email || "No email"}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <CalendarTodayIcon className="mr-2" fontSize="small" />
                    <span>
                      Joined {formatDate(user?.createdAt || new Date())}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 md:mt-0">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">
                    {userEvents.length}
                  </div>
                  <div className="text-sm text-gray-600">Events Created</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {userEvents.reduce(
                      (total, event) => total + event.attendees.length,
                      0
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Total Attendees</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* My Events Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">My Events</h2>
          <div className="text-sm text-gray-600">
            {userEvents.length} event{userEvents.length !== 1 ? "s" : ""}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : userEvents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <EventNoteIcon
              className="mx-auto text-gray-400"
              sx={{ fontSize: 64 }}
            />{" "}
            {/* Fixed this line */}
            <h3 className="mt-4 text-xl font-medium text-gray-900">
              No events created yet
            </h3>
            <p className="mt-2 text-gray-600">
              Start creating events to see them here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userEvents.map((event) => (
              <div
                key={event._id}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                {/* Event Card Content */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {event.title}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditEvent(event)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                        title="Edit Event"
                      >
                        <EditIcon fontSize="small" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete Event"
                      >
                        <DeleteIcon fontSize="small" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4">{event.description}</p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Date:</span>
                      <span className="font-medium">
                        {formatDate(event.date)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Location:</span>
                      <span className="font-medium">{event.location}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Capacity:</span>
                      <span className="font-medium">
                        {event.attendees.length}/{event.capacity}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">Attendees:</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {event.attendees.slice(0, 3).map((attendee) => (
                        <div
                          key={attendee._id}
                          className="px-2 py-1 bg-gray-100 rounded text-sm"
                        >
                          {attendee.userName}
                        </div>
                      ))}
                      {event.attendees.length > 3 && (
                        <div className="px-2 py-1 bg-gray-100 rounded text-sm">
                          +{event.attendees.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Event Modal */}
      {showEditModal && editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => {
            setShowEditModal(false);
            setEditingEvent(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingEvent(null);
            fetchUserEvents();
          }}
        />
      )}
    </div>
  );
}

export default Profile;
