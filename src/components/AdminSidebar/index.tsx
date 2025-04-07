import { BookOpen, Users, ClipboardList, Calendar, LogOut, LineChart } from "lucide-react";
import "./index.scss";
import { useEffect, useState } from "react";
import SurveyTypeManagement from "../SurveyTypeManagement/SurveyTypeManagement";

import logo from "../../images/Logo.png";
import UserManagement from "../UserManagement";
import SubscriptionManagement from "../ProgramManagement";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../redux/features/userSlice";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/Store";
import AppointmentManagement from "../AppointmentManagement";
import LineChartManagementPage from "../../pages/LineChartmanage";
import ServicesBarChartPage from "../../pages/ServicesBarChart/ServicesBarChartPage";
const Sidebar = () => {
  const [activePage, setActivePage] = useState<string | null>(null);
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
          <img src={logo} width={80} alt="Logo" /> Admin Portal
        </h2>
        <ul className="sidebar-menu">
          <li
            className={activePage === "Programs" ? "active" : ""}
            onClick={() => setActivePage("Programs")}
          >
            <BookOpen /> <span>Programs</span>
          </li>
          <li
            className={activePage === "Users" ? "active" : ""}
            onClick={() => setActivePage("Users")}
          >
            <Users /> <span>Users</span>
          </li>
          <li
            className={activePage === "Surveys" ? "active" : ""}
            onClick={() => setActivePage("Surveys")}
          >
            <ClipboardList /> <span>Surveys</span>
          </li>
          <li
            className={activePage === "Appointments" ? "active" : ""}
            onClick={() => setActivePage("Appointments")}
          >
            <Calendar /> <span>Appointments</span>
          </li>
          <li
            className={activePage === "Charts" ? "active" : ""}
            onClick={() => setActivePage("Charts")}
          >
            <LineChart /> <span>Charts</span>
          </li>
        </ul>
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
        {activePage === "Surveys" && <SurveyTypeManagement />}
        {activePage === "Programs" && <SubscriptionManagement />}
        {activePage === "Users" && <UserManagement />}
        {activePage === "Appointments" && <AppointmentManagement />}
        {activePage === "Charts" && (
          <>
            <LineChartManagementPage />
            <ServicesBarChartPage />
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
