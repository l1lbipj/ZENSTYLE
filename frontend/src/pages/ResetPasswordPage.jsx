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
    <div style={styles.page}>
      <div style={styles.card}>
        {/* LEFT IMAGE */}
        <div style={styles.left}>
          <div style={styles.overlay}>
            <h1 style={styles.title}>Set a New Password</h1>
            <p style={styles.desc}>
              Choose a strong password to protect your account.
            </p>
          </div>
        </div>

        {/* RIGHT FORM */}
        <div style={styles.right}>
          <div style={{ width: '100%', maxWidth: 430 }}>
            <h2 style={styles.heading}>Create New Password</h2>
            <p style={styles.sub}>Set your new password and confirm it.</p>

            <Form
              layout="vertical"
              onFinish={onFinish}
              initialValues={{ email: defaultEmail, otp: defaultOtp }}
            >
              {/* EMAIL */}
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email.' },
                  { type: 'email', message: 'Invalid email.' },
                ]}
              >
                <Input size="large" disabled />
              </Form.Item>

              {/* OTP */}
              <Form.Item
                label="OTP"
                name="otp"
                rules={[
                  { required: true, message: 'Please enter OTP.' },
                  { len: 5, message: 'OTP must be 5 digits.' },
                  { pattern: /^\d{5}$/, message: 'OTP must be numeric.' },
                ]}
              >
                <Input size="large" maxLength={5} disabled />
              </Form.Item>

              {/* PASSWORD */}
              <Form.Item
                label="New Password"
                name="password"
                dependencies={['email']}
                rules={[
                  { required: true, message: 'Enter new password.' },
                  { min: 8, message: 'At least 8 characters.' },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/,
                    message: 'Must include upper, lower, number & special char.',
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const email = getFieldValue('email');
                      if (!value || !email) return Promise.resolve();

                      if (value.toLowerCase() === String(email).toLowerCase()) {
                        return Promise.reject(
                          new Error('Password cannot be same as email.')
                        );
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Input.Password size="large" />
              </Form.Item>

              {/* CONFIRM */}
              <Form.Item
                label="Confirm Password"
                name="password_confirmation"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Confirm password.' },
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

            <p style={styles.back}>
              <Link to="/login">Back to Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* STYLE CLEAN */
const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    background: 'linear-gradient(135deg, #f5f7ff, #dfeaff)',
  },
  card: {
    width: '100%',
    maxWidth: 1100,
    display: 'flex',
    borderRadius: 20,
    overflow: 'hidden',
    background: '#fff',
    boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
  },
  left: {
    flex: 1,
    backgroundImage: `url(${recoveryBanner})`,
    backgroundSize: 'cover',
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    padding: 32,
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    background: 'rgba(0,0,0,0.5)',
  },
  right: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  title: { fontSize: 32, margin: 0 },
  desc: { marginTop: 10 },
  heading: { fontSize: 26 },
  sub: { color: '#666', marginBottom: 20 },
  back: { marginTop: 16, textAlign: 'center' },
};