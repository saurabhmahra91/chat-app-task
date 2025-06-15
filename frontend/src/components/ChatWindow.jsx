import "./ChatWindow.css";
import { useState, useEffect, useRef } from "react";
import { getAuthenticatedApiClient, fetchMessages } from "../api"; // assuming these are from somewhere

export default function ChatWindow({ user }) {
    const [contacts, setContacts] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const socket = useRef(null);
    const selectedUserRef = useRef(null);
    const bottomRef = useRef(null);

    useEffect(() => {
        selectedUserRef.current = selectedUser?.id || null;
        if (!selectedUser) return;
        loadMessages(selectedUser.id);
    }, [selectedUser]);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);



    const fetchFriends = async () => {
        try {
            const res = await getAuthenticatedApiClient().get('/friends');
            const friends = res.data.map(([user, latestMessageTime]) => ({
                id: user.id,
                name: user.name || user.email,
                latestMessageTime,
            }));
            setContacts(friends);
        } catch (e) {
            console.error("Failed to fetch friends", e);
        }
    };


    useEffect(() => {
        if (!user) return;

        const ws = new WebSocket(`${import.meta.env.VITE_BACKEND_CHAT_WS_BASE}?token=${localStorage.getItem("token")}`);
        socket.current = ws;

        ws.onopen = () => console.log("WebSocket connection opened");
        ws.onclose = () => console.log("WebSocket connection closed");
        ws.onerror = (e) => console.error("WebSocket error:", e);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const currentChatUserId = selectedUserRef.current;
            if (data.sender_id === currentChatUserId || data.receiver_id === currentChatUserId) {
                setMessages(prev => [...prev, data]);
            }
        };

        return () => {
            ws.close(); // close socket when component unmounts or re-renders
        };
    }, [user]);


    useEffect(() => {
        if (!selectedUser) return;
        setMessages([]); // Clear old messages
        loadMessages(selectedUser.id);
    }, [selectedUser]);



    const sendMessage = (friendId, message) => {
        if (socket.current && socket.current.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket not open yet. Retrying soon or check connection.");
        }
        else {
            console.log("sending message to backend")
            socket.current.send(JSON.stringify({ "receiver_id": friendId, "message": message }));

        }
    };


    const loadMessages = async (friendId) => {
        try {
            const res = await getAuthenticatedApiClient().get('/messages', {
                params: { friend_id: friendId }
            });
            setMessages(res.data.reverse());
        } catch (e) {
            console.error("Failed to load messages", e);
        }
    };

    const handleSend = async () => {
        if (!text.trim()) return;
        try {
            sendMessage(selectedUser.id, text.trim())
            // const newMsg = await getAuthenticatedApiClient().post('/messages', {
            //     sender_id: user.id,
            //     receiver_id: selectedUser.id,
            //     message: text.trim(),
            // });
            setMessages(prev => [...prev, {
                sender_id: user.id,
                receiver_id: selectedUser.id,
                message: text.trim()
            }]);
            setText('');
        } catch (e) {
            console.error("Send failed", e);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        location.reload();
    };

    useEffect(() => {
        fetchFriends();
    }, []);

    useEffect(() => {
        if (!selectedUser) return;
        loadMessages(selectedUser.id);
    }, [selectedUser]);


    return (
        <div className="chat-app">
            <div className="sidebar">
                <div className="top-bar">
                    <span>{user.name}</span>
                    <div className="top-bar-icons">
                        <button onClick={handleLogout}>🚪</button>
                        <button>👤</button>
                    </div>
                </div>
                <ul className="chat-list">
                    {contacts.map(contact => (
                        <li
                            key={contact.id}
                            className={selectedUser?.id === contact.id ? 'active' : ''}
                            onClick={() => setSelectedUser(contact)}
                        >
                            {contact.name}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="chat-panel">
                {selectedUser ? (
                    <>
                        <div className="chat-header">
                            <h3>{selectedUser.name}</h3>
                        </div>
                        <div className="chat-messages">
                            {messages.map((m, i) => (
                                <div key={i} className={`message ${m.sender_id === user.id ? 'sent' : 'received'}`}>
                                    {m.message}
                                </div>
                            ))}
                            <div ref={bottomRef} />
                        </div>
                        <div className="chat-input">
                            <input
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="type a message..."
                            />
                            <button onClick={handleSend}>➤</button>
                        </div>
                    </>
                ) : (
                    <div className="no-chat">select a user to start chatting</div>
                )}
            </div>
        </div>
    );
}
