# VKU Job Survey PWA

Ứng dụng PWA hỗ trợ khảo sát nhu cầu việc làm của sinh viên VKU trong quá trình khảo sát thực địa.

## 🌐 Demo

https://vku-job-survey.hiennvp-23itb.workers.dev

## 📌 Giới thiệu

VKU Job Survey là ứng dụng khảo sát nhu cầu việc làm dành cho sinh viên.

Ứng dụng cho phép người khảo sát thu thập thông tin về:

- Ngành học
- Năm học
- Lĩnh vực việc làm mong muốn
- Hình thức làm việc
- Mức thu nhập kỳ vọng
- Tiêu chí lựa chọn việc làm
- Nhu cầu hỗ trợ tìm việc
- Vị trí GPS
- Hình ảnh khảo sát thực địa

Ứng dụng được xây dựng dưới dạng Progressive Web App (PWA), có thể sử dụng trên máy tính và điện thoại.

## ✨ Chức năng

- Tạo nhiều phiên khảo sát.
- Tạo Session ID tự động cho mỗi phiên.
- Nhập thông tin người phỏng vấn.
- Nhập thông tin ngành học và năm học.
- Khảo sát nhu cầu việc làm.
- Ghi nhận hình thức làm việc mong muốn.
- Ghi nhận mức thu nhập kỳ vọng.
- Ghi nhận tiêu chí lựa chọn việc làm.
- Ghi nhận nhu cầu hỗ trợ tìm việc.
- Lấy vị trí GPS.
- Thêm hình ảnh khảo sát.
- Lưu dữ liệu cục bộ khi offline.
- Tự động đồng bộ dữ liệu khi có mạng trở lại.
- Hiển thị trạng thái Online / Offline.
- Hiển thị số lượng khảo sát đã tạo.
- Hiển thị số lượng khảo sát đã đồng bộ.
- Hiển thị số lượng khảo sát đang chờ đồng bộ.

## 🛠️ Công nghệ sử dụng

- React
- Vite
- JavaScript
- Progressive Web App (PWA)
- vite-plugin-pwa
- IndexedDB
- idb
- Geolocation API
- Google Apps Script
- Google Sheets
- Google Drive
- Cloudflare Workers

## 🏗️ Kiến trúc hệ thống

```text
                    Mobile / Desktop
                           │
                           ▼
                  VKU Job Survey PWA
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
         IndexedDB                Internet
              │                         │
       Lưu offline                      ▼
              │                 Cloudflare Worker
              │                         │
              └────────────► Google Apps Script
                                      │
                           ┌──────────┴──────────┐
                           │                     │
                           ▼                     ▼
                    Google Sheets         Google Drive
                    Dữ liệu khảo sát      Hình ảnh
📡 Online / Offline
Khi Online

Khi thiết bị có kết nối Internet, khảo sát được lưu vào IndexedDB trước và sau đó gửi đến hệ thống API.

Nhập khảo sát
      ↓
IndexedDB
      ↓
Cloudflare Worker
      ↓
Google Apps Script
      ↓
Google Sheets
      +
Google Drive

Sau khi đồng bộ thành công, trạng thái khảo sát được chuyển thành:

SYNCED
Khi Offline

Khi không có Internet, người dùng vẫn có thể tạo và lưu khảo sát.

Nhập khảo sát
      ↓
IndexedDB
      ↓
PENDING

Dữ liệu được giữ lại trên thiết bị.

Khi kết nối mạng trở lại, ứng dụng tự động thực hiện đồng bộ.

PENDING
   ↓
Cloudflare Worker
   ↓
Google Apps Script
   ↓
Google Sheets / Google Drive
   ↓
SYNCED
📊 Dữ liệu khảo sát

Mỗi phiên khảo sát bao gồm các thông tin:

Session ID
Thời gian
Người phỏng vấn
Ngành
Năm học
Lĩnh vực việc làm
Hình thức làm việc
Thu nhập kỳ vọng
Tiêu chí ưu tiên
Nhu cầu hỗ trợ
Ý kiến khác
Latitude
Longitude
Ảnh
Status
📷 Xử lý hình ảnh

Hình ảnh khảo sát được xử lý trước khi đồng bộ:

Người dùng chọn hoặc chụp ảnh.
Ảnh được hiển thị xem trước.
Ảnh được resize.
Ảnh được nén để giảm dung lượng.
Ảnh được chuyển sang dữ liệu Base64.
Ảnh được gửi lên Google Apps Script.
Google Drive lưu trữ ảnh.
Google Sheets lưu URL của ảnh.
📍 GPS

Ứng dụng sử dụng Geolocation API để lấy vị trí hiện tại của thiết bị.

Thông tin được lưu gồm:

Latitude
Longitude

Vị trí được lưu cùng với từng phiên khảo sát.

📱 Progressive Web App

Ứng dụng hỗ trợ:

Web App Manifest
Service Worker
Offline caching
Responsive UI
Có thể cài đặt trên điện thoại
Hoạt động trên trình duyệt hiện đại
🚀 Cài đặt project
1. Clone repository
git clone https://github.com/hien205/vku-job-survey.git
2. Di chuyển vào project
cd vku-job-survey
3. Cài đặt dependencies
npm install
4. Chạy project
npm run dev

Sau đó mở địa chỉ được Vite cung cấp, thường là:

http://localhost:5173
📦 Build project
npm run build
☁️ Deploy

Project được triển khai bằng Cloudflare.

npx wrangler deploy
📂 Cấu trúc project
vku-job-survey/
│
├── public/
│   ├── logo-vku.png
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   ├── favicon.svg
│   └── icons.svg
│
├── src/
│   ├── App.jsx
│   ├── App.css
│   ├── config.js
│   ├── db.js
│   ├── sync.js
│   ├── index.css
│   └── main.jsx
│
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── wrangler.jsonc
└── README.md
🔄 Trạng thái khảo sát

Ứng dụng sử dụng các trạng thái:

PENDING

Khảo sát đã được lưu trên thiết bị nhưng chưa đồng bộ lên hệ thống.

SYNCED

Khảo sát đã được đồng bộ thành công lên Google Sheets.

🌐 Link hệ thống
Demo PWA

https://vku-job-survey.hiennvp-23itb.workers.dev

GitHub

https://github.com/hien205/vku-job-survey

👨‍💻 Project

VKU Student Job Survey

Project được thực hiện phục vụ mục đích học tập.