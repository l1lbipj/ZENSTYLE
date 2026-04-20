import React, { useState } from 'react';
import { Button, DatePicker, Form, Input, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import authApi from '../../Api/authApi';
import registerBanner from '../../assets/register-warm.png';

const Register = () => {
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const getApiErrorMessage = (error) => {
    const errors = error?.response?.data?.errors;
    if (errors && typeof errors === 'object') {
      const firstField = Object.keys(errors)[0];
      const firstFieldErrors = errors[firstField];
      if (Array.isArray(firstFieldErrors) && firstFieldErrors.length > 0) {
        return firstFieldErrors[0];
      }
    }

    return (
      error?.response?.data?.message ||
      error?.message ||
      'Register failed. Please try again.'
    );
  };

  const onFinish = async (values) => {
    const payload = {
      type: 'client',
      client_name: values.client_name,
      phone: values.phone,
      email: values.email,
      password: values.password,
      password_confirmation: values.confirmPassword,
      dob: values.dob?.format('YYYY-MM-DD'),
      status: 'active',
    };

    try {
      setSubmitting(true);
      const response = await authApi.register(payload);
      const successMessage = response?.data?.message || 'Register successful! Please sign in.';
      message.success(successMessage);
      navigate('/login');
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
            backgroundImage: `url(${registerBanner})`,
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
            <h1 style={{ margin: 0, fontSize: '34px', lineHeight: 1.2 }}>Join ZENSTYLE</h1>
            <p style={{ margin: '12px 0 0', maxWidth: '420px', color: 'rgba(255,255,255,0.92)' }}>
              Create your account and unlock personalized beauty and styling services.
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
            <div style={{ marginBottom: '22px' }}>
              <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#1f2937' }}>
                Create account
              </h2>
              <p style={{ margin: '8px 0 0', color: '#6b7280' }}>
                Please fill in your information to register.
              </p>
            </div>

            <Form
              name="register-form"
              layout="vertical"
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
              autoComplete="off"
            >
              <Form.Item
                label="Full Name"
                name="client_name"
                rules={[
                  { required: true, message: 'Please enter your full name!' },
                  { min: 2, message: 'The first and last names must have at least two characters.' },
                ]}
              >
                <Input size="large" placeholder="Nguyen Van A" />
              </Form.Item>

              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[
                  { required: true, message: 'Please enter your phone number!' },
                  { pattern: /^(0|\+84)\d{9,10}$/, message: 'The phone number is invalid!' },
                ]}
              >
                <Input size="large" placeholder="0901234567" />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email address!' },
                  { type: 'email', message: 'Invalid email address!' },
                ]}
              >
                <Input size="large" placeholder="you@gmail.com" />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: 'Please enter your password!' },
                  { min: 8, message: 'Passwords must have at least 8 characters.' },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/,
                    message: 'Passwords must contain uppercase letters, lowercase letters, numbers, and special characters.',
                  },
                ]}
              >
                <Input.Password size="large" placeholder="Enter password" />
              </Form.Item>

              <Form.Item
                label="Confirm Password"
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm your password!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }

                      return Promise.reject(new Error('The verification password does not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password size="large" placeholder="Re-enter password" />
              </Form.Item>

              <Form.Item
                label="Date Of Birth"
                name="dob"
                rules={[{ required: true, message: 'Please select your date of birth!' }]}
              >
                <DatePicker size="large" style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" size="large" block loading={submitting}>
                  Create account
                </Button>
              </Form.Item>
            </Form>

            <p style={{ margin: '16px 0 0', textAlign: 'center', color: '#6b7280' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#2563eb', fontWeight: 600 }}>
                Sign in
              </Link>
            </p>
            <p style={{ margin: '8px 0 0', textAlign: 'center' }}>
              <Link to="/" style={{ color: '#2563eb', fontWeight: 600 }}>
                Back to homepage
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
