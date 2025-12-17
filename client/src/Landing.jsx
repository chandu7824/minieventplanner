import React, { useState } from "react";
import { Link } from "react-router-dom";
import EventIcon from "@mui/icons-material/Event";
import PeopleIcon from "@mui/icons-material/People";
import SecurityIcon from "@mui/icons-material/Security";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ImageIcon from "@mui/icons-material/Image";
import DashboardIcon from "@mui/icons-material/Dashboard";

const LandingPage = () => {
  const features = [
    {
      icon: <EventIcon />,
      title: "Create Events",
      description:
        "Easily create events with all details including location, date, capacity, and images.",
    },
    {
      icon: <PeopleIcon />,
      title: "Join & RSVP",
      description:
        "Join events you're interested in and manage your attendance with one click.",
    },
    {
      icon: <SecurityIcon />,
      title: "Personal Event Space",
      description:
        "Your own secure space to manage all your events and RSVPs with privacy protection.",
    },
    {
      icon: <CalendarTodayIcon />,
      title: "Your Event Dashboard",
      description:
        "Easily view, edit, and manage all events you've created in one organized place.",
    },
    {
      icon: <ImageIcon />,
      title: "Add Event Photos",
      description:
        "Upload images to make your events more attractive and engaging for attendees.",
    },
    {
      icon: <DashboardIcon />,
      title: "Track Your Events",
      description:
        "Keep track of events you're attending and those you're organizing in real-time.",
    },
  ];

  return (
    <div className={`min-h-screen bg-white`}>
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <EventIcon className="text-indigo-600 mr-2" fontSize="large" />
              <span className="text-2xl font-bold text-gray-900">EventHub</span>
            </div>
            <nav className="flex lg:space-x-8 md:space-x-8 sm:space-x-8 space-x-4">
              <Link
                to="/login"
                className="text-indigo-600 hover:text-indigo-800 font-medium !no-underline"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="text-indigo-600 hover:text-indigo-800 font-medium !no-underline"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Mini Event Platform
              <br />
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
              Bring people together by creating events or joining exciting
              gatherings in your community.
            </p>
            <div className="flex sm:flex-row justify-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center bg-indigo-600 text-white px-8 py-3 text-lg font-medium rounded-md hover:bg-indigo-700 !no-underline"
              >
                Start Creating Events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Platform Features
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 ml-4">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Manage Your Events?
            </h2>
            <p className="text-indigo-100 mb-8 max-w-2xl mx-auto">
              Join our platform for your event management needs
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center bg-white text-indigo-600 px-8 py-3 text-lg font-medium rounded-md hover:bg-gray-100 !no-underline"
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center bg-transparent text-white border-2 border-white px-8 py-3 text-lg font-medium rounded-md hover:bg-white/10 !no-underline"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center mb-4">
                <EventIcon className="text-white mr-2" fontSize="large" />
                <span className="text-2xl font-bold">EventHub</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Bring people together with our intuitive platform for organizing
                and attending events seamlessly.
              </p>
            </div>

            <div className="flex flex-col space-y-4">
              <div className="flex space-x-6">
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white font-medium !no-underline"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="text-gray-300 hover:text-white font-medium !no-underline"
                >
                  Sign Up
                </Link>
              </div>
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} EventHub. MERN Stack
                Implementation.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
