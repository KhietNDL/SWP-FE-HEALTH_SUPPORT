import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, List, Button, Spin, notification } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import axios from 'axios';
import './ClassDetail.scss';

const { Title, Text } = Typography;

interface UserProgress {
  id: string;
  accountId: string;
  accountName: string;
  section: number;
  isCompleted: boolean;
  description: string;
  date: number;
  subscriptionId: string;
  subscriptionName: string;  // Add this field
  createAt: string;         // Add this field
  modifiedAt: string;       // Add this field
}

interface Order {
  id: string;
  accountId: string;
  accountName: string;
  subscriptionName: string;
  isJoined: boolean;
}

interface Account {
  id: string;
  fullname: string;
  email: string;
  userName: string;
  // ...other fields
}

interface SubscriptionProgress {
  id: string;
  section: number;
  description: string;
  date: number;
  startDate: string;
  subscriptionName: string;
  isCompleted: boolean;
  createAt: string;
  modifiedAt: string | null;
}

const ClassDetail: React.FC = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const [sections, setSections] = useState<number[]>([]);
  const [participants, setParticipants] = useState<Order[]>([]);
  const [activeSection, setActiveSection] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [sectionProgress, setSectionProgress] = useState<SubscriptionProgress[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  // Fetch sections and participants
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
       
        // Get current subscription data first
        const subscriptionResponse = await axios.get(`http://localhost:5199/Subscription/${programId}`);
        const currentSubscription = subscriptionResponse.data;
       
        // Fetch accounts first
        const accountsResponse = await axios.get('http://localhost:5199/Account');
        const accountsData = accountsResponse.data;
        setAccounts(accountsData);

        // Fetch progress sections
        const progressResponse = await axios.get(`http://localhost:5199/SubscriptionProgress?subscriptionId=${programId}`);
        const uniqueSections = [...new Set(progressResponse.data.map((p: any) => p.section))];
        setSections(uniqueSections.sort((a, b) => a - b));
        setSectionProgress(progressResponse.data); // Save the progress data

        // Get all user progress with exact matching conditions
        const userProgressResponse = await axios.get('http://localhost:5199/UserProgress');
        
        // First get orders to know which accounts are participating
        const ordersResponse = await axios.get(`http://localhost:5199/Order`);
        const joinedOrders = ordersResponse.data.filter((order: Order) => 
          order.isJoined === true && 
          order.subscriptionName === currentSubscription.subscriptionName
        ).map((order: Order) => {
          const account = accountsData.find(acc => acc.fullname === order.accountName);
          return {
            ...order,
            accountId: account?.id,
            userName: account?.userName
          };
        });

        // Store all valid progress
        const allProgress = userProgressResponse.data.filter((progress: any) => 
          progress.subscriptionName === currentSubscription.subscriptionName &&
          !progress.isDeleted
        );

        console.log('Initial Progress Data:', allProgress);
        setUserProgress(allProgress);
        setParticipants(joinedOrders);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, [programId]);

  // Update the useEffect to set currentSubscription
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const subscriptionResponse = await axios.get(`http://localhost:5199/Subscription/${programId}`);
        setCurrentSubscription(subscriptionResponse.data);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    };
    fetchSubscription();
  }, [programId]);

  const handleComplete = async (accountId: string, section: number) => {
    if (!accountId) {
      notification.error({
        message: 'Lỗi',
        description: 'Không tìm thấy accountId của học viên'
      });
      return;
    }
    try {
      const currentDate = Math.floor(Date.now() / 1000);
      // Create new progress
      const createPayload = {
        section,
        description: "Đã tham gia các hoạt động và bài tập tại lớp",
        date: currentDate,
        subscriptionId: programId,
        accountId: accountId,
        isCompleted: false
      };
      console.log('Create payload:', createPayload);
      // Create UserProgress
      const createResponse = await axios.post(
        'http://localhost:5199/UserProgress/Create',
        createPayload
      );
      if (!createResponse.data) {
        throw new Error('Failed to create UserProgress');
      }
      // Fetch the newly created UserProgress to get its ID
      const userProgressList = await axios.get(
        `http://localhost:5199/UserProgress?accountId=${accountId}&subscriptionId=${programId}`
      );

      // Tìm progress mới nhất theo createAt
      const createdUserProgress = userProgressList.data
        .filter((up: any) => up.section === section)
        .sort((a: any, b: any) => 
          new Date(b.createAt).getTime() - new Date(a.createAt).getTime()
        )[0];

      if (!createdUserProgress) {
        throw new Error('Failed to find the newly created UserProgress');
      }

      // Update the progress to completed
      const updatePayload = {
        ...createdUserProgress,
        isCompleted: true,
        isDeleted: false
      };

      console.log('Update payload for ID:', createdUserProgress.id);
      
      const updateResponse = await axios.put(
        `http://localhost:5199/UserProgress/${createdUserProgress.id}`,
        updatePayload
      );

      if (!updateResponse.data) {
        throw new Error('Failed to update UserProgress');
      }

      // Fetch lại progress sau khi update để đảm bảo dữ liệu mới nhất
      const updatedProgressResponse = await axios.get(
        `http://localhost:5199/UserProgress/${createdUserProgress.id}`
      );
      
      const finalProgress = updatedProgressResponse.data;
      console.log('Final progress after update:', finalProgress);

      // Update state với dữ liệu mới nhất
      setUserProgress(prev => [...prev, finalProgress]);
      notification.success({
        message: 'Cập nhật thành công',
        description: 'Đã cập nhật tiến độ cho học viên'
      });
    } catch (error: any) {
      console.error('Error in handleComplete:', error);
      notification.error({
        message: 'Lỗi',
        description: error.message || 'Không thể cập nhật tiến độ'
      });
    }
  };

  if (loading) {
    return <Spin size="large" className="loading-spinner" />;
  }

  return (
    <div className="class-detail">
      <div className="header-actions">
        <Button 
          onClick={() => navigate(-1)}
          className="back-button"
          icon={<ArrowLeftOutlined />}
        >
          Quay lại
        </Button>
      </div>
      <Row gutter={24}>
        <Col span={6} className="sections-list">
          <Card title="Danh sách buổi học">
            <List
              dataSource={sections}
              renderItem={section => {
                const progress = sectionProgress.find(p => 
                  p.section === section && 
                  p.subscriptionName === currentSubscription.subscriptionName
                );
                return (
                  <List.Item
                    className={`section-item ${activeSection === section ? 'active' : ''}`}
                    onClick={() => setActiveSection(section)}
                  >
                    <div>
                      <Text>Buổi {section}</Text>
                      {progress && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          {new Date(progress.startDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>
        <Col span={18} className="participants-list">
          <Card title={`Danh sách học viên - Buổi ${activeSection}`}>
            <List
              dataSource={participants}
              renderItem={participant => {
                // Find the account with matching fullname to get userName
                const account = accounts.find(acc => acc.fullname === participant.accountName);
                const userName = account?.userName;
                const progress = userProgress.find(
                  p => 
                    p.accountName === userName && // Kiểm tra userName
                    p.section === activeSection && // Kiểm tra section hiện tại
                    p.subscriptionName === participant.subscriptionName && // Kiểm tra subscriptionName
                    p.isCompleted === true // Chỉ lấy những progress đã hoàn thành
                );

                // Find the section progress to check startDate
                const sectionProgressData = sectionProgress.find(p => 
                  p.section === activeSection && 
                  p.subscriptionName === participant.subscriptionName
                );
                
                // Check if current date is before startDate
                const isBeforeStartDate = sectionProgressData && sectionProgressData.startDate
                  ? new Date() < new Date(sectionProgressData.startDate)
                  : false;

                console.log('Checking progress for:', {
                  userName,
                  section: activeSection,
                  subscriptionName: participant.subscriptionName,
                  foundProgress: progress,
                  allProgressForUser: userProgress.filter(p => p.accountName === userName),
                  isBeforeStartDate,
                  startDate: sectionProgressData?.startDate
                });
                return (
                  <List.Item
                    actions={[
                      progress && progress.isCompleted ? (
                        <Text type="success">Đã tham gia</Text>
                      ) : (
                        <Button
                          type="primary"
                          onClick={() => handleComplete(participant.accountId, activeSection)}
                          disabled={isBeforeStartDate}
                          title={isBeforeStartDate && sectionProgressData?.startDate 
                            ? `Buổi học này bắt đầu từ ${new Date(sectionProgressData.startDate).toLocaleDateString()}` 
                            : ""}
                        >
                          {isBeforeStartDate ? "Chưa đến thời gian" : "Tham gia"}
                        </Button>
                      )
                    ]}
                  >
                    <List.Item.Meta
                      title={participant.accountName} // Keep displaying fullname
                    />
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ClassDetail;
