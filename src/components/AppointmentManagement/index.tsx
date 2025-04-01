import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  Pencil,
  Trash2,
  Calendar as CalendarIcon, // Renamed to avoid conflict with Calendar component if any
  User as UserIcon,
  Briefcase, // Example icon for Psychologist
  FileText, // Example icon for Content
  CheckCircle, // Example icon for Status
} from "lucide-react";
import axios from "axios"; // Using axios for consistency
import "./index.scss"; // Assuming you'll create this SCSS file

// Assuming User type is defined elsewhere, e.g., ../../types/user
import { User } from "../../types/user"; // Adjust path as necessary

// Provided Appointment interface
import { Appointment } from "../../types/Appointment"; // Adjust path as necessary

// --- Component Starts ---
const AppointmentManagement: React.FC = () => {
  // State for appointments list
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // State for users (accounts) and psychologists for dropdowns
  const [users, setUsers] = useState<User[]>([]);
  const [psychologists, setPsychologists] = useState<User[]>([]); // Assuming psychologists are also Users

  // UI State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state

  // State for the appointment being added/edited in the modal
  const [currentAppointment, setCurrentAppointment] = useState<{
    accountId: string;
    psychologistId: string;
    content: string;
    appointmentDate: string; // Store as YYYY-MM-DDTHH:mm for input, convert before sending
    status: Appointment["status"];
  }>({
    accountId: "",
    psychologistId: "",
    content: "",
    appointmentDate: "", // Initialize as empty or a default date string
    status: "pending", // Default status
  });

  // --- API Base URL ---
  const API_URL = "http://localhost:5199"; // Centralize API base URL

  // --- Fetch Initial Data ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch appointments
        const appointmentsResponse = await axios.get<Appointment[]>(
          `${API_URL}/Appointment`
        );
        const sortedAppointments = appointmentsResponse.data.sort(
          (a, b) =>
            new Date(b.appointmentDate).getTime() -
            new Date(a.appointmentDate).getTime()
        );
        setAppointments(sortedAppointments);

        // Fetch all users (for account dropdown) - VẪN GIỮ NGUYÊN NẾU CẦN CHO DROPDOWN USER
        const usersResponse = await axios.get<User[]>(`${API_URL}/Account`);
        setUsers(usersResponse.data); // Store all users

        // --- FETCH PSYCHOLOGISTS TỪ API CHUYÊN DỤNG ---
        // Bỏ OPTION 1 (lọc từ /Account)
        // const psychoResponse = await axios.get<User[]>(`${API_URL}/Account`);
        // setPsychologists(
        //   psychoResponse.data.filter((user) => user.roleName === "Psychologist")
        // );

        // Sử dụng API mới: /api/Psychologist/all
        // Lưu ý: Cần kiểm tra cấu trúc dữ liệu trả về từ API này
        // Giả sử nó trả về một mảng các đối tượng có cấu trúc tương tự User (có id, fullname, userName)
        // Nếu cấu trúc khác, bạn cần tạo một Interface mới (ví dụ: PsychologistInfo) và cập nhật state/dropdown
        const psychoResponse = await axios.get<User[]>( // Hoặc thay User[] bằng PsychologistInfo[] nếu cấu trúc khác
          `${API_URL}/api/Psychologist/all` // Đảm bảo URL chính xác
        );
        setPsychologists(psychoResponse.data);
        // ------------------------------------------------
      } catch (err) {
        console.error("Error fetching data:", err);
        // Xử lý lỗi như cũ
        setError("Failed to load data. Please try again later.");
        if (axios.isAxiosError(err)) {
          setError(
            `Failed to load data: ${err.response?.data?.message || err.message}`
          );
        } else {
          setError("An unknown error occurred while fetching data.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Filtering Logic ---
  const filteredAppointments = appointments.filter((appointment) => {
    // Check if appointment and related data exist
    if (!appointment || appointment.isDelete) return false; // Skip deleted appointments

    const accountName = appointment.account?.fullname?.toLowerCase() || "";
    const psychologistName =
      appointment.psychologist?.fullname?.toLowerCase() || ""; // Handle potential null psychologist
    const content = appointment.content?.toLowerCase() || "";
    const searchTermLower = searchTerm.toLowerCase();

    const matchesSearch =
      accountName.includes(searchTermLower) ||
      psychologistName.includes(searchTermLower) ||
      content.includes(searchTermLower);

    const matchesStatus =
      selectedStatus === "All" || appointment.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  // --- Modal Handling ---
  const handleOpenCreateModal = () => {
    setEditingAppointmentId(null);
    // Reset form fields
    setCurrentAppointment({
      accountId: "",
      psychologistId: "",
      content: "",
      appointmentDate: "", // Reset date
      status: "pending",
    });
    setError(null); // Clear previous errors
    setShowModal(true);
  };

  const handleOpenEditModal = (appointment: Appointment) => {
    if (!appointment) return;
    setEditingAppointmentId(appointment.id);

    let localDateTime = "";
    if (appointment.appointmentDate) {
      try {
        const date = new Date(appointment.appointmentDate); // Tạo đối tượng Date

        // Kiểm tra xem date có hợp lệ không
        if (isNaN(date.getTime())) {
          throw new Error("Invalid date received from API");
        }

        // Lấy các thành phần theo múi giờ ĐỊA PHƯƠNG
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Tháng từ 0-11 nên +1
        const day = date.getDate().toString().padStart(2, "0");
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");

        // Tạo chuỗi đúng định dạng cho datetime-local
        localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
      } catch (error) {
        console.error("Error formatting date for modal:", error);
        // Có thể đặt giá trị mặc định hoặc hiển thị lỗi
        localDateTime = ""; // Hoặc giá trị mặc định khác
        setError("Could not parse appointment date."); // Thông báo lỗi cho người dùng
      }
    }

    setCurrentAppointment({
      accountId: appointment.accountId,
      psychologistId: appointment.psychologistId,
      content: appointment.content,
      appointmentDate: localDateTime, // Sử dụng chuỗi đã định dạng đúng
      status: appointment.status,
    });
    setError(null); // Xóa lỗi trước đó (nếu có) khi mở modal thành công
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAppointmentId(null);
    // Reset form state (optional, but good practice)
    setCurrentAppointment({
      accountId: "",
      psychologistId: "",
      content: "",
      appointmentDate: "",
      status: "pending",
    });
    setError(null); // Clear errors on close
  };

  // --- Form Input Change Handler ---
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setCurrentAppointment((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --- Submit Handler (Create/Update) ---
  const handleSubmitAppointment = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    console.log(currentAppointment);
    // Convert local datetime string back to ISO string for the API
    let isoDate = "";
    try {
      if (currentAppointment.appointmentDate) {
        const date = new Date(currentAppointment.appointmentDate);
        // Basic validation: Check if the date is valid
        if (isNaN(date.getTime())) {
          throw new Error("Invalid date format.");
        }
        isoDate = date.toISOString();
      } else {
        throw new Error("Appointment date is required."); // Or handle as needed
      }
    } catch (dateError: any) {
      setError(`Error processing date: ${dateError.message}`);
      setIsLoading(false);
      return; // Stop submission if date is invalid
    }

    const appointmentData = {
      ...currentAppointment,
      appointmentDate: isoDate, // Use the ISO formatted date
    };

    // Remove properties not needed for POST/PUT payload if necessary
    // delete (appointmentData as any).account;
    // delete (appointmentData as any).psychologist;

    try {
      let updatedAppointments = [...appointments];

      if (editingAppointmentId) {
        // --- UPDATE ---
        const response = await axios.put(
          `${API_URL}/Appointment/${editingAppointmentId}`,
          appointmentData
        );
        // Assuming the PUT request returns the updated appointment or just a success status
        // Re-fetch the specific updated appointment to get nested data if PUT doesn't return it
        const updatedDetails = await axios.get<Appointment>(
          `${API_URL}/Appointment/${editingAppointmentId}`
        );

        updatedAppointments = appointments.map(
          (app) => (app.id === editingAppointmentId ? updatedDetails.data : app) // Use detailed data
        );
      } else {
        // --- CREATE ---
        await axios.post(`${API_URL}/Appointment`, appointmentData); // 1. Gửi POST

        // 2. Fetch lại toàn bộ danh sách sau khi POST thành công
        const response = await axios.get<Appointment[]>(
            `${API_URL}/Appointment`
        );

        // 3. Sắp xếp danh sách mới nhận được
        const sortedNewAppointments = response.data.sort(
            (a, b) =>
                new Date(b.appointmentDate).getTime() -
                new Date(a.appointmentDate).getTime()
        );

        // 4. Cập nhật state với danh sách mới nhất đã sắp xếp
        setAppointments(sortedNewAppointments);
    }

    handleCloseModal();
      // Sort appointments again after update/create (optional)
      updatedAppointments.sort(
        (a, b) =>
          new Date(b.appointmentDate).getTime() -
          new Date(a.appointmentDate).getTime()
      );

      setAppointments(updatedAppointments);
      handleCloseModal();
    } catch (err) {
      console.error("Error submitting appointment:", err);
      if (axios.isAxiosError(err)) {
        setError(
          `Submission failed: ${
            err.response?.data?.message ||
            err.response?.data?.title ||
            err.message
          }`
        ); // Check for different error structures
      } else {
        setError("An unknown error occurred during submission.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Delete Handler ---
  const handleDeleteAppointment = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this appointment?")) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await axios.delete(`${API_URL}/Appointment/${id}`);
      // Update state by filtering out the deleted appointment
      setAppointments((prev) => prev.filter((app) => app.id !== id));
    } catch (err) {
      console.error("Error deleting appointment:", err);
      if (axios.isAxiosError(err)) {
        setError(
          `Deletion failed: ${err.response?.data?.message || err.message}`
        );
      } else {
        setError("An unknown error occurred during deletion.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Helper to format date for display ---
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString(undefined, {
        // Use locale-sensitive formatting
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  // --- Render ---
  return (
    <div className="appointment-container">
      {/* HEADER */}
      <div className="appointment-header">
        <h2>Appointment Management</h2>
        <button className="add-button" onClick={handleOpenCreateModal}>
          <Plus size={16} /> Add New Appointment
        </button>
      </div>
      {/* CONTROLS: Search + Filter */}
      <div className="appointment-controls">
        <div className="search-bar">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by user, psychologist, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-dropdown">
          <button
            className="filter-button"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <Filter size={16} />
            Status: {selectedStatus}
            <ChevronDown size={16} />
          </button>
          {showDropdown && (
            <ul className="dropdown-menu">
              {[
                "All",
                "pending",
                "approved",
                "rejected",
                "in progress",
                "completed",
                "expired",
              ].map((status) => (
                <li
                  key={status}
                  onClick={() => {
                    setSelectedStatus(status);
                    setShowDropdown(false);
                  }}
                >
                  {status}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {/* Loading and Error Display */}
      {isLoading && <div className="loading-indicator">Loading...</div>}
      {error && !showModal && <div className="error-message">{error}</div>}{" "}
      {/* Show general errors here */}
      {/* TABLE */}
      <div className="table-wrapper">
        {" "}
        {/* Added wrapper for potential horizontal scroll */}
        <table className="appointment-table">
          <thead>
            <tr>
              <th>User (Account)</th>
              <th>Psychologist</th>
              <th>Appointment Date</th>
              <th>Content Snippet</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>
                    {appointment.account?.fullname || appointment.accountId}
                  </td>
                  <td>
                    {appointment.psychologist?.name ||
                      appointment.psychologistId}
                  </td>
                  <td>{formatDate(appointment.appointmentDate)}</td>
                  {/* Show only a snippet of the content */}
                  <td title={appointment.content}>
                    {appointment.content?.substring(0, 50)}
                    {appointment.content?.length > 50 ? "..." : ""}
                  </td>
                  <td>
                    <span
                      className={`status-badge status-${appointment.status}`}
                    >
                      {appointment.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="edit-button"
                      onClick={() => handleOpenEditModal(appointment)}
                      title="Edit Appointment"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteAppointment(appointment.id)}
                      title="Delete Appointment"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: "center" }}>
                  {isLoading ? "Loading..." : "No appointments found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* MODAL (Add/Edit) */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>
              {editingAppointmentId
                ? "Edit Appointment"
                : "Create New Appointment"}
            </h3>
            {/* Display errors specific to the modal */}
            {error && <div className="error-message modal-error">{error}</div>}

            <form onSubmit={handleSubmitAppointment}>
              {/* Account Selection */}
              <div className="form-group">
                <label htmlFor="accountId">
                  <UserIcon size={14} /> User (Account)
                </label>
                <select
                  id="accountId"
                  name="accountId"
                  value={currentAppointment.accountId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="" disabled>
                    Select User
                  </option>
                  {users.map((user) => (
                    // Filter out psychologists/managers if they shouldn't book appointments
                    // (user.roleName === 'Student' || user.roleName === 'Parent') &&
                    <option key={user.id} value={user.id}>
                      {user.fullname} ({user.userName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Psychologist Selection */}
              <div className="form-group">
                <label htmlFor="psychologistId">
                  <Briefcase size={14} /> Psychologist
                </label>
                <select
                  id="psychologistId"
                  name="psychologistId"
                  value={currentAppointment.psychologistId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="" disabled>
                    Select Psychologist
                  </option>
                  {psychologists.map((psycho) => (
                    <option key={psycho.id} value={psycho.id}>
                      {/* Đảm bảo psycho.fullname và psycho.userName tồn tại trong dữ liệu trả về từ API mới */}
                      {psycho.name}
                      {/* Thêm fallback nếu userName không có */}
                    </option>
                  ))}
                </select>
              </div>

              {/* Appointment Date */}
              <div className="form-group">
                <label htmlFor="appointmentDate">
                  <CalendarIcon size={14} /> Appointment Date & Time
                </label>
                <input
                  type="datetime-local" // Use datetime-local for date and time input
                  id="appointmentDate"
                  name="appointmentDate"
                  value={currentAppointment.appointmentDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Content */}
              <div className="form-group">
                <label htmlFor="content">
                  <FileText size={14} /> Content/Notes
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={3}
                  value={currentAppointment.content}
                  onChange={handleInputChange}
                  placeholder="Brief reason for appointment..."
                />
              </div>

              {/* Status Selection */}
              <div className="form-group">
                <label htmlFor="status">
                  <CheckCircle size={14} /> Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={currentAppointment.status}
                  onChange={handleInputChange}
                  required
                >
                  {[
                    "pending",
                    "approved",
                    "rejected",
                    "in progress",
                    "completed",
                    "expired",
                  ].map((stat) => (
                    <option key={stat} value={stat}>
                      {stat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isLoading}>
                  {isLoading
                    ? "Saving..."
                    : editingAppointmentId
                    ? "Update Appointment"
                    : "Create Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentManagement;
