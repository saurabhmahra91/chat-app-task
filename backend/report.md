# Failure Analysis Report for Chat App

---

## 1. System Overview & Diagram

The chat application consists of:

- **Frontend:** React-based UI with WebSocket connection for real-time chat.
- **Backend:** FastAPI server handling WebSocket connections and REST APIs.
- **Database:** SQLAlchemy ORM with a relational DB for message persistence.
- **Infrastructure:** Single GCP e2-standard-2 instance (2 vCPUs, 8GB RAM).

![System Diagram](Task.drawio.png)


---

## 2. Breaking Point Estimation

### Key Assumptions

- Server: GCP e2-standard-2 (2 vCPUs, 8GB RAM)
- Average message rate: 1 message per user per second
- Each connection is persistent WebSocket
- 1 operator + 1 manager per chat (2 users per chat)
- Average message payload size ~ 200 bytes JSON
- DB write + commit per message
- WebSocket broadcast to all connected clients except sender

---

### Performance Estimation & Bottlenecks

#### CPU and Message Handling

- **WebSocket broadcast loop** iterates over all connected clients on every message.
- Each message sent results in:

  - **1 DB write** (commit)  
  - **N-1 WebSocket sends** where N = number of connected clients  

- Assume:
  - 2 vCPUs @ ~2.5 GHz (total ~5 GHz CPU power)
  - CPU cycles per message:  
    - DB commit: ~1 ms CPU time  
    - WebSocket send: ~0.2 ms CPU time per client  
  - For 1 message, CPU time = 1 ms + 0.2 ms × (N - 1)

- With M concurrent users sending 1 msg/sec each:  
  Total messages/sec = M  
  Total CPU time per second = M × [1 ms + 0.2 ms × (M - 1)]

---

### Solution for Maximum concurrent users

Total messages per second × CPU per message ≤ 1600 ms CPU
$$
    M \times (6 + 0.1(n - 1)) \leq 1600
$$

But \( M \) (messages per second) ≈ number of users \( n \), since 1 msg/sec/user.

Rearranging for \( n \):

$$
n \times (6 + 0.1(n - 1)) \leq 1600
$$

Approximate:

$$
n \times (6 + 0.1n) \leq 1600
$$

$$
6n + 0.1n^2 \leq 1600
$$

Multiply by 10:

$$
60n + n^2 \leq 16000
$$

Rewrite as quadratic inequality:

$$
n^2 + 60n - 16000 \leq 0
$$

Solve quadratic equation:

$$
n = \frac{-60 \pm \sqrt{60^2 + 4 \times 16000}}{2} = \frac{-60 \pm \sqrt{3600 + 64000}}{2} = \frac{-60 \pm \sqrt{67600}}{2}
$$

$$
\sqrt{67600} \approx 260
$$

Positive root:

$$
n = \frac{-60 + 260}{2} = \frac{200}{2} = 100
$$

**Interpretation:**

Maximum concurrent users before CPU saturation ≈ **100 users**

---

### Interpretation:

- **Max concurrent users: ~98 users** sending 1 msg/sec simultaneously before CPU saturates.  
- Beyond this, CPU becomes the bottleneck, causing latency or dropped connections.

---

### Memory

- WebSocket connection overhead ~200 KB per connection (buffers, stack, etc)  
- For 98 users: ~19.6 MB RAM, which is well within 8GB RAM limit.  
- DB and other processes consume the rest.

---

### Network

- Message size ~200 bytes  
- Total outgoing data/sec ≈ 200 bytes × (M users) × (M - 1) clients  
- For 98 users: ~200 × 98 × 97 = ~1.9 MB/sec outgoing traffic  
- Network bandwidth on GCP instance (~1 Gbps) is sufficient here.

---

## 3. Monitoring Plan & Implementation

### Metrics to Monitor

1. **CPU Usage (%)**  
   - High sustained CPU usage indicates overload.

2. **Active WebSocket Connections**  
   - Track connection count to observe scaling.

3. **Messages Per Second (incoming/outgoing)**  
   - To correlate load with CPU/network.

4. **Message Latency**  
   - Time from message receipt to broadcast completion.

5. **Error Rates**  
   - Connection drops, WebSocket send failures.

---

### Detection of Bottlenecks in Production

- Set alerts on CPU > 80% sustained  
- Alerts on sudden spike or drop in active connections  
- Monitor message latency — rising latency signals processing backlog

