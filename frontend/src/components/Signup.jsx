import React, { useState } from 'react';
import { getApiClient, getAuthenticatedApiClient } from '../api';


export default function Signup({ handleSignUpSuccess, onToggleAuthMode }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Step 1: Register the user
            await getApiClient().post('/users', {
                name,
                email,
                password
            });

            // Step 2: Login the newly created user
            const formData = new URLSearchParams();
            formData.append('username', email); // FastAPI wants this key
            formData.append('password', password);

            const loginResponse = await getApiClient().post('/token', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const { access_token } = loginResponse.data;
            localStorage.setItem("token", access_token)

            const userResponse = await getAuthenticatedApiClient().get('/users/me/');

            const userData = userResponse.data;

            // Step 4: Call success handler
            handleSignUpSuccess(userData, access_token);

        } catch (err) {
            console.error('Signup error:', err);
            setError(err.response?.data?.detail || 'Signup failed. Email might be taken or password weak.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Create an account</h2>
            <p className="subtitle">Sign up to get started!</p>

            <div className="form-group">
                <label htmlFor="signup-name">Name</label>
                <input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="signup-email">Email</label>
                <input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="signup-password">Password</label>
                <input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>

            <button type="submit" className="auth-button">
                Signup
            </button>

            <button type="button" className="google-button">
                <img src="https://www.gstatic.com/images/branding/product/2x/google_fonts_24dp.png" alt="Google icon" />
                Sign in with Google
            </button>

            <p className="switch-auth-mode">
                Already have an account? <button type="button" onClick={() => onToggleAuthMode(true)}>Login</button>
            </p>
        </form>
    );
}

