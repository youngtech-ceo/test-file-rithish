import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

const MOCK_PRODUCTS = [
  {
    name: 'MacBook Pro 16"',
    sku: "APPLE-MBP16-M3MAX",
    brand: "Apple",
    category: "Laptops",
    subcategory: "Professional Laptops",
    description: "The most advanced Mac laptop ever built, powered by the beastly M3 Max chip. Features a gorgeous 16.2-inch Liquid Retina XDR display, up to 36GB of unified memory, and 1TB of super-fast SSD storage. Perfect for video editors, developers, and 3D artists.",
    specifications: {
      "Processor": "Apple M3 Max (16-core CPU, 40-core GPU)",
      "RAM": "36GB Unified Memory",
      "Storage": "1TB SSD",
      "Display": "16.2-inch Liquid Retina XDR (3456 x 2234)",
      "Battery Life": "Up to 22 hours",
      "OS": "macOS Sonoma",
      "Weight": "2.16 kg"
    },
    price: 349900,
    discountPrice: 329900,
    stockQuantity: 15,
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80"
    ],
    warrantyDetails: "1 Year Apple Care Limited Warranty",
    deliveryInfo: "Free express shipping. Delivery in 2-3 business days.",
    rating: 4.9,
    numReviews: 48,
    createdAt: new Date().toISOString()
  },
  {
    name: "iPhone 15 Pro Max",
    sku: "APPLE-IP15PM-256",
    brand: "Apple",
    category: "Mobile Phones",
    subcategory: "Flagship Phones",
    description: "Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system ever with 5x optical zoom. Designed with aerospace-grade titanium that is strong yet incredibly light.",
    specifications: {
      "Processor": "A17 Pro chip with 6-core GPU",
      "RAM": "8GB RAM",
      "Storage": "256GB",
      "Display": "6.7-inch Super Retina XDR OLED",
      "Camera": "48MP Main + 12MP Ultra Wide + 12MP 5x Telephoto",
      "Battery": "4441 mAh with 20W fast charging",
      "OS": "iOS 17"
    },
    price: 159900,
    discountPrice: 149900,
    stockQuantity: 25,
    images: [
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1695048133144-ad7c4cc45025?auto=format&fit=crop&w=800&q=80"
    ],
    warrantyDetails: "1 Year Manufacturer Warranty",
    deliveryInfo: "Free delivery. Ships within 24 hours.",
    rating: 4.8,
    numReviews: 92,
    createdAt: new Date().toISOString()
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    sku: "SAMSUNG-S24U-512",
    brand: "Samsung",
    category: "Mobile Phones",
    subcategory: "Flagship Phones",
    description: "Welcome to the era of mobile AI. With Galaxy S24 Ultra in your hands, you can unleash whole new levels of creativity, productivity and possibility. Features the built-in S Pen, a titanium frame, and a 200MP camera system.",
    specifications: {
      "Processor": "Snapdragon 8 Gen 3 for Galaxy",
      "RAM": "12GB RAM",
      "Storage": "512GB",
      "Display": "6.8-inch Dynamic AMOLED 2X, 120Hz",
      "Camera": "200MP + 50MP + 12MP + 10MP Quad Camera",
      "Battery": "5000 mAh, 45W Fast Charging",
      "OS": "Android 14 with One UI 6.1"
    },
    price: 139900,
    discountPrice: 129900,
    stockQuantity: 20,
    images: [
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80"
    ],
    warrantyDetails: "1 Year Brand Warranty",
    deliveryInfo: "Free delivery. Delivery in 3-4 business days.",
    rating: 4.7,
    numReviews: 65,
    createdAt: new Date().toISOString()
  },
  {
    name: "Sony BRAVIA XR OLED 65\"",
    sku: "SONY-OLED-65A80L",
    brand: "Sony",
    category: "TVs",
    subcategory: "OLED TVs",
    description: "Our Premium OLED TV powered by Cognitive Processor XR™ brings out pure black and stunning brightness. Combined with Acoustic Surface Audio+™, sound comes directly from the screen, matching exactly what you see.",
    specifications: {
      "Display Type": "OLED 4K Ultra HD",
      "Screen Size": "65 Inches",
      "Processor": "Cognitive Processor XR",
      "Audio": "Acoustic Surface Audio+ (50W Output)",
      "Smart TV Platform": "Google TV",
      "HDMI Ports": "4 (2x HDMI 2.1)",
      "Refresh Rate": "120Hz"
    },
    price: 249900,
    discountPrice: 219900,
    stockQuantity: 8,
    images: [
      "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1552975084-6e027cd345c2?auto=format&fit=crop&w=800&q=80"
    ],
    warrantyDetails: "2 Years Comprehensive Warranty on Product",
    deliveryInfo: "Free scheduled delivery and professional installation.",
    rating: 4.9,
    numReviews: 34,
    createdAt: new Date().toISOString()
  },
  {
    name: "Bose QuietComfort Ultra",
    sku: "BOSE-QC-ULTRA-BLK",
    brand: "Bose",
    category: "Accessories",
    subcategory: "Headphones",
    description: "World-class noise cancellation, quieter than ever before. Breakthrough spatialized audio for more immersive listening. CustomTune technology for personalized sound. Elevated design and luxury materials for comfort that lasts.",
    specifications: {
      "Type": "Over-Ear Wireless",
      "Noise Cancellation": "Active Noise Cancelling (ANC)",
      "Battery Life": "Up to 24 hours",
      "Bluetooth Version": "5.3",
      "Charging": "USB-C, Fast charge (15 min = 2 hrs)",
      "Microphones": "Built-in array for clear calls"
    },
    price: 35900,
    discountPrice: 32900,
    stockQuantity: 30,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80"
    ],
    warrantyDetails: "1 Year Bose India Warranty",
    deliveryInfo: "Ships within 24 hours. Free delivery.",
    rating: 4.6,
    numReviews: 110,
    createdAt: new Date().toISOString()
  },
  {
    name: "Apple Watch Ultra 2",
    sku: "APPLE-WATCH-U2",
    brand: "Apple",
    category: "Smart Devices",
    subcategory: "Wearables",
    description: "The ultimate sports and adventure watch is back, pushing boundaries once again. Featuring the all-new S9 SiP, a magical new way to use your watch without touching the screen, and Apple's brightest display ever.",
    specifications: {
      "Case Size": "49mm Titanium Case",
      "Display": "Always-On Retina LTPO OLED (3000 nits)",
      "Battery Life": "Up to 36 hours (72 hours in Low Power Mode)",
      "Water Resistance": "100m (Swimproof & Recreational Dive to 40m)",
      "GPS": "Precision Dual-frequency GPS",
      "Connectivity": "GPS + Cellular"
    },
    price: 89900,
    discountPrice: 84900,
    stockQuantity: 12,
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=800&q=80"
    ],
    warrantyDetails: "1 Year Apple Care Limited Warranty",
    deliveryInfo: "Free shipping. Delivery in 2 days.",
    rating: 4.8,
    numReviews: 29,
    createdAt: new Date().toISOString()
  },
  {
    name: "Samsung Double Door Refrigerator",
    sku: "SAMSUNG-REF-RT34",
    brand: "Samsung",
    category: "Refrigerators",
    subcategory: "Double Door",
    description: "Keep your food fresh and healthy for longer. Powered by Twin Cooling Plus technology, this refrigerator features 5 conversion modes to take care of all your storage needs. Digital Inverter Technology ensures long-lasting performance.",
    specifications: {
      "Capacity": "322 Liters",
      "Star Rating": "3 Star",
      "Cooling Type": "Twin Cooling Plus",
      "Inverter": "Digital Inverter Compressor",
      "Stabilizer": "Stabilizer Free Operation (100V - 300V)"
    },
    price: 74900,
    discountPrice: 68900,
    stockQuantity: 5,
    images: [
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80"
    ],
    warrantyDetails: "1 Year on Product, 20 Years on Digital Inverter Compressor",
    deliveryInfo: "Free delivery & installation. Scheduled delivery available.",
    rating: 4.5,
    numReviews: 54,
    createdAt: new Date().toISOString()
  },
  {
    name: "LG Front Load Washing Machine",
    sku: "LG-WM-FHP1208Z5W",
    brand: "LG",
    category: "Washing Machines",
    subcategory: "Front Load",
    description: "Get smart, gentle fabric care with the AI Direct Drive™ motor, which detects the weight and softness of fabrics to automatically select the optimal washing pattern. Features Steam™ technology to remove 99.9% of allergens.",
    specifications: {
      "Capacity": "8.0 kg",
      "Spin Speed": "1200 RPM",
      "Motor Type": "AI Direct Drive Motor",
      "Features": "Steam Wash, 6 Motion DD, Smart Diagnosis",
      "Energy Rating": "5 Star"
    },
    price: 48900,
    discountPrice: 44900,
    stockQuantity: 7,
    images: [
      "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=80"
    ],
    warrantyDetails: "2 Years on Product, 10 Years on Motor",
    deliveryInfo: "Free delivery and demo. Standard installation included.",
    rating: 4.6,
    numReviews: 42,
    createdAt: new Date().toISOString()
  }
];

const MOCK_CATEGORIES = [
  { id: "laptops", name: "Laptops", image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=300&q=80" },
  { id: "mobile-phones", name: "Mobile Phones", image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=300&q=80" },
  { id: "tvs", name: "TVs", image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=300&q=80" },
  { id: "refrigerators", name: "Refrigerators", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80" },
  { id: "washing-machines", name: "Washing Machines", image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=300&q=80" },
  { id: "accessories", name: "Accessories", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80" },
  { id: "smart-devices", name: "Smart Devices", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80" }
];

const MOCK_COUPONS = [
  {
    code: "WELCOME10",
    type: "percentage",
    value: 10,
    minPurchaseAmount: 1000,
    usageLimit: 500,
    usedCount: 0,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    code: "SUPER5000",
    type: "fixed",
    value: 5000,
    minPurchaseAmount: 50000,
    usageLimit: 100,
    usedCount: 0,
    expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    code: "FREESHIP",
    type: "free_shipping",
    value: 0,
    minPurchaseAmount: 5000,
    usageLimit: 1000,
    usedCount: 0,
    expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // Simple protection: only allow seeding with the secret key or in development
  if (process.env.NODE_ENV !== "development" && secret !== "seed_secret_123") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const batch = adminDb.batch();

    // 1. Seed Categories
    for (const cat of MOCK_CATEGORIES) {
      const docRef = adminDb.collection("categories").doc(cat.id);
      batch.set(docRef, cat);
    }

    // 2. Seed Products
    for (const prod of MOCK_PRODUCTS) {
      const docRef = adminDb.collection("products").doc();
      batch.set(docRef, { ...prod, id: docRef.id });
    }

    // 3. Seed Coupons
    for (const coup of MOCK_COUPONS) {
      const docRef = adminDb.collection("coupons").doc(coup.code);
      batch.set(docRef, coup);
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${MOCK_CATEGORIES.length} categories, ${MOCK_PRODUCTS.length} products, and ${MOCK_COUPONS.length} coupons.`
    });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
