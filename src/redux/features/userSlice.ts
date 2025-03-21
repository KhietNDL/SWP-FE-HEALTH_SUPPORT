import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../../types/user";

// Lấy dữ liệu từ localStorage khi Redux khởi động
const storedUser = localStorage.getItem("userInfo");

const initialState: User | null = storedUser ? JSON.parse(storedUser) : null;

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<User>) => {
      localStorage.setItem("userInfo", JSON.stringify(action.payload)); // Lưu vào localStorage
      return action.payload;
    },
    logout: () => {
      localStorage.removeItem("userInfo"); // Xóa khỏi localStorage khi logout
      localStorage.removeItem("BearerToken");
      sessionStorage.removeItem("token");
      return null;
    },
    updateUserInfo: (state, action) => {
      // Cập nhật các thuộc tính của user theo dữ liệu mới
      state.userName = action.payload.userName || state.userName;
      state.fullname = action.payload.fullname || state.fullname;
      state.email = action.payload.email || state.email;
      state.phone = action.payload.phone || state.phone;
      state.address = action.payload.address || state.address;
      // Nếu API trả về avatar mới, bạn cũng có thể cập nhật ở đây:
      state.imgUrl = action.payload.imgUrl || state.imgUrl;
      // Cập nhật thêm các thuộc tính khác nếu cần
      localStorage.setItem("userInfo", JSON.stringify(state));
    },
  },
});

export const { login, logout, updateUserInfo } = userSlice.actions;
export default userSlice.reducer;
