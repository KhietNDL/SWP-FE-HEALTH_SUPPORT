import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { toastConfig } from "../../types/toastConfig";
import "react-toastify/dist/ReactToastify.css";
import { AiOutlineCloudUpload, AiOutlineLoading3Quarters } from "react-icons/ai";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/Store";
import "./AvatarUpload.scss";
import defaultAvatar from "../../images/User.png";

const AvatarUpload: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const User = useSelector((state: RootState) => state.user);

  const accountId = localStorage.getItem("accountId");

  // Đặt avatar mặc định khi chuyển hướng đến trang
  useEffect(() => {
    const setDefaultAvatar = async () => {
      if (accountId) {
        try {
          const formData = new FormData();
          const response = await fetch(defaultAvatar);
          const blob = await response.blob();
          formData.append("File", blob, "User.png");

          const putResponse = await fetch(`http://localhost:5199/Account/${accountId}/avatar`, {
            method: "PUT",
            body: formData,
          });

          if (!putResponse.ok) {
            const errorData = await putResponse.json();
            toast.error(errorData.message || "Không thể đặt ảnh đại diện mặc định", toastConfig);
          }
        } catch (error) {
          toast.error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.", toastConfig);
        }
      }
    };

    setDefaultAvatar();
  }, [accountId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Kiểm tra nếu file không phải là ảnh
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file ảnh hợp lệ", toastConfig);
        return;
      }

      // Kiểm tra kích thước file (tối đa 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File ảnh không được vượt quá 5MB", toastConfig);
        return;
      }

      setSelectedFile(file);

      // Tạo URL xem trước
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async () => {
    if (!selectedFile || !accountId) {
      toast.error("Vui lòng chọn ảnh đại diện", toastConfig);
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("File", selectedFile);

      const response = await fetch(`http://localhost:5199/Account/${accountId}/avatar`, {
        method: "PUT",
        body: formData,
      });

      if (response.ok) {
        toast.success("Cập nhật ảnh đại diện thành công!", toastConfig);

        setTimeout(() => {
          if (User?.roleName === "Manager") {
            navigate("/manage");
          } else {
            navigate("/login");
          }

          localStorage.removeItem("accountId");
          localStorage.removeItem("email");

        }, 3000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Cập nhật ảnh đại diện thất bại", toastConfig);
      }
    } catch (error) {
      toast.error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.", toastConfig);
    } finally {
      setIsLoading(false);
    }
  };

  const skipUpload = () => {
    if (User?.roleName === "Manager") {
      navigate("/manage");
    } else {
      navigate("/login");
    }
    
    localStorage.removeItem("accountId");
    localStorage.removeItem("email");
  };

  return (
    <div className="avatar-upload-container">
      <ToastContainer />
      <div className="avatar-upload-card">
        <h2>Thêm Ảnh Đại Diện</h2>
        <p>Bạn có thể thêm ảnh đại diện ngay bây giờ hoặc thực hiện sau</p>

        <div className="avatar-preview-container">
          {previewUrl ? (
            <img src={previewUrl} alt="Avatar Preview" className="avatar-preview" />
          ) : (
            <div className="avatar-placeholder">
              <img src={defaultAvatar} alt="Default Avatar" className="avatar-preview" />
            </div>
          )}
        </div>

        <div className="upload-actions">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="file-input"
            hidden
          />

          <button
            className="select-file-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <AiOutlineCloudUpload size={20} />
            Chọn ảnh
          </button>

          <button
            className="upload-btn"
            onClick={uploadAvatar}
            disabled={!selectedFile || isLoading}
          >
            {isLoading ? (
              <AiOutlineLoading3Quarters className="loading-icon" />
            ) : (
              "Cập nhật"
            )}
          </button>

          <button className="skip-btn" onClick={skipUpload} disabled={isLoading}>
            Bỏ qua
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarUpload;