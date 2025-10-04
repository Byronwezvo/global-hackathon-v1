"use client";

import React, { useEffect, useState } from "react";
import { Card, Table, Button, Modal, Form, Input, Select, message } from "antd";
import { useSelector } from "react-redux";

const { Option } = Select;

interface Account {
  id: string;
  name: string;
  type: "credit" | "debit";
}

interface Transaction {
  id: string;
  accountId: string;
  accountName?: string;
  amount: number;
  type: "credit" | "debit";
  description?: string;
  status?: string;
  reference?: string;
  createdAt: string;
  updatedAt: string;
}

const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [selectedType, setSelectedType] = useState<"credit" | "debit" | "">("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);

  const userToken = useSelector((state: any) => state.auth.token);
  const [form] = Form.useForm();

  // Ant Design message instance
  const [messageApi, contextHolder] = message.useMessage();

  const showMessage = (type: "success" | "error" | "info", text: string) => {
    messageApi.open({ type, content: text });
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/accounts", {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch accounts");
      setAccounts(data.accounts);
      showMessage("success", "Accounts fetched successfully");
    } catch (err: any) {
      console.error(err);
      showMessage("error", err.message || "Error fetching accounts");
    }
  };

  const fetchTransactions = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/transactions?page=${pageNumber}&limit=${pageSize}`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to fetch transactions");

      setTransactions(
        data.transactions.map((t: Transaction) => ({
          ...t,
          accountName: t.account?.name || "",
        }))
      );
      setTotal(data.total);
      setPage(data.page);

      showMessage("success", "Transactions fetched successfully");
    } catch (err: any) {
      console.error(err);
      showMessage("error", err.message || "Error fetching transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
  }, []);

  const openEditModal = async (transaction: Transaction) => {
    try {
      setLoading(true);
      // Fetch single transaction from API to ensure latest data
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to fetch transaction");

      setEditingTransaction(data);
      setSelectedType(data.type);

      form.setFieldsValue({
        accountId: data.accountId,
        amount: data.amount,
        description: data.description,
        status: data.status,
        reference: data.reference,
      });

      setModalOpen(true);
      showMessage("success", "Transaction loaded for editing");
    } catch (err: any) {
      console.error(err);
      showMessage("error", err.message || "Error loading transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleAccountChange = (accountId: string) => {
    const selectedAccount = accounts.find((a) => a.id === accountId);
    if (selectedAccount) {
      setSelectedType(selectedAccount.type);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const transactionData = {
        ...values,
        type: selectedType,
        amount: parseFloat(values.amount), // Ensure float
      };

      const url = editingTransaction
        ? `/api/transactions/${editingTransaction.id}`
        : "/api/transactions";
      const method = editingTransaction ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify(transactionData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");

      showMessage(
        "success",
        editingTransaction ? "Transaction updated" : "Transaction created"
      );

      setModalOpen(false);
      form.resetFields();
      setEditingTransaction(null);
      setSelectedType("");
      fetchTransactions(page);
    } catch (err: any) {
      console.error(err);
      showMessage("error", err.message || "Error saving transaction");
    }
  };

  const columns = [
    { title: "Account", dataIndex: "accountName", key: "accountName" },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => parseFloat(amount.toString()).toFixed(2),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => type.toUpperCase(),
    },
    { title: "Description", dataIndex: "description", key: "description" },
    { title: "Status", dataIndex: "status", key: "status" },
    { title: "Reference", dataIndex: "reference", key: "reference" },
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
      render: (_: any, record: Transaction) => (
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
            <span>Transactions</span>
            <Button
              type="primary"
              onClick={() => {
                setEditingTransaction(null);
                form.resetFields();
                setSelectedType("");
                setModalOpen(true);
              }}
            >
              Create Transaction
            </Button>
          </div>
        }
        style={{ border: 0, boxShadow: "none" }}
      >
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p) => fetchTransactions(p),
          }}
          style={{ border: 0 }}
        />
      </Card>

      <Modal
        title={editingTransaction ? "Edit Transaction" : "Create Transaction"}
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
            label="Account"
            name="accountId"
            rules={[{ required: true, message: "Please select account" }]}
          >
            <Select
              placeholder="Select account"
              onChange={handleAccountChange}
              disabled={!!editingTransaction}
            >
              {accounts.map((acc) => (
                <Option key={acc.id} value={acc.id}>
                  {acc.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Type">
            <Input value={selectedType?.toUpperCase() || ""} disabled />
          </Form.Item>

          <Form.Item label="Amount" name="amount" rules={[{ required: true }]}>
            <Input
              type="number"
              placeholder="Enter amount"
              disabled={!!editingTransaction}
            />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input placeholder="Optional description" />
          </Form.Item>

          <Form.Item label="Status" name="status">
            <Select placeholder="Pending/Completed/Rejected">
              <Option value="pending">Pending</Option>
              <Option value="completed">Completed</Option>
              <Option value="rejected">Rejected</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Reference" name="reference">
            <Input placeholder="Optional reference" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingTransaction ? "Update" : "Create"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TransactionsPage;
