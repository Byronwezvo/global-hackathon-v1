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
} from "antd";
import {
  BankOutlined,
  RiseOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

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
      render: (amount: number) => `${amount.toLocaleString()}`,
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
        `${value.toLocaleString(undefined, {
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

  const { topGainer, topLoser, topAccountGainer, topAccountLoser } = summary || {};

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
                      {`+${topAccountGainer.change.toFixed(2)}`}
                    </Text>
                  )}
                  {topAccountLoser && (
                    <Text style={{ fontSize: 12, color: "red" }}>
                      <ArrowDownOutlined /> {topAccountLoser.name}{" "}
                      {`-${topAccountLoser.change.toFixed(2)}`}
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
              renderItem={(item: AccountBalance) => (
                <List.Item>
                  <List.Item.Meta title={item.name} />
                  <div
                    style={{
                      color: item.type === "credit" ? "green" : "red",
                    }}
                  >
                    {`${Math.abs(item.balance).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
                  </div>
                </List.Item>
              )}
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
                    {`${investmentAllocation[key].toLocaleString(undefined, {
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
    </div>
  );
};

export default DashboardPage;
