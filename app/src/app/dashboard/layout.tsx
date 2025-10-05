// components/DashboardLayout.tsx
"use client";

import React, { useState } from "react";
import {
  DesktopOutlined,
  PieChartOutlined,
  BankOutlined,
  LogoutOutlined,
  MoneyCollectOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Layout, Menu, theme } from "antd";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { logout } from "@/redux/reducers/auth";

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
  getItem("Accounts", "dashboard/accounts", <BankOutlined />),
  getItem("Transactions", "dashboard/transactions", <MoneyCollectOutlined />),
  getItem("Investments", "dashboard/investments", <DesktopOutlined />, [
    getItem("Portfolio", "dashboard/investments/portfolio"),
    getItem("Assets", "dashboard/investments/assets"),
  ]),
  getItem("Logout", "logout", <LogoutOutlined />),
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const onMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "logout") {
      dispatch(logout());
      router.push("/");
    } else {
      router.push(`/${key}`);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          background: "#fff",
          borderRight: "1px solid #f0f0f0",
        }}
      >
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
          style={{ background: "#fff", color: "#000", borderRight: 0 }}
          defaultSelectedKeys={["dashboard"]}
          mode="inline"
          items={items}
          onClick={onMenuClick}
        />
      </Sider>
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 200,
          transition: "margin-left 0.2s",
        }}
      >
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            position: "sticky",
            top: 0,
            zIndex: 10,
            width: "100%",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          {/* You can add header content here if needed */}
        </Header>
        <Content
          style={{
            margin: "24px 16px 0",
            overflow: "auto", // Make content scrollable
          }}
        >
          <div
            style={{
              padding: 24,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              minHeight: "calc(100vh - 180px)", // Adjust based on header/footer/margin height
            }}
          >
            {children}
          </div>
        </Content>
        <Footer
          style={{
            textAlign: "center",
            background: "#fff",
            borderTop: "1px solid #f0f0f0",
          }}
        >
          ©{new Date().getFullYear()} made with love by{" "}
          <a
            href="https://github.com/Byronwezvo"
            target="_blank"
            rel="noopener noreferrer"
          >
            Byron Wezvo
          </a>
        </Footer>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
