import { Button, Form, Input, message } from 'antd';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import authApi from '../Api/authApi';
import recoveryBanner from '../assets/recovery-pic.png';

export default function ResetPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const defaultEmail = location.state?.email || '';
  const defaultOtp = location.state?.otp || '';

  const onFinish = async (values) => {
    try {
      setSubmitting(true);
      await authApi.resetPassword({
        email: values.email?.trim().toLowerCase(),
        otp: values.otp?.trim(),
        password: values.password,
        password_confirmation: values.password_confirmation,
      });
      message.success('Password reset successful. Please login again.');
      navigate('/login');
    } catch (error) {
      message.error(error?.response?.data?.message || 'Password reset failed.');
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
          maxWidth: '1120px',
          minHeight: '680px',
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
            <h1 style={{ margin: 0, fontSize: '34px', lineHeight: 1.2 }}>Set a New Password</h1>
            <p style={{ margin: '12px 0 0', maxWidth: '420px', color: 'rgba(255,255,255,0.92)' }}>
              Choose a strong password to protect your account and continue with confidence.
            </p>
          </div>
        </div>

        <div
          style={{
            flex: '1 1 460px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 32px',
          }}
        >
          <div style={{ width: '100%', maxWidth: '430px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '8px', fontSize: '28px', color: '#1f2937' }}>
              Create New Password
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '22px' }}>Set your new password and confirm it.</p>
            <Form layout="vertical" onFinish={onFinish} initialValues={{ email: defaultEmail, otp: defaultOtp }}>
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
              <Form.Item
                label="New Password"
                name="password"
                dependencies={['email']}
                rules={[
                  { required: true, message: 'Please enter new password.' },
                  { min: 8, message: 'Password must be at least 8 characters.' },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/,
                    message: 'Password must contain uppercase, lowercase, number, and special character.',
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const emailValue = getFieldValue('email');
                      if (!value || !emailValue) {
                        return Promise.resolve();
                      }

                      if (value.toLowerCase() === String(emailValue).toLowerCase()) {
                        return Promise.reject(new Error('Password cannot be the same as your email.'));
                      }

                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Input.Password size="large" />
              </Form.Item>
              <Form.Item
                label="Confirm New Password"
                name="password_confirmation"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm new password.' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match.'));
                    },
                  }),
                ]}
              >
                <Input.Password size="large" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block size="large" loading={submitting}>
                Reset Password
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
