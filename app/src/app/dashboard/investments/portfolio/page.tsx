"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Spin,
  Row,
  Col,
} from "antd";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

const { Option } = Select;

interface InvestmentAccount {
  id: string;
  name: string;
  description?: string;
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

const PortfolioPage: React.FC = () => {
  const [accounts, setAccounts] = useState<InvestmentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] =
    useState<InvestmentAccount | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const userToken = useSelector((state: RootState) => state.auth.token);

  const fetchInvestmentAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/investments/accounts", {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to fetch investment accounts");
      setAccounts(data);
    } catch (err: any) {
      console.error(err);
      messageApi.error(err.message || "Error fetching accounts");
    } finally {
      setLoading(false);
    }
  }, [userToken, messageApi]);

  useEffect(() => {
    if (userToken) {
      fetchInvestmentAccounts();
    }
  }, [userToken, fetchInvestmentAccounts]);

  const handleOpenModal = (account: InvestmentAccount | null = null) => {
    if (account) {
      setEditingAccount(account);
      form.setFieldsValue({
        name: account.name,
        description: account.description,
        currency: account.currency,
      });
    } else {
      setEditingAccount(null);
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    const url = editingAccount
      ? `/api/investments/accounts/${editingAccount.id}`
      : "/api/investments/accounts";
    const method = editingAccount ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.message ||
            `Failed to ${editingAccount ? "update" : "create"} account`
        );

      messageApi.success(
        `Investment account ${
          editingAccount ? "updated" : "created"
        } successfully!`
      );
      setModalOpen(false);
      fetchInvestmentAccounts(); // Refresh the list
    } catch (err: any) {
      console.error(err);
      messageApi.error(
        err.message ||
          `Error ${editingAccount ? "updating" : "creating"} account`
      );
    }
  };

  const columns = [
    {
      title: "Account Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text: string) => text || "—",
    },
    {
      title: "Currency",
      dataIndex: "currency",
      key: "currency",
      render: (text: string) => text || "N/A",
    },
    {
      title: "Date Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: "Last Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: InvestmentAccount) => (
        <Button size="small" onClick={() => handleOpenModal(record)}>
          Edit
        </Button>
      ),
    },
  ];

  const TitleContent = (
    <div style={{ width: "100%" }}>
      <Row justify="space-between" align="middle">
        <Col>
          <span style={{ fontSize: "1.2em", fontWeight: "bold" }}>
            Investment Accounts
          </span>
        </Col>
        <Col>
          <Button type="primary" onClick={() => handleOpenModal()}>
            Create Investment Account
          </Button>
        </Col>
      </Row>
    </div>
  );

  return (
    <div>
      {contextHolder}
      <Card title={TitleContent} style={{ border: 0, boxShadow: "none" }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
            }}
          >
            <Spin size="large" />
          </div>
        ) : (
          <Table
            dataSource={accounts}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10 }}
            style={{ border: 0 }}
          />
        )}
      </Card>

      <Modal
        title={
          editingAccount ? "Edit Investment Account" : "Create Investment Account"
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Account Name"
            name="name"
            rules={[
              { required: true, message: "Please enter the account name" },
            ]}
          >
            <Input
              placeholder="e.g., Tech Stocks Portfolio"
              disabled={!!editingAccount}
            />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea placeholder="e.g., Long-term growth stocks" />
          </Form.Item>
          <Form.Item label="Currency" name="currency">
            <Select
              placeholder="Select a currency (optional)"
              disabled={!!editingAccount}
            >
              <Option value="USD">USD</Option>
              <Option value="EUR">EUR</Option>
              <Option value="GBP">GBP</Option>
              <Option value="JPY">JPY</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingAccount ? "Update Account" : "Create Account"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PortfolioPage;
