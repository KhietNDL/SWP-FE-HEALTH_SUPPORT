import { toast, ToastOptions } from 'react-toastify';

// Cấu hình mặc định
export const toastConfig: ToastOptions = {
  position: "top-center",
  closeButton: false,
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: false,
  draggable: true,
  progress: undefined,
  theme: "dark",
};

// Hoặc nếu toastService đã được sử dụng ở UserSurveyList, thêm export dưới đây:
export const toastService = {
  success: (message: string) => toast.success(message, toastConfig),
  error: (message: string) => toast.error(message, toastConfig),
  info: (message: string) => toast.info(message, toastConfig),
  warning: (message: string) => toast.warning(message, toastConfig),
};