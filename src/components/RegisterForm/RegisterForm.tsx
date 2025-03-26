import { useState, ChangeEvent, FormEvent } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { toastConfig } from "../../types/toastConfig";
import "react-toastify/dist/ReactToastify.css";
import "./RegisterForm.scss";
import { FormData, FormErrors } from "../../types/RegisterForm";

const vietnamPhoneRegex = /^0[35789][0-9]{8}$/;

const RegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    userName: "",
    fullname: "",
    email: "",
    phone: "",
    address: "",
    passwordHash: "",
    confirmPassword: "",
    roleName: "",
    //DoB: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = useState<number>(0);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);

  const navigate = useNavigate();

  const validatePassword = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const {
      userName,
      fullname,
      email,
      phone,
      address,
      passwordHash,
      confirmPassword,
      roleName,
      //DoB,

    } = formData;

    if (!/^[A-Za-zÀ-ỹ\s]+$/.test(fullname) || fullname.trim().split(" ").length < 2) {
      newErrors.fullname = "Họ và tên phải chứa ít nhất 2 từ và chỉ bao gồm chữ cái";
    }
    if (!/^[a-zA-Z0-9_]{4,}$/.test(userName)) {
      newErrors.userName =
        "Tên người dùng phải có ít nhất 4 ký tự (không dấu, không khoảng trắng)";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Vui lòng nhập địa chỉ email hợp lệ";
    }
    if (passwordHash.length < 6) {
      newErrors.passwordHash = "Mật khẩu phải có ít nhất 6 ký tự";
    }
    else if (passwordHash.length === 25) {
      newErrors.passwordHash = "Mật khẩu không được quá 25 ký tự";
    }
    if (passwordHash !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }
    if (!roleName) {
      newErrors.roleName = "Vui lòng chọn vai trò";
    }
    if (!phone || !vietnamPhoneRegex.test(phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ (phải có 10 chữ số)";
    }
    if (address.length < 5) {
      newErrors.address = "Địa chỉ phải có ít nhất 5 ký tự";
    }
    // if (!DoB) {
    //   newErrors.DoB = "Vui lòng nhập ngày sinh";
    // } else {
    //   const today = new Date();
    //   const birthDate = new Date(DoB);
    //   let age = today.getFullYear() - birthDate.getFullYear();
    //   const monthDifference = today.getMonth() - birthDate.getMonth();
    //   if (
    //     monthDifference < 0 ||
    //     (monthDifference === 0 && today.getDate() < birthDate.getDate())
    //   ) {
    //     age--;
    //   }
    //   if (age < 6) {
    //     newErrors.DoB = "Bạn phải ít nhất 6 tuổi";
    //   }
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      try {
        const apiUrl = "http://localhost:5199/Account/Register";

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullname: formData.fullname,
            username: formData.userName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            passwordHash: formData.passwordHash,
            confirmPassword: formData.confirmPassword,
            roleName: formData.roleName
            // DoB: formData.DoB,
          }),
        });

        if (response.ok) {
          const result = await response.clone().json();
          toast.success(result.message || "Đăng ký thành công!", { ...toastConfig });
          localStorage.setItem("email", formData.email);
          setFormData({
            userName: "",
            fullname: "",
            email: "",
            phone: "",
            address: "",
            passwordHash: "",
            confirmPassword: "",
            roleName: "",
            // DoB: "",
          });
          setTimeout(() => navigate("/register-valid"), 3000);
        } else if (!response.ok) {
          const errorText = await response.clone().json();
          console.error("Error details:", errorText);
          toast.error(errorText);
        } else {
          const errorData = await response.clone().json();
          toast.error(errorData.message || "Đăng ký thất bại!", { ...toastConfig });
        }
      } catch (error: any) {
        console.error("Đăng ký lỗi:", error);
        toast.error(error.message || "Đăng ký thất bại. Vui lòng thử lại.", {
          ...toastConfig,
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.error("Hãy kiểm tra lại thông tin bạn nhập", {
        ...toastConfig,
      });
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    let error = "";

    switch (name) {
      case "fullname":
        if (!/^[A-Za-zÀ-ỹ\s]+$/.test(value) || value.trim().split(" ").length < 2) {
          error = "Họ và tên phải chứa ít nhất 2 từ và chỉ bao gồm chữ cái";
        }
        break;
      case "userName":
        if (!/^[a-zA-Z0-9_]{4,}$/.test(value)) {
          error = "Tên người dùng phải có ít nhất 4 ký tự (không dấu, không khoảng trắng)";
        }
        break;
      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Vui lòng nhập địa chỉ email hợp lệ";
        }
        break;
      case "passwordHash":
        setPasswordStrength(validatePassword(value));
        if (value.length < 6) {
          error = "Mật khẩu phải có ít nhất 6 ký tự";
        } else if (value.length === 25) {
          error = "Mật khẩu không được quá 25 ký tự";
          setTimeout(() => {
            setErrors((prev) => ({
              ...prev,
              [name]: "",
            }));
          }, 3000);
        }
        break;
      case "confirmPassword":
        if (value !== formData.passwordHash) {
          error = "Mật khẩu xác nhận không khớp";
        }
        break;
      case "roleName":
        if (!value) {
          error = "Vui lòng chọn vai trò";
        }
        break;
      case "phone":
        if (!vietnamPhoneRegex.test(value)) {
          error = "Số điện thoại không hợp lệ (phải có 10 chữ số)";
        }
        break;
      case "address":
        if (value.length < 5) {
          error = "Địa chỉ phải có ít nhất 5 ký tự";
        }
        break;
      // case "DoB":
      //   if (!value) {
      //     error = "Vui lòng nhập ngày sinh";
      //   } else {
      //     const today = new Date();
      //     const birthDate = new Date(value);
      //     let age = today.getFullYear() - birthDate.getFullYear();
      //     const monthDifference = today.getMonth() - birthDate.getMonth();
      //     if (
      //       monthDifference < 0 ||
      //       (monthDifference === 0 && today.getDate() < birthDate.getDate())
      //     ) {
      //       age--;
      //     }
      //     if (age < 6) {
      //       error = "Bạn phải ít nhất 6 tuổi";
      //     }
      //     if (age > 100) {
      //       error = "Really? Are you sure you are over 100 years old?";
      //     }
      //   }
      //   break;
      default:
        break;
    }

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  return (
    <div className="register-page">
      <div className="registration-container">
        <div className="registration-wrapper">
          <div className="registration-background"></div>
          <div className="registration-form-container">
            <div className="registration-form-wrapper">
              <div className="registration-form-content">
                <h2 className="registration-title">Đăng Ký Tài Khoản</h2>
                <form onSubmit={handleSubmit} className="registration-form">
                  {currentStep === 1 && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Họ và Tên</label>
                        <input
                          type="text"
                          name="fullname"
                          value={formData.fullname}
                          onChange={handleChange}
                          placeholder="vd: Nguyễn Văn A"
                          className={`form-input ${errors.fullname ? "input-error" : ""}`}
                        />
                        {errors.fullname && (
                          <p className="error-message">{errors.fullname}</p>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="roleName">Vai trò</label>
                        <select
                          id="roleName"
                          name="roleName"
                          value={formData.roleName}
                          onChange={handleChange}
                          className={`form-input ${errors.roleName ? "input-error" : ""}`}
                        >
                          <option value="">Chọn vai trò</option>
                          <option value="Student">Học Sinh</option>
                          <option value="Parent">Phụ Huynh</option>
                          <option value="Manager">Quản Trị Viên</option>
                        </select>
                        {errors.roleName && (
                          <p className="error-message">{errors.roleName}</p>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="vd: a@a.com"
                          className={`form-input ${errors.email ? "input-error" : ""}`}
                        />
                        {errors.email && <p className="error-message">{errors.email}</p>}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Số điện thoại</label>
                        <div className="phone-input-container">
                          <PhoneInput
                            country={'vn'}
                            onlyCountries={['vn']}
                            disableDropdown={true}
                            disableCountryCode={true}
                            disableCountryGuess={true}
                            specialLabel="Số điện thoại"
                            placeholder="vd: 0912345678"
                            value={formData.phone}
                            onChange={(phone) => setFormData({ ...formData, phone })}
                            inputClass={`form-input ${errors.phone ? "input-error" : ""}`}
                            containerClass="phone-input"
                            inputProps={{
                              name: 'phone',
                              required: true,
                              autoFocus: true
                            }}
                          />
                          {errors.phone && <span className="error-message">{errors.phone}</span>}
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Địa chỉ</label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="vd: 123 Đường ABC, Quận XYZ, TP HCM"
                          className={`form-input ${errors.address ? "input-error" : ""}`}
                        />
                        {errors.address && <p className="error-message">{errors.address}</p>}
                      </div>

                      <div className="form-buttons">
                        <button type="button" onClick={() => setCurrentStep(2)} className="next-button">
                          Tiếp
                        </button>
                      </div>
                    </>
                  )}

                  {currentStep === 2 && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Tên người dùng</label>
                        <input
                          type="text"
                          name="userName"
                          value={formData.userName}
                          onChange={handleChange}
                          placeholder="vd: nguyenvana"
                          className={`form-input ${errors.userName ? "input-error" : ""}`}
                        />
                        {errors.userName && (
                          <p className="error-message">{errors.userName}</p>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Mật khẩu</label>
                        <div className="password-input-container">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="passwordHash"
                            value={formData.passwordHash}
                            onChange={handleChange}
                            placeholder="Mật khẩu từ 6 ký tự"
                            autoComplete="new-password"
                            spellCheck="false"
                            maxLength={25}
                            className={`form-input ${errors.passwordHash ? "input-error" : ""}`}
                          />
                          <button
                            type="button"
                            className="password-toggle-button"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? "Ẩn" : "Hiện"}
                          </button>
                        </div>
                        {errors.passwordHash && (
                          <p className="error-message">{errors.passwordHash}</p>
                        )}
                      </div>

                      <div className="password-strength">
                        <div
                          className={`strength-meter strength-${passwordStrength}`}
                        ></div>
                        <span className="strength-status">
                          {
                            ["Yếu", "Trung bình", "Khá", "Mạnh"][passwordStrength - 1]
                          }
                        </span>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Xác nhận mật khẩu</label>
                        <div className="password-input-container">
                          <input
                            type={showPasswordConfirmation ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Xác nhận mật khẩu"
                            autoComplete="new-password"
                            spellCheck="false"
                            maxLength={25}
                            className={`form-input ${errors.confirmPassword ? "input-error" : ""}`}
                          />
                          <button
                            type="button"
                            className="password-toggle-button"
                            onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                          >
                            {showPasswordConfirmation ? "Ẩn" : "Hiện"}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="error-message">{errors.confirmPassword}</p>
                        )}
                      </div>

                      <div className="form-buttons">
                        <button type="button" onClick={() => setCurrentStep(1)} className="back-button">
                          Quay lại
                        </button>
                        <button type="submit" disabled={isLoading} className="submit-button">
                          {isLoading ? "Đang đăng ký..." : "Đăng ký"}
                        </button>
                      </div>
                    </>
                  )}
                </form>
                <ToastContainer />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;

