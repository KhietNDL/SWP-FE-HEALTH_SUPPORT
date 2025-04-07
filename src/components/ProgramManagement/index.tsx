import React, { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, Search, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./index.scss";

// ✅ Định nghĩa `id` là `string` thay vì `number`
interface Subscription {
  id?: string;
  subscriptionName: string;
  description: string;
  price: number;
  duration: number;
  categoryId: string;
  psychologistId: string;
  purpose: string;
  criteria: string;
  focusGroup: string;
  assessmentTool: string;
}

const API_URL = "http://localhost:5199/Subscription";

const SubscriptionManagement: React.FC = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [categories, setCategories] = useState<{ id: string; categoryName: string }[]>([]);
  const [psychologists, setPsychologists] = useState<{ id: string; name: string; specialization: string }[]>([]);
  const [currentSub, setCurrentSub] = useState<Subscription>({
    subscriptionName: "",
    description: "",
    price: 0.01,
    duration: 0,
    categoryId: "",
    psychologistId: "",
    purpose: "",
    criteria: "",
    focusGroup: "",
    assessmentTool: "",
  });

  // 🔹 Lấy danh sách từ API
  const fetchSubscriptions = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data: Subscription[] = await response.json();
      console.log("📢 Dữ liệu API trả về:", data);

      if (!Array.isArray(data)) {
        throw new Error("❌ Dữ liệu API không phải là mảng!");
      }

      setSubscriptions(data);
    } catch (error) {
      console.error("⚠ Lỗi khi gọi API:", error);
      alert("❌ Không thể lấy dữ liệu từ API! Kiểm tra console.");
    }
  };

  const fetchCategoriesAndPsychologists = async () => {
    try {
      const categoryResponse = await fetch("http://localhost:5199/api/Category");
      console.log("Category Response:", categoryResponse); // Log phản hồi từ API Category
      const psychologistResponse = await fetch("http://localhost:5199/api/Psychologist");
      console.log("Psychologist Response:", psychologistResponse); // Log phản hồi từ API Psychologist
  
      if (!categoryResponse.ok || !psychologistResponse.ok) {
        throw new Error("Failed to fetch data");
      }
  
      const categoryData = await categoryResponse.json();
      const psychologistData = await psychologistResponse.json();
  
      setCategories(categoryData);
      setPsychologists(psychologistData);
    } catch (error) {
      console.error("Error fetching categories/psychologists:", error);
      alert("Failed to fetch categories and psychologists.");
    }
  };

  // 🔹 Gọi API khi component mount
  useEffect(() => {
    fetchSubscriptions();
    fetchCategoriesAndPsychologists();
  }, []);

  // Mở Modal để thêm mới
  const handleOpenAddModal = () => {
    setEditingId(null);
    setCurrentSub({
      subscriptionName: "",
      description: "",
      price: 0.01,
      duration: 0,
      categoryId: "",
      psychologistId: "",
      purpose: "",
      criteria: "",
      focusGroup: "",
      assessmentTool: "",

    });
    setShowModal(true);
  };

  // Mở Modal để chỉnh sửa
  const handleOpenEditModal = async (sub: Subscription) => {
    try {
      // Fetch all orders
      const ordersResponse = await fetch(`http://localhost:5199/Order`);
      if (!ordersResponse.ok) throw new Error("Failed to fetch orders");
  
      const orders = await ordersResponse.json();
  
      // Filter orders by subscriptionId
      const relatedOrders = orders.filter((order: any) => order.subscriptionName === sub.subscriptionName);
  
      // Check if any order has isJoined = true
      const hasJoinedOrders = relatedOrders.some((order: any) => order.isJoined === true);
  
      if (hasJoinedOrders) {
        setErrorMessage("Không thể chỉnh sửa chương trình này vì đã có người tham gia.");
        setShowErrorPopup(true);
        return;
      }
  
      // Proceed with editing if no joined orders exist
      setEditingId(sub.id || null);
      setCurrentSub(sub);
      setShowModal(true);
    } catch (error) {
      console.error("Lỗi kiểm tra trạng thái chương trình:", error);
      setErrorMessage("Không thể kiểm tra trạng thái chương trình. Vui lòng thử lại.");
      setShowErrorPopup(true);
    }
  };

  // Đóng Modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  // Xử lý Submit Form (Thêm/Sửa)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("🔍 Dữ liệu gửi lên API:", JSON.stringify(currentSub, null, 2));
  
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `http://localhost:5199/Subscription/${editingId}` : `http://localhost:5199/Subscription/Create`;
  
      // 🔹 Nếu là cập nhật, chỉ lấy 3 trường cần thiết
      const payload = editingId
        ? {
            description: currentSub.description,
            duration: currentSub.duration,
            price: currentSub.price,
          }
        : currentSub;
  
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Không thể lưu chương trình: ${errorText}`);
      }
  
      await response.json();
  
      // 🔥 Gọi lại API để cập nhật danh sách
      fetchSubscriptions();
      handleCloseModal();
    } catch (error) {
      console.error("🚨 Lỗi khi gửi API:", error);
      alert("⚠ Không thể lưu chương trình. Kiểm tra console cho chi tiết.");
    }
  };
  
  // Xóa Subscription
  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa chương trình này không?")) return;
  
    try {
      // Fetch all orders
      const ordersResponse = await fetch(`http://localhost:5199/Order`);
      if (!ordersResponse.ok) throw new Error("Failed to fetch orders");
  
      const orders = await ordersResponse.json();
  
      // Filter orders by subscriptionId
      const relatedOrders = orders.filter((order: any) => order.subscriptionName === subscriptions.find((sub) => sub.id === id)?.subscriptionName);
  
      // Check if any order has isJoined = true
      const hasJoinedOrders = relatedOrders.some((order: any) => order.isJoined === true);
  
      if (hasJoinedOrders) {
        setErrorMessage("Không thể xóa chương trình này vì đã có người tham gia.");
        setShowErrorPopup(true);
        return;
      }
  
      // Proceed with deletion if no joined orders exist
      const response = await fetch(`http://localhost:5199/Subscription/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Không thể xóa chương trình này.");
  
      // Refresh the subscription list
      fetchSubscriptions();
    } catch (error) {
      console.error("Error deleting subscription:", error);
      setErrorMessage("Không thể xóa chương trình này. Vui lòng thử lại.");
      setShowErrorPopup(true);
    }
  };
  

  // 🔹 Fix lỗi `.toLowerCase()` bị undefined
  const filteredSubs = subscriptions.filter((sub) =>
    sub.subscriptionName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="subscription-container">
      {/* HEADER */}
      <div className="subscription-header">
        <h2>Subscription Management</h2>
        <div className="header-buttons">
          <button className="add-button" onClick={handleOpenAddModal}>
            <Plus size={16} /> Add New Subscription
          </button>
          <button
            className="navigate-button"
            onClick={() => navigate("/manage/ProgressManagePage")}
          >
            Go to Progress Management
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="subscription-controls">
        <div className="search-bar">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by subscription name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <table className="subscription-table">
        <thead>
          <tr>
            <th>Subscription Name</th>
            <th>Description</th>
            <th>Price</th>
            <th>Duration</th>
            <th>Category</th>
            <th>Psychologist</th>
            <th>Purpose</th>
            <th>Criteria</th>
            <th>Focus Group</th>
            <th>Assessment Tool</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredSubs.map((sub) => (
            <tr key={sub.id}>
              <td>{sub.subscriptionName}</td>
              <td>{sub.description}</td>
              <td>VND{sub.price.toLocaleString()}</td>
              <td>{sub.duration} days</td>
              {/* Hiển thị tên Category dựa trên categoryId */}
              <td>{sub.categoryName}</td>
              {/* Hiển thị tên Psychologist dựa trên psychologistId */}
              <td>{sub.psychologistName}</td>
              <td>{sub.purpose}</td>
              <td>{sub.criteria}</td>
              <td>{sub.focusGroup}</td>
              <td>{sub.assessmentTool}</td>
              <td>
                <button className="edit-button" onClick={() => handleOpenEditModal(sub)}>
                  <Pencil size={16} />
                </button>
                <button className="delete-button" onClick={() => handleDelete(sub.id!)}>
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL (Add/Edit Subscription) */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingId !== null ? "Edit Subscription" : "Create New Subscription"}</h3>
              <button className="close-button" onClick={handleCloseModal}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Subscription Name</label>
                <input type="text" value={currentSub.subscriptionName} onChange={(e) => setCurrentSub({ ...currentSub, subscriptionName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={currentSub.description} onChange={(e) => setCurrentSub({ ...currentSub, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Price</label>
                <input type="number" step="0.01" value={currentSub.price} onChange={(e) => setCurrentSub({ ...currentSub, price: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>Duration</label>
                <input type="number" value={currentSub.duration} onChange={(e) => setCurrentSub({ ...currentSub, duration: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={currentSub.categoryId}
                  onChange={(e) => setCurrentSub({ ...currentSub, categoryId: e.target.value })}
                >
                  <option value="">Select a Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.categoryName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Psychologist</label>
                <select
                  value={currentSub.psychologistId}
                  onChange={(e) => setCurrentSub({ ...currentSub, psychologistId: e.target.value })}
                >
                  <option value="">Select a Psychologist</option>
                  {psychologists.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {p.specialization}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Purpose</label>
                <input type="text" value={currentSub.purpose} onChange={(e) => setCurrentSub({ ...currentSub, purpose: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Criteria</label>
                <input type="text" value={currentSub.criteria} onChange={(e) => setCurrentSub({ ...currentSub, criteria: e.target.value })} />
                </div>
                <div className="form-group">
                <label>Focus Group</label>
                <input type="text" value={currentSub.focusGroup} onChange={(e) => setCurrentSub({ ...currentSub, focusGroup: e.target.value })} />
                </div>
                <div className="form-group">
                <label>Assessment Tool</label>
                <input type="text" value={currentSub.assessmentTool} onChange={(e) => setCurrentSub({ ...currentSub, assessmentTool: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="submit">{editingId !== null ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error Popup */}
      {showErrorPopup && (
        <div className="error-popup-overlay">
          <div className="error-popup-content">
            <div className="error-popup-icon">
              <XCircle size={40} color="#d32f2f" />
            </div>
            <p className="error-popup-message">{errorMessage}</p>
            <button 
              className="error-popup-button"
              onClick={() => setShowErrorPopup(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;