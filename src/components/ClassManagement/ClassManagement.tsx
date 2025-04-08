import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Row, Col, Typography, Spin } from 'antd';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/Store';
import { useNavigate } from 'react-router-dom';
import './ClassManagement.scss';

const { Title, Text } = Typography;

interface Subscription {
  id: string;
  subscriptionName: string;
  description: string;
  price: number;
  duration: number;
  categoryName: string;
  psychologistName: string;
  purpose: string;
  criteria: string;
  focusGroup: string;
  assessmentTool: string;
}

const stripTitle = (name: string) => {
  return name.replace(/^Dr\.\s+/, '');
};

const ClassManagement: React.FC = () => {
  const [programs, setPrograms] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const User = useSelector((state: RootState) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5199/Subscription');
        console.log('API Response:', response.data);
        console.log('Current User fullname:', User?.fullname);
        
        const userPrograms = response.data.filter(
          (program: Subscription) => {
            const normalizedPsychologistName = stripTitle(program.psychologistName);
            console.log('Comparing:', normalizedPsychologistName, 'with', User?.fullname);
            return normalizedPsychologistName === User?.fullname;
          }
        );
        console.log('Filtered Programs:', userPrograms);
        setPrograms(userPrograms);
      } catch (error) {
        console.error('Error fetching programs:', error);
      } finally {
        setLoading(false);
      }
    };

    if (User?.fullname) {
      fetchPrograms();
    }
  }, [User?.fullname]);

  const handleProgramClick = async (programId: string) => {
    try {
      // Pre-fetch UserProgress data before navigation
      const userProgressResponse = await axios.get('http://localhost:5199/UserProgress');
      console.log('Pre-fetched UserProgress:', {
        programId: programId,
        progress: userProgressResponse.data.filter((p: any) => p.subscriptionId === programId)
      });
      
      // Navigate to class detail page
      console.log('Navigating to:', `/class-detail/${programId}`);
      navigate(`/class-detail/${programId}`);
    } catch (error) {
      console.error('Error pre-fetching UserProgress:', error);
      // Still navigate even if pre-fetch fails
      navigate(`/class-detail/${programId}`);
    }
  };

  if (loading) {
    return <Spin size="large" className="loading-spinner" />;
  }

  return (
    <div className="class-management">
      <Title level={2}>My Programs ({programs.length})</Title>
      {programs.length === 0 ? (
        <Text>No programs found for {User?.fullname}</Text>
      ) : (
        <Row gutter={[24, 24]}>
          {programs.map((program) => (
            <Col key={program.id} xs={24} sm={12} lg={8}>
              <Card 
                className="program-card"
                title={program.subscriptionName}
                hoverable
                onClick={() => handleProgramClick(program.id)}
              >
                <div className="program-info">
                  <Text strong>Category: </Text>
                  <Text>{program.categoryName}</Text>
                </div>
                <div className="program-info">
                  <Text strong>Duration: </Text>
                  <Text>{program.duration} days</Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default ClassManagement;