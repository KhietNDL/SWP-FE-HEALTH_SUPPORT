import axios, { AxiosInstance } from "axios";


const API_BASE_URL = "http://localhost:5199";

// Create an Axios instance with authentication
export const getAuthAxios = (): AxiosInstance => {
  const token = sessionStorage.getItem("token");
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

// Generic error handler
const handleApiError = (error: any, errorMessage: string) => {
  console.error(`${errorMessage}:`, error); // Ghi lỗi vào console
  throw error; // Tiếp tục ném lỗi để xử lý ở nơi gọi hàm
};

// Account API calls
export const accountApi = {
  getAll: async () => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.get("/Account");
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi lấy danh sách tài khoản");
    }
  },

  getById: async (accountId: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.get(`/Account/${accountId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi lấy thông tin tài khoản");
    }
  },
};

// Survey Type API calls
export const surveyTypeApi = {
  getAll: async () => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.get("/SurveyType");
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi lấy danh sách loại khảo sát");
    }
  },

  getBySurveyTypeId: async (surveyTypeId: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.get(`/SurveyType/${surveyTypeId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi lấy thông tin loại khảo sát");
    }
  },

  create: async (surveyName: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.post("/SurveyType", { surveyName });
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi tạo loại khảo sát mới");
    }
  },

  update: async (surveyTypeId: string, surveyName: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.put(`/SurveyType/${surveyTypeId}`, { surveyName });
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi cập nhật loại khảo sát");
    }
  },

  delete: async (surveyTypeId: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.delete(`/SurveyType/${surveyTypeId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi xóa loại khảo sát");
    }
  },
};

// Survey API calls
export const surveyApi = {
  getAll: async () => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.get("/Survey");
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi lấy danh sách khảo sát");
    }
  },

  getById: async (surveyId: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.get(`/Survey/${surveyId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi lấy thông tin khảo sát");
    }
  },

  create: async (maxScore: number, surveyTypeId: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.post("/Survey", { maxScore, surveyTypeId, questionList: [] });
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi tạo khảo sát mới");
    }
  },

  update: async (surveyId: string, maxScore: number) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.put(`/Survey/${surveyId}`, { maxScore });
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi cập nhật khảo sát");
    }
  },

  delete: async (surveyId: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.delete(`/Survey/${surveyId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi xóa khảo sát");
    }
  },
};

// Question API calls
export const questionApi = {
  create: async (surveyId: string, contentQ: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.post(`/api/SurveyQuestion/${surveyId}`, [{ contentQ, answersList: [] }]);
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi tạo câu hỏi mới");
    }
  },

  update: async (questionId: string, contentQ: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.put(`/api/SurveyQuestion/${questionId}`, { contentQ });
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi cập nhật câu hỏi");
    }
  },

  delete: async (questionId: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.delete(`/api/SurveyQuestion/${questionId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi xóa câu hỏi");
    }
  },
};

// Answer API calls
export const answerApi = {
  create: async (questionId: string, content: string, point: number) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.post(`/api/SurveyAnswer/${questionId}`, { content, point });
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi tạo câu trả lời mới");
    }
  },

  update: async (answerId: string, content: string, point: number) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.put(`/api/SurveyAnswer/${answerId}`, { content, point });
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi cập nhật câu trả lời");
    }
  },

  delete: async (answerId: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.delete(`/api/SurveyAnswer/${answerId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi xóa câu trả lời");
    }
  },
};

// AccountSurvey API calls
export const AccountSurveyApi = {
  getAllAccountSurvey: async () => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.get("/api/AccountSurvey");
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi lấy danh sách khảo sát");
    }
  },

  postAccountSurvey: async (accountId: string, surveyId: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.post(`/api/AccountSurvey`, { accountId, surveyId });
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi lưu khảo sát");
    }
  },

  getAccountSurveyByAccountSurveyId: async (accountSurveyId: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.get(`/api/AccountSurvey/${accountSurveyId}/byId`);
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi lấy khảo sát");
    }
  },

  getAccountSurveyByAccountId: async (accountId: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.get(`/api/AccountSurvey/${accountId}/byAccountId`);
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi lấy khảo sát");
    }
  },

  getAccountSurveyBySurveyId: async (surveyId: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.get(`/api/AccountSurvey/${surveyId}/bySurveyId`);
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi lấy khảo sát");
    }
  },

  delete: async (accountSurveyId: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.delete(`/api/AccountSurvey/${accountSurveyId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi xóa khảo sát");
    }
  },
};

// SurveyAnswerRecord API calls
export const SurveyAnswerRecordApi = {
  getSurveyAnswerRecordByAccountSurveyId: async (accountSurveyId: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.get(`/api/SurveyAnswerRecord/${accountSurveyId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi lấy kết quả khảo sát");
    }
  },

  postSurveyAnswerRecord: async (accountSurveyId: string, questionAndAnswerRequests: { surveyQuestionId: string; surveyAnswerId: string }[]) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.post(`/api/SurveyAnswerRecord`, { accountSurveyId, questionAndAnswerRequests });
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi lưu kết quả khảo sát");
    }
  },

  delete: async (surveyAnswerRecordId: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.delete(`/api/SurveyAnswerRecord/${surveyAnswerRecordId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi xóa kết quả khảo sát");
    }
  }
};

//SurveyResult API calls
export const SurveyResultApi = {
  getAll: async () => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.get("/api/SurveyResults");
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi lấy danh sách kết quả khảo sát");
    }
  },
  getBySurveyId: async (surveyId: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.get(`/api/SurveyResults/${surveyId}/SurveyResults`);
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi lấy kết quả khảo sát");
    }
  },
  delete: async (SurveyResultsId: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.delete(`/api/SurveyResults/${SurveyResultsId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi xóa kết quả khảo sát");
    }
  },
  post: async (resultDescription: string, surveyId: string, maxScore: number, minScore: number) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.post("/api/SurveyResults", { resultDescription, surveyId, maxScore, minScore });
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi tạo kết quả khảo sát mới");
    }
  }
};

//Order API calls
export const OrderApi = {
  getAll: async () => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.get("/Order");
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi lấy danh sách đơn hàng");
    }
  }
}

//Appointment API calls
export const AppointmentApi = {
  getAll: async () => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.get("/Appointment");
      return response.data;
    } catch (error) {
      handleApiError(error, "Lỗi khi lấy danh sách cuộc hẹn");
    }
  }
}
