import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import UserProfile from './components/UserProfile';

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);

  const handleLoginSuccess = (token: string) => {
    setToken(token);
  };

  if (!token) {
    return (
      <div>
        <LoginForm onLoginSuccess={handleLoginSuccess} />
        <RegisterForm />
      </div>
    );
  }

  return <UserProfile token={token} />;
};

export default App;
