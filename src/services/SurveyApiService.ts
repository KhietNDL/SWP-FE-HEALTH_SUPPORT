import axios, { AxiosInstance } from "axios";
import { toast } from "react-toastify";
import { toastConfig } from "../types/toastConfig";

const API_BASE_URL = "http://localhost:5199";

// Tạo instance axios có authentication
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

// Survey Type API calls
export const surveyTypeApi = {
  getAll: async () => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.get("/SurveyType");
      return response.data;
    } catch (error) {
      toast.error("Lỗi khi lấy danh sách loại khảo sát", toastConfig);
      throw error;
    }
  },

  create: async (surveyName: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.post("/SurveyType", { surveyName });
      return response.data;
    } catch (error) {
      toast.error("Lỗi khi tạo loại khảo sát mới", toastConfig);
      throw error;
    }
  },

  update: async (surveyTypeId: string, surveyName: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.put(`/SurveyType/${surveyTypeId}`, { surveyName });
      return response.data;
    } catch (error) {
      toast.error("Lỗi khi cập nhật loại khảo sát", toastConfig);
      throw error;
    }
  },

  delete: async (surveyTypeId: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.delete(`/SurveyType/${surveyTypeId}`);
      return response.data;
    } catch (error) {
      toast.error("Lỗi khi xóa loại khảo sát", toastConfig);
      throw error;
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
      toast.error("Lỗi khi lấy danh sách khảo sát", toastConfig);
      throw error;
    }
  },

  getById: async (surveyId: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.get(`/Survey/${surveyId}`);
      return response.data;
    } catch (error) {
      toast.error("Lỗi khi lấy thông tin khảo sát", toastConfig);
      throw error;
    }
  },

  create: async (maxScore: number, surveyTypeId: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.post("/Survey", {
        maxScore,
        surveyTypeId,
        questionList: [],
      });
      return response.data;
    } catch (error) {
      toast.error("Lỗi khi tạo khảo sát mới", toastConfig);
      throw error;
    }
  },

  update: async (surveyId: string, maxScore: number) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.put(`/Survey/${surveyId}`, { maxScore });
      return response.data;
    } catch (error) {
      toast.error("Lỗi khi cập nhật khảo sát", toastConfig);
      throw error;
    }
  },

  delete: async (surveyId: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.delete(`/Survey/${surveyId}`);
      return response.data;
    } catch (error) {
      toast.error("Lỗi khi xóa khảo sát", toastConfig);
      throw error;
    }
  },
};

// Question API calls
export const questionApi = {
  create: async (surveyId: string, contentQ: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.post(`http://localhost:5199/api/SurveyQuestion/${surveyId}`, [
        {
          contentQ,
          answersList: [],
        },
      ]);
      return response.data;
    } catch (error) {
      toast.error("Lỗi khi tạo câu hỏi mới", toastConfig);
      throw error;
    }
  },

  update: async (questionId: string, contentQ: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.put(`http://localhost:5199/api/SurveyQuestion/${questionId}`, {
        contentQ,
      });
      return response.data;
    } catch (error) {
      toast.error("Lỗi khi cập nhật câu hỏi", toastConfig);
      throw error;
    }
  },

  delete: async (questionId: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.delete(`http://localhost:5199/api/SurveyQuestion/${questionId}`);
      return response.data;
    } catch (error) {
      toast.error("Lỗi khi xóa câu hỏi", toastConfig);
      throw error;
    }
  },
};

// Answer API calls
export const answerApi = {
  create: async (questionId: string, content: string, point: number) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.post(`http://localhost:5199/api/SurveyAnswer/${questionId}`, {
        content,
        point,
      });
      return response.data;
    } catch (error) {
      toast.error("Lỗi khi tạo câu trả lời mới", toastConfig);
      throw error;
    }
  },

  update: async (answerId: string, content: string, point: number) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.put(`http://localhost:5199/api/SurveyAnswer/${answerId}`, {
        content,
        point,
      });
      return response.data;
    } catch (error) {
      toast.error("Lỗi khi cập nhật câu trả lời", toastConfig);
      throw error;
    }
  },

  delete: async (answerId: string) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.delete(`http://localhost:5199/api/SurveyAnswer/${answerId}`);
      return response.data;
    } catch (error) {
      toast.error("Lỗi khi xóa câu trả lời", toastConfig);
      throw error;
    }
  },
};

// Survey Result API calls
export const surveyResultApi = {
  saveResult: async (surveyId: string, score: number, answers: Record<string, string>) => {
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.post(`/api/SurveyResult`, {
        surveyId,
        score,
        answers,
      });
      return response.data;
    } catch (error) {
      toast.error("Lỗi khi lưu kết quả khảo sát", toastConfig);
      throw error;
    }
  },
};