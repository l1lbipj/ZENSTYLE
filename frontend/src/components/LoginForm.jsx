
import { Button, Checkbox, Form, Input, } from 'antd';
import { Space, Typography } from 'antd';
const { Text, Link } = Typography;
const onFinish = values => {
  console.log('Success:', values);
};
const onFinishFailed = errorInfo => {
  console.log('Failed:', errorInfo);
};
const App = () => (
  <Form
  name="basic"
    style={{ maxWidth: 600 }}
    initialValues={{ remember: true }}
    onFinish={onFinish}
    onFinishFailed={onFinishFailed}
    autoComplete="off"
  >
    <Form.Item
      label="Username"
      name="username"
      rules={[{required: true, message: "Plese enter your user name"}]}
      layout="vertical"
    >
      <Input placeholder='Enter your username...' />
    </Form.Item>

    <Form.Item
    label="Password"
    name="password"
    rules={[{required: true, message: 'Please enter your Password'}]}
    layout="vertical"
    >
      <Input.Password placeholder='Enter your password'/>
    </Form.Item>

    <Form.Item name="remember" label={null}>
      <Checkbox>Remember me</Checkbox>
      <p>Do not have Account?<Link href="https://ant.design" target="_blank"> Register now!</Link></p>
    </Form.Item>
    <Form.Item label={null}>
      <Button type="primary" htmlType="submit">
         Submit
      </Button>
    </Form.Item>
  </Form>
);
export default App;