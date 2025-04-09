import { useEffect, useState } from "react";
import "./index.scss";
import { Button } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/Store"; // Điều chỉnh đường dẫn nếu cần
import axios from "axios";
import { login } from "../../redux/features/userSlice";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
function UserInformation() {
  // Lấy thông tin user từ Redux
  const reduxUser = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();

  // Nếu cần giữ các state riêng cho input để cho phép chỉnh sửa
  const [username, setUsername] = useState("");
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [passwordHash, setPasswordHash] = useState("");
  const [passwordSalt, setPasswordSalt] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(reduxUser?.imgUrl); // Thêm state cho avatar URL
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Lưu file ảnh đã chọn
  // Các state cho đổi mật khẩu
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangePassword, setIsChangePassword] = useState(false);

  // Đồng bộ các state với dữ liệu từ Redux khi reduxUser thay đổi
  useEffect(() => {
    if (reduxUser) {
      setUsername(reduxUser.userName || reduxUser.userName || "");
      setFullname(reduxUser.fullname || "");
      setEmail(reduxUser.email || "");
      setPhone(reduxUser.phone || "");
      setAddress(reduxUser.address || "");
      setPasswordHash(reduxUser.passwordHash || "");
      // Nếu có thêm thông tin nào khác, cập nhật tương tự
    }
  }, [reduxUser]);

  // Nếu chưa có user từ Redux, có thể hiển thị Loading
  if (!reduxUser) {
    return <div>Loading...</div>;
  }

  // Các hàm xử lý cập nhật thông tin người dùng và đổi mật khẩu giữ nguyên
  const handleUpdateUserInfo = async () => {
    const updatedData = {
      accountId: reduxUser.id,
      username: username || reduxUser.userName,
      fullname: fullname || reduxUser.fullname,
      email: email || reduxUser.email,
      phone: phone || reduxUser.phone,
      address: address || reduxUser.address,
      passwordHash: passwordHash || reduxUser.passwordHash,
      passwordSalt,
    };
  
    try {
      // Gửi request cập nhật thông tin
      await axios.put(`https://healthsupportwebapp-edf2hybhcah3e7hr.southeastasia-01.azurewebsites.net/Account/${reduxUser.id}`, updatedData);
      console.log("Cập nhật thông tin thành công!");
  
      // Gọi API GET để lấy thông tin mới nhất sau khi update thành công
      const response = await axios.get(`https://healthsupportwebapp-edf2hybhcah3e7hr.southeastasia-01.azurewebsites.net/Account/${reduxUser.id}`);
      
      // Cập nhật Redux với dữ liệu mới nhất từ server
      dispatch(login(response.data));
  
      // Lưu vào Local Storage để giữ thông tin sau khi reload
      localStorage.setItem("userState", JSON.stringify(response.data));
  
      toast.success("Cập nhật thông tin thành công!");
    } catch (error) {
      toast.error("Cập nhật thông tin thất bại!");
      console.error("Lỗi khi cập nhật thông tin:", error);
    }
  };
  

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới không khớp. Vui lòng kiểm tra lại!");
      return;
    }
    try {
      const payload = {
        accountId: reduxUser.id,
        oldPassword,
        newPassword,
      };
      const response = await axios.post(
        "https://healthsupportwebapp-edf2hybhcah3e7hr.southeastasia-01.azurewebsites.net/Account/UpdatePassword",
        payload
      );
      console.log("Password updated successfully:", response.data);
      toast.success("Cập nhật mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangePassword(false);
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Cập nhật mật khẩu thất bại!");
    }
  };
  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    setSelectedFile(file);
  
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      const avatar = await axios.put(
        `https://healthsupportwebapp-edf2hybhcah3e7hr.southeastasia-01.azurewebsites.net/Account/${reduxUser.id}/avatar`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setAvatarUrl(avatar.data.avatarUrl);
            // Gọi API GET để lấy thông tin mới nhất sau khi update thành công
      const response = await axios.get(`https://healthsupportwebapp-edf2hybhcah3e7hr.southeastasia-01.azurewebsites.net/Account/${reduxUser.id}`);
      
      // Cập nhật Redux với dữ liệu mới nhất từ server
      dispatch(login(response.data));
      toast.success("Cập nhật avatar thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật avatar:", error);
      toast.error("Cập nhật avatar thất bại!");
    }
  };
  

  
  // Render form thông tin người dùng và đổi mật khẩu
  const renderUserInfoForm = () => (
    <div className="user-information__content">
      <div className="user-information__form">
        <div className="form-group">
          <label>Tên Đăng Nhập</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Gmail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Số điện thoại</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Vai trò</label>
          <input disabled type="text" value={reduxUser.roleName} readOnly />
        </div>
      </div>

      <div className="user-information__avatar">
      <div className="avatar-section">
    <label>Hình đại diện</label>
    <div className="avatar-container" onClick={() => document.getElementById("avatarInput")?.click()}>
      <img src={`https://healthsupportwebapp-edf2hybhcah3e7hr.southeastasia-01.azurewebsites.net/${avatarUrl}`} alt="avatar" />
      <div className="avatar-overlay">+</div>
    </div>
    <input
      type="file"
      id="avatarInput"
      accept="image/*"
      style={{ display: "none" }}
      onChange={handleAvatarChange}
    />
  </div>

        <div className="form-group">
          <label>Họ và Tên</label>
          <input
            type="text"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Địa chỉ</label>
          <textarea
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          ></textarea>
        </div>
        <div className="button-container">
          <Button
            type="primary"
            className="update-btn"
            onClick={handleUpdateUserInfo}
          >
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </div>
  );

  const renderChangePasswordForm = () => (
    <div className="user-information__change-password">
      <div className="change-password-form">
        <div className="form-group">
          <label>Mật khẩu cũ</label>
          <input
            type="password"
            placeholder="Nhập mật khẩu cũ"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Mật khẩu mới</label>
          <input
            type="password"
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Xác nhận mật khẩu</label>
          <input
            type="password"
            placeholder="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <div className="button-container">
          <Button
            type="primary"
            className="update-btn"
            onClick={handleUpdatePassword}
          >
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="user-information">
      <div className="user-information__header">
        <h2>Thông tin tài khoản chung</h2>
        <button
          className="change-password-btn"
          onClick={() => setIsChangePassword(!isChangePassword)}
        >
          <h2>{isChangePassword ? " Quay lại" : " Đổi mật khẩu"}</h2>
        </button>
      </div>
      {isChangePassword ? renderChangePasswordForm() : renderUserInfoForm()}
    </div>
  );
}

export default UserInformation;
