# Chat App

Ứng dụng trò chuyện thời gian thực full-stack với chat riêng, chat nhóm, chia sẻ hình ảnh và gọi video trực tiếp giữa hai người dùng.

## Tính năng

- Đăng ký, đăng nhập, đăng xuất và tự làm mới phiên đăng nhập.
- Chat 1-1 và chat nhóm qua REST API kết hợp Socket.IO.
- Gửi tin nhắn văn bản và hình ảnh.
- Sửa, thu hồi tin nhắn và tải lịch sử theo cursor.
- Trạng thái online, typing indicator, unread count và read receipt.
- Quản lý nhóm: đổi tên, thêm/xóa thành viên và rời nhóm.
- Kết bạn và xử lý lời mời kết bạn.
- Gọi thoại WebRTC với microphone, signaling Socket.IO, timeout và hỗ trợ nhiều tab.
- Chuyển đổi giao diện sáng/tối và tiếng Việt/English.
- Docker Compose cho frontend Nginx và backend Node.js.

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Zustand, React Hook Form, Zod |
| Backend | Node.js, Express 5, TypeScript, Socket.IO |
| Database | MongoDB với Mongoose |
| Media | Cloudinary cho ảnh, WebRTC cho cuộc gọi |
| Bảo mật | bcrypt, JWT access token, refresh token HttpOnly cookie, Helmet, CORS, rate limit |
| Triển khai | Docker, Docker Compose, Nginx |

## Kiến trúc thư mục

```text
Chat-App/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Xử lý nghiệp vụ HTTP
│   │   ├── middlewares/     # Auth, validation, upload, error handling
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # REST endpoints
│   │   ├── socket/          # Socket.IO và signaling cuộc gọi
│   │   └── utils/
│   └── test/
├── frontend/
│   └── src/
│       ├── components/      # UI và feature components
│       ├── pages/
│       ├── services/        # REST client
│       ├── stores/          # Zustand stores
│       └── lib/             # Axios, WebRTC và helpers
├── docker-compose.yml
└── README.md
```

## Yêu cầu

- Node.js 22+
- npm 10+
- MongoDB 6+ (local hoặc MongoDB Atlas)
- Tài khoản Cloudinary để upload ảnh
- TURN server là tùy chọn nhưng nên cấu hình khi chạy WebRTC qua các mạng NAT khó.

## Chạy local

### Backend

```powershell
cd backend
Copy-Item .env.example .env
```

Điền các giá trị bắt buộc trong `backend/.env`:

```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/chat-app
ACCESS_TOKEN_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Chạy backend:

```powershell
npm ci
npm run dev
```

Backend mặc định chạy tại `http://localhost:5001`.

### Frontend

```powershell
cd frontend
Copy-Item .env.example .env
npm ci
npm run dev
```

Với backend local, dùng các biến sau trong `frontend/.env`:

```env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

TURN là tùy chọn:

```env
VITE_TURN_URL=turn:your-turn-server:3478
VITE_TURN_USERNAME=your-turn-username
VITE_TURN_CREDENTIAL=your-turn-credential
```

Frontend mặc định chạy tại `http://localhost:5173`.

## Chạy bằng Docker Compose

Tạo `backend/.env` và điền các biến MongoDB, JWT, Cloudinary. Sau đó chạy:

```powershell
docker compose up --build
```

Ứng dụng được phục vụ tại `http://localhost:8080`. Nginx frontend proxy `/api` và `/socket.io` tới backend trong network Docker.

Khi triển khai production, cần chạy sau HTTPS và đặt `NODE_ENV=production` để cookie refresh token dùng `Secure` và `SameSite=None`. `CLIENT_URL` phải khớp chính xác origin của frontend.

## Scripts

### Backend

```text
npm run dev          # Development server
npm run build        # Compile TypeScript
npm run typecheck    # Kiểm tra kiểu
npm run lint         # ESLint
npm test             # Test signaling cuộc gọi
```

### Frontend

```text
npm run dev          # Vite development server
npm run build        # Typecheck và build production
npm run lint         # ESLint
npm run preview      # Preview production build
```

## REST API chính

Các route bên dưới `/api/users`, `/api/friends`, `/api/messages` và `/api/conversations` yêu cầu access token trong header `Authorization: Bearer <token>`.

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| POST | `/api/auth/signup` | Tạo tài khoản |
| POST | `/api/auth/signin` | Đăng nhập |
| POST | `/api/auth/refresh` | Cấp access token mới |
| GET | `/api/users/me` | Lấy người dùng hiện tại |
| GET | `/api/conversations` | Lấy danh sách hội thoại |
| GET | `/api/conversations/:id/messages` | Lấy lịch sử tin nhắn |
| POST | `/api/messages/direct` | Gửi tin nhắn riêng |
| POST | `/api/messages/group` | Gửi tin nhắn nhóm |
| PATCH/DELETE | `/api/messages/:id` | Sửa/thu hồi tin nhắn |
| GET | `/api/friends` | Lấy danh sách bạn bè |
| POST | `/api/friends/requests` | Gửi lời mời kết bạn |

## Ghi chú WebRTC

Ứng dụng dùng Google STUN mặc định. STUN-only có thể không kết nối được khi hai máy ở sau symmetric NAT hoặc firewall nghiêm ngặt. Khi đó cần cung cấp TURN server qua các biến `VITE_TURN_*`. Microphone phải được trình duyệt cấp quyền trên HTTPS hoặc `localhost`.

## Bảo mật và vận hành

- Không commit `.env` hoặc thông tin Cloudinary/JWT vào repository.
- Dùng secret ngẫu nhiên đủ dài cho `ACCESS_TOKEN_SECRET`.
- Production nên đặt frontend và backend sau HTTPS.
- Giới hạn payload Socket.IO và upload ảnh đã được cấu hình ở backend; vẫn nên đặt reverse proxy/rate limit phù hợp khi public service.
- MongoDB cần bật authentication và giới hạn network access khi chạy production.

## Trạng thái kiểm tra

- Backend TypeScript typecheck và ESLint.
- Frontend production build và ESLint.
- Test Node.js cho signaling cuộc gọi: validation payload, chống gọi trùng, binding tab và giới hạn ICE queue.

## License

Dự án hiện chưa khai báo license. Nếu phát hành công khai, hãy bổ sung license phù hợp với mục đích sử dụng.
