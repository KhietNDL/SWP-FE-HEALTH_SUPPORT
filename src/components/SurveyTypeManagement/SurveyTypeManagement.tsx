import React, { useState, useEffect } from "react";
import { FiEdit2, FiTrash2, FiSearch, FiX, FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { toastConfig } from "../../types/toastConfig";
import "react-toastify/dist/ReactToastify.css";
import "./SurveyTypeManagement.scss";
import { Survey } from "../../types/Survey";
import { SurveyType } from "../../types/SurveyType";
import { surveyApi, surveyTypeApi } from "../../services/SurveyApiService";

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
  const [isLoading, setIsLoading] = useState(false);

  // States for add survey popup
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [addForm, setAddForm] = useState<AddSurveyForm>({
    surveyName: "",
    maxScore: 100
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [surveyTypesData, surveysData] = await Promise.all([
        surveyTypeApi.getAll(),
        surveyApi.getAll()
      ]);
      setSurveyTypes(surveyTypesData);
      setSurveys(surveysData);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
    const surveyToEdit = surveys.find(survey => survey.id === surveyId);
    if (!surveyToEdit) {
      toast.error("Không tìm thấy thông tin khảo sát", toastConfig);
      return;
    }
    
    const surveyType = surveyTypes.find(type => type.id === surveyToEdit.surveyTypeId);
    if (!surveyType) {
      toast.error("Không tìm thấy thông tin loại khảo sát", toastConfig);
      return;
    }

    setEditingSurvey(surveyToEdit);
    setEditForm({
      maxScore: surveyToEdit.maxScore,
      surveyTypeId: surveyToEdit.surveyTypeId,
      surveyName: surveyType.surveyName
    });

    setShowEditPopup(true);
  };

  const openAddPopup = () => {
    setAddForm({
      surveyName: "",
      maxScore: 100
    });
    setShowAddPopup(true);
  };

  const closeEditPopup = () => {
    setShowEditPopup(false);
    setEditingSurvey(null);
  };

  const closeAddPopup = () => {
    setShowAddPopup(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: name === "maxScore" ? Number(value) : value,
    });
  };

  const handleAddFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddForm({
      ...addForm,
      [name]: name === "maxScore" ? Number(value) : value,
    });
  };

  const validateAddForm = () => {
    if (!addForm.surveyName.trim()) {
      toast.error("Vui lòng nhập tên loại khảo sát", toastConfig);
      return false;
    }
    
    if (addForm.maxScore <= 0) {
      toast.error("Điểm tối đa phải lớn hơn 0", toastConfig);
      return false;
    }
    
    return true;
  };

  const validateEditForm = () => {
    if (!editForm.surveyName.trim()) {
      toast.error("Vui lòng nhập tên loại khảo sát", toastConfig);
      return false;
    }
    
    if (editForm.maxScore <= 0) {
      toast.error("Điểm tối đa phải lớn hơn 0", toastConfig);
      return false;
    }
    
    return true;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAddForm()) return;
    
    setIsLoading(true);
    try {
      // Step 1: Create new SurveyType
      const surveyTypeResponse = await surveyTypeApi.create(addForm.surveyName);
      
      // Step 2: Get updated survey types to find the new ID
      const updatedTypes = await surveyTypeApi.getAll();
      const createdType = updatedTypes.find(
        (type: SurveyType) => type.surveyName === addForm.surveyName
      );
      
      if (!createdType) {
        throw new Error("Không tìm thấy loại khảo sát vừa tạo");
      }

      // Step 3: Create Survey with the new type ID
      await surveyApi.create(addForm.maxScore, createdType.id);
      
      toast.success("Tạo khảo sát mới thành công!", toastConfig);
      
      // Refresh data
      await fetchInitialData();
      closeAddPopup();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tạo khảo sát mới", toastConfig);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSurvey || !validateEditForm()) return;
    
    setIsLoading(true);
    try {
      // Update survey maxScore
      await surveyApi.update(editingSurvey.id, editForm.maxScore);
      
      // Update survey type name
      await surveyTypeApi.update(editForm.surveyTypeId, editForm.surveyName);
      
      toast.success("Cập nhật khảo sát thành công!", toastConfig);
      
      // Refresh data
      await fetchInitialData();
      closeEditPopup();
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật khảo sát thất bại", toastConfig);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (surveyId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa khảo sát này không?")) {
      return;
    }
    
    setIsLoading(true);
    try {
      await surveyApi.delete(surveyId);
      toast.success("Xóa khảo sát thành công!", toastConfig);
      
      // Update local state without re-fetching
      setSurveys(prevSurveys => 
        prevSurveys.filter(survey => survey.id !== surveyId)
      );
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi xóa khảo sát", toastConfig);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <ToastContainer {...toastConfig} />
      <h1>Quản Lý Khảo Sát</h1>

      {/* <div className="search-box">
        <input
          type="text"
          placeholder="Tìm kiếm khảo sát..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FiSearch className="search-icon" />
      </div>

      <div className="button-container">
        <button 
          className="add-button" 
          onClick={openAddPopup}
          disabled={isLoading}
        >
          <FiPlus /> Thêm Bài Khảo Sát
        </button>
      </div> */}

      {isLoading && <div className="loading-indicator">Đang tải dữ liệu...</div>}

      <table>
        <thead>
          <tr>
            <th>Tên Loại Khảo Sát</th>
            <th>Điểm tối đa</th>
            <th>Thao tác</th>
            <th>Xem danh sách câu hỏi</th>
          </tr>
        </thead>
        <tbody>
          {filteredSurveys.length > 0 ? (
            filteredSurveys.map((survey) => (
              <tr key={survey.id}>
                <td>{survey.surveyName}</td>
                <td>{survey.maxScore}</td>
                <td className="actions">
                  {!survey.isDeleted ? (
                    <>
                      <button 
                        onClick={() => openEditPopup(survey.id)}
                        disabled={isLoading}
                      >
                        <FiEdit2 /> Chỉnh Sửa
                      </button>
                      <button 
                        className="delete" 
                        onClick={() => handleDelete(survey.id)}
                        disabled={isLoading}
                      >
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
            ))
          ) : (
            <tr>
              <td colSpan={4} className="no-data">
                {searchTerm ? "Không tìm thấy khảo sát phù hợp" : "Chưa có khảo sát nào"}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Edit Popup Modal */}
      {showEditPopup && editingSurvey && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="popup-header">
              <h2>Chỉnh Sửa Khảo Sát</h2>
              <button className="close-button" onClick={closeEditPopup} aria-label="Close edit popup">
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
                  min="1"
                />
              </div>
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="save-button"
                  disabled={isLoading}
                >
                  {isLoading ? "Đang lưu..." : "Lưu"}
                </button>
                <button 
                  type="button" 
                  className="cancel-button" 
                  onClick={closeEditPopup}
                  disabled={isLoading}
                >
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
              <button className="close-button" onClick={closeAddPopup} aria-label="Close add popup">
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
                  min="1"
                />
              </div>
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="save-button"
                  disabled={isLoading}
                >
                  {isLoading ? "Đang tạo..." : "Tạo mới"}
                </button>
                <button 
                  type="button" 
                  className="cancel-button" 
                  onClick={closeAddPopup}
                  disabled={isLoading}
                >
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