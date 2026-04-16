import { Button, Form, Input, message } from 'antd';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import authApi from '../Api/authApi';
import recoveryBanner from '../assets/recovery-pic.png';

export default function VerifyOtpPage() {
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const defaultEmail = location.state?.email || '';

  const onFinish = async (values) => {
    const email = values.email?.trim().toLowerCase();
    const otp = values.otp?.trim();

    try {
      setSubmitting(true);
      await authApi.verifyOtp({ email, otp });
      message.success('OTP verified successfully.');
      navigate('/reset-password', { state: { email, otp } });
    } catch (error) {
      message.error(error?.response?.data?.message || 'OTP verification failed.');
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
            <h1 style={{ margin: 0, fontSize: '34px', lineHeight: 1.2 }}>Verify Your OTP</h1>
            <p style={{ margin: '12px 0 0', maxWidth: '420px', color: 'rgba(255,255,255,0.92)' }}>
              Enter the security code sent to your inbox to continue resetting your password.
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
            <h2 style={{ marginTop: 0, marginBottom: '8px', fontSize: '28px', color: '#1f2937' }}>Verify OTP</h2>
            <p style={{ color: '#6b7280', marginBottom: '22px' }}>Enter the 5-digit OTP sent to your email.</p>
            <Form layout="vertical" onFinish={onFinish} initialValues={{ email: defaultEmail }}>
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
              <Form.Item
                label="OTP"
                name="otp"
                rules={[
                  { required: true, message: 'Please enter OTP.' },
                  { len: 5, message: 'OTP must be exactly 5 digits.' },
                  { pattern: /^\d{5}$/, message: 'OTP must contain only numbers.' },
                ]}
              >
                <Input size="large" placeholder="12345" maxLength={5} />
              </Form.Item>
              <Button type="primary" htmlType="submit" block size="large" loading={submitting}>
                Verify OTP
              </Button>
            </Form>
            <p style={{ marginTop: '16px', textAlign: 'center', color: '#6b7280' }}>
              <Link to="/forgot-password" style={{ color: '#2563eb', fontWeight: 600 }}>
                Resend OTP
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
