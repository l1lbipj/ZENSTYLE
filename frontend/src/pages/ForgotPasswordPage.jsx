import { Button, Form, Input, message } from 'antd';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authApi from '../Api/authApi';
import recoveryBanner from '../assets/recovery-pic.png';

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setSubmitting(true);
      await authApi.forgotPassword({ email: values.email?.trim().toLowerCase() });
      message.success('OTP has been sent to your email.');
      navigate('/verify-otp', { state: { email: values.email?.trim().toLowerCase() } });
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setSubmitting(false);
    }
  };

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
            backgroundImage: `url(${recoveryBanner})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(10,25,47,0.22) 0%, rgba(10,25,47,0.62) 62%, rgba(10,25,47,0.82) 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '32px',
              color: '#ffffff',
            }}
          >
            <h1 style={{ margin: 0, fontSize: '34px', lineHeight: 1.2 }}>Recover Your Account</h1>
            <p style={{ margin: '12px 0 0', maxWidth: '420px', color: 'rgba(255,255,255,0.92)' }}>
              We will send a secure OTP to your email so you can reset your password safely.
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
            <h2 style={{ marginTop: 0, marginBottom: '8px', fontSize: '28px', color: '#1f2937' }}>Forgot Password</h2>
            <p style={{ color: '#6b7280', marginBottom: '22px' }}>
              Enter your registered email to receive a 5-digit OTP.
            </p>
            <p style={{ color: '#6b7280', marginBottom: '22px', fontSize: '14px' }}>
              Demo accounts: <strong>admin@zenstyle.com</strong>, <strong>staff1@zenstyle.com</strong>, <strong>client1@zenstyle.com</strong>
            </p>
            <Form layout="vertical" onFinish={onFinish}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email.' },
                  { type: 'email', message: 'Please enter a valid email.' },
                ]}
              >
                <Input size="large" placeholder="you@example.com" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block size="large" loading={submitting}>
                Send OTP
              </Button>
            </Form>
            <p style={{ marginTop: '16px', textAlign: 'center', color: '#6b7280' }}>
              <Link to="/login" style={{ color: '#2563eb', fontWeight: 600 }}>
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
