import React, { useEffect, useState, useCallback } from "react";
import io from "socket.io-client";
import "./Menu.css";
import ChatArea from "./ChatArea";
import ProfileCard from "./ProfileCard";
import axios from "axios";
import config from "../config";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import LogoutIcon from "@mui/icons-material/Logout";
import Profile from "./Profile";
import Switch from "@mui/material/Switch";
import UpdateUserData from "./UpdateUserData";
import ContactDetailsForm from "./ContactDetailsForm";

const socket = io(`${config.url}`); // Replace with your server URL

const Menu = () => {
  const [selectedContact, setSelectedContact] = useState(null);
  const [showContacts, setShowContacts] = useState(true);
  const [theme, setTheme] = useState("light");
  const [userData, setUserData] = useState({});
  const [showUpdate, setShowUpdate] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showDetailsForm, setShowDetailsForm] = useState(false);

  useEffect(() => {
    const storedUserData = localStorage.getItem("user");
    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData);
      setUserData(parsedUserData);
      socket.emit("identify", parsedUserData.username);
      socket.emit("newUser", parsedUserData.username);
    }
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
  }, []);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url;
      if (searchTerm) {
        url = `${config.url}/searchuser/${searchTerm}`;
      } else {
        url = `${config.url}/connections/${userData.username}`;
      }
      const response = await axios.get(url);
      if (response.data === "No User found") {
        setContacts([]);
        setError("No user found");
      } else {
        const fetchedContacts = response.data;
        const uniqueContacts = [
          ...new Map(
            fetchedContacts.map((contact) => [contact.username, contact])
          ).values(),
        ];
        const filteredContacts = uniqueContacts.filter(
          (contact) => contact.username !== userData.username
        );
        const sortedContacts = filteredContacts.sort(
          (a, b) => b.online - a.online
        );

        const cleanedContacts = sortedContacts.map(
          ({ password, ...rest }) => rest
        );

        setContacts(cleanedContacts);
        localStorage.setItem("contacts", JSON.stringify(cleanedContacts));
      }
    } catch (err) {
      setError("Error fetching contacts");
    }
    setLoading(false);
  }, [searchTerm, userData.username]);

  useEffect(() => {
    fetchContacts();
    const interval = setInterval(fetchContacts, 60000);
    return () => clearInterval(interval);
  }, [fetchContacts]);

  useEffect(() => {
    socket.on("activeUsers", (users) => {
      setContacts((prevContacts) =>
        [
          ...new Map(
            prevContacts.map((contact) => [contact.username, contact])
          ).values(),
        ]
          .map((contact) =>
            users.includes(contact.username)
              ? { ...contact, online: true }
              : { ...contact, online: false }
          )
          .sort((a, b) => b.online - a.online)
      );
    });

    return () => {
      socket.off("activeUsers");
    };
  }, []);

  const handleSelectContact = (contact) => {
    const filteredContact = {
      username: contact.username,
      profilename: contact.profilename,
      imagelink: contact.imagelink,
      online: contact.online,
      bio: contact.bio,
      email: contact.email,
      _id: contact._id,
    };
    setSelectedContact(filteredContact);
    setShowContacts(false);
    setShowProfile(false);
    setShowUpdate(false);
    setShowDetailsForm(false); // Ensure details form is hidden when selecting contact
  };

  const handleBackButtonClick = () => {
    setSelectedContact(null);
    setShowContacts(true);
    setShowProfile(false);
    setShowUpdate(false);
    setShowDetailsForm(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("isUserLoggedIn");
    localStorage.removeItem("user");
    localStorage.removeItem("selectedContact");
    localStorage.removeItem("contacts");
    socket.disconnect(); // Disconnect socket on logout
    window.location.reload();
  };

  const handleProfileClick = () => {
    setShowProfile(true);
    setShowUpdate(false);
    setSelectedContact(null);
    setShowDetailsForm(false);
  };

  const handleUpdateClick = () => {
    setShowUpdate(true);
    setShowProfile(false);
    setSelectedContact(null);
    setShowDetailsForm(false);
  };

  const handleContactNameClick = () => {
    setShowDetailsForm(true);
  };

  const isMobile = window.innerWidth <= 575.98;

  const handleThemeChange = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <div className={`menu-container ${theme}-theme`}>
      <div
        className="menu-left"
        style={{ display: isMobile && !showContacts ? "none" : "flex" }}
      >
        <div className="menu-header">
          <div className="menu-avatar">
            <img
              src={userData.imagelink || "https://via.placeholder.com/50"}
              alt="Avatar"
            />
          </div>
          <div className="menu-title">
            <h1>ChatApp</h1>
          </div>
          <Switch
            checked={theme === "dark"}
            onChange={handleThemeChange}
            color="default"
          />
        </div>
        <input
          type="text"
          className="search-bar"
          placeholder="Search contacts"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setContacts([]);
          }}
        />
        {loading && <p>Loading...</p>}
        {!loading && error && <p>{error}</p>}
        {!loading && !error && contacts.length === 0 && <p>No users found</p>}
        {!loading && !error && contacts.length > 0 && (
          <div className="contact-list">
            {contacts.map((contact) => (
              <ProfileCard
                key={contact._id}
                contact={contact}
                onSelect={() => handleSelectContact(contact)} // Update here
              />
            ))}
          </div>
        )}
        <div className="menu-footer">
          <div onClick={handleProfileClick} className="account-icon-container">
            <AccountCircleIcon className="account-icon" />
          </div>
          <div onClick={handleUpdateClick} className="account-icon-container">
            <ModeEditIcon className="account-icon" />
          </div>
          <div onClick={handleLogout} className="account-icon-container">
            <LogoutIcon className="account-icon" />
          </div>
        </div>
      </div>
      <div
        className="menu-right"
        style={{ display: isMobile && showContacts ? "none" : "flex" }}
      >
        <div className="menu-header-r">
          <button
            className={`back-button ${theme}-theme`}
            onClick={handleBackButtonClick}
          >
            <ArrowBackIcon />
          </button>
          {selectedContact && !showDetailsForm && (
            <div className="contact-details-top" onClick={handleContactNameClick}>
              <img
                src={
                  selectedContact.imagelink || "https://via.placeholder.com/50"
                }
                alt="Avatar"
                className={`contact-photo ${
                  selectedContact.online ? "online" : "offline"
                }`}
              />
              <div className="contact-details">
                <h2 className="contact-name">{selectedContact.profilename}</h2>
                <span
                  className={`contact-status ${
                    selectedContact.online ? "online" : "offline"
                  }`}
                >
                  {selectedContact.online ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          )}
        </div>
        {showUpdate ? (
          <UpdateUserData />
        ) : showProfile ? (
          <Profile theme={theme} />
        ) : showDetailsForm ? (
          <ContactDetailsForm contact={selectedContact} onClose={() => setShowDetailsForm(false)} />
        ) : (
          <ChatArea selectedContact={selectedContact} />
        )}
      </div>
    </div>
  );
};

export default Menu;
