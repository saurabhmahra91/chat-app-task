import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import './Auth.css'; // Import the new CSS file

export default function AuthScreen({ handleLoginSuccess, handleSignUpSuccess }) {
    const [isLoginMode, setIsLoginMode] = useState(true); // true for login, false for signup

    const handleToggleAuthMode = (mode) => {
        setIsLoginMode(mode);
    };

    return (
        <div className="auth-container">
            {isLoginMode ? (
                <Login handleLoginSuccess={handleLoginSuccess} onToggleAuthMode={handleToggleAuthMode} />
            ) : (
                <Signup handleSignUpSuccess={handleSignUpSuccess} onToggleAuthMode={handleToggleAuthMode} />
            )}
        </div>
    );
}
