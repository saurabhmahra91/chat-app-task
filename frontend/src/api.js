import axios from 'axios';

export const createUser = async (data) => {
    const res = await fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    return res.json()
}

export const sendMessage = async (data) => {
    const res = await fetch(`${BASE_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    return res.json()
}

export const fetchMessages = async (userId) => {
    const res = await fetch(`${BASE_URL}/messages?userId=${userId}`)
    return res.json()
}


const getApiClient = () => {
    const apiClient = axios.create({
        baseURL: import.meta.env.VITE_BACKEND_BASE_URL,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    return apiClient

}


const getAuthenticatedApiClient = () => {
    const token = localStorage.getItem('token');

    const apiClient = axios.create({
        baseURL: import.meta.env.VITE_BACKEND_BASE_URL,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    return apiClient

}

export {getApiClient, getAuthenticatedApiClient}