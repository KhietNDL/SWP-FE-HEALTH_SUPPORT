import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiEdit2, FiTrash2, FiSearch, FiX, FiPlus } from "react-icons/fi";
import { useNavigate} from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { toastConfig } from "../../types/toastConfig";
import "react-toastify/dist/ReactToastify.css";
import "./SurveyTypeManagement.scss";
import { Survey } from "../../types/Survey";

interface SurveyType {
  id: string;
  surveyName: string;
  isDelete: boolean;
}

interface EditSurveyForm {
  maxScore: number;
  surveyTypeId: string;
  surveyName: string;
}

interface AddSurveyForm {
  surveyName: string;
  maxScore: number;
}

const SurveyTypeManagement: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [surveyTypes, setSurveyTypes] = useState<SurveyType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [editForm, setEditForm] = useState<EditSurveyForm>({
    maxScore: 0,
    surveyTypeId: "",
    surveyName: ""
  });
  const [currentSurveyType, setCurrentSurveyType] = useState<SurveyType | null>(null);

  // States for add survey popup
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [addForm, setAddForm] = useState<AddSurveyForm>({
    surveyName: "",
    maxScore: 100
  });

  useEffect(() => {
    fetchSurveyTypes();
    fetchSurveys();
  }, []);

  // Set up axios with authentication token
  const getAuthAxios = () => {
    const token = sessionStorage.getItem('token');
    return axios.create({
      baseURL: "http://localhost:5199",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  };

  const fetchSurveys = async () => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.get("/Survey");
      setSurveys(response.data);
    } catch (error) {
      toast.error("Lỗi khi lấy danh sách khảo sát", toastConfig);
    }
  };

  const fetchSurveyTypes = async () => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.get("/SurveyType");
      setSurveyTypes(response.data);
      return response.data;
    } catch (error) {
      toast.error("Lỗi khi lấy danh sách loại khảo sát", toastConfig);
      return [];
    }
  };

  // REMOVED: fetchSurveyById function as we're no longer using it

  const mergedSurveys = surveys.map((survey) => {
    const surveyType = surveyTypes.find((type) => type.id === survey.surveyTypeId);
    return {
      ...survey,
      surveyName: surveyType ? surveyType.surveyName : "Không xác định",
    };
  });

  const filteredSurveys = mergedSurveys.filter((survey) =>
    survey.surveyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditPopup = (surveyId: string) => {
    // Find the survey in our existing data instead of fetching it again
    const surveyToEdit = surveys.find(survey => survey.id === surveyId);
    if (!surveyToEdit) {
      toast.error("Không tìm thấy thông tin khảo sát", toastConfig);
      return;
    }
    
    // Find the corresponding survey type
    const surveyType = surveyTypes.find(type => type.id === surveyToEdit.surveyTypeId);
    if (!surveyType) {
      toast.error("Không tìm thấy thông tin loại khảo sát", toastConfig);
      return;
    }

    setEditingSurvey(surveyToEdit);
    setCurrentSurveyType(surveyType);

    setEditForm({
      maxScore: surveyToEdit.maxScore,
      surveyTypeId: surveyToEdit.surveyTypeId,
      surveyName: surveyType.surveyName
    });

    setShowEditPopup(true);
  };

  // Open add survey popup
  const openAddPopup = () => {
    setAddForm({
      surveyName: "",
      maxScore: 100
    });
    setShowAddPopup(true);
  };

  // Close edit popup
  const closeEditPopup = () => {
    setShowEditPopup(false);
    setEditingSurvey(null);
  };

  // Close add popup
  const closeAddPopup = () => {
    setShowAddPopup(false);
  };

  // Handle form input changes for edit form
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: name === "maxScore" ? Number(value) : value,
    });
  };

  // Handle form input changes for add form
  const handleAddFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddForm({
      ...addForm,
      [name]: name === "maxScore" ? Number(value) : value,
    });
  };

  // Handle add new survey submission
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addForm.surveyName.trim()) {
      toast.error("Vui lòng nhập tên loại khảo sát", toastConfig);
      return;
    }

    try {
      const authAxios = getAuthAxios();

      // Bước 1: Gửi yêu cầu tạo SurveyType mới
      const surveyTypeResponse = await authAxios.post("/SurveyType", {
        surveyName: addForm.surveyName,
      });

      if (!surveyTypeResponse.data) {
        throw new Error("Không nhận được phản hồi từ server khi tạo loại khảo sát");
      }

      // Bước 2: Lấy danh sách SurveyType để lấy surveyTypeId mới
      const surveyTypesResponse = await authAxios.get("/SurveyType");
      const createdSurveyType = surveyTypesResponse.data.find(
        (type: SurveyType) => type.surveyName === addForm.surveyName
      );

      if (!createdSurveyType) {
        throw new Error("Không tìm thấy loại khảo sát vừa tạo");
      }

      // Bước 3: Gửi yêu cầu tạo Survey mới với surveyTypeId
      await authAxios.post("/Survey", {
        maxScore: addForm.maxScore,
        surveyTypeId: createdSurveyType.id,
        questionList: [],
      });

      toast.success("Tạo khảo sát mới thành công!", toastConfig);

      await fetchSurveyTypes();
      await fetchSurveys();

      closeAddPopup();
    } catch (error) {
      toast.error("Lỗi khi tạo khảo sát mới", toastConfig);
      console.error(error);
    }
  };

  // Submit the unified edit form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSurvey) return;

    try {
      const authAxios = getAuthAxios();

      // Cập nhật survey (chỉ maxScore)
      await authAxios.put(`/Survey/${editingSurvey.id}`, {
        maxScore: editForm.maxScore
      });

      // Cập nhật surveyType (chỉ surveyName)
      await authAxios.put(`/SurveyType/${editForm.surveyTypeId}`, {
        surveyName: editForm.surveyName
      });

      toast.success("Cập nhật khảo sát thành công!", toastConfig);
      
      await fetchSurveys();
      await fetchSurveyTypes();

      closeEditPopup();
    } catch (error) {
      toast.error("Cập nhật khảo sát thất bại", toastConfig);
    }
  };

  const handleDelete = async (surveyId: string) => {
    try {
      const authAxios = getAuthAxios();
      await authAxios.delete(`/Survey/${surveyId}`);
      toast.success("Xóa khảo sát thành công!", toastConfig);
      fetchSurveys();
    } catch (error) {
      toast.error("Lỗi khi xóa khảo sát", toastConfig);
    }
  };

  return (
    <div className="container">
      <ToastContainer position="top-center" autoClose={3000} />
      <h1>Quản Lý Khảo Sát</h1>

      <div className="search-box">
        <input
          type="text"
          placeholder="Tìm kiếm khảo sát..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FiSearch className="search-icon" />
      </div>

      <div className="button-container">
        <button className="add-button" onClick={openAddPopup}>
          <FiPlus /> Thêm Bài Khảo Sát
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Tên Loại Khảo Sát</th>
            <th>Điểm tối đa</th>
            {/* <th>Trạng Thái</th> */}
            <th>Thao tác</th>
            <th>Xem danh sách câu hỏi</th>
          </tr>
        </thead>
        <tbody>
          {filteredSurveys.map((survey) => (
            <tr key={survey.id}>
              <td>{survey.surveyName}</td>
              <td>{survey.maxScore}</td>
              {/* <td className={survey.isDeleted ? "inactive" : "active"}>
                {survey.isDeleted ? "Inactive" : "Active"}
              </td> */}
              <td className="actions">
                {!survey.isDeleted ? (
                  <>
                    <button onClick={() => openEditPopup(survey.id)}>
                      <FiEdit2 /> Chỉnh Sửa
                    </button>
                    <button className="delete" onClick={() => handleDelete(survey.id)}>
                      <FiTrash2 /> Xóa
                    </button>
                  </>
                ) : null}
              </td>
              <td className="QuestionList">
                <i
                  style={{ cursor: "pointer", fontStyle: "italic", color: "#007bff" }}
                  onClick={() => navigate(`survey-management/${survey.id}`)}
                >
                  View
                </i>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Popup Modal */}
      {showEditPopup && editingSurvey && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="popup-header">
              <h2>Chỉnh Sửa Khảo Sát</h2>
              <button className="close-button" onClick={closeEditPopup}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label htmlFor="surveyName">Tên loại khảo sát:</label>
                <input
                  type="text"
                  id="surveyName"
                  name="surveyName"
                  value={editForm.surveyName}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="maxScore">Điểm tối đa:</label>
                <input
                  type="number"
                  id="maxScore"
                  name="maxScore"
                  value={editForm.maxScore}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="save-button">
                  Lưu
                </button>
                <button type="button" className="cancel-button" onClick={closeEditPopup}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Survey Popup Modal */}
      {showAddPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="popup-header">
              <h2>Thêm Khảo Sát Mới</h2>
              <button className="close-button" onClick={closeAddPopup}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label htmlFor="addSurveyName">Tên loại khảo sát:</label>
                <input
                  type="text"
                  id="addSurveyName"
                  name="surveyName"
                  value={addForm.surveyName}
                  onChange={handleAddFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="addMaxScore">Điểm tối đa:</label>
                <input
                  type="number"
                  id="addMaxScore"
                  name="maxScore"
                  value={addForm.maxScore}
                  onChange={handleAddFormChange}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="save-button">
                  Tạo mới
                </button>
                <button type="button" className="cancel-button" onClick={closeAddPopup}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyTypeManagement;