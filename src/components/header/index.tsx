import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/features/userSlice";
import { RootState } from "../../redux/Store";
import { Button, Badge, Dropdown, Menu, Modal } from "antd";
import { UserOutlined, LogoutOutlined, BellOutlined, StockOutlined, FileTextOutlined, VideoCameraOutlined } from "@ant-design/icons";
// Giả sử bạn đã cài đặt date-fns: npm install date-fns
// Hoặc bạn có thể dùng cách tính bằng mili giây như trong ví dụ trước
import { differenceInHours, parseISO } from 'date-fns';
// Import toast để hiển thị thông báo
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Hàm formatDate nên được import hoặc định nghĩa ở đây nếu dùng date-fns
import { format } from 'date-fns'; // Ví dụ dùng format của date-fns
import { vi } from 'date-fns/locale'; // Import locale tiếng Việt nếu cần

const formatDateForDisplay = (dateString: string) => {
  if (!dateString) return "";
  try {
    // Giả sử dateString là ISO 8601 UTC
    const date = parseISO(dateString);
    return format(date, 'HH:mm dd/MM/yyyy', { locale: vi }); // Format giờ:phút ngày/tháng/năm
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Ngày không hợp lệ";
  }
};
// -------------------------------------------------------

// Import các slice khác nếu cần
// import { setOrder } from "../../redux/features/orderSlice";
import logo from "../../images/Logo.png";
import "./index.scss";
import { Appointment } from "../../types/Appointment";



function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [notifications, setNotifications] = useState<Appointment[]>([]); // Thêm kiểu dữ liệu
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null); // Thêm kiểu dữ liệu
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

  // Fetch notifications
  useEffect(() => {
    if (user?.id) { // Kiểm tra user và id tồn tại
      fetch(`http://localhost:5199/Appointment/${user.id}/Account`)

        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data: Appointment[]) => { // Thêm kiểu dữ liệu cho data
            // Lọc bỏ các lịch đã hủy hoặc trạng thái không muốn hiển thị ở đây nếu cần
            const activeAppointments = data.filter(app => app.status === 'pending' || app.status === 'approved');
            console.log("Fetched appointments:", activeAppointments); // Debug log
            setNotifications(activeAppointments);
        })
        .catch((err) => console.error("Error fetching appointments:", err));
    } else {
        setNotifications([]); // Reset nếu không có user
    }
  }, [user]); // Phụ thuộc vào user

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("token");
    // dispatch(setOrder(null)); // Đảm bảo setOrder được import nếu sử dụng
    navigate("/");
    toast.info("Đăng xuất thành công!");
  };

  // --- Hàm kiểm tra điều kiện hủy ---
  const checkCancellationEligibility = (appointment: Appointment | null): { canCancel: boolean; reason: string } => {
    if (!appointment) return { canCancel: false, reason: "Không có thông tin lịch hẹn." };

    const { status, appointmentDate } = appointment;
    const now = new Date();
    let appointmentDateTime: Date;

    try {
        // Parse chuỗi ISO từ API (thường là UTC)
        appointmentDateTime = parseISO(appointmentDate);
        if (isNaN(appointmentDateTime.getTime())) throw new Error("Invalid Date");
    } catch (error) {
        console.error("Invalid appointment date format:", appointmentDate, error);
        return { canCancel: false, reason: "Ngày hẹn không hợp lệ." };
    }

    // Điều kiện 1: Pending - Luôn được hủy
    if (status !== 'approved') {
      return { canCancel: true, reason: "" };
    }

    // Điều kiện 2: Approved - Chỉ được hủy trước 48 giờ
    if (status === 'approved') {
      // Tính số giờ chênh lệch
      const hoursDifference = differenceInHours(appointmentDateTime, now);

      if (hoursDifference > 24) {
        return { canCancel: true, reason: "" };
      } else {
        return { canCancel: false, reason: "Chỉ được hủy lịch đã duyệt trước 48 giờ." };
      }
    }

    // Các trạng thái khác (ví dụ: 'cancelled', 'completed') không được hủy
    return { canCancel: false, reason: `Không thể hủy lịch hẹn với trạng thái "${status}".` };
  };
  // --- Kết thúc hàm kiểm tra ---

  // Hàm xử lý hủy cuộc hẹn (đã cập nhật)
  const handleCancelAppointment = (appointment: Appointment | null) => { // Nhận cả object appointment
    if (!appointment) return;

    // Kiểm tra lại điều kiện trước khi hiển thị xác nhận
    const { canCancel, reason } = checkCancellationEligibility(appointment);

    if (!canCancel) {
      Modal.warning({
        title: "Không thể hủy lịch hẹn",
        content: reason || "Lịch hẹn này không đủ điều kiện để hủy.", // Hiển thị lý do
        okText: "Đã hiểu"
      });
      return; // Dừng lại nếu không thể hủy
    }

    // Nếu đủ điều kiện, hiển thị Modal xác nhận
    Modal.confirm({
      title: "Xác nhận hủy cuộc hẹn",
      content: "Bạn có chắc chắn muốn hủy cuộc hẹn này không?",
      okText: "Hủy cuộc hẹn",
      cancelText: "Không",
      okType: "danger",
      // Sử dụng async/await để xử lý fetch tốt hơn
      onOk: async () => {
        console.log(`Attempting to cancel appointment ID: ${appointment.id}`);
        try {
          const response = await fetch(`http://localhost:5199/Appointment/${appointment.id}`, {
              method: "DELETE",
              // Thêm headers nếu API yêu cầu (ví dụ: Authorization)
              // headers: {
              //   'Authorization': `Bearer ${localStorage.getItem('token')}`
              // }
          });

          if (response.ok) {
            toast.success("Hủy cuộc hẹn thành công!");
            // Cập nhật lại danh sách notifications trên UI
            setNotifications((prev) => prev.filter((app) => app.id !== appointment.id));
            setIsModalVisible(false); // Đóng modal chi tiết
          } else {
            // Cố gắng đọc lỗi từ backend
            let errorMsg = "Hủy cuộc hẹn thất bại.";
            try {
                const errorData = await response.json();
                // Kiểm tra xem BE có trả về message cụ thể không (ví dụ: lỗi do BE cũng check 48h)
                errorMsg = errorData.message || `Lỗi ${response.status}: ${response.statusText}`;
            } catch (e) {
                // Nếu response không phải JSON hoặc không có body
                errorMsg = `Lỗi ${response.status}: ${response.statusText}`;
            }
            console.error("Server error cancelling appointment:", errorMsg);
            toast.error(errorMsg); // Hiển thị lỗi cho người dùng
          }
        } catch (err) {
          console.error("Network or other error cancelling appointment:", err);
          toast.error("Đã xảy ra lỗi mạng hoặc lỗi không xác định. Vui lòng thử lại.");
        }
      },
    });
  };

  const showAppointmentDetails = (appointment: Appointment) => { // Thêm kiểu dữ liệu
    setSelectedAppointment(appointment);
    setIsModalVisible(true);
  };

  // Menu thông báo
  const notificationMenu = (
    <Menu>
      {notifications.length > 0 ? (
        notifications.map((appointment) => ( // Không cần index làm key nếu id là duy nhất
          <Menu.Item key={appointment.id} onClick={() => showAppointmentDetails(appointment)} style={{ whiteSpace: 'normal', lineHeight: '1.4' }}>
            <div>Lịch khám với <strong>{appointment.psychologist?.name || 'N/A'}</strong></div> {/* Kiểm tra psychologist tồn tại */}
            <div>{formatDateForDisplay(appointment.appointmentDate)}</div>
            <div style={{ textTransform: 'capitalize', color: appointment.status === 'approved' ? 'green' : 'orange' }}>
                ({appointment.status})
            </div>
            <Button
                                    type="primary"
                                    href={appointment.psychologist.urlMeet} // Truy cập trực tiếp
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    icon={<VideoCameraOutlined />}
                                    style={{  borderColor: '#000000' }}
                                >
                                    Join Meet
                                </Button>
          </Menu.Item>
        ))
      ) : (
        <Menu.Item disabled>Không có thông báo</Menu.Item>
      )}
    </Menu>
  );

  // Tính toán trạng thái của nút hủy trong Modal
  const cancellationCheckResult = checkCancellationEligibility(selectedAppointment);
  const canCancelAppointment = cancellationCheckResult.canCancel;
  const cancellationReason = cancellationCheckResult.reason;


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
          {/* Notification Dropdown */}
          <div className="notification-container">
            <Dropdown overlay={notificationMenu} trigger={["click"]}>
              <Badge count={notifications.length} size="small" offset={[5, 0]}>
                 {/* Tăng kích thước icon và thêm padding nếu cần */}
                <BellOutlined className="notification-icon" style={{ fontSize: '20px', cursor: 'pointer' }} />
              </Badge>
            </Dropdown>
          </div>

          {/* User Menu Dropdown */}
          <div className="user-menu">
            <div className="user-avatar">
              {/* Thêm ảnh mặc định nếu user.imgUrl không có */}
              <img src={user.imgUrl ? `http://localhost:5199${user.imgUrl}` : "/default-avatar.png"} alt="User Avatar" />
              <span className="user-name">{user.userName}</span>
            </div>
            <ul className="dropdown-content">
               {/* Sửa lại Link và thêm icon */}
              <li><Link to="/info-user"><UserOutlined /> Thông tin</Link></li>
              <li><Link to="/progress"><StockOutlined /> Lộ Trình</Link></li>
              <li><Link to="/user-survey-result-list"><FileTextOutlined /> Lịch Sử Khảo Sát</Link></li>
              <li><Link to="/user-survey-result-list"><FileTextOutlined /> Lịch Sử Khám bệnh</Link></li>
              {/* Nút Đăng xuất nên là button hoặc Menu.Item */}
              <li><button onClick={handleLogout} className="logout-button"><LogoutOutlined /> Đăng xuất</button></li>
            </ul>
          </div>

          {/* Modal Chi tiết cuộc hẹn */}
          <Modal
             title="Chi tiết cuộc hẹn"
             open={isModalVisible} // Sử dụng 'open' thay cho 'visible' ở antd v5+
             onCancel={() => setIsModalVisible(false)}
             footer={null} // Tự tạo footer với nút hủy
             className="appointment-modal"
             destroyOnClose // Reset state khi đóng
             centered
          >
            {selectedAppointment && (
              <div>
                {/* Kiểm tra null trước khi truy cập nested properties */}
                <p><strong>Chuyên gia:</strong> {selectedAppointment.psychologist?.name || 'N/A'}</p>
                <p><strong>Email:</strong> {selectedAppointment.psychologist?.email || 'N/A'}</p>
                <p><strong>SĐT:</strong> {selectedAppointment.psychologist?.phoneNumber || 'N/A'}</p>
                <p><strong>Thời gian hẹn:</strong> {formatDateForDisplay(selectedAppointment.appointmentDate)}</p>
                 <p><strong>Trạng thái:</strong> <span style={{ textTransform: 'capitalize', color: selectedAppointment.status === 'approved' ? 'green' : (selectedAppointment.status === 'pending' ? 'orange' : 'grey') }}>{selectedAppointment.status}</span></p>
                <p><strong>Nội dung ghi:</strong> {selectedAppointment.content || 'Không có'}</p>
                <hr style={{ margin: '15px 0' }} />
                <Button
                  type="danger"
                  onClick={() => handleCancelAppointment(selectedAppointment)} // Truyền cả object
                  disabled={!canCancelAppointment} // Vô hiệu hóa nút dựa trên kiểm tra
                  title={!canCancelAppointment ? cancellationReason : "Hủy cuộc hẹn này"} // Thêm tooltip giải thích
                  
                >
                  Hủy cuộc hẹn
                </Button>
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