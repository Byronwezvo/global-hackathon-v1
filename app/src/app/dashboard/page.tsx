"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Col,
  Row,
  Statistic,
  Table,
  List,
  Spin,
  message,
  Typography,
  Space,
  FloatButton,
  Modal,
  Button,
} from "antd";
import {
  BankOutlined,
  RiseOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import ReactMarkdown from "react-markdown";

const { Text } = Typography;

interface AccountBalance {
  id: string;
  name: string;
  balance: number;
  type: "credit" | "debit";
}

interface RecentTransaction {
  id: string;
  description: string;
  amount: number;
  createdAt: string;
  accountName: string;
}

interface InvestmentDetail {
  id: string;
  assetName: string;
  amount: number; // Quantity
  currentValue: number;
  assetType: string;
}

const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const userToken = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    if (userToken) {
      const fetchSummary = async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/dashboard/summary", {
            headers: { Authorization: `Bearer ${userToken}` },
          });
          const data = await res.json();
          if (!res.ok)
            throw new Error(data.message || "Failed to fetch summary");
          setSummary(data);
        } catch (err: any) {
          messageApi.error(err.message || "Error fetching dashboard data.");
        } finally {
          setLoading(false);
        }
      };
      fetchSummary();
    }
  }, [userToken, messageApi]);

  const handleAiSummary = async () => {
    setAiLoading(true);
    setAiModalOpen(true);
    setAiAnalysis("");

    try {
      if (!summary) {
        throw new Error("Dashboard data is not available for analysis.");
      }

      const aiRes = await fetch("/api/ai/dashboard-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          summaryData: summary,
          userQuestion:
            "Provide a holistic summary of my financial health based on my bank balances, investments, and recent activity. Give me high-level advice.",
        }),
      });

      const aiData = await aiRes.json();
      if (!aiRes.ok) throw new Error(aiData.message || "AI Summary Failed");

      setAiAnalysis(
        aiData.analysisText || "Analysis completed, but no text was returned."
      );
    } catch (err: any) {
      setAiAnalysis(`Error during analysis: ${err.message}`);
      messageApi.error(err.message || "Error running AI analysis");
    } finally {
      setAiLoading(false);
    }
  };

  const recentTransactionsColumns = [
    {
      title: "Transaction",
      dataIndex: "description",
      key: "description",
      render: (text: string) => text || "N/A",
    },
    {
      title: "Account",
      dataIndex: "accountName",
      key: "accountName",
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => `$${amount.toLocaleString()}`,
    },
  ];

  const investmentColumns = [
    {
      title: "Asset",
      dataIndex: "assetName",
      key: "assetName",
    },
    {
      title: "Type",
      dataIndex: "assetType",
      key: "assetType",
    },
    {
      title: "Quantity",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => amount.toLocaleString(),
    },
    {
      title: "Current Value",
      dataIndex: "currentValue",
      key: "currentValue",
      render: (value: number) =>
        `$${value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
    },
  ];

  const investmentAllocation = summary?.investmentDetails?.reduce(
    (acc: any, curr: InvestmentDetail) => {
      acc[curr.assetType] = (acc[curr.assetType] || 0) + curr.currentValue;
      return acc;
    },
    {}
  );

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  const { topGainer, topLoser, topAccountGainer, topAccountLoser } =
    summary || {};

  return (
    <div>
      {contextHolder}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12}>
          <Card>
            <Row align="top" justify="space-between">
              <Col flex="auto">
                <Statistic
                  title="Total Bank Balance"
                  value={summary?.totalBankBalance}
                  precision={2}
                  prefix={
                    <BankOutlined style={{ color: "black", marginRight: 8 }} />
                  }
                  valueStyle={{
                    color:
                      summary?.totalBankBalance >= 0 ? "#3f8600" : "#cf1322",
                  }}
                />
              </Col>
              <Col flex="none">
                <Space direction="vertical" align="end" size={2}>
                  {topAccountGainer && (
                    <Text style={{ fontSize: 12, color: "green" }}>
                      <ArrowUpOutlined /> {topAccountGainer.name}{" "}
                      {`+$${topAccountGainer.change.toFixed(2)}`}
                    </Text>
                  )}
                  {topAccountLoser && (
                    <Text style={{ fontSize: 12, color: "red" }}>
                      <ArrowDownOutlined /> {topAccountLoser.name}{" "}
                      {`-$${topAccountLoser.change.toFixed(2)}`}
                    </Text>
                  )}
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Row align="top" justify="space-between">
              <Col flex="auto">
                <Statistic
                  title="Total Investment Value"
                  value={summary?.totalInvestmentValue}
                  precision={2}
                  prefix={
                    <RiseOutlined style={{ color: "black", marginRight: 8 }} />
                  }
                  valueStyle={{ color: "#3f8600" }}
                />
              </Col>
              <Col flex="none">
                <Space direction="vertical" align="end" size={2}>
                  {topGainer && topGainer.changePercent > 0 && (
                    <Text style={{ fontSize: 12, color: "green" }}>
                      <ArrowUpOutlined /> {topGainer.assetName}{" "}
                      {topGainer.changePercent.toFixed(2)}%
                    </Text>
                  )}
                  {topLoser && topLoser.changePercent < 0 && (
                    <Text style={{ fontSize: 12, color: "red" }}>
                      <ArrowDownOutlined /> {topLoser.assetName}{" "}
                      {topLoser.changePercent.toFixed(2)}%
                    </Text>
                  )}
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="Account Balances"
            bodyStyle={{ height: 300, overflowY: "auto" }}
            className="hide-scrollbar"
          >
            <List
              dataSource={summary?.accountBalances || []}
              renderItem={(item: AccountBalance) => {
                const balance =
                  item.type === "credit" ? -item.balance : item.balance;
                return (
                  <List.Item>
                    <List.Item.Meta title={item.name} />
                    <div style={{ color: balance < 0 ? "red" : "inherit" }}>
                      {`$${balance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`}
                    </div>
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="Investment Allocation"
            bodyStyle={{ height: 300, overflowY: "auto" }}
            className="hide-scrollbar"
          >
            <List
              dataSource={
                investmentAllocation ? Object.keys(investmentAllocation) : []
              }
              renderItem={(key: string) => (
                <List.Item>
                  <List.Item.Meta title={key} />
                  <div>
                    {`$${investmentAllocation[key].toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Recent Transactions">
            <Table
              dataSource={summary?.recentTransactions || []}
              columns={recentTransactionsColumns}
              pagination={false}
              rowKey="id"
              size="small"
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Current Investments">
            <Table
              dataSource={summary?.investmentDetails || []}
              columns={investmentColumns}
              pagination={{ pageSize: 5 }}
              rowKey="id"
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <FloatButton
        icon={<span style={{ fontSize: 15 }}>✨</span>}
        type="default"
        onClick={handleAiSummary}
        tooltip="Get AI Financial Summary"
      />

      <Modal
        open={aiModalOpen}
        title={null}
        onCancel={() => setAiModalOpen(false)}
        footer={null}
        width={720}
        centered
      >
        {aiLoading ? (
          <div
            style={{
              height: 360,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 40 }}>✨</span>
            <p style={{ color: "#888", fontSize: 15 }}>Gemini is thinking…</p>
          </div>
        ) : (
          <div
            style={{
              padding: "24px 32px",
              maxHeight: "50vh",
              overflowY: "auto",
              background: "#fff",
            }}
            className="hide-scrollbar"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 30,
                borderBottom: "1px solid #f0f0f0",
                paddingBottom: 30,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                AI Financial Summary 🧸
              </h2>
            </div>
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h3 style={{ fontSize: 18, margin: "20px 0 8px" }}>
                    {children}
                  </h3>
                ),
                h2: ({ children }) => (
                  <h4
                    style={{
                      fontSize: 16,
                      margin: "16px 0 8px",
                      color: "#52c41a",
                      fontWeight: 600,
                    }}
                  >
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p
                    style={{
                      margin: "0 0 12px",
                      lineHeight: 1.7,
                      color: "#444",
                      fontSize: 14.5,
                    }}
                  >
                    {children}
                  </p>
                ),
                li: ({ children }) => (
                  <li
                    style={{
                      marginBottom: 6,
                      lineHeight: 1.7,
                      color: "#444",
                      fontSize: 14.5,
                    }}
                  >
                    {children}
                  </li>
                ),
                ul: ({ children }) => (
                  <ul style={{ paddingLeft: 20, margin: "0 0 16px" }}>
                    {children}
                  </ul>
                ),
                hr: () => (
                  <hr
                    style={{
                      border: "none",
                      borderTop: "1px solid #f0f0f0",
                      margin: "20px 0",
                    }}
                  />
                ),
              }}
            >
              {aiAnalysis}
            </ReactMarkdown>
            <div
              style={{
                textAlign: "center",
                marginTop: 24,
                borderTop: "1px solid #f0f0f0",
                paddingTop: 16,
              }}
            >
              <Button type="primary" onClick={() => setAiModalOpen(false)}>
                Got it 🎉
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DashboardPage;
