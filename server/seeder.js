/**
 * DripStore Database Seeder
 * Run: node seeder.js         → seed database
 * Run: node seeder.js destroy → clear database
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// ── Models ──────────────────────────────────────────────────────────────────
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Cart = require('./models/Cart');

// ── Sample Data ──────────────────────────────────────────────────────────────

const users = [
  {
    name: 'Admin User',
    email: 'admin@dripstore.com',
    password: 'admin123',
    isAdmin: true,
  },
  {
    name: 'John Drip',
    email: 'john@example.com',
    password: 'password123',
    isAdmin: false,
  },
  {
    name: 'Sarah Fire',
    email: 'sarah@example.com',
    password: 'password123',
    isAdmin: false,
  },
];

// Using Unsplash direct image URLs (no API key needed, always available)
const products = [
  // ── SNEAKERS ────────────────────────────────────────────────────────────────
  {
    name: 'Air Max 97 Silver Bullet',
    brand: 'Nike',
    category: 'sneakers',
    description:
      'The Nike Air Max 97 keeps everything you love about the original — full-length Max Air cushioning, the iconic wave design — and turns up the heat with a metallic silver finish. Originally inspired by Japanese bullet trains, this silhouette is still turning heads decades later.',
    price: 14999,
    originalPrice: 17999,
    countInStock: 25,
    sizes: ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11'],
    isFeatured: true,
    tags: ['retro', 'classic', 'silver', 'air-max'],
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80',
    ],
  },
  {
    name: 'Jordan Retro 1 High OG Chicago',
    brand: 'Jordan',
    category: 'sneakers',
    description:
      'The shoe that started it all. The Air Jordan 1 Retro High OG in the iconic Chicago colorway is the grail that every sneaker head needs. Premium leather upper, Nike Air cushioning, and a legacy that speaks for itself.',
    price: 22999,
    originalPrice: 27999,
    countInStock: 12,
    sizes: ['7', '8', '8.5', '9', '9.5', '10', '11'],
    isFeatured: true,
    tags: ['jordan', 'retro', 'chicago', 'grail', 'limited'],
    images: [
      'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&q=80',
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&q=80',
    ],
  },
  {
    name: 'Yeezy Boost 350 V2 Zebra',
    brand: 'Adidas',
    category: 'sneakers',
    description:
      'Kanye West and Adidas delivered heat with the Yeezy Boost 350 V2 Zebra. Primeknit upper, full-length Boost cushioning, and the signature red "SPLY-350" stripe on a black-and-white zebra pattern. A modern grail.',
    price: 19999,
    originalPrice: 24999,
    countInStock: 8,
    sizes: ['7', '7.5', '8', '8.5', '9', '9.5', '10'],
    isFeatured: true,
    tags: ['yeezy', 'boost', 'kanye', 'limited', 'zebra'],
    images: [
      'https://images.unsplash.com/photo-1584735175315-9d5df23be620?w=800&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80',
    ],
  },
  {
    name: 'New Balance 550 White Green',
    brand: 'New Balance',
    category: 'sneakers',
    description:
      'Originally a basketball shoe from the 80s, the New Balance 550 made a massive comeback. Clean leather upper, heritage cupsole, and a timeless white/green colorway that pairs with literally everything.',
    price: 9999,
    originalPrice: 11999,
    countInStock: 30,
    sizes: ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11'],
    isFeatured: false,
    tags: ['new-balance', 'basketball', 'retro', '550'],
    images: [
      'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80',
      'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80',
    ],
  },
  {
    name: 'Puma Suede Classic XXI',
    brand: 'Puma',
    category: 'sneakers',
    description:
      'The Puma Suede is a genuine icon of street culture. The Suede Classic XXI is the latest iteration of the silhouette that has been on the feet of basketball players, b-boys, and hip-hop legends since 1968.',
    price: 6999,
    originalPrice: 8499,
    countInStock: 40,
    sizes: ['6', '7', '8', '9', '10', '11'],
    isFeatured: false,
    tags: ['puma', 'suede', 'classic', 'street'],
    images: [
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80',
      'https://images.unsplash.com/photo-1556906781-9a412961a28b?w=800&q=80',
    ],
  },
  {
    name: 'Converse Chuck 70 Hi Vintage Canvas',
    brand: 'Converse',
    category: 'sneakers',
    description:
      'The Chuck 70 takes everything you love about the classic Chuck Taylor and elevates it. Higher rubber foxing, a cushioned footbed, vintage canvas upper, and a premium feel that justifies every penny.',
    price: 7499,
    originalPrice: 8999,
    countInStock: 50,
    sizes: ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '11'],
    isFeatured: false,
    tags: ['converse', 'chuck', 'vintage', 'canvas', 'classic'],
    images: [
      'https://images.unsplash.com/photo-1463100099107-aa0980c362e6?w=800&q=80',
      'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&q=80',
    ],
  },

  // ── HOODIES ─────────────────────────────────────────────────────────────────
  {
    name: 'Oversized Acid Wash Hoodie',
    brand: 'DripStore',
    category: 'hoodies',
    description:
      'Heavy 400gsm French terry cotton. Acid-washed for that worn-in vintage look fresh out the bag. Dropped shoulders, kangaroo pocket, ribbed hem and cuffs. The kind of hoodie you reach for every single day.',
    price: 4999,
    originalPrice: 6999,
    countInStock: 60,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    isFeatured: true,
    tags: ['hoodie', 'oversized', 'acid-wash', 'heavy', 'vintage'],
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=80',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80',
    ],
  },
  {
    name: 'Tech Fleece Zip-Up Hoodie',
    brand: 'Nike',
    category: 'hoodies',
    description:
      'Nike Tech Fleece engineering at its finest. Lightweight yet warm, the double-layer material traps heat without bulk. A modern silhouette built for the streets and the gym.',
    price: 8999,
    originalPrice: 10999,
    countInStock: 35,
    sizes: ['S', 'M', 'L', 'XL'],
    isFeatured: false,
    tags: ['nike', 'tech-fleece', 'zip-up', 'lightweight'],
    images: [
      'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&q=80',
      'https://images.unsplash.com/photo-1565128939410-0f4f2571e9f9?w=800&q=80',
    ],
  },
  {
    name: 'Champion Reverse Weave Hoodie',
    brand: 'Champion',
    category: 'hoodies',
    description:
      'The OG. Champion Reverse Weave construction prevents shrinkage and maintains shape wash after wash. The ribbed side panels add stretch where you need it. A wardrobe essential since 1938.',
    price: 5499,
    originalPrice: 6499,
    countInStock: 45,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    isFeatured: false,
    tags: ['champion', 'reverse-weave', 'classic', 'og'],
    images: [
      'https://images.unsplash.com/photo-1589042032041-05df5c1e8b25?w=800&q=80',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80',
    ],
  },

  // ── STREETWEAR ───────────────────────────────────────────────────────────────
  {
    name: 'Cargo Utility Pants Black',
    brand: 'DripStore',
    category: 'streetwear',
    description:
      'Six-pocket cargo pants in heavyweight ripstop nylon. Adjustable ankle cuffs, a relaxed tapered fit, and YKK zipper hardware throughout. The workhorse pant for any streetwear rotation.',
    price: 5999,
    originalPrice: 7499,
    countInStock: 40,
    sizes: ['S', 'M', 'L', 'XL'],
    isFeatured: true,
    tags: ['cargo', 'utility', 'tactical', 'pants', 'black'],
    images: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80',
    ],
  },
  {
    name: 'Graphic Tee — Tokyo Nights',
    brand: 'DripStore',
    category: 'streetwear',
    description:
      'Heavyweight 220gsm 100% ringspun cotton tee. Screenprinted "Tokyo Nights" graphic on a washed black base. Boxy fit, dropped shoulders. Wash inside out to preserve the print.',
    price: 2499,
    originalPrice: 3499,
    countInStock: 80,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    isFeatured: false,
    tags: ['graphic-tee', 'tokyo', 'screenprint', 'boxy'],
    images: [
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80',
    ],
  },
  {
    name: 'Windbreaker Jacket — Retro Shell',
    brand: 'DripStore',
    category: 'streetwear',
    description:
      'Full-zip windbreaker in a crisp nylon shell. Packable design, mesh lining, elasticated cuffs and hem. Retro colorblock paneling that pops. Your go-to layer for the shoulder seasons.',
    price: 7999,
    originalPrice: 9999,
    countInStock: 20,
    sizes: ['S', 'M', 'L', 'XL'],
    isFeatured: true,
    tags: ['windbreaker', 'jacket', 'retro', 'colorblock', 'packable'],
    images: [
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80',
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80',
    ],
  },
  {
    name: 'Boxy Flannel Shirt — Red Plaid',
    brand: 'DripStore',
    category: 'streetwear',
    description:
      'Heavyweight brushed flannel in a classic red plaid. Boxy silhouette, chest pockets, and a washed-out finish. Wear it open over a tee or buttoned up solo — both are valid.',
    price: 3499,
    originalPrice: 4499,
    countInStock: 55,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    isFeatured: false,
    tags: ['flannel', 'shirt', 'plaid', 'boxy', 'red'],
    images: [
      'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80',
      'https://images.unsplash.com/photo-1603251578711-3290ca1a0187?w=800&q=80',
    ],
  },

  // ── ACCESSORIES ──────────────────────────────────────────────────────────────
  {
    name: '6-Panel Snapback Cap — Black',
    brand: 'DripStore',
    category: 'accessories',
    description:
      'Structured 6-panel cap in polycotton twill. Flat brim, embroidered DripStore logo, and a classic snapback closure. One size fits most. The finishing touch to every fit.',
    price: 1999,
    originalPrice: 2499,
    countInStock: 100,
    sizes: ['One Size'],
    isFeatured: false,
    tags: ['cap', 'snapback', '6-panel', 'hat', 'black'],
    images: [
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=80',
      'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&q=80',
    ],
  },
  {
    name: 'Leather Bifold Wallet — Slate Grey',
    brand: 'DripStore',
    category: 'accessories',
    description:
      'Full-grain vegetable-tanned leather bifold. 4 card slots, a bill compartment, and a slim profile that won\'t ruin your back pocket silhouette. Develops a beautiful patina over time.',
    price: 2999,
    originalPrice: 3999,
    countInStock: 70,
    sizes: ['One Size'],
    isFeatured: false,
    tags: ['wallet', 'leather', 'bifold', 'slim', 'grey'],
    images: [
      'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80',
    ],
  },
  {
    name: 'Ribbed Beanie — Off White',
    brand: 'DripStore',
    category: 'accessories',
    description:
      'Chunky ribbed knit beanie in off-white. 100% merino wool blend — warm without the itch. Fold-up cuff design. The minimal drip every cold-weather fit needs.',
    price: 1499,
    originalPrice: 1999,
    countInStock: 90,
    sizes: ['One Size'],
    isFeatured: false,
    tags: ['beanie', 'knit', 'merino', 'winter', 'off-white'],
    images: [
      'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800&q=80',
      'https://images.unsplash.com/photo-1510598155-173a3dc4c8a2?w=800&q=80',
    ],
  },
];

// ── Seeder Functions ──────────────────────────────────────────────────────────

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Clear existing data
    await Order.deleteMany();
    await Cart.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    console.log('🗑️  Cleared existing data');

    // Insert users (password hashing handled by pre-save hook)
    const createdUsers = await User.insertMany(users);
    const adminUser = createdUsers[0];
    console.log(`👤 Created ${createdUsers.length} users`);
    console.log(`   Admin: admin@dripstore.com / admin123`);

    // Insert products linked to admin user
    const productData = products.map(p => ({ ...p, user: adminUser._id }));
    const createdProducts = await Product.insertMany(productData);
    console.log(`👟 Created ${createdProducts.length} products`);

    console.log('\n🔥 Database seeded successfully!\n');
    console.log('┌─────────────────────────────────────────┐');
    console.log('│  Admin Login:                           │');
    console.log('│  Email:    admin@dripstore.com          │');
    console.log('│  Password: admin123                     │');
    console.log('├─────────────────────────────────────────┤');
    console.log('│  Test User:                             │');
    console.log('│  Email:    john@example.com             │');
    console.log('│  Password: password123                  │');
    console.log('└─────────────────────────────────────────┘\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeder error:', err.message);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    await Order.deleteMany();
    await Cart.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    console.log('💥 All data destroyed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Destroy error:', err.message);
    process.exit(1);
  }
};

// ── Run ───────────────────────────────────────────────────────────────────────
if (process.argv[2] === 'destroy') {
  destroyData();
} else {
  importData();
}
