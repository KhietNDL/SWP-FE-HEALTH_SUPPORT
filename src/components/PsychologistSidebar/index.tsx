import { Calendar, Bell, LogOut } from "lucide-react";
import "./index.scss";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../redux/features/userSlice";

import logo from "../../images/Logo.png";
import WeeklySchedule from "../WeeklyCalendar";
import { RootState } from "../../redux/Store";
import Notification from "../AppointmentNoti";

const ConsultantSidebar = () => {
  const [activePage, setActivePage] = useState("Schedule");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const User = useSelector((state: RootState) => state.user);
  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <h2 className="sidebar-title">
          <img src={logo} width={80} alt="Logo" /> Consultant Portal
        </h2>
        <ul className="sidebar-menu">
          <li
            className={activePage === "Schedule" ? "active" : ""}
            onClick={() => setActivePage("Schedule")}
          >
            <Calendar /> <span>Schedule</span>
          </li>
          <li
            className={activePage === "Notifications" ? "active" : ""}
            onClick={() => setActivePage("Notifications")}
          >
            <Bell /> <span>Notifications</span>
          </li>
        </ul>

        {/* Consultant Info */}
        <div className="consultant-info">
          <img className="consultant-avatar" src={`http://localhost:5199${User?.imgUrl}`} alt="Avatar" />

          <div className="consultant-details">
            <strong>{User?.userName}</strong>
            <p>{User?.roleName}</p>
          </div>
        </div>

        <div className="logout" onClick={handleLogout}>
          <LogOut /> <span>Sign out</span>
        </div>
      </div>

      <div className="content">
        {activePage === "Schedule" && <WeeklySchedule />}
        {activePage === "Notifications" && <Notification />}
      </div>
    </div>
  );
};

export default ConsultantSidebar;
