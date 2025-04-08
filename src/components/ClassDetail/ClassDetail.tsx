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
  // ...other fields
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

  // Fetch sections and participants
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get current subscription data first
        const subscriptionResponse = await axios.get(`http://localhost:5199/Subscription/${programId}`);
        const currentSubscription = subscriptionResponse.data;
        
        // Fetch accounts
        const accountsResponse = await axios.get('http://localhost:5199/Account');
        const accountsData = accountsResponse.data;
        setAccounts(accountsData);

        // Fetch program progress sections
        const progressResponse = await axios.get(`http://localhost:5199/SubscriptionProgress?subscriptionId=${programId}`);
        const uniqueSections = [...new Set(progressResponse.data.map((p: any) => p.section))];
        setSections(uniqueSections.sort((a, b) => a - b));

        // Fetch user progress
        const userProgressResponse = await axios.get(`http://localhost:5199/UserProgress?subscriptionId=${programId}`);
        setUserProgress(userProgressResponse.data);

        // Fetch orders and filter by current subscription
        const ordersResponse = await axios.get(`http://localhost:5199/Order`);
        
        const joinedOrders = ordersResponse.data.filter((order: Order) => {
          const isValidOrder = order.isJoined === true && 
                             order.subscriptionName === currentSubscription.subscriptionName;
          console.log('Checking order:', {
            orderName: order.subscriptionName,
            currentName: currentSubscription.subscriptionName,
            isValid: isValidOrder
          });
          return isValidOrder;
        }).map((order: Order) => {
          const account = accountsData.find(acc => acc.fullname === order.accountName);
          return {
            ...order,
            accountId: account?.id
          };
        });

        setParticipants(joinedOrders);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [programId]); // Remove accounts.length dependency since we handle accounts inside

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
        description: "Created by psychologist",
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

      const createdUserProgress = userProgressList.data.find(
        (up: any) => up.section === section
      );

      if (!createdUserProgress) {
        throw new Error('Failed to find the newly created UserProgress');
      }

      // Update the progress to completed
      const updatePayload = {
        ...createdUserProgress,
        isCompleted: true,
        isDeleted: false
      };

      console.log('Update payload:', updatePayload);

      const updateResponse = await axios.put(
        `http://localhost:5199/UserProgress/${createdUserProgress.id}`,
        updatePayload
      );

      if (!updateResponse.data) {
        throw new Error('Failed to update UserProgress');
      }

      // Cập nhật state userProgress ngay lập tức
      setUserProgress(prevProgress => [
        ...prevProgress.filter(p => !(p.accountId === accountId && p.section === section)),
        {
          ...updatePayload,
          id: createdUserProgress.id,
          accountId: accountId,
          section: section,
          subscriptionId: programId
        }
      ]);

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
          <Card title="Danh sách tuần học">
            <List
              dataSource={sections}
              renderItem={section => (
                <List.Item
                  className={`section-item ${activeSection === section ? 'active' : ''}`}
                  onClick={() => setActiveSection(section)}
                >
                  <Text>Tuần {section}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={18} className="participants-list">
          <Card title={`Danh sách học viên - Tuần ${activeSection}`}>
            <List
              dataSource={participants}
              renderItem={participant => {
                // Kiểm tra chính xác progress cho từng học viên và section
                const progress = userProgress.find(
                  p => 
                    p.accountId === participant.accountId && 
                    p.section === activeSection &&
                    p.subscriptionId === programId && 
                    p.isCompleted === true // Chỉ lấy những progress đã hoàn thành
                );
                
                console.log('Checking progress for:', {
                  participantId: participant.accountId,
                  section: activeSection,
                  progress: progress
                });

                return (
                  <List.Item
                    actions={[
                      progress ? (
                        <Text type="success">Đã tham gia</Text>
                      ) : (
                        <Button
                          type="primary"
                          onClick={() => handleComplete(participant.accountId, activeSection)}
                        >
                          Tham gia
                        </Button>
                      )
                    ]}
                  >
                    <List.Item.Meta
                      title={participant.accountName}
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
