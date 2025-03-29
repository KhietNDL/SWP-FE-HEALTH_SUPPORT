import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './LineChart.scss';

interface SubscriptionData {
  month: string;
  totalPrograms: number;
  totalRevenue: number;
}

const SubscriptionLineChart: React.FC = () => {
  // Sample data - you'll want to replace this with actual data from your backend
  const data: SubscriptionData[] = [
    { month: 'Jan', totalPrograms: 50, totalRevenue: 75000 },
    { month: 'Feb', totalPrograms: 65, totalRevenue: 97500 },
    { month: 'Mar', totalPrograms: 55, totalRevenue: 82500 },
    { month: 'Apr', totalPrograms: 70, totalRevenue: 105000 },
    { month: 'May', totalPrograms: 60, totalRevenue: 90000 },
    { month: 'Jun', totalPrograms: 75, totalRevenue: 112500 }
  ];

  return (
    <div className="subscription-line-chart">
      <h2>Subscription Overview</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis yAxisId="left" label={{ value: 'Total Programs', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'Total Revenue (VNĐ)', angle: 90, position: 'insideRight' }} />
          
          <Tooltip 
            formatter={(value, name) => [
              name === 'totalPrograms' ? value + ' Programs' : 
              new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value))
            ]}
          />
          <Legend />
          
          <Line 
            yAxisId="left" 
            type="monotone" 
            dataKey="totalPrograms" 
            stroke="#8884d8" 
            activeDot={{ r: 8 }} 
            name="Total Programs"
          />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="totalRevenue" 
            stroke="#82ca9d" 
            name="Total Revenue"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SubscriptionLineChart;