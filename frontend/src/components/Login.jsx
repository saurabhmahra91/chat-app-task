import React, { useState } from 'react';
import { getApiClient, getAuthenticatedApiClient } from '../api';

export default function Login({ handleLoginSuccess, onToggleAuthMode }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); // Added password state
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const formData = new URLSearchParams();

            formData.append('username', email); // FastAPI expects 'username' key
            formData.append('password', password);

            const response = await getApiClient().post('/token', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const { access_token } = response.data;
            
            localStorage.setItem("token", access_token)
            const userResponse = await getAuthenticatedApiClient().get('/users/me/', {
                headers: {
                    Authorization: `Bearer ${access_token}`
                }
            });

            const userData = userResponse.data;
            handleLoginSuccess(userData, access_token)

        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.detail || 'Failed to login. Check credentials.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <form onSubmit={handleSubmit}>
            <h2>Welcome back</h2>
            <p className="subtitle">Welcome back! Please enter your details.</p>

            <div className="form-group">
                <label htmlFor="login-email">Email</label>
                <input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <input
                    id="login-password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>

            <div className="forgot-password">
                <a href="#forgot-password">Forgot password</a> {/* Placeholder link */}
            </div>

            <button type="submit" className="auth-button">
                Login
            </button>

            <button type="button" className="google-button">
                <img src="https://www.gstatic.com/images/branding/product/2x/google_fonts_24dp.png" alt="Google icon" />
                Sign in with Google
            </button>

            <p className="switch-auth-mode">
                Don't have an account? <button type="button" onClick={() => onToggleAuthMode(false)}>Sign up for free</button>
            </p>
        </form>
    );
}

