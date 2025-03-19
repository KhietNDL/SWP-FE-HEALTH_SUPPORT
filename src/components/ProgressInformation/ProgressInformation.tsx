import React, { useState, useEffect } from 'react';
import './ProgressInformation.scss';

// Define TypeScript interfaces
interface CourseSession {
    id: number;
    description: string;
    startDate: string;
    subscriptionId: number;
    createAt: string;
    modifiedAt: string;
    isDeleted: boolean;
    session: number;
  }
  
  const CourseProgress: React.FC = () => {
    // State management
    const [sessions, setSessions] = useState<CourseSession[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [activeSession, setActiveSession] = useState<number | null>(null);
  
    // Fetch data from API
    useEffect(() => {
      const fetchSessions = async () => {
        try {
          // Replace with actual API call
          const data: CourseSession[] = [
            {
              id: 1,
              description: "Giới thiệu về khóa học và phương pháp học tập hiệu quả. Trong buổi này, học viên sẽ được làm quen với nội dung chính của khóa học, các mục tiêu cần đạt được và phương pháp học tập phù hợp.",
              startDate: "2023-09-01T09:00:00",
              subscriptionId: 101,
              createAt: "2023-08-15T10:30:00",
              modifiedAt: "2023-08-20T14:20:00",
              isDeleted: false,
              session: 1
            },
            {
              id: 2,
              description: "Các kỹ năng cơ bản trong phát triển phần mềm. Học viên sẽ được giới thiệu về quy trình phát triển phần mềm, các công cụ cần thiết và cách thức tổ chức mã nguồn hiệu quả.",
              startDate: "2023-09-03T09:00:00",
              subscriptionId: 101,
              createAt: "2023-08-15T10:35:00",
              modifiedAt: "2023-08-21T09:15:00",
              isDeleted: false,
              session: 2
            },
            {
              id: 3,
              description: "Thực hành với công cụ phát triển và môi trường làm việc. Buổi này sẽ hướng dẫn học viên cài đặt và sử dụng các IDE, quản lý phiên bản với Git và thực hành quy trình làm việc nhóm.",
              startDate: "2023-09-05T09:00:00",
              subscriptionId: 101,
              createAt: "2023-08-15T10:40:00",
              modifiedAt: "2023-08-22T16:45:00",
              isDeleted: false,
              session: 3
            },
            {
              id: 4,
              description: "Kiến trúc phần mềm và nguyên tắc thiết kế. Học viên sẽ được tìm hiểu về các pattern phổ biến, nguyên tắc SOLID và cách áp dụng vào dự án thực tế.",
              startDate: "2023-09-08T09:00:00",
              subscriptionId: 101,
              createAt: "2023-08-15T10:45:00",
              modifiedAt: "2023-08-23T11:30:00",
              isDeleted: false,
              session: 4
            },
            {
              id: 5,
              description: "Phát triển ứng dụng web: Front-end basics. Buổi học tập trung vào HTML, CSS, JavaScript và các framework phổ biến trong phát triển giao diện người dùng.",
              startDate: "2023-09-10T09:00:00",
              subscriptionId: 101,
              createAt: "2023-08-15T10:50:00",
              modifiedAt: "2023-08-24T13:25:00",
              isDeleted: false,
              session: 5
            }
          ];
          
          setSessions(data);
          if (data.length > 0) {
            setActiveSession(data[0].id);
          }
          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching session data:", error);
          setIsLoading(false);
        }
      };
  
      fetchSessions();
    }, []);
  
    // Format date for display
    const formatDate = (dateString: string): string => {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', { 
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };
  
    // Get current session details
    const getCurrentSession = () => {
      return sessions.find(s => s.id === activeSession);
    };
  
    return (
      <div className="course-container">
        <div className="course-content">
          <h1 className="course-title">Đánh giá sự phát triển</h1>
          
          <div className="content-layout">
            {/* Session navigation sidebar */}
            <div className="sessions-sidebar">
              <h2 className="sidebar-title">Buổi học</h2>
              {isLoading ? (
                <div className="loading">Đang tải...</div>
              ) : (
                <div className="sessions-list">
                  {sessions.map(session => (
                    <div 
                      key={session.id}
                      className={`session-item ${session.id === activeSession ? 'active' : ''}`}
                      onClick={() => setActiveSession(session.id)}
                    >
                      <div className="session-number">Buổi {session.session}</div>
                      <div className="session-date">{formatDate(session.startDate)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Session content area */}
            <div className="session-content-area">
              {isLoading ? (
                <div className="loading">Đang tải nội dung...</div>
              ) : activeSession ? (
                <div className="session-details">
                  <div className="session-header">
                    <h2>Buổi {getCurrentSession()?.session}: Chi tiết</h2>
                    <div className="session-meta">
                      Ngày bắt đầu: {formatDate(getCurrentSession()?.startDate || '')}
                    </div>
                  </div>
                  <div className="session-description">
                    <h3>Mô tả buổi học</h3>
                    <p>{getCurrentSession()?.description}</p>
                  </div>
                  <div className="session-info">
                    <div className="info-item">
                      <span className="info-label">Mã khóa học:</span>
                      <span className="info-value">{getCurrentSession()?.subscriptionId}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Ngày tạo:</span>
                      <span className="info-value">{formatDate(getCurrentSession()?.createAt || '')}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Cập nhật:</span>
                      <span className="info-value">{formatDate(getCurrentSession()?.modifiedAt || '')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-session">
                  <p>Vui lòng chọn một buổi học từ danh sách bên trái</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

export default CourseProgress;