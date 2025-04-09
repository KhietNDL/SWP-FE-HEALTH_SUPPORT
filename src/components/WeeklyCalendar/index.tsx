import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer, Event as BigCalendarEvent } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";


import axios from "axios";
import "./index.scss";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/Store";
import { Modal, Button, Form, Input, DatePicker, message } from "antd";
import { VideoCameraOutlined } from "@ant-design/icons";
const { TextArea } = Input;

// --- Interfaces ---
interface AccountInfo {
    fullname?: string;
    email?: string;
    phone?: string;
}

// Thêm type để phân biệt event
type EventType = 'appointment' | 'workingSlot';

interface BaseEventResource {
    id: number | string;
    type: EventType; // Thêm trường type
}

// Resource cho Appointment
interface AppointmentResource extends BaseEventResource {
    type: 'appointment';
    accountId: string;
    psychologistId: string;
    psychologist?: {
        urlMeet: string;
    };
    content: string;
    appointmentDate: string; // ISO string date
    status: "pending" | "approved" | "in progress" | "completed" | "expired";
    account?: AccountInfo;
}

// Resource cho Working Slot (đơn giản hơn)
interface WorkingSlotResource extends BaseEventResource {
    type: 'workingSlot';
    // Có thể thêm các trường khác nếu API trả về
}

// Calendar Event type union
type CalendarEventResource = AppointmentResource | WorkingSlotResource;

interface CalendarEvent extends BigCalendarEvent {
    resource: CalendarEventResource; // Resource có thể là Appointment hoặc WorkingSlot
}

// --- (Giữ nguyên MedicalRecordFormData) ---
interface MedicalRecordFormData {
    patientName: string;
    examDate: moment.Moment | null;
    diagnosis: string;
    reasonForVisit: string;
    treatmentSummary: string;
}

// --- (Giữ nguyên localizer) ---
const localizer = momentLocalizer(moment);

// --- API URL Constant ---
const API_BASE_URL = "http://localhost:5199"; // Base URL cho cả hai

const WeeklySchedule: React.FC = () => {
    const user = useSelector((state: RootState) => state.user);
    // State giờ dùng cho cả appointments và working slots
    const [scheduleEvents, setScheduleEvents] = useState<CalendarEvent[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [detailsModalIsOpen, setDetailsModalIsOpen] = useState(false);
    const [medicalRecordModalIsOpen, setMedicalRecordModalIsOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [medicalRecordForm] = Form.useForm<MedicalRecordFormData>();
    const [isSavingMedicalRecord, setIsSavingMedicalRecord] = useState(false);
    // State loading chung cho việc fetch dữ liệu ban đầu
    const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

    // --- Cập nhật useEffect để fetch cả hai loại dữ liệu ---
    useEffect(() => {
        if (user?.fullname) {
            const psychologistName = user.fullname;
            setIsLoadingSchedule(true); // Bắt đầu loading
            console.log(`Workspaceing data for psychologist: ${psychologistName}`);

            const appointmentsApiUrl = `${API_BASE_URL}/Appointment/by-name/${psychologistName}/Psychologist`;
            const workingSlotsApiUrl = `${API_BASE_URL}/SubscriptionProgress/start-dates?psychologistName=${encodeURIComponent(psychologistName)}`; // Mã hóa tên nếu có ký tự đặc biệt

             console.log("Appointments API URL:", appointmentsApiUrl);
             console.log("Working Slots API URL:", workingSlotsApiUrl);


            Promise.all([
                axios.get<{ data: AppointmentResource[] } | AppointmentResource[]>(appointmentsApiUrl), // API có thể trả về {data: [...]} hoặc [...]
                axios.get<string[]>(workingSlotsApiUrl) // API trả về mảng string date
            ])
            .then(([appointmentsResponse, workingSlotsResponse]) => {
                // --- Xử lý Appointments ---
                let rawAppointments: AppointmentResource[] = [];
                 // Kiểm tra cấu trúc trả về của API appointment
                if (appointmentsResponse.data && Array.isArray((appointmentsResponse.data as any).data)) {
                     rawAppointments = (appointmentsResponse.data as any).data;
                } else if (Array.isArray(appointmentsResponse.data)) {
                     rawAppointments = appointmentsResponse.data as AppointmentResource[];
                }
                console.log("Raw Appointments Data:", rawAppointments);

                const processedAppointments = rawAppointments
                    .filter(appt => appt.status !== "pending") // Vẫn lọc bỏ pending
                    .map((appt): CalendarEvent => ({
                        id: appt.id,
                        title: `${appt.account?.fullname || "Unknown"} (${appt.status})`, // Title gọn hơn
                        start: new Date(appt.appointmentDate),
                        end: moment(appt.appointmentDate).add(1, 'hour').toDate(), // Giả định cuộc hẹn 1 giờ
                        resource: { ...appt, type: 'appointment' } // Thêm type: 'appointment'
                    }));
                console.log("Processed Appointments:", processedAppointments);

                // --- Xử lý Working Slots ---
                const workingSlotsData = workingSlotsResponse.data || []; // Đảm bảo là mảng
                console.log("Raw Working Slots Data:", workingSlotsData);
                const processedWorkingSlots = workingSlotsData.map((startDateString, index): CalendarEvent => {
                    const start = new Date(startDateString);
                    // *** Giả định thời lượng làm việc là 1 giờ ***
                    // Nếu thời lượng khác, bạn cần điều chỉnh logic này
                    const end = moment(start).add(1, 'hour').toDate();
                    return {
                        id: `ws-${index}-${start.toISOString()}`, // Tạo ID duy nhất cho slot
                        title: "Working Slot", // Tiêu đề cho slot làm việc
                        start: start,
                        end: end,
                        resource: { id: `ws-${index}-${start.toISOString()}`, type: 'workingSlot' } // Resource đơn giản cho working slot
                    };
                });
                 console.log("Processed Working Slots:", processedWorkingSlots);


                // --- Kết hợp và cập nhật state ---
                setScheduleEvents([...processedAppointments, ...processedWorkingSlots]);
                console.log("Combined Schedule Events Set");

            })
            .catch(error => {
                console.error("Error fetching schedule data:", error);
                // Xử lý lỗi chi tiết hơn
                if (axios.isAxiosError(error)) {
                     console.error("Axios error details:", error.response?.data || error.message);
                     if (error.config?.url === appointmentsApiUrl) {
                         message.error("Failed to fetch appointments data.");
                     } else if (error.config?.url === workingSlotsApiUrl) {
                          message.error("Failed to fetch working slots data.");
                     } else {
                         message.error("Failed to fetch schedule data.");
                     }
                } else {
                     message.error("An unexpected error occurred while fetching schedule data.");
                }
                 setScheduleEvents([]); // Đặt lại thành mảng rỗng nếu lỗi
            })
            .finally(() => {
                setIsLoadingSchedule(false); // Kết thúc loading
            });

        } else {
            console.log("User fullname not available for fetching data.");
            setScheduleEvents([]); // Reset nếu không có user
        }
    }, [user?.fullname]); // Dependency là user.fullname

    // --- (Giữ nguyên useEffect update time) ---
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // --- Cập nhật handleSelectEvent để phân biệt loại event ---
    const handleSelectEvent = (event: CalendarEvent) => {
        console.log("Selected Event:", event);
        if (event.resource.type === 'workingSlot') {
            // Xử lý khi click vào working slot
            message.info(`Selected a working slot: ${moment(event.start).format('lll')} - ${moment(event.end).format('h:mm a')}`);
            // Không mở modal chi tiết cho working slot
            return;
        }

        // Xử lý khi click vào appointment (logic cũ)
        setSelectedEvent(event);
        setDetailsModalIsOpen(true);

        // Kiểm tra và cập nhật status thành 'in progress' nếu là appointment
        if (event.resource.type === 'appointment' && // Chỉ áp dụng cho appointment
            moment(event.start).isSameOrBefore(currentTime) &&
            event.resource.status === "approved"
           )
        {
             // Đảm bảo chỉ gọi update status cho appointment
             // Cần ép kiểu event.resource thành AppointmentResource để truy cập status
             const appointmentResource = event.resource as AppointmentResource;
            updateAppointmentStatus(appointmentResource, "in progress");
        }
    };

    // --- Cập nhật updateAppointmentStatus để xử lý state mới ---
    const updateAppointmentStatus = async (
        appointmentToUpdate: AppointmentResource,
        status: AppointmentResource['status']
    ) => {
         // Logic gửi API giữ nguyên
         const updatedAppointmentPayload = {
            accountId: appointmentToUpdate.accountId,
            psychologistId: appointmentToUpdate.psychologistId,
            content: appointmentToUpdate.content,
            appointmentDate: appointmentToUpdate.appointmentDate,
            status: status,
        };

        try {
            await axios.put(
                `${API_BASE_URL}/Appointment/${appointmentToUpdate.id}`,
                updatedAppointmentPayload
            );

            // Cập nhật state scheduleEvents
            const updatedEvents = scheduleEvents.map((event) => {
                // Chỉ cập nhật event tương ứng và phải là appointment
                if (event.resource.type === 'appointment' && event.resource.id === appointmentToUpdate.id) {
                    const updatedResource: AppointmentResource = {
                        ...(event.resource as AppointmentResource), // Ép kiểu để lấy các thuộc tính appointment
                        status: status
                    };
                    return {
                        ...event,
                        title: `${updatedResource.account?.fullname || "Unknown"} (${status})`, // Cập nhật title
                        resource: updatedResource
                    };
                }
                return event; // Giữ nguyên các event khác (working slots hoặc appointment khác)
            });
            setScheduleEvents(updatedEvents);

            // Cập nhật selectedEvent nếu nó đang được chọn
            if (selectedEvent && selectedEvent.resource.type === 'appointment' && selectedEvent.resource.id === appointmentToUpdate.id) {
                 setSelectedEvent(prev => prev ? {
                    ...prev,
                    title: `${(prev.resource as AppointmentResource).account?.fullname || "Unknown"} (${status})`,
                    resource: { ...(prev.resource as AppointmentResource), status }
                } : null);
            }
             // message.success(`Appointment status updated to ${status}`);

        } catch (error) {
            console.error("Error updating appointment status:", error);
            message.error("Failed to update appointment status.");
        }
    };

    // --- Cập nhật handleCancelAppointment để xử lý state mới ---
    const handleCancelAppointment = async () => {
         // Đảm bảo selectedEvent là appointment trước khi hủy
        if (!selectedEvent || selectedEvent.resource.type !== 'appointment' || !selectedEvent.resource.id) return;

        const confirmCancel = window.confirm("Are you sure you want to cancel this appointment?");
        if (!confirmCancel) return;

        try {
            await axios.delete(
                `${API_BASE_URL}/Appointment/${selectedEvent.resource.id}`
            );
            // Lọc bỏ event đã hủy khỏi state scheduleEvents
            setScheduleEvents(
                scheduleEvents.filter((event) => !(event.resource.type === 'appointment' && event.resource.id === selectedEvent.resource.id))
            );
            message.success("Appointment cancelled successfully.");
            handleCloseDetailsModal();
        } catch (error) {
            console.error("Error canceling appointment:", error);
            message.error("Failed to cancel appointment.");
        }
    };

     // --- Cập nhật handleCheckIn để đảm bảo event là appointment ---
     const handleCheckIn = async (status: "completed" | "expired") => {
        if (!selectedEvent || selectedEvent.resource.type !== 'appointment') return; // Chỉ check-in cho appointment
        // Ép kiểu resource thành AppointmentResource
        await updateAppointmentStatus(selectedEvent.resource as AppointmentResource, status);
    };


    // --- (Giữ nguyên handleCloseDetailsModal, handleOpenMedicalRecordModal, handleCloseMedicalRecordModal, handleSaveMedicalRecord ) ---
     const handleCloseDetailsModal = () => {
        setDetailsModalIsOpen(false);
        setSelectedEvent(null);
    };
     const handleOpenMedicalRecordModal = () => {
        // Đảm bảo selectedEvent là appointment đã hoàn thành
        if (!selectedEvent || selectedEvent.resource.type !== 'appointment' || selectedEvent.resource.status !== 'completed') {
            message.warn("Cannot create medical record for this event.");
            return;
        };
         const resource = selectedEvent.resource as AppointmentResource; // Ép kiểu
        medicalRecordForm.setFieldsValue({
            patientName: resource.account?.fullname || 'N/A',
            examDate: moment(selectedEvent.start),
            diagnosis: '',
            reasonForVisit: resource.content || '',
            treatmentSummary: '',
        });
        setMedicalRecordModalIsOpen(true);
    };
     const handleCloseMedicalRecordModal = () => {
        setMedicalRecordModalIsOpen(false);
    };
    const handleSaveMedicalRecord = async () => {
      // Đảm bảo selectedEvent là appointment
      if (!selectedEvent || selectedEvent.resource.type !== 'appointment') {
          message.error("Cannot save record. No valid appointment selected.");
          return;
      }
      const resource = selectedEvent.resource as AppointmentResource; // Ép kiểu

      if (!resource.accountId || !resource.psychologistId) {
           message.error("Missing Account ID or Psychologist ID.");
          return;
      }

      // --- Lấy ngày giờ cuộc hẹn từ selectedEvent ---
      const appointmentStartDate = selectedEvent.start;

      // Kiểm tra xem ngày giờ có hợp lệ không trước khi dùng toISOString
      if (!(appointmentStartDate instanceof Date) || isNaN(appointmentStartDate.getTime())) {
          message.error("Invalid appointment date found for the record.");
          return;
      }
      // --- Kết thúc phần lấy ngày giờ ---

      try {
          const values = await medicalRecordForm.validateFields();

          // --- Cập nhật payload để thêm appointmentDate ---
          const payload = {
              diagnosis: values.diagnosis,
              purpose: values.reasonForVisit, // Map từ form
              summary: values.treatmentSummary, // Map từ form
              appointmentDate: appointmentStartDate.toISOString(), // <<< THÊM DÒNG NÀY (chuyển Date thành ISO String)
              accountId: resource.accountId,
              psychologistId: resource.psychologistId,
          };
          // --- Kết thúc cập nhật payload ---

          console.log("Sending medical record payload:", payload); // Log payload để kiểm tra

          setIsSavingMedicalRecord(true);
          message.loading({ content: 'Saving medical record...', key: 'saving' });

          // Gọi API POST với payload đã cập nhật
          await axios.post(`${API_BASE_URL}/api/HealthData`, payload);

          message.success({ content: 'Medical record saved successfully!', key: 'saving', duration: 2 });
          handleCloseMedicalRecordModal();

      } catch (errorInfo) {
          console.error('Failed:', errorInfo);
           if (axios.isAxiosError(errorInfo)) {
               message.error({ content: `Error saving medical record: ${errorInfo.response?.data?.message || errorInfo.message}`, key: 'saving', duration: 3 });
           } else {
               message.error({ content: 'Please check the form fields.', key: 'saving', duration: 3 });
           }
      } finally {
          setIsSavingMedicalRecord(false);
      }
  };



    // --- Cập nhật eventPropGetter để style cho workingSlot ---
    const eventPropGetter = (event: CalendarEvent) => {
        // Style cho working slot
        if (event.resource.type === 'workingSlot') {
            return {
                style: {
                    backgroundColor: '#f0f8ff', // Màu AliceBlue nhạt
                    borderColor: '#add8e6', // LightBlue border
                    color: '#4682b4', // SteelBlue text
                    borderStyle: 'dashed', // Border đứt nét
                    opacity: 0.7, // Hơi trong suốt
                }
            };
        }

        // Style cho appointment (logic cũ dựa trên status)
        if (event.resource.type === 'appointment') {
            const resource = event.resource as AppointmentResource; // Ép kiểu
            let backgroundColor = "#9e9e9e"; // Default grey for "approved"
            switch (resource.status) {
                case "in progress": backgroundColor = "#2196f3"; break; // Blue
                case "expired": backgroundColor = "#f44336"; break; // Red
                case "completed": backgroundColor = "#4caf50"; break; // Green
                case "approved":
                default: backgroundColor = "#9e9e9e"; break; // Grey
            }
            return { style: { backgroundColor, borderColor: backgroundColor } };
        }

        // Fallback style (mặc định nếu không khớp type)
         return { style: { backgroundColor: 'gray' } };
    };


    return (
        <div className="weekly-schedule">
            {/* Có thể thêm chỉ báo loading */}
            {isLoadingSchedule && <p>Loading schedule...</p>}
            <h2>Weekly Schedule</h2>
             {/* Calendar component giờ sử dụng scheduleEvents */}
            <Calendar
                localizer={localizer}
                events={scheduleEvents} // <--- Sử dụng state mới
                startAccessor="start"
                endAccessor="end"
                titleAccessor="title" // Sử dụng title đã tạo
                defaultView="week"
                views={{ week: true, day: true, month: true }} // Thêm month view nếu muốn
                style={{ height: 800 }}
                min={moment().startOf('day').add(8, 'hours').toDate()}
                max={moment().startOf('day').add(18, 'hours').toDate()}
                scrollToTime={new Date()}
                eventPropGetter={eventPropGetter} // <--- Sử dụng getter đã cập nhật
                onSelectEvent={handleSelectEvent} // <--- Sử dụng handler đã cập nhật
                step={60}
                timeslots={1}
                selectable={false} // Tắt việc chọn slot trống nếu không cần
            />

            {/* Modal Chi tiết Cuộc hẹn (Chỉ hiển thị khi selectedEvent là appointment) */}
            <Modal
                open={detailsModalIsOpen && selectedEvent?.resource.type === 'appointment'}
                onCancel={handleCloseDetailsModal}
                footer={null}
                title="Appointment Details"
                className="weekly-modal-content"
            >
                {/* Đảm bảo selectedEvent tồn tại và là appointment */}
                {selectedEvent && selectedEvent.resource.type === 'appointment' ? (
                    // ---- BỎ CẤU TRÚC IIFE (() => { ... })() ----
                    // Render trực tiếp JSX
                    <div>
                        {/* Truy cập trực tiếp resource, TS sẽ hiểu kiểu dữ liệu */}
                        <p><strong>Name:</strong> {selectedEvent.resource.account?.fullname || "N/A"}</p>
                        <p><strong>Email:</strong> {selectedEvent.resource.account?.email || "N/A"}</p>
                        <p><strong>Phone:</strong> {selectedEvent.resource.account?.phone || "N/A"}</p>
                        <p><strong>Content:</strong> {selectedEvent.resource.content || "No details available"}</p>
                        {/* Sửa lại format ngày tháng moment */}
                        <p><strong>Date:</strong> {moment(selectedEvent.start).format("dddd, MMMM Do YYYY, h:mm a")}</p>
                        <p><strong>Status:</strong> <span className={`status-${selectedEvent.resource.status?.replace(' ', '-')}`}>{selectedEvent.resource.status}</span></p>

                        <div className="modal-actions">
                            {/* Logic nút điểm danh */}
                            {(selectedEvent.resource.status === 'approved' || selectedEvent.resource.status === 'in progress') && moment(selectedEvent.start).isSameOrBefore(currentTime) && (
                                <>
                                    <Button className="checkin-btn-present" onClick={() => handleCheckIn("completed")} type="primary">Điểm danh (Có mặt)</Button>
                                    <Button className="checkin-btn-absent" onClick={() => handleCheckIn("expired")} danger>Điểm danh (Vắng mặt)</Button>
                                </>
                            )}
                            {/* Logic nút hủy */}
                            {selectedEvent.resource.status === 'approved' && moment(selectedEvent.start).isAfter(currentTime) && (
                                <Button className="cancel-btn" onClick={handleCancelAppointment} danger>Cancel Appointment</Button>
                            )}
                            {/* Logic nút bệnh án */}
                            {selectedEvent.resource.status === 'completed' && (
                                <Button className="medical-record-btn" onClick={handleOpenMedicalRecordModal}>View/Edit Medical Record</Button>
                            )}

                            {/* NÚT JOIN MEET (Lấy từ Appointment Data) */}
                            {selectedEvent.resource.psychologist?.urlMeet && (selectedEvent.resource.status === 'approved' || selectedEvent.resource.status === 'in progress') && (
                                <Button
                                    type="primary"
                                    href={selectedEvent.resource.psychologist.urlMeet} // Truy cập trực tiếp
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    icon={<VideoCameraOutlined />}
                                    style={{ backgroundColor: '#008000', borderColor: '#008000' }}
                                >
                                    Join Meet
                                </Button>
                            )}
                        </div>
                    </div>
                    // ---- KẾT THÚC PHẦN JSX TRỰC TIẾP ----
                ) : (
                    // Phần fallback
                    <p>Loading appointment details...</p>
                )}
            </Modal>


            {/* --- (Giữ nguyên Modal Form Bệnh án) --- */}
             <Modal
                title="Medical Record"
                open={medicalRecordModalIsOpen}
                onCancel={handleCloseMedicalRecordModal}
                className="medical-record-modal"
                footer={[
                    <Button key="back" onClick={handleCloseMedicalRecordModal} disabled={isSavingMedicalRecord}>Cancel</Button>,
                    <Button key="submit" type="primary" loading={isSavingMedicalRecord} onClick={handleSaveMedicalRecord}>Save Record</Button>,
                ]}
            >
                 {selectedEvent && selectedEvent.resource.type === 'appointment' && ( // Chỉ render form nếu là appointment
                     <Form form={medicalRecordForm} layout="vertical" name="medical_record_form">
                        {/* Các Form.Item giữ nguyên */}
                         <Form.Item name="patientName" label="Patient Name" rules={[{ required: true }]}><Input disabled /></Form.Item>
                         <Form.Item name="examDate" label="Exam Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} disabled format="YYYY-MM-DD HH:mm" showTime/></Form.Item>
                         <Form.Item name="reasonForVisit" label="Reason for Visit (Purpose)" rules={[{ required: true }]}><TextArea rows={2} /></Form.Item>
                         <Form.Item name="diagnosis" label="Diagnosis" rules={[{ required: true }]}><TextArea rows={3} /></Form.Item>
                         <Form.Item name="treatmentSummary" label="Treatment Summary / Session Notes" rules={[{ required: true }]}><TextArea rows={5} /></Form.Item>
                    </Form>
                 )}
            </Modal>
        </div>
    );
};

export default WeeklySchedule;