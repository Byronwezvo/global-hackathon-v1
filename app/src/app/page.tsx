// components/AuthForm.tsx
"use client";

import React, { useState } from "react";
import { Tabs, Form, Input, Button, Card, message } from "antd";

const { TabPane } = Tabs;

const AuthForm: React.FC = () => {
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState("login");

  // message hook
  const [messageApi, contextHolder] = message.useMessage();

  const handleLogin = async (values: any) => {
    try {
      const response = await fetch("/api/auth/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        messageApi.success("Login successful!");
        // Save token, redirect, etc.
      } else {
        messageApi.error(data.message || "Login failed");
      }
    } catch (err: any) {
      messageApi.error("Login failed: " + err.message);
    }
  };

  const handleRegister = async (values: any) => {
    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        messageApi.success("Registration successful! Please log in.");
        setActiveTab("login"); // Switch to login tab
        registerForm.resetFields();
      } else {
        messageApi.error(data.message || "Registration failed");
      }
    } catch (err: any) {
      messageApi.error("Registration failed: " + err.message);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#fff",
      }}
    >
      {/* Place contextHolder here once */}
      {contextHolder}
      <Card style={{ width: 400, padding: "2rem" }}>
        <Tabs
          activeKey={activeTab}
          centered
          onChange={(key) => setActiveTab(key)}
        >
          <TabPane tab="Login" key="login">
            <Form form={loginForm} layout="vertical" onFinish={handleLogin}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Please input your email!" },
                  { type: "email", message: "Enter a valid email" },
                ]}
              >
                <Input placeholder="Email" />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: "Please input your password!" },
                ]}
              >
                <Input.Password placeholder="Password" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Login
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="Register" key="register">
            <Form
              form={registerForm}
              layout="vertical"
              onFinish={handleRegister}
            >
              <Form.Item
                label="Name"
                name="name"
                rules={[{ required: true, message: "Please input your name!" }]}
              >
                <Input placeholder="Name" />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Please input your email!" },
                  { type: "email", message: "Enter a valid email" },
                ]}
              >
                <Input placeholder="Email" />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: "Please input your password!" },
                ]}
              >
                <Input.Password placeholder="Password" />
              </Form.Item>

              <Form.Item
                label="Confirm Password"
                name="confirmPassword"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Please confirm your password!" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("Passwords do not match!")
                      );
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Confirm Password" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Register
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default AuthForm;
