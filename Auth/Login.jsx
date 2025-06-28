import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './Login.css'
import axios from 'axios';

const DOMAIN = import.meta.env.VITE_DOMAIN || 'http://localhost:3000';

function Login({ onLogin, onSwitchToRegister }) {
     const [error, setError] = useState(null);
     const [loading, setLoading] = useState(false);

     async function handleLogin(event) {
          event.preventDefault();
          if (loading) return;
          setLoading(true);
          const username = event.target.username.value;
          const password = event.target.password.value;

          try {
               const res = await axios.post(`${DOMAIN}/login`, {
                    username,
                    password
               });
               if (res.data && res.data.id) {
                    onLogin(res.data); // <-- This sets user in Home
               } else {
                    setError('Invalid username or password');
               }
          } catch (err) {
               setError(err.response?.data || 'Login failed');
          } finally {
               setLoading(false);
          }
     }

     return (
          <div className="auth-container">
               <div className="auth-card">
                    <h2 className="auth-title">Sign In</h2>
                    <form className="auth-form" autoComplete="on" onSubmit={handleLogin}>
                         <div className="input-group">
                              <label htmlFor="username">Username</label>
                              <input type="text" id="username" placeholder="Enter your username" autoComplete="username" />
                         </div>
                         <div className="input-group">
                              <label htmlFor="password">Password</label>
                              <input type="password" id="password" placeholder="Enter your password" autoComplete="current-password" />
                         </div>
                         <button type="submit" className="auth-btn" disabled={loading}>
                              {loading ? 'Logging in...' : 'Login'}
                         </button>
                    </form>
                    <div className="divider"><span>or</span></div>
                    <div className="google-login">
                         <GoogleLogin
                              onSuccess={credentialResponse => {
                                   const user = jwtDecode(credentialResponse.credential);
                                   onLogin(user); // <-- This sets user in Home
                              }}
                              onError={() => setError('Google Login Failed')}
                         />
                         {error && <p className="error">{error}</p>}
                    </div>
                    <div className="auth-footer">
                         <span>Don't have an account?</span>
                         <button className="link-btn" type="button" onClick={onSwitchToRegister} disabled={loading}>
                              Sign up
                         </button>
                    </div>
               </div>
          </div>
     );
}

export default Login;