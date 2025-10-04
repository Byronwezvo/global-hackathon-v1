"use client";

import * as React from "react";
import { Card, Row, Col } from "antd";
import {
  DollarCircleOutlined,
  CreditCardOutlined,
  CalendarOutlined,
  TeamOutlined,
} from "@ant-design/icons";

const Dashboard: React.FC = () => {
  const tiles = [
    {
      title: "Total Balance",
      value: "$12,400",
      icon: (
        <DollarCircleOutlined style={{ fontSize: "2rem", color: "#1890ff" }} />
      ),
    },
    {
      title: "Debit Balance",
      value: "$3,200",
      icon: (
        <CreditCardOutlined style={{ fontSize: "2rem", color: "#fa541c" }} />
      ),
    },
    {
      title: "Credit Period",
      value: "30 Days",
      icon: <CalendarOutlined style={{ fontSize: "2rem", color: "#52c41a" }} />,
    },
    {
      title: "Active Accounts",
      value: "128",
      icon: <TeamOutlined style={{ fontSize: "2rem", color: "#722ed1" }} />,
    },
  ];

  const handleClick = (title: string) => {
    console.log(`${title} clicked`);
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        {tiles.map((tile) => (
          <Col xs={24} sm={12} md={6} key={tile.title}>
            <Card
              hoverable
              onClick={() => handleClick(tile.title)}
              style={{
                cursor: "pointer",
                border: "1px solid #f0f0f0", // light divider border
                boxShadow: "none", // flat look
              }}
              bodyStyle={{ padding: "1.5rem" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ marginRight: "1rem" }}>{tile.icon}</div>
                <h3 style={{ margin: 0, fontWeight: 600 }}>{tile.title}</h3>
              </div>
              <p style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>
                {tile.value}
              </p>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ marginTop: "2rem" }}>
        <p>This is the dashboard content...</p>
      </div>
    </div>
  );
};

export default Dashboard;
