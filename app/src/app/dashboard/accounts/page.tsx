"use client";

import React, { useEffect, useState } from "react";
import { Card, Table, Button, Modal, Form, Input, Select, message } from "antd";
import { useSelector } from "react-redux";

const { Option } = Select;

interface Account {
  id: string;
  name: string;
  type: "credit" | "debit";
  description?: string;
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

const AccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const userToken = useSelector((state: any) => state.auth.token);
  const [form] = Form.useForm();

  const [messageApi, contextHolder] = message.useMessage();

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounts", {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch accounts");
      setAccounts(data.accounts);
    } catch (err: any) {
      console.error(err);
      messageApi.error(err.message || "Error fetching accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    form.setFieldsValue({
      name: account.name,
      type: account.type,
      description: account.description,
      currency: account.currency,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const url = editingAccount
        ? `/api/accounts/${editingAccount.id}`
        : "/api/accounts";
      const method = editingAccount ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");

      messageApi.success(
        editingAccount ? "Account updated" : "Account created"
      );
      setModalOpen(false);
      form.resetFields();
      setEditingAccount(null);
      fetchAccounts();
    } catch (err: any) {
      console.error(err);
      messageApi.error(err.message || "Error");
    }
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => type.toUpperCase(),
    },
    { title: "Description", dataIndex: "description", key: "description" },
    { title: "Currency", dataIndex: "currency", key: "currency" },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Account) => (
        <Button size="small" onClick={() => openEditModal(record)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}
      <Card
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Accounts</span>
            <Button
              type="primary"
              onClick={() => {
                setEditingAccount(null);
                form.resetFields();
                setModalOpen(true);
              }}
            >
              Create Account
            </Button>
          </div>
        }
        style={{ border: 0, boxShadow: "none" }}
      >
        <Table
          columns={columns}
          dataSource={accounts}
          rowKey="id"
          size="small"
          loading={loading}
          pagination={false}
          style={{ border: 0 }}
        />
      </Card>

      <Modal
        title={editingAccount ? "Edit Account" : "Create Account"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Form.Item
            label="Account Name"
            name="name"
            rules={[{ required: true, message: "Please enter account name" }]}
          >
            <Input placeholder="e.g. Incomes" />
          </Form.Item>

          {editingAccount ? (
            <>
              <Form.Item label="Account Type">
                <Input value={editingAccount.type.toUpperCase()} disabled />
              </Form.Item>

              <Form.Item label="Currency">
                <Input value={editingAccount.currency || ""} disabled />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                label="Account Type"
                name="type"
                rules={[
                  { required: true, message: "Please select account type" },
                ]}
              >
                <Select placeholder="Select type">
                  <Option value="credit">Credit</Option>
                  <Option value="debit">Debit</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Currency" name="currency">
                <Input placeholder="Optional currency e.g. USD" />
              </Form.Item>
            </>
          )}

          <Form.Item label="Description" name="description">
            <Input placeholder="Optional description" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingAccount ? "Update" : "Create"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AccountsPage;
