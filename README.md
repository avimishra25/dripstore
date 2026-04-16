# 🚀 DripStore — Full Stack E-Commerce Platform

A modern, production-ready **MERN stack eCommerce application** for sneakers and streetwear, featuring secure authentication, online payments, cloud-based image storage, and an admin dashboard.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=jsonwebtokens)
![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white) 

---

## 📸 Features

### 👤 Authentication
- JWT-based authentication
- Secure password hashing using bcrypt
- Role-based access control (Admin/User)

### 🛍️ Product Management
- Product listing with search, filters, pagination
- Product reviews and ratings
- Dynamic product detail pages

### 🛒 Cart & Checkout
- Persistent cart (MongoDB + localStorage)
- Multi-step checkout flow
- Address handling & validation

### 💳 Payments
- Razorpay payment integration
- Server-side payment verification (HMAC signature)

### 📦 Orders
- Order lifecycle: `Placed → Processing → Shipped → Delivered`
- User order history & tracking

### 🛠️ Admin Panel
- Dashboard with stats
- Product CRUD operations
- Order management
- User management

### ☁️ Media Handling
- Cloudinary integration for image uploads
- Optimized image delivery via CDN

---

## 🧱 Tech Stack

| Layer       | Technology |
|------------|-----------|
| Frontend   | React.js, React Router, Context API |
| Backend    | Node.js, Express.js |
| Database   | MongoDB, Mongoose |
| Auth       | JWT, bcryptjs |
| Payments   | Razorpay |
| Media      | Cloudinary, Multer |
| HTTP       | Axios |

---

## 📁 Project Structure

```
dripstore/
├── client/                    # React frontend
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── admin/             # Admin panel pages
│       │   ├── AdminLayout.js/.css
│       │   ├── AdminDashboard.js/.css
│       │   ├── AdminProducts.js/.css
│       │   ├── AdminProductForm.js/.css
│       │   ├── AdminOrders.js/.css
│       │   └── AdminUsers.js
│       ├── components/        # Reusable UI components
│       │   ├── Navbar.js/.css
│       │   ├── Footer.js/.css
│       │   ├── ProductCard.js/.css
│       │   ├── RatingStars.js/.css
│       │   ├── Loader.js
│       │   ├── PrivateRoute.js
│       │   └── AdminRoute.js
│       ├── context/           # React Context (global state)
│       │   ├── AuthContext.js
│       │   └── CartContext.js
│       ├── pages/             # All page-level components
│       │   ├── HomePage.js/.css
│       │   ├── ProductsPage.js/.css
│       │   ├── ProductDetailPage.js/.css
│       │   ├── CartPage.js/.css
│       │   ├── CheckoutPage.js/.css
│       │   ├── OrderSuccessPage.js
│       │   ├── ProfilePage.js/.css
│       │   ├── OrderDetailPage.js/.css
│       │   ├── LoginPage.js
│       │   ├── RegisterPage.js
│       │   └── AuthPages.css
│       └── utils/
│           └── api.js         # Axios instance with JWT interceptors
├── server/                    # Node.js/Express backend
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── cloudinary.js      # Cloudinary + Multer config
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   ├── paymentController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT protect + adminOnly
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   └── Cart.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── paymentRoutes.js
│   │   └── adminRoutes.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── package.json               # Root — runs both client & server
```

## 🚀 Setup & Installation

### 1. Clone and install all dependencies

```bash
# Install root concurrently + all packages
npm run install-all
```

Or manually:
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment variables

```bash
cd server
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
PORT=5000
NODE_ENV=development

# MongoDB — local or Atlas URI
MONGO_URI=mongodb://localhost:27017/dripstore

# JWT — make this a long random string
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=30d

# Cloudinary — from https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay Test Keys — from https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Frontend URL
CLIENT_URL=http://localhost:3000
```

### 3. Run the application

**Development (both client + server):**
```bash
# From root dripstore/ directory
npm run dev
```

**Or run separately:**
```bash
# Terminal 1 — Backend API on :5000
npm run server

# Terminal 2 — React app on :3000
npm run client
```

### 4. Create an admin account

Register normally, then run this in MongoDB shell or Compass:

```js
db.users.updateOne({ email: "admin@example.com" }, { $set: { isAdmin: true } })
```

---

## 🔌 API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register user |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Private | Get current user |
| PUT | `/api/auth/profile` | Private | Update profile |
| GET | `/api/products` | Public | List products (filters, pagination) |
| GET | `/api/products/:id` | Public | Get product details |
| POST | `/api/products/:id/reviews` | Private | Add review |
| GET | `/api/orders/cart` | Private | Get user cart |
| PUT | `/api/orders/cart` | Private | Sync cart |
| DELETE | `/api/orders/cart` | Private | Clear cart |
| POST | `/api/orders` | Private | Create order |
| GET | `/api/orders/myorders` | Private | User's orders |
| GET | `/api/orders/:id` | Private | Order details |
| POST | `/api/payment/create-order` | Private | Create Razorpay order |
| POST | `/api/payment/verify` | Private | Verify payment |
| GET | `/api/admin/stats` | Admin | Dashboard stats |
| GET | `/api/admin/products` | Admin | All products |
| POST | `/api/admin/products` | Admin | Create product |
| PUT | `/api/admin/products/:id` | Admin | Update product |
| DELETE | `/api/admin/products/:id` | Admin | Delete product |
| GET | `/api/admin/orders` | Admin | All orders |
| PUT | `/api/admin/orders/:id/status` | Admin | Update order status |
| GET | `/api/admin/users` | Admin | All users |

---

## ✨ Features

- **Auth**: JWT + bcrypt, protected routes, admin role
- **Products**: Filters, search, sort, pagination, reviews & ratings
- **Cart**: Persistent (MongoDB for logged-in users, localStorage for guests)
- **Checkout**: 3-step flow with address validation
- **Payments**: Razorpay integration with server-side signature verification
- **Orders**: Full status lifecycle — Placed → Processing → Shipped → Delivered
- **Admin Panel**: Dashboard with revenue chart, product CRUD, order management, user list
- **Images**: Cloudinary upload with Multer
- **UI**: Dark streetwear aesthetic, mobile-first responsive design

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Context API |
| Styling | Pure CSS (CSS Variables, no framework) |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| Payments | Razorpay |
| Images | Cloudinary, Multer |
| Notifications | react-toastify |

---

📸 Screenshots

<img width="1782" height="877" alt="image" src="https://github.com/user-attachments/assets/a96c08e8-c877-41fb-8b5b-ad5dc4bed4d5" />
<img width="1707" height="921" alt="image" src="https://github.com/user-attachments/assets/1bfccf26-9eb8-4350-8207-657055442678" />
<img width="1696" height="922" alt="image" src="https://github.com/user-attachments/assets/e53b7917-7f33-479e-8ddd-5d00518b54a5" />
<img width="1675" height="926" alt="image" src="https://github.com/user-attachments/assets/8eec60fb-a188-45cb-be1f-d209631b24fe" />
<img width="1911" height="926" alt="image" src="https://github.com/user-attachments/assets/0edff658-e8d3-4df9-a900-a95b7601b3a3" />
<img width="1907" height="915" alt="image" src="https://github.com/user-attachments/assets/1a7668a6-5505-4ca4-8cb4-49125c974e34" />

---

🧠 Key Highlights
Secure authentication using JWT middleware
Payment verification using HMAC (Razorpay)
Scalable image storage with Cloudinary
Modular backend architecture (MVC pattern)
Protected routes with role-based access

---

🚀 Future Improvements
Wishlist feature
Coupon system
Email notifications
Product recommendations

---

👨‍💻 Author

Avi Mishra - https://github.com/avimishra25
- 📍 Ahmedabad, India

---

⭐ Show Your Support

If you like this project, give it a ⭐ on GitHub!

---
