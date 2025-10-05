"use client";

import * as React from "react";
import { useSelector } from "react-redux";
import { Card, Row, Col, Table, Spin } from "antd";
import {
  DollarCircleOutlined,
  CreditCardOutlined,
  CalendarOutlined,
  TeamOutlined,
} from "@ant-design/icons";

interface Tile {
  title: string;
  value: string;
  icon: React.ReactNode;
}

interface Transaction {
  id: string;
  type: string;
  amount: string;
  date: string;
}

const Dashboard: React.FC = () => {
  const token = useSelector((state: any) => state.auth.token);

  const [loading, setLoading] = React.useState(true);
  const [totalBalance, setTotalBalance] = React.useState("$0");
  const [debitBalance, setDebitBalance] = React.useState("$0");
  const [activeAccounts, setActiveAccounts] = React.useState(0);
  const [creditPeriod, setCreditPeriod] = React.useState("30 Days");
  const [recentTransactions, setRecentTransactions] = React.useState<
    Transaction[]
  >([]);

  React.useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const accountsRes = await fetch("/api/accounts", { headers });
        const accountsData = await accountsRes.json();

        const transactionsRes = await fetch("/api/transactions", { headers });
        const transactionsData = await transactionsRes.json();

        // Safely calculate totals
        const totalBal = accountsData.reduce(
          (acc: number, accItem: any) => acc + (Number(accItem.balance) || 0),
          0
        );
        const debitBal = accountsData.reduce(
          (acc: number, accItem: any) => acc + (Number(accItem.debit) || 0),
          0
        );

        setTotalBalance(`$${totalBal}`);
        setDebitBalance(`$${debitBal}`);
        setActiveAccounts(accountsData.length);

        // Safely map transactions
        setRecentTransactions(
          transactionsData.slice(0, 5).map((tx: any) => ({
            id: tx.id || tx._id || "N/A",
            type: tx.type || "N/A",
            amount: tx.amount ? `$${tx.amount}` : "$0",
            date: tx.createdAt
              ? new Date(tx.createdAt).toLocaleDateString()
              : "N/A",
          }))
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const tiles: Tile[] = [
    {
      title: "Total Balance",
      value: totalBalance,
      icon: (
        <DollarCircleOutlined style={{ fontSize: "2rem", color: "#1890ff" }} />
      ),
    },
    {
      title: "Debit Balance",
      value: debitBalance,
      icon: (
        <CreditCardOutlined style={{ fontSize: "2rem", color: "#fa541c" }} />
      ),
    },
    {
      title: "Credit Period",
      value: creditPeriod,
      icon: <CalendarOutlined style={{ fontSize: "2rem", color: "#52c41a" }} />,
    },
    {
      title: "Active Accounts",
      value: `${activeAccounts}`,
      icon: <TeamOutlined style={{ fontSize: "2rem", color: "#722ed1" }} />,
    },
  ];

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Type", dataIndex: "type", key: "type" },
    { title: "Amount", dataIndex: "amount", key: "amount" },
    { title: "Date", dataIndex: "date", key: "date" },
  ];

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "70vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        {tiles.map((tile) => (
          <Col xs={24} sm={12} md={6} key={tile.title}>
            <Card
              hoverable
              style={{
                cursor: "pointer",
                border: "1px solid #f0f0f0",
                boxShadow: "none",
              }}
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
        <h3>Recent Transactions</h3>
        <Table
          columns={columns}
          dataSource={recentTransactions}
          rowKey="id"
          pagination={false}
        />
      </div>
    </div>
  );
};

export default Dashboard;
