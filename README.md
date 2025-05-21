# HƯỚNG DẪN SỬ DỤNG VÀ GIẢI THÍCH DỰ ÁN BLOCKCHAIN HAI CHIỀU

## 1. GIỚI THIỆU TỔNG QUAN

Dự án Blockchain Hai Chiều là một ứng dụng minh họa một khái niệm độc đáo: blockchain có thể mở rộng theo cả hai hướng (dương và âm) từ một khối gốc trung tâm (Genesis Block). Khác với blockchain truyền thống chỉ phát triển theo một chiều, mô hình này cho phép cân bằng giữa hai hướng phát triển và có khả năng kết nối với các blockchain khác một cách linh hoạt.

### Các thành phần chính:

- **Giao diện người dùng (Frontend)**: Xây dựng bằng React, cho phép người dùng tương tác với blockchain
- **Máy chủ API (Backend)**: Xây dựng bằng Express.js, xử lý các yêu cầu và tương tác với blockchain
- **Cơ sở dữ liệu**: PostgreSQL lưu trữ dữ liệu blockchain
- **Blockchain hai chiều**: Mô hình kỹ thuật đặc biệt cho phép blockchain phát triển theo hai hướng từ khối gốc

## 2. KIẾN TRÚC BLOCKCHAIN HAI CHIỀU

### Khái niệm đặc biệt:

Trong blockchain truyền thống, các khối được thêm vào chỉ theo một hướng (tăng dần). Blockchain hai chiều của chúng ta có những đặc điểm độc đáo sau:

1. **Khối gốc (Genesis Block) ở trung tâm**: Có chỉ số (index) là 0
2. **Mở rộng theo hướng dương**: Các khối có chỉ số 1, 2, 3, ...
3. **Mở rộng theo hướng âm**: Các khối có chỉ số -1, -2, -3, ...
4. **Cơ chế cân bằng**: Đảm bảo blockchain không phát triển mất cân đối về một hướng
5. **Khả năng kết nối blockchain**: Cho phép kết nối với các blockchain khác thông qua "khối cầu nối"

### Cấu trúc khối (Block):

```javascript
{
  "id": 1,                  // ID trong cơ sở dữ liệu
  "index": 0,               // Chỉ số trong chuỗi (0 = Genesis, dương/âm = mở rộng theo hướng)
  "timestamp": "1621500000000", // Thời gian tạo khối
  "data": {                 // Dữ liệu trong khối (có thể là bất kỳ thông tin gì)
    "genesis": true,
    "message": "Khối khởi tạo"
  },
  "previousHash": "",       // Hash của khối trước đó
  "hash": "abc123...",      // Hash của khối hiện tại
  "nonce": 1234,            // Số ngẫu nhiên dùng trong quá trình đào (mining)
  "tampered": false         // Đánh dấu nếu khối bị giả mạo
}
```

## 3. CÀI ĐẶT VÀ CHẠY DỰ ÁN

### Yêu cầu hệ thống:
- Node.js 18+ 
- PostgreSQL
- NPM hoặc Yarn

### Các bước cài đặt:

1. **Clone dự án:**
   ```
   git clone https://github.com/zuun1989/BlockchainNavigator.git
   cd BlockchainNavigator
   ```

2. **Cài đặt dependencies:**
   ```
   npm install
   ```

3. **Cấu hình cơ sở dữ liệu:**
   - Đảm bảo PostgreSQL đang chạy
   - Cấu hình biến môi trường DATABASE_URL (hoặc các biến PGUSER, PGPASSWORD, PGDATABASE, PGHOST, PGPORT)

4. **Khởi tạo cơ sở dữ liệu:**
   ```
   npm run db:push
   ```

5. **Chạy ứng dụng ở chế độ phát triển:**
   ```
   npm run dev
   ```

6. **Truy cập ứng dụng:**
   Mở trình duyệt và truy cập `http://localhost:5000`

## 4. CÁCH SỬ DỤNG ỨNG DỤNG

### Giao diện chính:

Giao diện người dùng bao gồm:
- **Biểu diễn blockchain**: Hiển thị các khối và kết nối giữa chúng
- **Bảng điều khiển**: Cho phép tương tác với blockchain

### Các chức năng chính:

#### 1. Đào khối mới (Mining)

- **Chọn hướng**: Dương hoặc âm
- **Nhập dữ liệu**: Nhập thông tin JSON cho khối mới
- **Đặt độ khó (Difficulty)**: Điều chỉnh độ khó khi đào khối (1-5)
- **Nhấn "Mine Block"**: Hệ thống sẽ đào một khối mới theo hướng đã chọn

#### 2. Kiểm tra tính toàn vẹn

- **Xác thực chuỗi**: Kiểm tra xem blockchain có hợp lệ không
- **Giả mạo khối**: Thử nghiệm tính toàn vẹn bằng cách giả mạo một khối
- **Khôi phục**: Đặt lại blockchain về trạng thái ban đầu

#### 3. Kiểm tra trạng thái cân bằng

- **Trạng thái cân bằng**: Xem liệu blockchain có cân bằng giữa hai hướng không
- **Hướng đề xuất**: Hệ thống đề xuất hướng để đào khối tiếp theo giúp duy trì cân bằng

#### 4. Kết nối blockchain

- **Nhập blockchain bên ngoài**: Dán JSON của một blockchain khác
- **Chọn hướng kết nối**: Quyết định kết nối theo hướng dương hay âm
- **Kết nối**: Hệ thống sẽ tạo "khối cầu nối" và điều chỉnh blockchain bên ngoài

## 5. CƠ CHẾ HOẠT ĐỘNG CHI TIẾT

### Quy trình đào khối (Mining):

1. Người dùng chọn hướng và nhập dữ liệu cho khối mới
2. Hệ thống tìm khối mới nhất trong hướng đã chọn
3. Tạo khối mới với chỉ số tiếp theo theo hướng
4. Thực hiện quá trình tìm nonce thỏa mãn độ khó (Proof of Work)
5. Lưu khối mới vào cơ sở dữ liệu

### Xác thực blockchain:

1. Duyệt qua tất cả các khối trong blockchain
2. Đối với mỗi khối, kiểm tra:
   - Hash của khối có chính xác không
   - Hash trước đó có trỏ đến khối trước không
   - Chỉ số có hợp lệ không

### Cơ chế cân bằng:

1. Theo dõi số lượng khối theo mỗi hướng
2. Theo dõi thời gian tạo khối mới nhất ở mỗi hướng
3. Đánh giá mức độ cân bằng dựa trên:
   - Chênh lệch số lượng khối giữa hai hướng
   - Khoảng thời gian từ khi tạo khối mới nhất ở mỗi hướng

### Quy trình kết nối blockchain:

1. Xác định khối gốc của blockchain bên ngoài
2. Chọn khối mới nhất của blockchain hiện tại theo hướng kết nối
3. Tạo "khối cầu nối" đặc biệt
4. Điều chỉnh chỉ số của các khối từ blockchain bên ngoài
5. Thêm các khối đã điều chỉnh vào chuỗi hiện tại

## 6. GIẢI THÍCH MÃ NGUỒN CHÍNH

### Cấu trúc thư mục:

```
/
├── client/              # Mã nguồn frontend
│   └── src/
│       ├── components/  # Các component React 
│       ├── lib/         # Thư viện và tiện ích
│       └── pages/       # Các trang
├── server/              # Mã nguồn backend
│   ├── routes.ts        # Định nghĩa API
│   ├── storage.ts       # Lưu trữ bộ nhớ tạm thời
│   └── databaseStorage.ts # Lưu trữ cơ sở dữ liệu
└── shared/              # Mã nguồn dùng chung
    └── schema.ts        # Schema cơ sở dữ liệu
```

### Các phần mã nguồn quan trọng:

#### 1. Định nghĩa Schema (shared/schema.ts)

```typescript
// Định nghĩa bảng blocks trong cơ sở dữ liệu
export const blocks = pgTable("blocks", {
  id: serial("id").primaryKey(),
  index: integer("index").notNull(),
  timestamp: varchar("timestamp").notNull(),
  data: jsonb("data").notNull(),
  previousHash: varchar("previous_hash").notNull(),
  hash: varchar("hash").notNull(),
  nonce: integer("nonce").notNull(),
  tampered: boolean("tampered").notNull().default(false),
});
```

#### 2. Lưu trữ Blockchain (server/databaseStorage.ts)

```typescript
// Lớp quản lý lưu trữ blockchain trong cơ sở dữ liệu
export class DatabaseStorage implements IStorage {
  // Khởi tạo blockchain với một khối genesis
  private async initializeBlockchain() {
    // Tạo khối genesis và các khối ban đầu
  }
  
  // Tính toán hash của một khối
  private calculateHash(index, previousHash, timestamp, data, nonce) {
    // Sử dụng thuật toán SHA-256 để tạo hash
  }
  
  // Tìm nonce thỏa mãn độ khó
  private findBlock(index, previousHash, timestamp, data, difficulty) {
    // Thuật toán Proof of Work
  }
  
  // Đào một khối mới
  public async mineBlock(direction, data, difficulty) {
    // Tìm khối mới nhất, tạo khối mới và lưu vào DB
  }
  
  // Xác thực tính toàn vẹn của blockchain
  public async validateChain() {
    // Duyệt và kiểm tra tất cả các khối
  }
  
  // Kết nối với blockchain bên ngoài
  public async connectBlockchain(externalBlocks, direction) {
    // Tạo khối cầu nối và thêm blockchain bên ngoài
  }
}
```

#### 3. API Endpoints (server/routes.ts)

```typescript
// Lấy toàn bộ blockchain
app.get("/api/blockchain", async (req, res) => {
  const blockchain = await storage.getBlockchain();
  res.json(blockchain);
});

// Đào khối mới
app.post("/api/blockchain/mine", async (req, res) => {
  const { direction, data, difficulty } = req.body;
  const newBlock = await storage.mineBlock(direction, data, difficulty);
  res.json(newBlock);
});

// Xác thực blockchain
app.get("/api/blockchain/validate", async (req, res) => {
  const isValid = await storage.validateChain();
  res.json({ valid: isValid });
});

// Kết nối blockchain
app.post("/api/blockchain/connect", async (req, res) => {
  const { externalBlocks, direction } = req.body;
  const connectedBlocks = await storage.connectBlockchain(externalBlocks, direction);
  res.json({
    message: "Blockchains connected successfully",
    connectedBlocksCount: connectedBlocks.length,
    connectionBlock: connectedBlocks[0]
  });
});
```

## 7. HƯỚNG PHÁT TRIỂN TIẾP THEO

### Các tính năng có thể phát triển thêm:

1. **Hệ thống tài khoản người dùng**: Cho phép nhiều người dùng tương tác với blockchain
2. **Giao dịch thực tế**: Thêm cơ chế giao dịch và xác thực giao dịch
3. **Thuật toán đồng thuận nâng cao**: Thử nghiệm với các thuật toán như Proof of Stake
4. **Mạng ngang hàng (P2P)**: Cho phép nhiều nút tham gia mạng
5. **Thị trường khối**: Tạo một thị trường để trao đổi các khối giữa các blockchain khác nhau
6. **Trực quan hóa 3D**: Biểu diễn blockchain trong không gian ba chiều
7. **Ứng dụng thực tế**: Áp dụng mô hình blockchain hai chiều vào các trường hợp sử dụng cụ thể

## 8. KẾT LUẬN

Blockchain Hai Chiều là một mô hình đổi mới, mở ra những khả năng mới trong việc thiết kế và ứng dụng công nghệ blockchain. Với khả năng phát triển cân bằng theo hai hướng và kết nối linh hoạt, mô hình này có thể giải quyết một số hạn chế của blockchain truyền thống và mở ra những khả năng ứng dụng mới.

---

Dự án này là một minh họa giáo dục về khái niệm blockchain hai chiều và không nhằm mục đích sử dụng trong các ứng dụng sản xuất mà không có sự phát triển và kiểm thử thêm.
