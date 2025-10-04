// components/DashboardLayout.tsx
"use client";

import React, { useState } from "react";
import {
  DesktopOutlined,
  PieChartOutlined,
  BankOutlined,
  SettingOutlined,
  MoneyCollectOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Layout, Menu, theme } from "antd";
import { useRouter } from "next/navigation";

const { Header, Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return { key, icon, children, label } as MenuItem;
}

const items: MenuItem[] = [
  getItem("Dashboard", "dashboard", <PieChartOutlined />),
  getItem("Transactions", "dashboard/transactions", <MoneyCollectOutlined />),
  getItem("Accounts", "dashboard/accounts", <BankOutlined />),
  getItem("Settings", "settings", <SettingOutlined />),
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  breadcrumbItems?: { title: string }[];
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const onMenuClick: MenuProps["onClick"] = ({ key }) => {
    router.push(`/${key}`);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{ background: "#fff" }}
      >
        {/* Circle logo placeholder with padding top */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: "10em",
            paddingBottom: "5em",
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "black",
            }}
          />
        </div>

        <Menu
          style={{ background: "#fff", color: "#000" }}
          defaultSelectedKeys={["dashboard"]}
          mode="inline"
          items={items}
          onClick={onMenuClick}
        />
      </Sider>

      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: "0 16px" }}>
          <div style={{ margin: "16px 0" }} />
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {children}
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          Ant Design ©{new Date().getFullYear()} Created by Ant UED
        </Footer>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
