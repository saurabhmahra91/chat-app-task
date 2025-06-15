import React, { useEffect, useState } from 'react';
import AuthScreen from './components/AuthScreen';
import ChatWindow from './components/ChatWindow';
import { getAuthenticatedApiClient } from './api';

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await getAuthenticatedApiClient().get('/users/me/');
                    setUser(response.data);
                    setIsAuthenticated(true);
                } catch (err) {
                    console.error('Error fetching user:', err);
                    localStorage.removeItem('token');
                    setIsAuthenticated(false);
                }
            }
        };

        fetchUser();
    }, []);

    const handleSignUpSuccess = (userData, token) => {
        setIsAuthenticated(true);
        setUser(userData);
        localStorage.setItem('token', token);
    };

    const handleLoginSuccess = (userData, token) => {
        setIsAuthenticated(true);
        setUser(userData);
        localStorage.setItem('token', token);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('token');
    };

    if (!isAuthenticated) {
        return (
            <AuthScreen
                handleLoginSuccess={handleLoginSuccess}
                handleSignUpSuccess={handleSignUpSuccess}
            />
        );
    }

    return <ChatWindow user={user} handleLogout={handleLogout} />;
};

export default App;
