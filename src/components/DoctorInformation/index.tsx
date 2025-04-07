import "./index.scss";
import { useEffect, useState } from "react";
import axios from "axios";
import { Button, Modal } from "antd";
import { DoctorType } from "../../types/doctor";
import { useParams } from "react-router-dom";
// Thêm isToday để kiểm tra ngày hiện tại
import { format, addDays, startOfWeek, isToday, parse } from "date-fns";
import { vi } from "date-fns/locale"; // Import locale tiếng Việt
import { useSelector } from "react-redux";
import { RootState } from "../../redux/Store";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface DateInfo {
  fullDate: Date;
  displayDate: string;
  dayName: string;
  isPast: boolean;
}

function DoctorInfo() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [visibleDates, setVisibleDates] = useState<DateInfo[]>([]);
  const [doctor, setDoctor] = useState<DoctorType | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const { id } = useParams();
  const times = ["8:00 AM", "10:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"];
  const user = useSelector((state: RootState) => state.user);
  const navigate = useNavigate();
  const [bookingContent, setBookingContent] = useState("");

  useEffect(() => {
    const fetchDoctor = async () => {
      try { // Thêm try-catch để xử lý lỗi tốt hơn
        const response = await axios.get(
          `http://localhost:5199/api/Psychologist/${id}`
        );
        setDoctor(response.data);
        console.log("Doctor data:", response.data); // Log dữ liệu bác sĩ
      } catch (error) {
        console.error("Lỗi khi lấy thông tin bác sĩ:", error);
        // Có thể thêm thông báo lỗi cho người dùng ở đây
      }
    };

    fetchDoctor();
  }, [id]);

  const generateDates = (offset = 0) => {
    const todayStartDate = new Date();
    todayStartDate.setHours(0, 0, 0, 0); // Đặt về đầu ngày để so sánh isPast chính xác

    const startOfSelectedWeek = addDays(
      startOfWeek(todayStartDate, { weekStartsOn: 1 }), // Bắt đầu tuần từ Thứ Hai
      offset * 7
    );

    return Array.from({ length: 7 }).map((_, index) => {
      const date = addDays(startOfSelectedWeek, index);
      return {
        fullDate: date,
        displayDate: format(date, "dd/MM"),
        dayName: format(date, "EEEE", { locale: vi }),
        // So sánh ngày hiện tại (không tính giờ) với đầu ngày hôm nay
        isPast: date.getTime() < todayStartDate.getTime(),
      };
    });
  };

  useEffect(() => {
    setVisibleDates(generateDates(weekOffset));
  }, [weekOffset]);

  // Hàm helper để phân tích chuỗi giờ AM/PM thành giờ 24h
  const parseTimeString = (timeStr: string): { hours: number; minutes: number } | null => {
    try {
      // Sử dụng date-fns để parse cho chính xác, cần định dạng đầu vào rõ ràng
      // Ví dụ: "8:00 AM" -> parse("8:00 AM", "h:mm a", new Date())
      const parsedDate = parse(timeStr, "h:mm a", new Date());
      return {
        hours: parsedDate.getHours(),
        minutes: parsedDate.getMinutes(),
      };
    } catch (e) {
      console.error("Lỗi phân tích chuỗi giờ:", timeStr, e);
      // Xử lý thủ công nếu date-fns parse không thành công hoặc cho các định dạng khác
      const parts = timeStr.match(/(\d+):(\d+)\s*(AM|PM|SA|CH)?/i);
      if (!parts) return null;

      let hours = parseInt(parts[1], 10);
      const minutes = parseInt(parts[2], 10);
      const period = parts[3]?.toUpperCase();

      if (period === "PM" && hours < 12) {
        hours += 12;
      } else if (period === "AM" && hours === 12) {
        // 12 AM is midnight
        hours = 0;
      } else if (period === "CH" && hours < 12) { // Giả sử CH là chiều
         hours += 12;
      }
      // Xử lý các trường hợp khác nếu cần (ví dụ: SA - sáng)

      return { hours, minutes };
    }
  };


  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
        toast.warn("Vui lòng chọn ngày và giờ khám.");
        return;
    }

    const selectedDateObj = visibleDates.find((d) => d.displayDate === selectedDate);
    if (!selectedDateObj) {
        console.error("Không tìm thấy đối tượng ngày cho:", selectedDate);
        toast.error("Đã xảy ra lỗi khi xử lý ngày. Vui lòng thử lại.");
        return;
    }

    // Phân tích giờ đã chọn (giờ địa phương)
    const timeParts = parseTimeString(selectedTime);
    if (!timeParts) {
        console.error("Không thể phân tích giờ:", selectedTime);
        toast.error("Đã xảy ra lỗi khi xử lý giờ. Vui lòng thử lại.");
        return;
    }
    const { hours, minutes } = timeParts;

    // Tạo đối tượng Date cho lịch hẹn (giờ địa phương)
    const appointmentDate = new Date(selectedDateObj.fullDate);
    appointmentDate.setHours(hours, minutes, 0, 0);

    // Kiểm tra lại nếu giờ địa phương này đã qua trước khi gửi
    if (isToday(selectedDateObj.fullDate) && appointmentDate.getTime() < new Date().getTime()) {
         toast.warn("Khung giờ bạn chọn đã qua. Vui lòng chọn khung giờ khác.");
         return;
     }

    // Chuyển đổi sang chuỗi ISO 8601 UTC để gửi đi
    const appointmentDateISO = appointmentDate.toISOString();

    const appointmentObj = {
        accountId: user?.id,
        psychologistId: id,
        content: bookingContent || "Đặt lịch khám thông thường",
        appointmentDate: appointmentDateISO, // Gửi đi dạng UTC
        status: "pending",
    };

    try {
        console.log("Đang đặt lịch (UTC):", appointmentDateISO, appointmentObj); // Log giá trị UTC gửi đi
        const response = await axios.post(
            "http://localhost:5199/Appointment",
            appointmentObj
        );
        console.log("Đặt lịch thành công:", response.data);
        toast.success("Đặt lịch thành công!");
        setIsBookingOpen(false);
        setSelectedDate("");
        setSelectedTime("");
        setBookingContent("");
    } catch (error: any) {
        console.error("Lỗi khi đặt lịch:", error.response || error.message || error);
        const errorMsg = error.response?.data?.message || "Đặt lịch thất bại! Vui lòng thử lại.";
        toast.error(errorMsg);
    }
  };


  const handleBookingClick = () => {
    if (!user) {
      Modal.warning({
        title: "Yêu cầu đăng nhập",
        content: "Vui lòng đăng nhập để đặt lịch khám.",
        okText: "Đăng nhập ngay",
        onOk: () => navigate("/login"),
        maskClosable: true,
      });
    } else {
      // Reset lựa chọn cũ khi mở lại modal
      setSelectedDate("");
      setSelectedTime("");
      setBookingContent("");
      setWeekOffset(0); // Có thể reset về tuần hiện tại
      setVisibleDates(generateDates(0)); // Cập nhật lại ngày cho tuần hiện tại
      setIsBookingOpen(true);
    }
  };

  return (
    <>
      <div className="doctor-information">
        {/* ... Phần hiển thị thông tin bác sĩ ... */}
         <div className="doctor-profile">
           <div className="doctor-image">
             {/* Sử dụng imgUrl thay vì poster_path nếu DoctorType định nghĩa vậy */}
             <img src={`http://localhost:5199${doctor?.imgUrl}`} alt={doctor?.name || "Bác sĩ"} />
           </div>
           <h2 className="doctor-name">{doctor?.name || "Đang tải..."}</h2>
           <p className="doctor-position">{doctor?.specialization}</p>

           <div className="profile-section">
             <h3 className="section-title">LÝ LỊCH CÁ NHÂN</h3>
             <div className="info-item">
               <div className="label">Họ và tên:</div>
               <div className="value">{doctor?.name}</div>
             </div>
           </div>

           <div className="profile-section">
             <h3 className="section-title">THÀNH TÍCH</h3>
             <div className="info-item">
               {/* Kiểm tra null/undefined cho achievements */}
               <div className="value">{doctor?.achievements || "Chưa cập nhật"}</div>
             </div>
           </div>

           <div className="profile-section">
             <h3 className="section-title">THÔNG TIN LIÊN HỆ</h3>
             <div className="info-item">
               <div className="label">SĐT:</div>
               <div className="value">{doctor?.phoneNumber || "Chưa cập nhật"}</div>
             </div>
             <div className="info-item">
               <div className="label">Email:</div>
               <div className="value">{doctor?.email || "Chưa cập nhật"}</div>
             </div>
             <div className="info-item">
               <div className="label">Website:</div>
               {/* Website nên lấy từ dữ liệu nếu có */}
               <div className="value">www.braincare.vn</div>
             </div>
           </div>
         </div>

         <div className="doctor-details">
           <div className="section">
             <h3 className="section-title">KINH NGHIỆM LÀM VIỆC CÁ NHÂN</h3>
             <div className="content">
               {/* Kiểm tra null/undefined cho description */}
               <p>{doctor?.description || "Chưa cập nhật thông tin kinh nghiệm."}</p>
             </div>
           </div>

           <button className="book-button" onClick={handleBookingClick}>
             Đặt lịch
           </button>
         </div>
      </div>

      <Modal
        open={isBookingOpen}
        onCancel={() => setIsBookingOpen(false)}
        footer={null}
        width={650}
        className="booking-modal"
        destroyOnClose // Thêm dòng này để reset state bên trong Modal khi đóng
      >
        <div className="booking-form">
          <div className="doctor-info">
             {/* Sử dụng imgUrl hoặc một trường ảnh phù hợp từ doctor */}
             <img src={doctor?.imgUrl || "/placeholder-avatar.png"} alt={doctor?.name || "Bác sĩ"} />
             <div className="info">
                 <h2>{doctor?.name || "Bác sĩ"}</h2>
                 <p>{doctor?.specialization}</p>
             </div>
          </div>

          <div className="booking-dates">
            <h3>Chọn ngày khám</h3>
            <div className="date-navigation">
              <button
                onClick={() => setWeekOffset((prev) => Math.max(prev - 1, 0))}
                disabled={weekOffset === 0}
              >
                ← Trước
              </button>
              <button onClick={() => setWeekOffset((prev) => prev + 1)}>
                Sau →
              </button>
            </div>
            <div className="date-container">
              {visibleDates.map((dateInfo) => (
                <button
                  key={dateInfo.displayDate}
                  className={`date-button ${
                    selectedDate === dateInfo.displayDate ? "selected" : ""
                  }`}
                  // Vô hiệu hóa cả những ngày trong quá khứ
                  onClick={() => {
                      if (!dateInfo.isPast) {
                           setSelectedDate(dateInfo.displayDate);
                           setSelectedTime(""); // Reset giờ khi chọn ngày mới
                      }
                  }}
                  disabled={dateInfo.isPast} // Chỉ cần kiểm tra isPast ở đây
                  title={dateInfo.isPast ? "Ngày đã qua" : ""} // Thêm tooltip
                >
                  <div className="date-day">{dateInfo.dayName}</div>
                  <div className="date-number">{dateInfo.displayDate}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Chỉ hiển thị phần chọn giờ khi đã chọn ngày */}
          {selectedDate && (
              <div className="booking-times">
                <h3>Chọn giờ khám</h3>
                <div className="time-buttons">
                  {times.map((time) => {
                    // --- Logic kiểm tra và vô hiệu hóa giờ ---
                    let isTimeDisabled = false;
                    const now = new Date(); // Lấy giờ hiện tại mỗi lần render nút giờ

                    // Tìm đối tượng Date đầy đủ của ngày đã chọn
                    const currentSelectedDateObj = visibleDates.find(
                      (d) => d.displayDate === selectedDate
                    );

                    // Chỉ kiểm tra giờ nếu ngày được chọn là ngày hôm nay
                    if (currentSelectedDateObj && isToday(currentSelectedDateObj.fullDate)) {
                      // Phân tích chuỗi giờ của nút hiện tại (ví dụ: "15:00 PM")
                      const timeParts = parseTimeString(time);

                      if (timeParts) {
                         // Tạo đối tượng Date cho khung giờ này vào ngày đã chọn
                         const slotDateTime = new Date(currentSelectedDateObj.fullDate);
                         slotDateTime.setHours(timeParts.hours, timeParts.minutes, 0, 0);

                         // So sánh với thời gian hiện tại
                         if (slotDateTime.getTime() < now.getTime()) {
                             isTimeDisabled = true;
                         }
                      }
                    }
                    // --- Kết thúc logic kiểm tra giờ ---

                    return (
                      <button
                        key={time}
                        className={`time-button ${
                          selectedTime === time ? "selected" : ""
                        }`}
                        onClick={() => setSelectedTime(time)}
                        // Áp dụng trạng thái disabled
                        disabled={isTimeDisabled}
                        title={isTimeDisabled ? "Giờ đã qua" : ""} // Thêm tooltip
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>
           )}

            {/* Chỉ hiển thị phần yêu cầu và nút đặt lịch khi đã chọn ngày và giờ */}
            {selectedDate && selectedTime && (
                 <>
                    <div className="booking-note">
                        <h3>Yêu cầu khám (không bắt buộc)</h3>
                        <textarea
                            placeholder="Nhập yêu cầu hoặc triệu chứng..."
                            rows={3} // Giảm số dòng nếu cần
                            value={bookingContent}
                            onChange={(e) => setBookingContent(e.target.value)}
                        />
                    </div>

                    <Button
                        type="primary"
                        className="submit-button"
                        onClick={handleSubmit}
                        // Nút submit vẫn giữ disabled nếu chưa chọn ngày giờ
                        // disabled={!selectedDate || !selectedTime} // Không cần nữa vì đã kiểm tra ở trên
                    >
                        Xác nhận
                    </Button>
                 </>
            )}
        </div>
      </Modal>
    </>
  );
}

export default DoctorInfo;