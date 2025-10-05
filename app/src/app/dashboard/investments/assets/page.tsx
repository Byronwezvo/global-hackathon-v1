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
} from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { investmentOptions } from "@/lib/investmentOptions";

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
        fetch(`/api/investments/price?assetName=${assetName}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.currentPrice !== undefined) {
              setAssetPrices((prev) => ({ ...prev, [assetName]: data }));
            }
          })
          .catch((err) =>
            console.error(`Failed to fetch price for ${assetName}`, err)
          )
          .finally(() => {
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
          <Button type="primary" onClick={() => handleOpenModal()}>
            Create Investment
          </Button>
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
    </div>
  );
};

export default AssetsPage;
