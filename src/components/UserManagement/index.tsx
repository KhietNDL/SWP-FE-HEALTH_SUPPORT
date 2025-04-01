import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  Pencil,
  Trash2,
} from "lucide-react";
import "./index.scss";
import { User } from "../../types/user";
import { useNavigate } from "react-router-dom";
import avt from "../../images/User.png";
import axios from "axios";
const UserManagement: React.FC = () => {
  // Khởi tạo state users là mảng rỗng
  const [users, setUsers] = useState<User[]>([]);

  // Các state khác vẫn giữ nguyên
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("All");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User>({
    id: "",
    userName: "",
    fullname: "",
    email: "",
    phone: 0,
    address: "",
    roleName: "Student",
    imgUrl: "",
  });

  // State dành cho mật khẩu khi thêm mới user
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  // Lấy dữ liệu từ API khi component mount
  useEffect(() => {
    fetch("http://localhost:5199/Account")
      .then((response) => response.json())
      .then((data: User[]) => setUsers(data))
      .catch((error) => console.error("Error fetching users: ", error));
  }, []);

  // Lọc users theo searchTerm & selectedRole
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.userName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.fullname || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      selectedRole === "All" || user.roleName === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Mở modal chỉnh sửa user
  const handleOpenEditModal = (user: User) => {
    setEditingUserId(user.id);
    setCurrentUser(user);
    setShowModal(true);
  };

  // Đóng modal và reset lại state
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUserId(null);
    setCurrentUser({
      id: "",
      userName: "",
      fullname: "",
      email: "",
      phone: 0,
      address: "",
      roleName: "User",
      imgUrl: "",
    });
    setPassword("");
    setConfirmPassword("");
  };

  // Xử lý submit user (cả thêm mới và cập nhật)
  const handleSubmitUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Nếu đang thêm mới user, kiểm tra mật khẩu và confirm password
    if (!editingUserId) {
      if (password !== confirmPassword) {
        alert("Mật khẩu và nhập lại mật khẩu không khớp!");
        return;
      }
      // Gán mật khẩu vào currentUser nếu API yêu cầu
      (currentUser as any).password = password;
    }

    if (editingUserId) {
      // Update user qua PUT
      fetch(`http://localhost:5199/Account/${editingUserId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(currentUser),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Lỗi cập nhật user");
          }
          return response.json();
        })
        .then(() => {
          // Sau PUT, gọi GET để lấy user mới nhất
          return fetch(`http://localhost:5199/Account/${editingUserId}`);
        })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Lỗi lấy user sau cập nhật");
          }
          return response.json();
        })
        .then((updatedUser: User) => {
          // Cập nhật state users với user mới cập nhật
          setUsers((prev) =>
            prev.map((u) => (u.id === editingUserId ? updatedUser : u))
          );
          handleCloseModal();
        })
        .catch((error) => console.error("Error updating user:", error));
    } else {
      // Thêm mới user qua POST với API Register
      fetch("http://localhost:5199/Account/Register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(currentUser),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Lỗi tạo user mới");
          }
          return response.json();
        })
        .then((newUser: User) => {
          setUsers([...users, newUser]);
          handleCloseModal();
        })
        .catch((error) => console.error("Error creating user:", error));
    }
  };

  const handleDeleteUser = (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản này không?")) {
      return;
    }
    fetch(`http://localhost:5199/Account/${id}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Lỗi xoá user");
        }
        // Sau khi xoá thành công trên server, cập nhật lại state
        setUsers((prev) => prev.filter((user) => user.id !== id));
      })
      .catch((error) => console.error("Error deleting user:", error));
  };
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingUserId) { 
      const formData = new FormData();
      formData.append("file", file);
      console.log("Uploading for user ID:", formData);
      console.log("Uploading for user ID:", editingUserId);
      try {
        await axios.put(
          `http://localhost:5199/Account/${editingUserId}/avatar`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
  
      } catch (error) {
        console.error("Lỗi tải ảnh: ", error);
      }
    }
  };
  

  const navigate = useNavigate();

  const handleCreateUser = () => {
    navigate("/register");
  };
  return (
    <div className="user-container">
      {/* HEADER */}
      <div className="user-header">
        <h2>User Management</h2>

        <button className="add-button" onClick={handleCreateUser}>
          <Plus size={16} /> Add New User
        </button>
      </div>

      {/* CONTROLS: Search + Filter */}
      <div className="user-controls">
        <div className="search-bar">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by username or full name..."
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
            Role: {selectedRole}
            <ChevronDown size={16} />
          </button>
          {showDropdown && (
            <ul className="dropdown-menu">
              {["All", "Manager", "Student", "Parent"].map((role) => (
                <li
                  key={role}
                  onClick={() => {
                    setSelectedRole(role);
                    setShowDropdown(false);
                  }}
                >
                  {role}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* TABLE */}
      <table className="user-table">
        <thead>
          <tr>
            <th>Avatar</th>
            <th>Username</th>
            <th>Fullname</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.id}>
              <td>
                {user.imgUrl ? (
                  <img
                    src={`http://localhost:5199${user.imgUrl}`}
                    alt="avatar"
                    style={{ width: 40, height: 40, borderRadius: "50%" }}
                  />
                ) : (
                  <img
                    src={avt}
                    alt="avatar"
                    style={{ width: 40, height: 40, borderRadius: "50%" }}
                  />
                )}
              </td>
              <td>{user.userName}</td>
              <td>{user.fullname}</td>
              <td>{user.email}</td>
              <td>{user.phone}</td>
              <td>{user.address}</td>
              <td>{user.roleName}</td>
              <td>
                <button
                  className="edit-button"
                  onClick={() => handleOpenEditModal(user)}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="delete-button"
                  onClick={() => handleDeleteUser(user.id)}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL (Add/Edit) */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingUserId ? "Edit User" : "Create New User"}</h3>
            <form onSubmit={handleSubmitUser}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={currentUser.userName}
                  onChange={(e) =>
                    setCurrentUser({ ...currentUser, userName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Fullname</label>
                <input
                  type="text"
                  value={currentUser.fullname}
                  onChange={(e) =>
                    setCurrentUser({ ...currentUser, fullname: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={currentUser.email}
                  onChange={(e) =>
                    setCurrentUser({ ...currentUser, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="number"
                  value={currentUser.phone}
                  onChange={(e) =>
                    setCurrentUser({
                      ...currentUser,
                      phone: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={currentUser.address}
                  onChange={(e) =>
                    setCurrentUser({ ...currentUser, address: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  disabled
                  value={currentUser.roleName}
                  onChange={(e) =>
                    setCurrentUser({
                      ...currentUser,
                      roleName: e.target.value,
                    })
                  }
                >
                  <option value="Manager">Manager</option>
                  <option value="Student">Student</option>
                  <option value="Parent">Parent</option>
                </select>
              </div>
              <div className="form-group">
                <label>Avatar</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                
              </div>
              {/* Hiển thị các trường mật khẩu chỉ khi thêm mới user */}
              {!editingUserId && (
                <>
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}
              <div className="modal-actions">
                <button type="button" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit">
                  {editingUserId ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
