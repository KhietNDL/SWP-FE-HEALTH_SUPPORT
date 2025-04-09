import { Calendar, Bell, LogOut, School } from "lucide-react";
import "./index.scss";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../redux/features/userSlice";

import logo from "../../images/Logo.png";
import WeeklySchedule from "../WeeklyCalendar";
import { RootState } from "../../redux/Store";
import Notification from "../AppointmentNoti";
import ClassManagement from "../ClassManagement/ClassManagement";

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
          <li
            className={activePage === "ClassManagement" ? "active" : ""}
            onClick={() => setActivePage("ClassManagement")}>
            <School /> <span>Class Management</span>
            </li>
        </ul>

        {/* Consultant Info */}
        <div className="consultant-info">
          

          <div className="consultant-details">
            <strong>{User?.fullname}</strong>
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
        {activePage === "ClassManagement" && <ClassManagement />}
      </div>
    </div>
  );
};

export default ConsultantSidebar;
