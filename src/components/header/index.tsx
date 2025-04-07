import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/features/userSlice";
import { RootState } from "../../redux/Store";
import { Button, Badge, Dropdown, Menu, Modal } from "antd";
import { UserOutlined, LogoutOutlined, BellOutlined, StockOutlined, FileTextOutlined } from "@ant-design/icons";
import { formatDate } from "../moment.js";
import { setOrder } from "../../redux/features/orderSlice";
import logo from "../../images/Logo.png";
import "./index.scss";

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      fetch(`http://localhost:5199/Appointment/${user.id}/Account`)
        .then((res) => res.json())
        .then((data) => setNotifications(data))
        .catch((err) => console.error("Error fetching appointments:", err));
    }
  }, [user]);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("token");
    dispatch(setOrder(null));
    navigate("/");
  };

  const handleCancelAppointment = (appointmentID) => {
    Modal.confirm({
      title: "Xác nhận hủy cuộc hẹn",
      content: "Bạn có chắc chắn muốn hủy cuộc hẹn này không?",
      okText: "Hủy cuộc hẹn",
      cancelText: "Không",
      okType: "danger",
      onOk: () => {
        fetch(`http://localhost:5199/Appointment/${appointmentID}`, { method: "DELETE" })
          .then((res) => {
            if (res.ok) {
              setNotifications((prev) => prev.filter((appointment) => appointment.id !== appointmentID));
              setIsModalVisible(false);
            } else {
              console.error("Hủy cuộc hẹn thất bại");
            }
          })
          .catch((err) => console.error("Lỗi khi hủy cuộc hẹn:", err));
      },
    });
  };

  const showAppointmentDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setIsModalVisible(true);
  };

  const notificationMenu = {
    items: notifications.length > 0 
      ? notifications.map((appointment, index) => ({
          key: index,
          onClick: () => showAppointmentDetails(appointment),
          label: (
            <div>
              <h3>Lịch khám</h3>
              <strong>{appointment.psychologist.name}</strong> - {formatDate(appointment.appointmentDate)}
              <p> ({appointment.status})</p>
            </div>
          )
        }))
      : [{ key: 'empty', label: 'Không có thông báo' }]
  };

  return (
    <header className={`header ${isScrolled ? "fixed" : ""}`}>
      <div className="header__logo">
        <Link to="/">
          <img src={logo} width={80} alt="Logo" />
        </Link>
      </div>
      <nav className="header__nav">
        <ul>
          <li><Link to="/">Trang chủ</Link></li>
          <li><Link to="/dich-vu">Dịch vụ</Link></li>
          <li><Link to="/survey">Quiz</Link></li>
          <li><Link to="/booking">Đặt lịch</Link></li>
          <li className="dropdown">
            <span>Blog và tài liệu</span>
            <ul className="dropdown-content">
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/tai-lieu">Tài liệu</Link></li>
            </ul>
          </li>
        </ul>
      </nav>
      {user ? (
        <div className="header__right">
          <div className="notification-container">
          <Dropdown menu={notificationMenu} trigger={["click"]}>
            <Badge count={notifications.length} offset={[8, 0]}>
              <BellOutlined className="notification-icon" />
            </Badge>
          </Dropdown>
          </div>
          <div className="user-menu">
            <div className="user-avatar">
              <img src={`http://localhost:5199${user.imgUrl}`} alt="User Avatar" />
              <span className="user-name">{user.userName}</span>
            </div>
            <ul className="dropdown-content">
            <li><Link to ="/info-user"><UserOutlined/> Thông tin</Link></li>
            <li><Link to = "/progress"><StockOutlined/> Lộ Trình</Link></li>
            <li><Link to = "/user-survey-result-list"><FileTextOutlined/> Lịch Sử Khảo Sát</Link></li>
            <li><button onClick={handleLogout}><LogoutOutlined/> Đăng xuất</button></li>
          </ul>
          </div>
          <Modal title="Chi tiết cuộc hẹn" open={isModalVisible} onCancel={() => setIsModalVisible(false)} footer={null} className="appointment-modal">
            {selectedAppointment && (
              <div>
                <p><strong>Chuyên gia:</strong> {selectedAppointment.psychologist.name}</p>
                <p><strong>Email:</strong> {selectedAppointment.psychologist.email}</p>
                <p><strong>SĐT:</strong> {selectedAppointment.psychologist.phoneNumber}</p>
                <p><strong>Thời gian tạo:</strong> {formatDate(selectedAppointment.appointmentDate)}</p>
                <p><strong>Nội dung ghi:</strong> {selectedAppointment.content}</p>
                <Button type="danger" onClick={() => handleCancelAppointment(selectedAppointment.id)}>Hủy cuộc hẹn</Button>
              </div>
            )}
          </Modal>
          
        </div>
      ) : (
        <Link to="/login">
          <Button type="primary" className="login-button">Đăng nhập</Button>
        </Link>
      )}
    </header>
  );
}

export default Header;