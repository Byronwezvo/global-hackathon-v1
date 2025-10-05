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
  InputNumber,
  Tag,
  Space,
} from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { investmentOptions } from "@/lib/investmentOptions";
import ReactMarkdown from "react-markdown";

const { Option } = Select;

interface Investment {
  id: string;
  investmentAccountId: string;
  accountName: string;
  amount: number; // This will now be treated as quantity
  purchasePrice: number; // Assuming we add this field later or calculate it
  assetType: string;
  assetName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  status?: string;
  reference?: string;
}

interface InvestmentAccount {
  id: string;
  name: string;
}

interface AssetPrice {
  currentPrice: number;
  previousClose: number;
}

type AssetType = "Stock" | "Bond" | "Crypto";

const AssetsPage: React.FC = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [investmentAccounts, setInvestmentAccounts] = useState<
    InvestmentAccount[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] =
    useState<Investment | null>(null);
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | null>(
    null
  );
  const [assetPrices, setAssetPrices] = useState<{ [key: string]: AssetPrice }>(
    {}
  );
  const [pricesLoading, setPricesLoading] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const userToken = useSelector((state: RootState) => state.auth.token);

  const fetchInvestments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/investments", {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to fetch investments");
      setInvestments(data);
    } catch (err: any) {
      messageApi.error(err.message || "Error fetching investments");
    } finally {
      setLoading(false);
    }
  }, [userToken, messageApi]);

  const fetchInvestmentAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/investments/accounts", {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to fetch investment accounts");
      setInvestmentAccounts(data);
    } catch (err: any) {
      messageApi.error(err.message || "Error fetching investment accounts");
    }
  }, [userToken, messageApi]);

  const fetchPriceWithRetry = async (
    assetName: string,
    retries = 3,
    delay = 1500
  ) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(`/api/investments/price?assetName=${assetName}`);
        if (!res.ok) {
          throw new Error(`Attempt ${i + 1} failed`);
        }
        const data = await res.json();
        if (data.currentPrice !== undefined) {
          setAssetPrices((prev) => ({ ...prev, [assetName]: data }));
          return; // Success
        }
      } catch (error) {
        console.warn(`Fetching price for ${assetName} failed. Retrying...`, error);
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          console.error(`All retries failed for ${assetName}`);
        }
      }
    }
  };

  useEffect(() => {
    if (userToken) {
      fetchInvestments();
      fetchInvestmentAccounts();
    }
  }, [userToken, fetchInvestments, fetchInvestmentAccounts]);

  useEffect(() => {
    if (investments.length > 0) {
      const uniqueAssetNames = [
        ...new Set(investments.map((inv) => inv.assetName)),
      ];
      uniqueAssetNames.forEach((assetName) => {
        setPricesLoading((prev) => ({ ...prev, [assetName]: true }));
        fetchPriceWithRetry(assetName).finally(() => {
          setPricesLoading((prev) => ({ ...prev, [assetName]: false }));
        });
      });
    }
  }, [investments]);

  const handleOpenModal = (investment: Investment | null = null) => {
    if (investment) {
      setEditingInvestment(investment);
      setSelectedAssetType(investment.assetType as AssetType);
      form.setFieldsValue({
        investmentAccountId: investment.investmentAccountId,
        assetType: investment.assetType,
        assetName: investment.assetName,
        amount: investment.amount,
        status: investment.status,
        description: investment.description,
        reference: investment.reference,
      });
    } else {
      setEditingInvestment(null);
      form.resetFields();
      setSelectedAssetType(null);
    }
    setModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    const url = editingInvestment
      ? `/api/investments/${editingInvestment.id}`
      : "/api/investments";
    const method = editingInvestment ? "PUT" : "POST";

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
            `Failed to ${editingInvestment ? "update" : "create"} investment`
        );

      messageApi.success(
        `Investment ${
          editingInvestment ? "updated" : "created"
        } successfully!`
      );
      setModalOpen(false);
      fetchInvestments();
    } catch (err: any) {
      messageApi.error(
        err.message ||
          `Error ${editingInvestment ? "creating" : "updating"} investment`
      );
    }
  };

  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiModalOpen(true);
    setAiAnalysis("");

    try {
      if (investments.length === 0) {
        throw new Error("No investments to analyze.");
      }

      const investmentsToAnalyze = investments.map((inv) => ({
        assetName: inv.assetName,
        assetType: inv.assetType,
        quantity: inv.amount,
        currentValue:
          (assetPrices[inv.assetName]?.currentPrice || 0) * inv.amount,
      }));

      const aiRes = await fetch("/api/ai/investment-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          investments: investmentsToAnalyze,
          userQuestion:
            "Analyze my portfolio's diversification, identify risks, and provide 2-3 actionable suggestions for improvement.",
        }),
      });

      const aiData = await aiRes.json();
      if (!aiRes.ok)
        throw new Error(aiData.message || "AI Analysis Failed");

      setAiAnalysis(
        aiData.analysisText || "Analysis completed, but no text was returned."
      );
      messageApi.success("AI Analysis complete!");
    } catch (err: any) {
      setAiAnalysis(`Error during analysis: ${err.message}`);
      messageApi.error(err.message || "Error running AI analysis");
    } finally {
      setAiLoading(false);
    }
  };

  const handleFormValuesChange = (changedValues: any) => {
    if (changedValues.assetType) {
      setSelectedAssetType(changedValues.assetType);
      form.setFieldsValue({ assetName: undefined });
    }
  };

  const getAssetOptions = () => {
    if (!selectedAssetType) return [];
    switch (selectedAssetType) {
      case "Stock":
        return investmentOptions.stocks;
      case "Bond":
        return investmentOptions.bonds;
      case "Crypto":
        return investmentOptions.crypto;
      default:
        return [];
    }
  };

  const columns = [
    { title: "Account", dataIndex: "accountName", key: "accountName" },
    { title: "Asset Name", dataIndex: "assetName", key: "assetName" },
    {
      title: "Quantity",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => amount.toLocaleString(),
    },
    {
      title: "Previous Close",
      dataIndex: "assetName",
      key: "previousClose",
      render: (assetName: string) => {
        if (pricesLoading[assetName]) return <Spin size="small" />;
        const priceData = assetPrices[assetName];
        return priceData
          ? `$${priceData.previousClose.toLocaleString()}`
          : "N/A";
      },
    },
    {
      title: "Current Price",
      dataIndex: "assetName",
      key: "currentPrice",
      render: (assetName: string) => {
        if (pricesLoading[assetName]) return <Spin size="small" />;
        const priceData = assetPrices[assetName];
        return priceData
          ? `$${priceData.currentPrice.toLocaleString()}`
          : "N/A";
      },
    },
    {
      title: "Current Value",
      key: "currentValue",
      render: (_: any, record: Investment) => {
        if (pricesLoading[record.assetName]) return <Spin size="small" />;
        const priceData = assetPrices[record.assetName];
        if (!priceData) return "N/A";
        const value = priceData.currentPrice * record.amount;
        return `$${value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      },
    },
    {
      title: "Direction",
      key: "direction",
      render: (_: any, record: Investment) => {
        if (pricesLoading[record.assetName]) return <Spin size="small" />;
        const priceData = assetPrices[record.assetName];
        if (!priceData) return "—";

        if (priceData.currentPrice > priceData.previousClose) {
          return <ArrowUpOutlined style={{ color: "green" }} />;
        }
        if (priceData.currentPrice < priceData.previousClose) {
          return <ArrowDownOutlined style={{ color: "red" }} />;
        }
        return "—";
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text: string) =>
        text ? <Tag>{text.toUpperCase()}</Tag> : "—",
    },
    {
      title: "Date Added",
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
      render: (_: any, record: Investment) => (
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
            Investment Assets
          </span>
        </Col>
        <Col>
          <Space>
            <Button onClick={handleAiAnalysis} loading={aiLoading}>
              AI Investment Advisor 🧠
            </Button>
            <Button type="primary" onClick={() => handleOpenModal()}>
              Create Investment
            </Button>
          </Space>
        </Col>
      </Row>
    </div>
  );

  const isClosed = editingInvestment?.status === "closed";

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
            dataSource={investments}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10 }}
            style={{ border: 0 }}
          />
        )}
      </Card>

      <Modal
        title={editingInvestment ? "Edit Investment" : "Create Investment"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={handleFormValuesChange}
        >
          <Form.Item
            label="Investment Account"
            name="investmentAccountId"
            rules={[{ required: true, message: "Please select an account" }]}
          >
            <Select
              placeholder="Select an investment account"
              disabled={!!editingInvestment}
            >
              {investmentAccounts.map((acc) => (
                <Option key={acc.id} value={acc.id}>
                  {acc.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Asset Type"
            name="assetType"
            rules={[{ required: true, message: "Please select an asset type" }]}
          >
            <Select
              placeholder="Select asset type"
              disabled={!!editingInvestment}
            >
              <Option value="Stock">Stock</Option>
              <Option value="Bond">Bond</Option>
              <Option value="Crypto">Crypto</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Asset Name"
            name="assetName"
            rules={[{ required: true, message: "Please select an asset name" }]}
          >
            <Select
              placeholder="Select asset name"
              disabled={!!editingInvestment || !selectedAssetType}
              showSearch
            >
              {getAssetOptions().map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Quantity"
            name="amount"
            rules={[{ required: true, message: "Please enter the quantity" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="e.g., 10.5"
              min="0"
              disabled={!!editingInvestment}
            />
          </Form.Item>

          <Form.Item label="Status" name="status">
            <Select
              placeholder="Select a status (optional)"
              disabled={isClosed}
            >
              <Option value="active">Active</Option>
              <Option value="closed">Closed</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea
              placeholder="Optional: Purchase notes, etc."
              disabled={isClosed}
            />
          </Form.Item>

          <Form.Item label="Reference" name="reference">
            <Input
              placeholder="Optional: Brokerage reference number"
              disabled={isClosed}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block disabled={isClosed}>
              {editingInvestment ? "Update Investment" : "Create Investment"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

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
                AI Investment Advisor 🧸
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

export default AssetsPage;
