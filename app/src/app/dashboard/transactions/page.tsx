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
  Space,
  DatePicker,
  Checkbox,
  Row,
  Col,
} from "antd";
import { useSelector } from "react-redux";
import moment, { Moment } from "moment";
import ReactMarkdown from "react-markdown";

const { Option } = Select;
const { RangePicker } = DatePicker;

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

interface Filters {
  dateRange: [Moment | null, Moment | null];
  accountIds: string[];
  types: Array<"credit" | "debit">;
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
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    dateRange: [null, null],
    accountIds: [],
    types: [],
  });

  const userToken = useSelector((state: any) => state.auth.token);
  const [form] = Form.useForm();

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
    } catch (err: any) {
      console.error(err);
      showMessage("error", err.message || "Error fetching accounts");
    }
  };

  const fetchTransactions = useCallback(
    async (pageNumber = 1, currentFilters: Filters = filters) => {
      setLoading(true);
      try {
        const [startDateMoment, endDateMoment] = currentFilters.dateRange;

        const params = new URLSearchParams();
        params.append("page", pageNumber.toString());
        params.append("limit", pageSize.toString());

        if (startDateMoment)
          params.append("startDate", startDateMoment.format("YYYY-MM-DD"));
        if (endDateMoment)
          params.append("endDate", endDateMoment.format("YYYY-MM-DD"));

        // ✅ Multiple accounts
        currentFilters.accountIds.forEach((id) =>
          params.append("accountIds", id)
        );

        // ✅ Multiple types
        currentFilters.types.forEach((t) => params.append("types", t));

        const res = await fetch(`/api/transactions?${params.toString()}`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Failed to fetch transactions");

        setTransactions(
          data.transactions.map(
            (t: Transaction & { account: { name: string } }) => ({
              ...t,
              accountName: t.account?.name || (t as any).accountName || "N/A",
            })
          )
        );
        setTotal(data.total);
        setPage(data.page);
      } catch (err: any) {
        console.error(err);
        showMessage("error", err.message || "Error fetching transactions");
      } finally {
        setLoading(false);
      }
    },
    [userToken, filters, pageSize]
  );

  useEffect(() => {
    fetchAccounts();
  }, [userToken]);

  useEffect(() => {
    fetchTransactions(page, filters);
  }, [page, filters, fetchTransactions]);

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiModalOpen(true);
    setAiAnalysis("");

    try {
      const [startDateMoment, endDateMoment] = filters.dateRange;

      const params = new URLSearchParams();
      params.append("limit", "10000");

      if (startDateMoment) {
        params.append("startDate", startDateMoment.format("YYYY-MM-DD"));
      }
      if (endDateMoment) {
        params.append("endDate", endDateMoment.format("YYYY-MM-DD"));
      }
      if (filters.accountIds.length > 0) {
        params.append("accountIds", filters.accountIds.join(","));
      }
      if (filters.types.length > 0) {
        params.append("types", filters.types.join(","));
      }

      const dataRes = await fetch(`/api/transactions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const data = await dataRes.json();
      if (!dataRes.ok)
        throw new Error(data.message || "Failed to fetch data for AI");

      if (data.transactions.length === 0) {
        throw new Error(
          "No transactions found for the selected filters to analyze."
        );
      }

      const transactionsToAnalyze = data.transactions.map((t: Transaction) => ({
        amount: t.amount,
        type: t.type,
        description: t.description,
        accountName: t.accountName,
        createdAt: t.createdAt,
      }));

      const aiRes = await fetch("/api/ai/financial-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          transactions: transactionsToAnalyze,
          userQuestion:
            "Based on my debits and credits in this data set, calculate the net balance. Give me a structured summary of income and expenses, and provide 2-3 specific, actionable suggestions on how to maximize my finances.",
        }),
      });

      const aiData = await aiRes.json();
      if (!aiRes.ok) throw new Error(aiData.message || "AI Analysis Failed");

      setAiAnalysis(
        aiData.analysisText || "Analysis completed, but no text was returned."
      );
      showMessage("success", "AI Analysis complete!");
    } catch (err: any) {
      console.error(err);
      setAiAnalysis(`Error during analysis: ${err.message}`);
      showMessage("error", err.message || "Error running AI analysis");
    } finally {
      setAiLoading(false);
    }
  };

  const openEditModal = async (transaction: Transaction) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to fetch transaction");

      const finalData = {
        ...data,
        accountId: data.accountId || data.account.id,
      };

      setEditingTransaction(finalData);
      setSelectedType(finalData.type);

      form.setFieldsValue({
        accountId: finalData.accountId,
        amount: finalData.amount,
        description: data.description,
        status: data.status,
        reference: data.reference,
      });

      setModalOpen(true);
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
        amount: parseFloat(values.amount),
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

  // Custom component for the Card Title to handle the two-line layout
  const TitleContent = (
    <div style={{ width: "100%" }}>
      {/* 1. Main Header Line (Title and Buttons) */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 10 }}>
        <Col>
          <span style={{ fontSize: "1.2em", fontWeight: "bold" }}>
            Transactions
          </span>
        </Col>
        <Col>
          <Space>
            {/* 2. Filter Line (The area where you drew the black line) */}
            <Row justify="start" gutter={[16, 0]}>
              <Col>
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Type(s)"
                  value={filters.types}
                  onChange={(selectedTypes) =>
                    handleFilterChange({
                      types: selectedTypes as Array<"credit" | "debit">,
                    })
                  }
                  style={{ minWidth: 120 }}
                >
                  <Option value="credit">Credit</Option>
                  <Option value="debit">Debit</Option>
                </Select>
              </Col>
              <Col>
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Account(s)"
                  value={filters.accountIds}
                  onChange={(selectedIds) =>
                    handleFilterChange({ accountIds: selectedIds as string[] })
                  }
                  style={{
                    minWidth: 180,
                    background: "#fffbe6",
                  }} // Highlight placeholder visually
                  dropdownStyle={{ zIndex: 2000 }} // Ensure dropdown is above other elements
                >
                  {accounts.map((acc) => (
                    <Option key={acc.id} value={acc.id}>
                      {acc.name}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <RangePicker
                  value={filters.dateRange as [Moment | null, Moment | null]}
                  onChange={(dates) =>
                    handleFilterChange({
                      dateRange: dates as [Moment | null, Moment | null],
                    })
                  }
                  placeholder={["Start Date", "End Date"]}
                  style={{ width: 250 }}
                />
              </Col>
            </Row>
            <Button onClick={handleAiAnalysis} loading={aiLoading}>
              AI Financial Advisor 🧠
            </Button>
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
          </Space>
        </Col>
      </Row>
    </div>
  );

  return (
    <div>
      {contextHolder}
      <Card
        title={TitleContent} // Use the custom TitleContent component
        style={{ border: 0, boxShadow: "none" }}
      >
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          size="small"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p) => setPage(p),
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

      <Modal
        open={aiModalOpen}
        title={null} // hide default title
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
            {/* Header (keeps Ant Design vibe) */}
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
                AI Financial Advisor 🧸
              </h2>
            </div>

            {/* Markdown Rendering */}
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h3
                    style={{
                      fontSize: 18,
                      margin: "20px 0 8px",
                    }}
                  >
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

            {/* Footer */}
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

export default TransactionsPage;
