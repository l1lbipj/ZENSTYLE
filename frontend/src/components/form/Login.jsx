import React, { useEffect, useRef, useState } from 'react';
import { Button, Checkbox, Form, Input, message } from 'antd';
import { Link } from 'react-router-dom';
import authApi from '../../Api/authApi';
import { setAuth } from '../../utils/auth';
import loginBanner from '../../assets/login-banner.jpg';

const Login = () => {
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleButtonRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const getApiErrorMessage = (error) => {
    const errors = error?.response?.data?.errors;
    if (errors && typeof errors === 'object') {
      const firstField = Object.keys(errors)[0];
      const firstFieldErrors = errors[firstField];
      if (Array.isArray(firstFieldErrors) && firstFieldErrors.length > 0) {
        return firstFieldErrors[0];
      }
    }

    return error?.response?.data?.message || error?.message || 'Login failed. Please try again.';
  };

  const onFinish = async (values) => {
    const payload = {
      email: values.email?.trim().toLowerCase(),
      password: values.password,
    };

    try {
      setSubmitting(true);
      const response = await authApi.login(payload);
      setAuth(response?.data);
      message.success('Login successful!');
    } catch (error) {
      const errorMessage = getApiErrorMessage(error);
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const onFinishFailed = () => {
    message.warning('Please check your input fields.');
  };

  useEffect(() => {
    if (!googleClientId) {
      return undefined;
    }

    const initializeGoogleSignIn = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (googleResponse) => {
          try {
            setGoogleLoading(true);
            const response = await authApi.googleLogin({ credential: googleResponse.credential });
            setAuth(response?.data);
            message.success('Google login successful!');
          } catch (error) {
            message.error(getApiErrorMessage(error));
          } finally {
            setGoogleLoading(false);
          }
        },
      });

      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: 380,
      });
    };

    if (window.google?.accounts?.id) {
      initializeGoogleSignIn();
      return undefined;
    }

    const existingScript = document.querySelector('script[data-google-gsi="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', initializeGoogleSignIn);
      return () => existingScript.removeEventListener('load', initializeGoogleSignIn);
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client?hl=en';
    script.async = true;
    script.defer = true;
    script.dataset.googleGsi = 'true';
    script.addEventListener('load', initializeGoogleSignIn);
    document.head.appendChild(script);

    return () => script.removeEventListener('load', initializeGoogleSignIn);
  }, [googleClientId]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        background:
          'linear-gradient(135deg, rgba(245,247,255,1) 0%, rgba(234,241,255,1) 45%, rgba(223,236,255,1) 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1100px',
          minHeight: '640px',
          display: 'flex',
          flexWrap: 'wrap',
          overflow: 'hidden',
          borderRadius: '20px',
          backgroundColor: '#ffffff',
          boxShadow: '0 22px 50px rgba(39, 64, 109, 0.2)',
        }}
      >
        <div
          style={{
            flex: '1 1 520px',
            minHeight: '320px',
            position: 'relative',
            backgroundImage: `url(${loginBanner})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(10,25,47,0.25) 0%, rgba(10,25,47,0.65) 65%, rgba(10,25,47,0.82) 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '32px',
              color: '#ffffff',
            }}
          >
            <h1 style={{ margin: 0, fontSize: '34px', lineHeight: 1.2 }}>ZENSTYLE</h1>
            <p style={{ margin: '12px 0 0', maxWidth: '420px', color: 'rgba(255,255,255,0.9)' }}>
              Elevate your look with premium styling experiences crafted by our experts.
            </p>
          </div>
        </div>

        <div
          style={{
            flex: '1 1 420px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 32px',
          }}
        >
          <div style={{ width: '100%', maxWidth: '420px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#1f2937',
                }}
              >
                Welcome back
              </h2>
              <p style={{ margin: '8px 0 0', color: '#6b7280' }}>
                Sign in to continue managing your account.
              </p>
            </div>

            <Form
              name="login-form"
              layout="vertical"
              initialValues={{ remember: true }}
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
              autoComplete="off"
            >
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please input your email!' },
                  { type: 'email', message: 'Please enter a valid email!' },
                ]}
              >
                <Input size="large" placeholder="you@example.com" />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Please input your password!' }]}
              >
                <Input.Password size="large" placeholder="Enter your password" />
              </Form.Item>

              <Form.Item
                name="remember"
                valuePropName="checked"
                style={{ marginBottom: '12px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <Checkbox>Remember me</Checkbox>
                  <a href="#" style={{ color: '#2563eb', fontSize: '14px' }}>
                    Forgot password?
                  </a>
                </div>
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" size="large" block loading={submitting}>
                  Sign in
                </Button>
              </Form.Item>
            </Form>

            <div style={{ marginTop: '18px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>OR CONTINUE WITH</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
              </div>

              {googleClientId ? (
                <div>
                  <div ref={googleButtonRef} style={{ width: '100%' }} />
                  {googleLoading ? (
                    <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '13px' }}>
                      Processing Google sign-in...
                    </p>
                  ) : null}
                </div>
              ) : (
                <Button size="large" block disabled>
                  Google is not configured
                </Button>
              )}

              <p style={{ margin: '16px 0 0', textAlign: 'center', color: '#6b7280' }}>
                Don&apos;t have an account?{' '}
                <Link to="/register" style={{ color: '#2563eb', fontWeight: 600 }}>
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;