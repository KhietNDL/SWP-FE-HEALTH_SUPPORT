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
import { Appointment } from "../../types/Appointment";

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
  const [bookingContent, setBookingContent] = useState("");
  const [bookedAppointments, setBookedAppointments] = useState<Appointment[]>([]); // State lưu lịch hẹn đã đặt
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false); // State theo dõi trạng thái tải lịch hẹn

  const { id } = useParams<{ id: string }>(); // Lấy id bác sĩ từ URL
  const times = ["8:00 AM", "10:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"]; // Các khung giờ cố định
  const user = useSelector((state: RootState) => state.user);
  const navigate = useNavigate();

  // ----- Fetch thông tin bác sĩ -----
  useEffect(() => {
    const fetchDoctor = async () => {
      if (!id) return; // Không fetch nếu không có id
      try {
        const response = await axios.get<DoctorType>( // Specify DoctorType for response data
          `https://healthsupportwebapp-edf2hybhcah3e7hr.southeastasia-01.azurewebsites.net/api/Psychologist/${id}`
        );
        setDoctor(response.data);
        console.log("Doctor data:", response.data);
      } catch (error) {
        console.error("Lỗi khi lấy thông tin bác sĩ:", error);
        toast.error("Không thể tải thông tin bác sĩ.");
      }
    };

    fetchDoctor();
  }, [id]); // Chạy lại khi id thay đổi

  // ----- Tạo danh sách ngày hiển thị -----
  const generateDates = (offset = 0): DateInfo[] => {
    const todayStartDate = new Date();
    todayStartDate.setHours(0, 0, 0, 0);

    const startOfSelectedWeek = addDays(
      startOfWeek(todayStartDate, { weekStartsOn: 1 }),
      offset * 7
    );

    return Array.from({ length: 7 }).map((_, index) => {
      const date = addDays(startOfSelectedWeek, index);
      return {
        fullDate: date,
        displayDate: format(date, "dd/MM"),
        dayName: format(date, "EEEE", { locale: vi }),
        isPast: date.getTime() < todayStartDate.getTime(),
      };
    });
  };

  // Cập nhật ngày hiển thị khi weekOffset thay đổi
  useEffect(() => {
    setVisibleDates(generateDates(weekOffset));
  }, [weekOffset]);

  // ----- Hàm helper phân tích chuỗi giờ AM/PM -----
  const parseTimeString = (timeStr: string): { hours: number; minutes: number } | null => {
    try {
      // Ưu tiên dùng date-fns để parse chuẩn hơn
      const parsedDate = parse(timeStr, "h:mm a", new Date());
      if (!isNaN(parsedDate.getTime())) { // Kiểm tra parse thành công
          return {
            hours: parsedDate.getHours(),
            minutes: parsedDate.getMinutes(),
          };
      } else {
         throw new Error("date-fns parsing failed"); // Gây lỗi để chuyển sang parse thủ công
      }
    } catch (e) {
      // Xử lý thủ công nếu date-fns parse không thành công
      console.warn("Date-fns parse failed for:", timeStr, "Falling back to manual parsing.");
      const parts = timeStr.match(/(\d+):(\d+)\s*(AM|PM|SA|CH)?/i);
      if (!parts) return null;

      let hours = parseInt(parts[1], 10);
      const minutes = parseInt(parts[2], 10);
      const period = parts[3]?.toUpperCase();

      if (period === "PM" && hours < 12) {
        hours += 12;
      } else if (period === "AM" && hours === 12) { // 12 AM is midnight
        hours = 0;
      } else if (period === "CH" && hours < 12) { // Giả sử CH là chiều
         hours += 12;
      }
      // Thêm các trường hợp khác nếu cần

      return { hours, minutes };
    }
  };

  // ----- Fetch danh sách lịch hẹn đã đặt -----
  const fetchBookedAppointments = async (psychologistId: string) => {
    if (!psychologistId) return;
    setIsLoadingAppointments(true); // Bắt đầu tải
    console.log(`Workspaceing appointments for psychologist: ${psychologistId}`);
    try {
      const response = await axios.get<Appointment[]>(
        `https://healthsupportwebapp-edf2hybhcah3e7hr.southeastasia-01.azurewebsites.net/Appointment/${psychologistId}/Psychologist`
      );
      // Lọc chỉ lấy lịch hẹn 'pending' hoặc 'approved' và chưa bị xóa (nếu có isDelete)
      const validAppointments = response.data.filter(
        app => (app.status === 'approved') //&& !app.isDelete
      );
      console.log("Fetched valid appointments:", validAppointments);
      setBookedAppointments(validAppointments);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách lịch hẹn:", error);
      setBookedAppointments([]); // Reset nếu có lỗi
      
    } finally {
        setIsLoadingAppointments(false); // Kết thúc tải
    }
  };

  // ----- Xử lý khi nhấn nút Đặt lịch (mở Modal) -----
  const handleBookingClick = async () => {
    if (!user) {
      Modal.warning({
        title: "Yêu cầu đăng nhập",
        content: "Vui lòng đăng nhập để đặt lịch khám.",
        okText: "Đăng nhập ngay",
        onOk: () => navigate("/login"),
        maskClosable: true,
      });
    } else {
      // Reset state của modal trước khi mở
      setSelectedDate("");
      setSelectedTime("");
      setBookingContent("");
      setWeekOffset(0); // Reset về tuần hiện tại
      setVisibleDates(generateDates(0)); // Tải lại ngày cho tuần hiện tại
      setBookedAppointments([]); // Xóa lịch hẹn cũ trước khi fetch mới

      if (id) {
          // Fetch dữ liệu lịch hẹn mới nhất *trước khi* mở modal
          await fetchBookedAppointments(id);
      }
      setIsBookingOpen(true); // Mở modal sau khi đã có dữ liệu (hoặc lỗi)
    }
  };

  // ----- Xử lý khi nhấn nút Xác nhận (gửi yêu cầu đặt lịch) -----
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

    const timeParts = parseTimeString(selectedTime);
    if (!timeParts) {
        console.error("Không thể phân tích giờ:", selectedTime);
        toast.error("Đã xảy ra lỗi khi xử lý giờ. Vui lòng thử lại.");
        return;
    }
    const { hours, minutes } = timeParts;

    // Tạo đối tượng Date cho lịch hẹn (giờ địa phương của trình duyệt)
    const appointmentDateLocal = new Date(selectedDateObj.fullDate);
    appointmentDateLocal.setHours(hours, minutes, 0, 0);

    // Kiểm tra lại lần cuối xem giờ local này có bị quá khứ không
    if (isToday(selectedDateObj.fullDate) && appointmentDateLocal.getTime() < new Date().getTime()) {
         toast.warn("Khung giờ bạn chọn đã qua. Vui lòng chọn khung giờ khác.");
         return;
     }

    // Chuyển đổi sang chuỗi ISO 8601 UTC để gửi đi
    const appointmentDateISO_UTC = appointmentDateLocal.toISOString();

    const appointmentObj = {
        accountId: user?.id,
        psychologistId: id,
        content: bookingContent || "Đặt lịch khám thông thường",
        appointmentDate: appointmentDateISO_UTC, // Gửi đi dạng UTC
        status: "pending", // Trạng thái ban đầu khi đặt
    };

    try {
        console.log("Đang đặt lịch (gửi đi UTC):", appointmentDateISO_UTC, appointmentObj);
        const response = await axios.post(
            "https://healthsupportwebapp-edf2hybhcah3e7hr.southeastasia-01.azurewebsites.net/Appointment", // API endpoint để tạo appointment mới
            appointmentObj
        );
        console.log("Đặt lịch thành công:", response.data);
        toast.success("Đặt lịch thành công! Chờ xác nhận.");
        setIsBookingOpen(false); // Đóng modal sau khi thành công
        // Không cần reset state ở đây vì Modal có destroyOnClose
    } catch (error: any) {
        console.error("Lỗi khi đặt lịch:", error.response?.data || error.message || error);
        // Hiển thị thông báo lỗi cụ thể từ server nếu có
        const errorMsg = "Đặt lịch thất bại! khung giờ đã được đặt hoặc khung giờ phải trước 12 tiếng so với lịch đặt.";
        toast.error(errorMsg);
    }
  };

  // ----- Render Component -----
  return (
    <>
      {/* Phần hiển thị thông tin bác sĩ */}
      <div className="doctor-information">
        <div className="doctor-profile">
          <div className="doctor-image">
            {/* Sửa lại src nếu cần, đảm bảo URL đúng */}
            <img src={doctor?.imgUrl ? `https://healthsupportwebapp-edf2hybhcah3e7hr.southeastasia-01.azurewebsites.net${doctor.imgUrl}` : "/placeholder-avatar.png"} alt={doctor?.name || "Bác sĩ"} />
          </div>
          <h2 className="doctor-name">{doctor?.name || "Đang tải..."}</h2>
          <p className="doctor-position">{doctor?.specialization || "Chuyên khoa"}</p>

          <div className="profile-section">
             <h3 className="section-title">LÝ LỊCH CÁ NHÂN</h3>
             <div className="info-item">
               <div className="label">Họ và tên:</div>
               <div className="value">{doctor?.name || "Chưa cập nhật"}</div>
             </div>
          </div>

          <div className="profile-section">
             <h3 className="section-title">THÀNH TÍCH</h3>
             <div className="info-item">
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
               <div className="value">www.braincare.vn</div>
             </div>
           </div>
        </div>

        <div className="doctor-details">
           <div className="section">
             <h3 className="section-title">KINH NGHIỆM LÀM VIỆC CÁ NHÂN</h3>
             <div className="content">
               <p>{doctor?.description || "Chưa cập nhật thông tin kinh nghiệm."}</p>
             </div>
           </div>

           <button className="book-button" onClick={handleBookingClick}>
             Đặt lịch
           </button>
        </div>
      </div>

      {/* Modal Đặt lịch */}
      <Modal
        open={isBookingOpen}
        onCancel={() => setIsBookingOpen(false)}
        footer={null} // Tự tạo nút Xác nhận bên trong
        width={650}
        className="booking-modal"
        title="Đặt lịch khám" // Thêm tiêu đề cho Modal
        destroyOnClose // Quan trọng: Reset state bên trong Modal khi đóng
        centered // Hiển thị modal ở giữa màn hình
      >
        {/* Hiển thị loading khi đang tải lịch hẹn */}
        {isLoadingAppointments && <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải lịch hẹn...</div>}

        {/* Chỉ hiển thị form khi không còn loading */}
        {!isLoadingAppointments && (
             <div className="booking-form">
               <div className="doctor-info"> {/* Đổi tên class để tránh trùng */}
                  <img src={doctor?.imgUrl ? `https://healthsupportwebapp-edf2hybhcah3e7hr.southeastasia-01.azurewebsites.net${doctor.imgUrl}` : "/placeholder-avatar.png"} alt={doctor?.name || "Bác sĩ"} />
                  <div className="info">
                     <h2>{doctor?.name || "Bác sĩ"}</h2>
                     <p>{doctor?.specialization}</p>
                  </div>
               </div>

               {/* Chọn ngày */}
               <div className="booking-dates">
                 <h3>Chọn ngày khám</h3>
                 <div className="date-navigation">
                   <button
                     onClick={() => setWeekOffset((prev) => Math.max(prev - 1, 0))}
                     disabled={weekOffset === 0}
                   >
                     ← Trước
                   </button>
                   <span>{/* Có thể hiển thị tuần/tháng ở đây */}</span>
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
                       } ${dateInfo.isPast ? "disabled" : ""}`} // Thêm class disabled cho ngày quá khứ
                       onClick={() => {
                           if (!dateInfo.isPast) {
                                setSelectedDate(dateInfo.displayDate);
                                setSelectedTime(""); // Reset giờ khi chọn ngày mới
                           }
                       }}
                       disabled={dateInfo.isPast}
                       title={dateInfo.isPast ? "Ngày đã qua" : ""}
                     >
                       <div className="date-day">{dateInfo.dayName}</div>
                       <div className="date-number">{dateInfo.displayDate}</div>
                     </button>
                   ))}
                 </div>
               </div>

               {/* Chọn giờ (chỉ hiển thị khi đã chọn ngày) */}
               {selectedDate && (
                   <div className="booking-times">
                     <h3>Chọn giờ khám</h3>
                     <div className="time-buttons">
                       {times.map((time) => {
                         // --- Logic kiểm tra và vô hiệu hóa giờ ---
                         let isTimeInPast = false;
                         let isTimeBooked = false;
                         const now = new Date();
                         const currentSelectedDateObj = visibleDates.find(
                           (d) => d.displayDate === selectedDate
                         );

                         let slotDateTimeLocal: Date | null = null;
                         let timeParts = null;

                         if (currentSelectedDateObj) {
                            timeParts = parseTimeString(time);
                            if (timeParts) {
                                slotDateTimeLocal = new Date(currentSelectedDateObj.fullDate);
                                slotDateTimeLocal.setHours(timeParts.hours, timeParts.minutes, 0, 0);

                                // 1. Kiểm tra giờ trong quá khứ (chỉ áp dụng cho ngày hôm nay)
                                if (isToday(currentSelectedDateObj.fullDate) && slotDateTimeLocal.getTime() < now.getTime()) {
                                   isTimeInPast = true;
                                }

                                // 2. Kiểm tra giờ đã được đặt (chỉ kiểm tra nếu giờ chưa qua)
                                if (!isTimeInPast) {
                                   const slotTimeUTCMillis = slotDateTimeLocal.getTime(); // Lấy UTC timestamp
                                   for (const appointment of bookedAppointments) {
                                      // Parse ngày giờ UTC từ API
                                      const bookedDateTime = new Date(appointment.appointmentDate);
                                      const bookedTimeUTCMillis = bookedDateTime.getTime(); // Lấy UTC timestamp

                                      // So sánh timestamp
                                      if (slotTimeUTCMillis === bookedTimeUTCMillis) {
                                         console.log(`Slot ${time} on ${selectedDate} is booked.`);
                                         isTimeBooked = true;
                                         break;
                                      }
                                   }
                                }
                            } else {
                                console.warn("Could not parse time string:", time); // Cảnh báo nếu không parse được giờ
                            }
                         }

                         const isDisabled = isTimeInPast || isTimeBooked;
                         let title = "";
                         if (isTimeInPast) title = "Giờ đã qua";
                         else if (isTimeBooked) title = "Giờ đã có người đặt";
                         // --- Kết thúc logic kiểm tra giờ ---

                         return (
                           <button
                             key={time}
                             className={`time-button ${
                               selectedTime === time ? "selected" : ""
                             } ${isDisabled ? "disabled" : ""}`} // Thêm class disabled
                             onClick={() => {
                                 if (!isDisabled) {
                                     setSelectedTime(time);
                                 }
                             }}
                             disabled={isDisabled}
                             title={title}
                           >
                             {time}
                           </button>
                         );
                       })}
                     </div>
                   </div>
                )}

                 {/* Phần yêu cầu và nút xác nhận (chỉ hiển thị khi đã chọn ngày và giờ hợp lệ) */}
                 {selectedDate && selectedTime && (
                      <>
                         <div className="booking-note">
                             <h3>Yêu cầu khám (không bắt buộc)</h3>
                             <textarea
                                 placeholder="Nhập yêu cầu hoặc triệu chứng..."
                                 rows={3}
                                 value={bookingContent}
                                 onChange={(e) => setBookingContent(e.target.value)}
                             />
                         </div>

                         <Button
                             type="primary"
                             className="submit-button"
                             onClick={handleSubmit}
                             // Không cần disable ở đây nữa vì đã kiểm tra selectedDate/Time và logic trong map
                             // disabled={!selectedDate || !selectedTime} // Có thể bỏ dòng này
                             style={{ width: '100%', marginTop: '15px' }} // Style cho nút
                         >
                             Xác nhận Đặt lịch
                         </Button>
                      </>
                 )}
             </div>
        )} {/* Kết thúc điều kiện !isLoadingAppointments */}
      </Modal>
    </>
  );
}

export default DoctorInfo;