import {
  useEffect,
  useMemo,
  useState
} from "react";
import { createClient } from "@supabase/supabase-js";
import "./App.css";

/* =========================================================
   MAKEUP PLAZA
   DEMO E-COMMERCE VERSION
   Customer authentication uses Supabase Auth.
   Store catalog/order demo data continues to use localStorage
========================================================= */

const STORAGE = {
  products: "makeupPlazaProducts",
  categories: "makeupPlazaCategories",
  orders: "makeupPlazaOrders",
  users: "makeupPlazaUsers",
  currentUser: "makeupPlazaCurrentUser",
  favorites: "makeupPlazaFavorites",
  banners: "makeupPlazaBanners",
  hero: "makeupPlazaHero",
};

const ADMIN_EMAIL = "owner@makeupplaza.com";
const ADMIN_PASSWORD = "admin123";

/* =========================================================
   REAL CUSTOMER AUTH
   Put your Supabase project values here, or in .env.local:
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_PUBLISHABLE_KEY=...
========================================================= */

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "PASTE_YOUR_SUPABASE_URL_HERE";

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE";

const supabaseConfigured =
  SUPABASE_URL.startsWith("http") &&
  !SUPABASE_PUBLISHABLE_KEY.includes("PASTE_YOUR");

const supabase = supabaseConfigured
  ? createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      }
    )
  : null;

/* =========================================================
   DEMO IMAGES
========================================================= */

const demoImages = {
  lipstick:
    "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=85",

  foundation:
    "https://images.unsplash.com/photo-1631730486572-226d1d8b6d8a?auto=format&fit=crop&w=900&q=85",

  eyes:
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=900&q=85",

  highlighter:
    "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=900&q=85",
};

/* =========================================================
   DEFAULT PRODUCTS
========================================================= */

const defaultHero = {
  label: "✦ TRENDING NOW",
  title: "Glow Edit",
  description: "Premium beauty collection",
  discount: "40% OFF",
  image: demoImages.foundation,
  buttonText: "SHOP NOW",
};
const defaultProducts = [
  {
    id: "product-1",
    name: "Luxury Matte Lipstick",
    category: "Lipsticks",
    price: 399,
    oldPrice: 499,
    rating: 4.8,
    reviews: 124,
    badge: "BEST SELLER",
    image: demoImages.lipstick,
    todaySale: true,
    bestSeller: true,
    trending: true,
    newArrival: false,
  },

  {
    id: "product-2",
    name: "Premium Glow Foundation",
    category: "Foundation",
    price: 679,
    oldPrice: 799,
    rating: 4.9,
    reviews: 98,
    badge: "TRENDING",
    image: demoImages.foundation,
    todaySale: true,
    bestSeller: false,
    trending: true,
    newArrival: false,
  },

  {
    id: "product-3",
    name: "Luxury Glow Highlighter",
    category: "Highlighter",
    price: 599,
    oldPrice: 699,
    rating: 4.8,
    reviews: 76,
    badge: "NEW",
    image: demoImages.highlighter,
    todaySale: false,
    bestSeller: false,
    trending: false,
    newArrival: true,
  },

  {
    id: "product-4",
    name: "Luxury Eyeshadow Palette",
    category: "Eyeshadow",
    price: 749,
    oldPrice: 999,
    rating: 4.9,
    reviews: 156,
    badge: "HOT",
    image: demoImages.eyes,
    todaySale: true,
    bestSeller: true,
    trending: false,
    newArrival: false,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(
    key,
    JSON.stringify(value)
  );
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString(
    "en-IN"
  )}`;
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDeliveryDate(value) {
  if (!value) {
    return "Not updated yet";
  }

  const date = new Date(
    `${value}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* =========================================================
   ORDER STATUS MESSAGE
========================================================= */

function orderStatusText(
  status,
  deliveryDate
) {
  switch (status) {
    case "Pending":
      return "Order received. Waiting for owner approval.";

    case "Confirmed":
      return deliveryDate
        ? `Order accepted. Expected delivery: ${formatDeliveryDate(
            deliveryDate
          )}.`
        : "Order accepted by Makeup Plaza.";

    case "Packed":
      return deliveryDate
        ? `Your order has been packed. Expected delivery: ${formatDeliveryDate(
            deliveryDate
          )}.`
        : "Your order has been packed.";

    case "Shipped":
      return deliveryDate
        ? `Your order is on the way. Expected delivery: ${formatDeliveryDate(
            deliveryDate
          )}.`
        : "Your order is on the way.";

    case "Out for Delivery":
      return "Your order is out for delivery today.";

    case "Delivered":
      return "Your order has been delivered successfully.";

    case "Cancelled":
      return "This order has been cancelled.";

    case "Rejected":
      return "This order was rejected by the owner.";

    default:
      return "Order status unavailable.";
  }
}

/* =========================================================
   NORMALIZE CATEGORIES
========================================================= */

function normalizeCategories(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenNames = new Set();
  const seenIds = new Set();

  return value
    .filter(
      (category) =>
        category &&
        typeof category.name === "string" &&
        category.name.trim()
    )
    .map((category, index) => {
      const name = category.name.trim();
      const nameKey = name.toLowerCase();

      if (seenNames.has(nameKey)) {
        return null;
      }

      seenNames.add(nameKey);

      let id = String(
        category.id || ""
      ).trim();

      if (!id) {
        id = `category-${index}-${nameKey
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")}`;
      }

      let uniqueId = id;
      let suffix = 2;

      while (seenIds.has(uniqueId)) {
        uniqueId = `${id}-${suffix++}`;
      }

      seenIds.add(uniqueId);

      return {
        id: uniqueId,
        name,
        description:
          typeof category.description ===
            "string" &&
          category.description.trim()
            ? category.description.trim()
            : "Premium beauty collection",
        image:
          category.image || demoImages.lipstick,
      };
    })
    .filter(Boolean);
}

/* =========================================================
   IMAGE UPLOAD
========================================================= */

function imageUploadToDataURL(
  event,
  callback
) {
  const file =
    event.target.files?.[0];

  if (!file) {
    return;
  }

  if (
    !file.type.startsWith("image/")
  ) {
    alert(
      "Please select an image file."
    );
    return;
  }

  if (
    file.size >
    5 * 1024 * 1024
  ) {
    alert(
      "Image must be under 5MB."
    );
    return;
  }

  const reader =
    new FileReader();

  reader.onload = () => {
    callback(reader.result);
  };

  reader.readAsDataURL(file);
}

/* =========================================================
   APP
========================================================= */

function App() {
  /* =======================================================
     DATA
  ======================================================= */

  const [products, setProducts] =
    useState(() =>
      readStorage(
        STORAGE.products,
        defaultProducts
      )
    );

  const [categories, setCategories] =
    useState(() =>
      normalizeCategories(
        readStorage(
          STORAGE.categories,
          []
        )
      )
    );

  const [orders, setOrders] =
    useState(() =>
      readStorage(
        STORAGE.orders,
        []
      )
    );

  const [users, setUsers] =
    useState(() =>
      readStorage(
        STORAGE.users,
        []
      )
    );

  const [currentUser, setCurrentUser] = useState(null);

const [adminSession, setAdminSession] = useState(() =>
  sessionStorage.getItem("makeupPlazaAdmin") === "true"
);

const [authReady, setAuthReady] = useState(!supabaseConfigured);

  const [favorites, setFavorites] =
    useState(() =>
      readStorage(
        STORAGE.favorites,
        []
      )
    );

  const [banners, setBanners] =
    useState(() =>
      readStorage(
        STORAGE.banners,
        []
      )
    );
    const [hero, setHero] = useState(() =>
  readStorage(STORAGE.hero, defaultHero)
);

  /* =======================================================
     UI
  ======================================================= */

  const [page, setPage] =
    useState("home");

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [cartOpen, setCartOpen] =
    useState(false);

  const [checkoutOpen, setCheckoutOpen] =
    useState(false);

  const [authOpen, setAuthOpen] =
    useState(false);

  const [authMode, setAuthMode] =
    useState("login");

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [adminOpen, setAdminOpen] =
    useState(false);

  useEffect(() => {
    if (window.location.hash === "#owner") {
      setAdminOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return undefined;
    }

    let alive = true;

    const hydrateCustomer = (authUser) => {
      if (!authUser || !alive) {
        if (alive) {
          setCurrentUser(null);
          localStorage.removeItem(STORAGE.currentUser);
        }
        return;
      }

      const email = String(authUser.email || "")
        .trim()
        .toLowerCase();

      // Read the latest local profile at hydration time so this effect
      // does not need to re-subscribe on every users-state update.
      const latestUsers = readStorage(STORAGE.users, []);

      const localProfile = Array.isArray(latestUsers)
        ? latestUsers.find(
            (item) =>
              item?.authId === authUser.id ||
              String(item?.email || "")
                .trim()
                .toLowerCase() === email
          )
        : null;

      const customer = {
        id: authUser.id,
        authId: authUser.id,
        name:
          localProfile?.name ||
          authUser.user_metadata?.name ||
          email.split("@")[0] ||
          "Customer",
        phone:
          localProfile?.phone ||
          authUser.user_metadata?.phone ||
          "",
        email,
        address: localProfile?.address || "",
        city: localProfile?.city || "",
        state: localProfile?.state || "",
        pincode: localProfile?.pincode || "",
        role: "customer",
      };

      setCurrentUser(customer);
      saveStorage(STORAGE.currentUser, customer);

      if (!localProfile) {
        const profileRecord = { ...customer };
        setUsers((current) => {
          const safeCurrent = Array.isArray(current) ? current : [];
          if (safeCurrent.some((item) => item?.authId === authUser.id)) {
            return safeCurrent;
          }
          const next = [...safeCurrent, profileRecord];
          saveStorage(STORAGE.users, next);
          return next;
        });
      }
    };

    const restoreSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!alive) return;

        if (error) {
          console.error("Supabase session restore failed:", error);
          setCurrentUser(null);
          localStorage.removeItem(STORAGE.currentUser);
        } else if (data.session?.user) {
          hydrateCustomer(data.session.user);
        } else {
          setCurrentUser(null);
          localStorage.removeItem(STORAGE.currentUser);
        }
      } catch (error) {
        console.error("Supabase auth initialization failed:", error);
        if (alive) {
          setCurrentUser(null);
          localStorage.removeItem(STORAGE.currentUser);
        }
      } finally {
        if (alive) setAuthReady(true);
      }
    };

    restoreSession();

    const { data: listener } =
      supabase.auth.onAuthStateChange((event, session) => {
        if (!alive) return;

        if (session?.user) {
          hydrateCustomer(session.user);
        } else {
          setCurrentUser(null);
          localStorage.removeItem(STORAGE.currentUser);
        }

        if (event === "SIGNED_OUT") {
          setProfileOpen(false);
          setCheckoutOpen(false);
        }

        setAuthReady(true);
      });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const [searchText, setSearchText] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [selectedCollection, setSelectedCollection] =
    useState("All");

  const [successOrder, setSuccessOrder] =
    useState(null);

  const [toast, setToast] =
    useState("");

  /* =======================================================
     CART
  ======================================================= */

  const [cart, setCart] =
    useState([]);

  /* =======================================================
     SAVE HELPERS
  ======================================================= */

  const updateProducts = (
    next
  ) => {
    setProducts(next);

    saveStorage(
      STORAGE.products,
      next
    );
  };

  const updateCategories = (
    next
  ) => {
    const clean =
      normalizeCategories(next);

    setCategories(clean);

    saveStorage(
      STORAGE.categories,
      clean
    );
  };

  const updateOrders = (
    next
  ) => {
    setOrders(next);

    saveStorage(
      STORAGE.orders,
      next
    );
  };

  const updateUsers = (
    next
  ) => {
    setUsers(next);

    saveStorage(
      STORAGE.users,
      next
    );
  };

  const updateFavorites = (
    next
  ) => {
    setFavorites(next);

    saveStorage(
      STORAGE.favorites,
      next
    );
  };

  const updateBanners = (
    next
  ) => {
    setBanners(next);

    saveStorage(
      STORAGE.banners,
      next
    );
  };
  const updateHero = (nextHero) => {
  setHero(nextHero);
  saveStorage(STORAGE.hero, nextHero);
  showToast("Homepage hero updated successfully");
};

  /* =======================================================
     TOAST
  ======================================================= */

  const showToast = (
    message
  ) => {
    setToast(message);

    window.clearTimeout(
      window.makeupPlazaToastTimer
    );

    window.makeupPlazaToastTimer =
      window.setTimeout(() => {
        setToast("");
      }, 2500);
  };

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const navigate = (
    nextPage,
    category = "All",
    collection = "All"
  ) => {
    setPage(nextPage);

    setSelectedCategory(
      category
    );

    setSelectedCollection(
      collection
    );

    setSearchText("");

    setMenuOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =======================================================
     FAVORITES
  ======================================================= */

  const toggleFavorite = (
    productId
  ) => {
    const exists =
      favorites.includes(
        productId
      );

    const next = exists
      ? favorites.filter(
          (id) =>
            id !== productId
        )
      : [
          ...favorites,
          productId,
        ];

    updateFavorites(next);

    showToast(
      exists
        ? "Removed from favourites"
        : "Added to favourites"
    );
  };

  /* =======================================================
     CART
  ======================================================= */

  const addToCart = (
    product
  ) => {
    setCart(
      (current) => {
        const existing =
          current.find(
            (item) =>
              item.id ===
              product.id
          );

        if (existing) {
          return current.map(
            (item) =>
              item.id ===
              product.id
                ? {
                    ...item,
                    quantity:
                      item.quantity +
                      1,
                  }
                : item
          );
        }

        return [
          ...current,
          {
            ...product,
            quantity: 1,
          },
        ];
      }
    );

    setCartOpen(true);

    showToast(
      "Product added to bag"
    );
  };

  const buyNow = (
    product
  ) => {
    setCart([
      {
        ...product,
        quantity: 1,
      },
    ]);

    if (!currentUser) {
      setAuthMode("login");
      setAuthOpen(true);

      showToast(
        "Login required before checkout"
      );

      return;
    }

    setCheckoutOpen(true);
  };

  const increaseQuantity = (
    id
  ) => {
    setCart(
      (current) =>
        current.map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  quantity:
                    item.quantity +
                    1,
                }
              : item
        )
    );
  };

  const decreaseQuantity = (
    id
  ) => {
    setCart(
      (current) =>
        current
          .map(
            (item) =>
              item.id === id
                ? {
                    ...item,
                    quantity:
                      item.quantity -
                      1,
                  }
                : item
          )
          .filter(
            (item) =>
              item.quantity > 0
          )
    );
  };

  const removeFromCart = (
    id
  ) => {
    setCart(
      (current) =>
        current.filter(
          (item) =>
            item.id !== id
        )
    );
  };

  const cartCount =
    cart.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );

  const subtotal =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(
          item.price || 0
        ) *
          item.quantity,
      0
    );

  const shipping =
    subtotal === 0 ||
    subtotal >= 999
      ? 0
      : 99;

  const grandTotal =
    subtotal +
    shipping;

  /* =======================================================
     CUSTOMER LOGIN / AUTH
  ======================================================= */

  const loginCustomer = async (email, password) => {
    if (!supabaseConfigured || !supabase) {
      showToast("Customer authentication is not configured yet.");
      return false;
    }

    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const cleanPassword = String(password || "");

    if (!normalizedEmail || !cleanPassword) {
      showToast("Please enter email and password");
      return false;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: cleanPassword,
    });

    if (error) {
      const message = String(error.message || "");

      if (/email not confirmed/i.test(message)) {
        showToast("Please verify your email before logging in.");
      } else if (/invalid login credentials/i.test(message)) {
        showToast("Incorrect email or password.");
      } else {
        showToast(message || "Unable to login");
      }

      return false;
    }

    if (!data.user) {
      showToast("Login failed. Please try again.");
      return false;
    }

    // onAuthStateChange will hydrate and persist the customer profile.
    setAuthOpen(false);
    showToast(`Welcome, ${data.user.user_metadata?.name || normalizedEmail.split("@")[0]}`);
    return true;
  };

  const registerCustomer = async (data) => {
    if (!supabaseConfigured || !supabase) {
      showToast("Customer authentication is not configured yet.");
      return false;
    }

    const name = String(data?.name || "").trim();
    const phone = String(data?.phone || "").replace(/\D/g, "");
    const email = String(data?.email || "").trim().toLowerCase();
    const password = String(data?.password || "");
    const confirmPassword = String(data?.confirmPassword || "");

    if (!name || !phone || !email || !password || !confirmPassword) {
      showToast("Please fill all required fields");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("Enter a valid email address");
      return false;
    }

    if (phone.length !== 10) {
      showToast("Enter valid 10 digit mobile number");
      return false;
    }

    if (password.length < 8) {
      showToast("Password must be at least 8 characters");
      return false;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match");
      return false;
    }

    const existingLocal = users.find(
      (item) =>
        String(item?.email || "").trim().toLowerCase() === email
    );

    if (existingLocal?.authId) {
      showToast("Email already registered. Please login.");
      return false;
    }

    const { data: signupData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      showToast(error.message || "Unable to create account");
      return false;
    }

    const authUser = signupData.user;

    if (!authUser) {
      showToast("Account could not be created. Please try again.");
      return false;
    }

    const customer = {
      id: authUser.id,
      authId: authUser.id,
      name,
      phone,
      email,
      address: "",
      city: "",
      state: "",
      pincode: "",
      role: "customer",
    };

    const currentUsers = Array.isArray(users) ? users : [];
    const nextUsers = existingLocal
      ? currentUsers.map((item) =>
          item.id === existingLocal.id ? { ...item, ...customer } : item
        )
      : [...currentUsers, customer];

    updateUsers(nextUsers);

    if (signupData.session) {
      // Email confirmation is disabled in Supabase: user can continue immediately.
      setCurrentUser(customer);
      saveStorage(STORAGE.currentUser, customer);
      setAuthOpen(false);
      showToast("Account created successfully");
    } else {
      // Email confirmation is enabled: keep user signed out until verified.
      setAuthMode("login");
      showToast("Account created. Check your email to verify your account.");
    }

    return true;
  };

  const sendPasswordResetOtp = async (email) => {
    if (!supabaseConfigured || !supabase) {
      showToast("Customer authentication is not configured yet.");
      return false;
    }

    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail) {
      showToast("Enter your registered email address");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      showToast("Enter a valid email address");
      return false;
    }

    // OTP sign-in is used here only for the password recovery verification step.
    // shouldCreateUser:false prevents unknown email addresses from creating accounts.
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      showToast(error.message || "Unable to send OTP");
      return false;
    }

    showToast("6-digit OTP sent to your email");
    return true;
  };

  const resetPasswordWithOtp = async (email, otp, newPassword) => {
    if (!supabaseConfigured || !supabase) {
      showToast("Customer authentication is not configured yet.");
      return false;
    }

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const cleanOtp = String(otp || "").replace(/\D/g, "");
    const password = String(newPassword || "");

    if (!normalizedEmail) {
      showToast("Enter your registered email address");
      return false;
    }

    if (!/^\d{6}$/.test(cleanOtp)) {
      showToast("Enter the 6 digit OTP");
      return false;
    }

    if (password.length < 8) {
      showToast("New password must be at least 8 characters");
      return false;
    }

    const { data: verifyData, error: verifyError } =
      await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: cleanOtp,
        type: "email",
      });

    if (verifyError) {
      showToast(verifyError.message || "Invalid or expired OTP");
      return false;
    }

    if (!verifyData.session?.user) {
      showToast("OTP verified, but no recovery session was created");
      return false;
    }

    const { data: updateData, error: updateError } =
      await supabase.auth.updateUser({
        password,
      });

    if (updateError) {
      showToast(updateError.message || "Unable to save new password");
      return false;
    }

    // Supabase has now stored the new password. The verified session is persisted
    // automatically by the browser auth client.
    const authUser = updateData.user || verifyData.user;
    const latestUsers = readStorage(STORAGE.users, []);
    const localProfile = Array.isArray(latestUsers)
      ? latestUsers.find(
          (item) =>
            item?.authId === authUser?.id ||
            String(item?.email || "").trim().toLowerCase() === normalizedEmail
        )
      : null;

    const customer = {
      id: authUser?.id || localProfile?.id || makeId("user"),
      authId: authUser?.id || localProfile?.authId || "",
      name:
        localProfile?.name ||
        authUser?.user_metadata?.name ||
        normalizedEmail.split("@")[0],
      phone:
        localProfile?.phone ||
        authUser?.user_metadata?.phone ||
        "",
      email: normalizedEmail,
      address: localProfile?.address || "",
      city: localProfile?.city || "",
      state: localProfile?.state || "",
      pincode: localProfile?.pincode || "",
      role: "customer",
    };

    if (localProfile) {
      updateUsers(
        latestUsers.map((item) =>
          item.id === localProfile.id ? { ...item, ...customer } : item
        )
      );
    } else {
      updateUsers([...latestUsers, customer]);
    }

    setCurrentUser(customer);
    saveStorage(STORAGE.currentUser, customer);
    setAuthOpen(false);
    showToast("Password updated successfully");
    return true;
  };

  /* =======================================================
     CUSTOMER LOGOUT
  ======================================================= */

  const logoutUser = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Supabase logout failed:", error);
      }
    }

    setCurrentUser(null);
    setProfileOpen(false);
    setMenuOpen(false);
    setCheckoutOpen(false);
    localStorage.removeItem(STORAGE.currentUser);
    navigate("home");
    showToast("Logged out successfully");
  };

  /* =======================================================
     PROFILE
  ======================================================= */

  const saveProfile = (
    profileData
  ) => {
    if (!currentUser) {
      return;
    }

    const updated = {
      ...currentUser,
      ...profileData,
    };

    const nextUsers =
      users.map(
        (user) =>
          user.id ===
          currentUser.id
            ? updated
            : user
      );

    updateUsers(
      nextUsers
    );

    setCurrentUser(
      updated
    );

    saveStorage(
      STORAGE.currentUser,
      updated
    );

    if (supabase) {
      supabase.auth
        .updateUser({
          data: {
            name: updated.name || "",
            phone: updated.phone || "",
          },
        })
        .catch((error) => {
          console.error("Unable to sync profile metadata:", error);
        });
    }

    showToast(
      "Profile & address saved"
    );
  };

  /* =======================================================
     CUSTOMER ORDERS
  ======================================================= */

  const customerOrders =
    useMemo(() => {
      if (!currentUser) {
        return [];
      }

      return orders.filter(
        (order) =>
          order.userId ===
          currentUser.id
      );
    }, [
      orders,
      currentUser,
    ]);

  /* =======================================================
     FAVORITE PRODUCTS
  ======================================================= */

  const favoriteProducts =
    useMemo(() => {
      return products.filter(
        (product) =>
          favorites.includes(
            product.id
          )
      );
    }, [
      products,
      favorites,
    ]);

  /* =======================================================
     FILTERED PRODUCTS
  ======================================================= */

  const filteredProducts =
    useMemo(() => {
      const search =
        searchText
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          let categoryMatch =
            true;

          let collectionMatch =
            true;

          if (
            selectedCategory !==
            "All"
          ) {
            categoryMatch =
              product.category ===
              selectedCategory;
          }

          if (
            selectedCollection ===
            "todaySale"
          ) {
            collectionMatch =
              product.todaySale ===
              true;
          }

          if (
            selectedCollection ===
            "bestSeller"
          ) {
            collectionMatch =
              product.bestSeller ===
              true;
          }

          if (
            selectedCollection ===
            "trending"
          ) {
            collectionMatch =
              product.trending ===
              true;
          }

          if (
            selectedCollection ===
            "newArrival"
          ) {
            collectionMatch =
              product.newArrival ===
              true;
          }

          const searchMatch =
            !search ||
            [
              product.name,
              product.category,
              product.badge,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(search);

          return (
            categoryMatch &&
            collectionMatch &&
            searchMatch
          );
        }
      );
    }, [
      products,
      selectedCategory,
      selectedCollection,
      searchText,
    ]);

  /* =======================================================
     PLACE ORDER
  ======================================================= */

  const placeOrder = (
    details
  ) => {
    if (!currentUser) {
      setCheckoutOpen(
        false
      );

      setAuthMode(
        "login"
      );

      setAuthOpen(
        true
      );

      return;
    }

    const required = [
      "name",
      "phone",
      "email",
      "address",
      "city",
      "state",
      "pincode",
    ];

    const missing =
      required.some(
        (field) =>
          !String(
            details[field] ||
              ""
          ).trim()
      );

    if (missing) {
      showToast(
        "Please fill all delivery details"
      );

      return;
    }

    const phone =
      String(
        details.phone
      ).replace(
        /\D/g,
        ""
      );

    const pincode =
      String(
        details.pincode
      ).trim();

    if (
      phone.length !==
      10
    ) {
      showToast(
        "Enter valid 10 digit mobile number"
      );

      return;
    }

    if (
      pincode.length !==
      6
    ) {
      showToast(
        "Enter valid 6 digit pincode"
      );

      return;
    }

    if (!cart.length) {
      showToast(
        "Your cart is empty"
      );

      return;
    }

    const newOrder = {
      id: `MP-${Date.now()
        .toString()
        .slice(-8)}`,

      userId:
        currentUser.id,

      createdAt:
        new Date().toISOString(),

      customer: {
        name:
          details.name.trim(),

        phone,

        email:
          details.email
            .trim()
            .toLowerCase(),

        address:
          details.address.trim(),

        city:
          details.city.trim(),

        state:
          details.state.trim(),

        pincode,
      },

      items: cart.map(
        (item) => ({
          ...item,
        })
      ),

      subtotal,

      shipping,

      total:
        grandTotal,

      payment:
        details.payment ||
        "Cash on Delivery",

      status: "Pending",

      expectedDelivery: "",

      cancellationRequested:
        false,

      cancellationReason: "",

      cancelledAt: "",
    };

    updateOrders([
      newOrder,
      ...orders,
    ]);

    saveProfile(
      newOrder.customer
    );

    setCart([]);

    setCheckoutOpen(false);

    setSuccessOrder(
      newOrder
    );
  };

  /* =======================================================
     CANCELLATION REQUEST
  ======================================================= */

  const requestCancellation = (
    order
  ) => {
    if (
      [
        "Delivered",
        "Cancelled",
        "Rejected",
      ].includes(
        order.status
      )
    ) {
      return;
    }

    if (
      order.cancellationRequested
    ) {
      return;
    }

    const reason =
      window.prompt(
        "Cancellation reason:",
        "I changed my mind."
      );

    if (!reason) {
      return;
    }

    updateOrders(
      orders.map(
        (item) =>
          item.id ===
          order.id
            ? {
                ...item,

                cancellationRequested:
                  true,

                cancellationReason:
                  reason,
              }
            : item
      )
    );

    showToast(
      "Cancellation request sent to owner"
    );
  };

  /* =======================================================
     RENDER
  ======================================================= */

  if (!authReady) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-card">
          <div className="auth-logo">M</div>
          <span className="eyebrow">MAKEUP PLAZA</span>
          <h2>Restoring your <em>account</em>...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="makeup-app">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <Header
  currentUser={
    currentUser
  }

  adminSession={
    adminSession
  }

  cartCount={
    cartCount
  }
        favoriteCount={
          favorites.length
        }
        searchText={
          searchText
        }
        setSearchText={
          setSearchText
        }
        onMenu={() =>
          setMenuOpen(true)
        }
        onHome={() =>
          navigate("home")
        }
        onShopSearch={() =>
          navigate("shop")
        }
        onFavorites={() =>
          navigate("favorites")
        }
        onOrders={() => {
          if (!currentUser) {
            setAuthMode(
              "login"
            );
            setAuthOpen(
              true
            );
            return;
          }

          navigate("orders");
        }}
        onAccount={() => {
          if (!currentUser) {
            setAuthMode(
              "login"
            );
            setAuthOpen(
              true
            );
            return;
          }

          setProfileOpen(
            true
          );
        }}
        onCart={() =>
          setCartOpen(
            true
          )
        }
        onAdmin={() =>
          setAdminOpen(
            true
          )
        }
      />
        <div className="luxury-marquee">
  <div className="luxury-marquee-track">
    <span>✦ FREE DELIVERY ON ORDERS ₹999+</span>
    <span>✦ PREMIUM BEAUTY COLLECTION</span>
    <span>✦ NEW ARRIVALS EVERY WEEK</span>
    <span>✦ CASH ON DELIVERY AVAILABLE</span>

    <span>✦ FREE DELIVERY ON ORDERS ₹999+</span>
    <span>✦ PREMIUM BEAUTY COLLECTION</span>
    <span>✦ NEW ARRIVALS EVERY WEEK</span>
    <span>✦ CASH ON DELIVERY AVAILABLE</span>
  </div>
</div>
      {/* =====================================================
          TOP NAVIGATION
      ===================================================== */}

      <TopNavigation
        categories={
          categories
        }
        activePage={
          page
        }
        activeCategory={
          selectedCategory
        }
        activeCollection={
          selectedCollection
        }
        onHome={() =>
          navigate("home")
        }
        onAll={() =>
          navigate(
            "shop",
            "All",
            "All"
          )
        }
        onBest={() =>
          navigate(
            "shop",
            "All",
            "bestSeller"
          )
        }
        onTrending={() =>
          navigate(
            "shop",
            "All",
            "trending"
          )
        }
        onDeals={() =>
          navigate(
            "shop",
            "All",
            "todaySale"
          )
        }
        onNew={() =>
          navigate(
            "shop",
            "All",
            "newArrival"
          )
        }
        onCategory={(
          name
        ) =>
          navigate(
            "shop",
            name,
            "All"
          )
        }
      />

      {/* =====================================================
          HOME
      ===================================================== */}

      {page === "home" && (
        <HomePage
  products={products}
  categories={categories}
  banners={banners}
  hero={hero}
          favorites={
            favorites
          }
          onFavorite={
            toggleFavorite
          }
          onAdd={
            addToCart
          }
          onBuy={
            buyNow
          }
          onShop={(
            category = "All",
            collection = "All"
          ) =>
            navigate(
              "shop",
              category,
              collection
            )
          }
        />
      )}

      {/* =====================================================
          SHOP
      ===================================================== */}

      {page === "shop" && (
        <ShopPage
          products={
            filteredProducts
          }
          categories={
            categories
          }
          selectedCategory={
            selectedCategory
          }
          selectedCollection={
            selectedCollection
          }
          searchText={
            searchText
          }
          onCategory={(
            category
          ) =>
            navigate(
              "shop",
              category,
              "All"
            )
          }
          onCollection={(
            collection
          ) =>
            navigate(
              "shop",
              "All",
              collection
            )
          }
          onClear={() => {
            setSelectedCategory(
              "All"
            );

            setSelectedCollection(
              "All"
            );

            setSearchText("");
          }}
          favorites={
            favorites
          }
          onFavorite={
            toggleFavorite
          }
          onAdd={
            addToCart
          }
          onBuy={
            buyNow
          }
        />
      )}

      {/* =====================================================
          FAVORITES
      ===================================================== */}

      {page ===
        "favorites" && (
        <FavoritesPage
          products={
            favoriteProducts
          }
          favorites={
            favorites
          }
          onFavorite={
            toggleFavorite
          }
          onAdd={
            addToCart
          }
          onBuy={
            buyNow
          }
          onShop={() =>
            navigate("shop")
          }
        />
      )}

      {/* =====================================================
          ORDERS
      ===================================================== */}

      {page ===
        "orders" && (
        <OrdersPage
          orders={
            customerOrders
          }
          onCancel={
            requestCancellation
          }
          onShop={() =>
            navigate("shop")
          }
        />
      )}

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <Footer
        categories={
          categories
        }
        onHome={() =>
          navigate("home")
        }
        onShop={() =>
          navigate("shop")
        }
        onOrders={() => {
          if (!currentUser) {
            setAuthMode(
              "login"
            );
            setAuthOpen(
              true
            );
            return;
          }

          navigate("orders");
        }}
        onFavorites={() =>
          navigate("favorites")
        }
        onLogin={() => {
          setAuthMode(
            "login"
          );

          setAuthOpen(
            true
          );
        }}
        onAdmin={() =>
          setAdminOpen(
            true
          )
        }
      />

      {/* =====================================================
          MENU
      ===================================================== */}

{menuOpen && (
  <MenuDrawer
    currentUser={currentUser}
    categories={categories}
    favoriteCount={favorites.length}
    orderCount={customerOrders.length}
    onClose={() => setMenuOpen(false)}
    onHome={() => navigate("home")}
    onShop={() => navigate("shop")}
    onFavorites={() => navigate("favorites")}
    onOrders={() =>
      currentUser
        ? navigate("orders")
        : (
            setAuthMode("login"),
            setAuthOpen(true),
            setMenuOpen(false)
          )
    }
    onProfile={() =>
      currentUser
        ? (
            setMenuOpen(false),
            setProfileOpen(true)
          )
        : (
            setAuthMode("login"),
            setAuthOpen(true),
            setMenuOpen(false)
          )
    }
    onCategory={(name) =>
      navigate("shop", name)
    }
    onBest={() =>
      navigate("shop", "All", "bestSeller")
    }
    onTrending={() =>
      navigate("shop", "All", "trending")
    }
    onDeals={() =>
      navigate("shop", "All", "todaySale")
    }
    onNew={() =>
      navigate("shop", "All", "newArrival")
    }
    onLogin={() => {
      setMenuOpen(false);
      setAuthMode("login");
      setAuthOpen(true);
    }}
    onLogout={logoutUser}
  />
)}

      {/* =====================================================
          CART
      ===================================================== */}

      {cartOpen && (
        <CartDrawer
          cart={cart}
          subtotal={subtotal}
          shipping={shipping}
          total={grandTotal}
          onClose={() =>
            setCartOpen(
              false
            )
          }
          onIncrease={
            increaseQuantity
          }
          onDecrease={
            decreaseQuantity
          }
          onRemove={
            removeFromCart
          }
          onCheckout={() => {
            if (!currentUser) {
              setCartOpen(
                false
              );

              setAuthMode(
                "login"
              );

              setAuthOpen(
                true
              );

              showToast(
                "Login required before checkout"
              );

              return;
            }

            if (!cart.length) {
              return;
            }

            setCartOpen(
              false
            );

            setCheckoutOpen(
              true
            );
          }}
        />
      )}

      {/* =====================================================
          CHECKOUT
      ===================================================== */}

      {checkoutOpen && (
        <CheckoutModal
          user={
            currentUser
          }
          cart={cart}
          subtotal={
            subtotal
          }
          shipping={
            shipping
          }
          total={
            grandTotal
          }
          onClose={() =>
            setCheckoutOpen(
              false
            )
          }
          onLoginRequired={() => {
            setCheckoutOpen(
              false
            );

            setAuthMode(
              "login"
            );

            setAuthOpen(
              true
            );
          }}
          onPlaceOrder={
            placeOrder
          }
        />
      )}

      {/* =====================================================
          AUTH
      ===================================================== */}

      {authOpen && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthOpen(false)}
          onLogin={loginCustomer}
          onRegister={registerCustomer}
          onSendPasswordResetOtp={sendPasswordResetOtp}
          onResetPasswordWithOtp={resetPasswordWithOtp}
        />
      )}

      {/* =====================================================
          PROFILE
      ===================================================== */}

      {profileOpen &&
        currentUser && (
          <ProfileModal
            user={
              currentUser
            }
            onClose={() =>
              setProfileOpen(
                false
              )
            }
            onSave={
              saveProfile
            }
            onLogout={
              logoutUser
            }
            onOrders={() => {
              setProfileOpen(
                false
              );

              navigate(
                "orders"
              );
            }}
            onFavorites={() => {
              setProfileOpen(
                false
              );

              navigate(
                "favorites"
              );
            }}
          />
        )}

      {/* =====================================================
          SUCCESS
      ===================================================== */}

      {successOrder && (
        <OrderSuccessModal
          order={
            successOrder
          }
          onClose={() => {
            setSuccessOrder(
              null
            );

            navigate(
              "orders"
            );
          }}
        />
      )}

      {/* =====================================================
          ADMIN
      ===================================================== */}

      {adminOpen && (
        <AdminPanel
          adminSession={adminSession}
  currentUser={currentUser}
  products={products}
  categories={categories}
  orders={orders}
  users={users}
  banners={banners}
  hero={hero}
  onClose={() => setAdminOpen(false)}
  onAdminLogin={() => {
  setAdminSession(true);
}}
  onLogout={logoutUser}
  saveProducts={updateProducts}
  saveCategories={updateCategories}
  saveOrders={updateOrders}
  saveBanners={updateBanners}
  saveHero={updateHero}
  showToast={showToast}
/>
      )}

      {/* =====================================================
          TOAST
      ===================================================== */}

      {toast && (
        <div className="toast-message">
          {toast}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   HEADER
========================================================= */

function Header({
  currentUser,
  adminSession,
  cartCount,
  favoriteCount,
  searchText,
  setSearchText,
  onMenu,
  onHome,
  onShopSearch,
  onFavorites,
  onOrders,
  onAccount,
  onCart,
  onAdmin,
}) {
  return (
    <header className="main-header">

      <div className="header-left">

        <button
          className="menu-button"
          onClick={onMenu}
        >
          ☰
          <span>
            MENU
          </span>
        </button>

        <button
          className="main-logo"
          onClick={onHome}
        >
          <span className="logo-box">
            M
          </span>

          <span className="logo-text">
            MAKEUP{" "}
            <b>
              PLAZA
            </b>
          </span>
        </button>

      </div>

      <div className="search-area">

        <input
          value={
            searchText
          }
          onChange={(e) =>
            setSearchText(
              e.target.value
            )
          }
          onKeyDown={(e) => {
            if (
              e.key ===
              "Enter"
            ) {
              onShopSearch();
            }
          }}
          placeholder="Search Makeup Plaza..."
        />

        <button
          onClick={
            onShopSearch
          }
        >
          ⌕
        </button>

      </div>

      <div className="header-actions">

        <button
          className="header-text-button"
          onClick={
            onAccount
          }
        >
          <span>
            ♙
          </span>

          <small>
            {currentUser
              ? `Hello, ${(
                  currentUser.name ||
                  "Customer"
                ).split(" ")[0]}`
              : "Sign in"}
          </small>
        </button>

        <button
          className="header-text-button"
          onClick={
            onOrders
          }
        >
          <span>
            ◇
          </span>

          <small>
            My Orders
          </small>
        </button>

        <button
          className="header-icon-button"
          onClick={
            onFavorites
          }
        >
          ♡

          {favoriteCount >
            0 && (
            <b>
              {
                favoriteCount
              }
            </b>
          )}
        </button>

        <button
          className="header-icon-button"
          onClick={
            onCart
          }
        >
          🛍

          {cartCount >
            0 && (
            <b>
              {
                cartCount
              }
            </b>
          )}
        </button>

        {adminSession && (
  <button
    className="owner-header-button"
    onClick={onAdmin}
  >
    OWNER
  </button>
)}

      </div>

    </header>
  );
}

/* =========================================================
   TOP NAVIGATION
========================================================= */

function TopNavigation({
  categories,
  activePage,
  activeCategory,
  activeCollection,
  onHome,
  onAll,
  onBest,
  onTrending,
  onDeals,
  onNew,
  onCategory,
}) {
  const safeCategories =
    normalizeCategories(
      categories
    );

  return (
    <nav className="top-navigation">

      <NavButton
        active={
          activePage ===
          "home"
        }
        onClick={
          onHome
        }
      >
        ⌂ HOME
      </NavButton>

      <NavButton
        active={
          activePage ===
            "shop" &&
          activeCategory ===
            "All" &&
          activeCollection ===
            "All"
        }
        onClick={
          onAll
        }
      >
        SHOP ALL
      </NavButton>

      <NavButton
        active={
          activeCollection ===
          "bestSeller"
        }
        onClick={
          onBest
        }
      >
        🔥 TODAY'S BEST SELLERS
      </NavButton>

      <NavButton
        active={
          activeCollection ===
          "trending"
        }
        onClick={
          onTrending
        }
      >
        ✦ TRENDING SELLERS
      </NavButton>

      <NavButton
        active={
          activeCollection ===
          "todaySale"
        }
        onClick={
          onDeals
        }
      >
        ⚡ TODAY'S DEALS
      </NavButton>

      <NavButton
        active={
          activeCollection ===
          "newArrival"
        }
        onClick={
          onNew
        }
      >
        ✨ NEW ARRIVALS
      </NavButton>

      {safeCategories.map(
        (category) => (
          <NavButton
            key={
              category.id
            }
            active={
              activePage ===
                "shop" &&
              activeCategory ===
                category.name
            }
            onClick={() =>
              onCategory(
                category.name
              )
            }
          >
            {
              category.name
            }
          </NavButton>
        )
      )}

    </nav>
  );
}

function NavButton({
  active,
  children,
  onClick,
}) {
  return (
    <button
      className={
        active
          ? "active"
          : ""
      }
      onClick={
        onClick
      }
    >
      {
        children
      }
    </button>
  );
}

/* =========================================================
   HOME PAGE
========================================================= */

function HomePage({
  products,
  categories,
  banners,
  hero,
  favorites,
  onFavorite,
  onAdd,
  onBuy,
  onShop,
}) {
  const safeCategories =
    normalizeCategories(
      categories
    );

  const groupedCategories =
    safeCategories.filter(
      (category) =>
        products.some(
          (product) =>
            product.category ===
            category.name
        )
    );

  const bestSellers =
    products.filter(
      (product) =>
        product.bestSeller ===
        true
    );

  const trending =
    products.filter(
      (product) =>
        product.trending ===
        true
    );

  const todaySale =
    products.filter(
      (product) =>
        product.todaySale ===
        true
    );

  const newArrivals =
    products.filter(
      (product) =>
        product.newArrival ===
        true
    );

  return (
    <main>

      {/* HERO */}

      <section className="hero-section">
        <div className="hero-particles" aria-hidden="true">
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
</div>

        <div className="hero-content">

          <span className="eyebrow">
            MAKEUP PLAZA • PREMIUM BEAUTY
          </span>

          <h1>
            Beauty that feels
            <br />
            <em>
              luxurious.
            </em>
          </h1>

          <p>
            Discover trending makeup,
            today's best sellers and
            premium beauty essentials
            selected specially for you.
          </p>

          <div className="hero-buttons">

            <button
              className="gold-button"
              onClick={() =>
                onShop(
                  "All",
                  "All"
                )
              }
            >
              SHOP COLLECTION →
            </button>

            <button
              className="outline-button"
              onClick={() =>
                onShop(
                  "All",
                  "trending"
                )
              }
            >
              TRENDING NOW →
            </button>

          </div>

          <div className="hero-benefits">

            <span>
              ✓ Premium products
            </span>

            <span>
              ✓ COD available
            </span>

            <span>
              ✓ Demo checkout
            </span>

          </div>

        </div>

        <div className="hero-visual">

          <div className="hero-circle circle-one" />

          <div className="hero-circle circle-two" />

          <div className="hero-product-showcase">

  <span>
    {hero?.label || "✦ TRENDING NOW"}
  </span>

  <h3>
    {hero?.title || "Glow Edit"}
  </h3>

  <p>
    {hero?.description || "Premium beauty collection"}
  </p>

  <img
    src={
      hero?.image ||
      demoImages.foundation
    }
    alt={
      hero?.title ||
      "Beauty"
    }
  />

</div>

<div className="hero-price-card">

  <small>
    UP TO
  </small>

  <b>
    {hero?.discount || "40% OFF"}
  </b>

</div>
          <div className="hero-price-card">

            <small>
              UP TO
            </small>

            <b>
              40% OFF
            </b>

          </div>

        </div>

      </section>

      {/* SERVICE STRIP */}

      <section className="service-marquee">

  <div className="service-marquee-track">

    <div className="service-marquee-item">
      🚚 FREE DELIVERY ON ORDERS ₹999+
    </div>

    <div className="marquee-separator">✦</div>

    <div className="service-marquee-item">
      🔒 SECURE CHECKOUT
    </div>

    <div className="marquee-separator">✦</div>

    <div className="service-marquee-item">
      💄 PREMIUM BEAUTY COLLECTION
    </div>

    <div className="marquee-separator">✦</div>

    <div className="service-marquee-item">
      ✨ NEW ARRIVALS EVERY WEEK
    </div>

    <div className="marquee-separator">✦</div>

    <div className="service-marquee-item">
      💳 CASH ON DELIVERY AVAILABLE
    </div>

    <div className="marquee-separator">✦</div>

    <div className="service-marquee-item">
      ♡ EASY SUPPORT
    </div>

    <div className="marquee-separator">✦</div>

    <div className="service-marquee-item">
      ✦ LUXURY BEAUTY PICKS
    </div>

    {/* DUPLICATE FOR SEAMLESS LOOP */}

    <div className="service-marquee-item">
      🚚 FREE DELIVERY ON ORDERS ₹999+
    </div>

    <div className="marquee-separator">✦</div>

    <div className="service-marquee-item">
      🔒 SECURE CHECKOUT
    </div>

    <div className="marquee-separator">✦</div>

    <div className="service-marquee-item">
      💄 PREMIUM BEAUTY COLLECTION
    </div>

    <div className="marquee-separator">✦</div>

    <div className="service-marquee-item">
      ✨ NEW ARRIVALS EVERY WEEK
    </div>

    <div className="marquee-separator">✦</div>

    <div className="service-marquee-item">
      💳 CASH ON DELIVERY AVAILABLE
    </div>

    <div className="marquee-separator">✦</div>

    <div className="service-marquee-item">
      ♡ EASY SUPPORT
    </div>

    <div className="marquee-separator">✦</div>

    <div className="service-marquee-item">
      ✦ LUXURY BEAUTY PICKS
    </div>

  </div>

</section>

      {/* CATEGORIES */}

      <SectionTitle
        label="SHOP BY BEAUTY"
        title="Trending Categories"
        onViewAll={() =>
          onShop(
            "All",
            "All"
          )
        }
      />

      <section className="category-grid home-category-grid">

        {groupedCategories.length >
        0 ? (
          groupedCategories.map(
            (category) => (
              <button
                key={
                  category.id
                }
                className="category-card"
                onClick={() =>
                  onShop(
                    category.name,
                    "All"
                  )
                }
              >

                <div className="category-image">

                  <img
                    src={
                      category.image ||
                      demoImages.lipstick
                    }
                    alt={
                      category.name
                    }
                  />

                  <div className="category-overlay" />

                </div>

                <div className="category-info">

                  <span>
                    EXPLORE
                  </span>

                  <h3>
                    {
                      category.name
                    }
                  </h3>

                  <p>
                    {
                      category.description ||
                      "Premium beauty collection"
                    }
                  </p>

                  <b>
                    VIEW COLLECTION →
                  </b>

                </div>

              </button>
            )
          )
        ) : (
          <div className="large-empty">

            <div>
              ✦
            </div>

            <h2>
              No categories yet
            </h2>

            <p>
              Categories added by the
              owner will appear here.
            </p>

          </div>
        )}

      </section>

      {/* ALL PRODUCTS */}

      <ProductShowcase
        label="ALL PRODUCTS"
        title="Shop All Beauty"
        products={
          products
        }
        favorites={
          favorites
        }
        onFavorite={
          onFavorite
        }
        onAdd={
          onAdd
        }
        onBuy={
          onBuy
        }
        onViewAll={() =>
          onShop(
            "All",
            "All"
          )
        }
      />

      {/* CATEGORY WISE PRODUCTS */}

      {groupedCategories.map(
        (category) => (
          <ProductShowcase
            key={
              category.id
            }
            label={
              category.name.toUpperCase()
            }
            title={`${category.name} Collection`}
            products={products.filter(
              (product) =>
                product.category ===
                category.name
            )}
            favorites={
              favorites
            }
            onFavorite={
              onFavorite
            }
            onAdd={
              onAdd
            }
            onBuy={
              onBuy
            }
            onViewAll={() =>
              onShop(
                category.name,
                "All"
              )
            }
          />
        )
      )}

      {/* TODAY'S DEALS */}

      <ProductShowcase
        label="TODAY'S DEALS"
        title="Hot Deals Today"
        products={
          todaySale
        }
        favorites={
          favorites
        }
        onFavorite={
          onFavorite
        }
        onAdd={
          onAdd
        }
        onBuy={
          onBuy
        }
        onViewAll={() =>
          onShop(
            "All",
            "todaySale"
          )
        }
      />

      {/* BEST SELLERS */}

      <ProductShowcase
        label="BEST SELLERS"
        title="Today's Best Sellers"
        products={
          bestSellers
        }
        favorites={
          favorites
        }
        onFavorite={
          onFavorite
        }
        onAdd={
          onAdd
        }
        onBuy={
          onBuy
        }
        onViewAll={() =>
          onShop(
            "All",
            "bestSeller"
          )
        }
      />

      {/* TRENDING */}

      <ProductShowcase
        label="TRENDING NOW"
        title="Trending Sellers"
        products={
          trending
        }
        favorites={
          favorites
        }
        onFavorite={
          onFavorite
        }
        onAdd={
          onAdd
        }
        onBuy={
          onBuy
        }
        onViewAll={() =>
          onShop(
            "All",
            "trending"
          )
        }
      />

      {/* BANNERS */}

      {banners.length >
        0 && (
        <section className="home-banners">

          {banners.map(
            (banner) => (
              <div
                className="luxury-banner image-banner"
                key={
                  banner.id
                }
              >

                <img
                  src={
                    banner.image
                  }
                  alt={
                    banner.title
                  }
                />

                <div className="banner-overlay" />

                <div className="banner-copy">

                  <span>
                    MAKEUP PLAZA EXCLUSIVE
                  </span>

                  <h2>
                    {
                      banner.title
                    }
                  </h2>

                  <p>
                    {
                      banner.subtitle
                    }
                  </p>

                  <button
                    className="gold-button"
                    onClick={() =>
                      onShop(
                        "All",
                        "All"
                      )
                    }
                  >
                    {
                      banner.buttonText ||
                      "SHOP NOW"
                    }{" "}
                    →
                  </button>

                </div>

              </div>
            )
          )}

        </section>
      )}

      {/* NEW ARRIVALS */}

      <ProductShowcase
        label="JUST IN"
        title="New Arrivals"
        products={
          newArrivals
        }
        favorites={
          favorites
        }
        onFavorite={
          onFavorite
        }
        onAdd={
          onAdd
        }
        onBuy={
          onBuy
        }
        onViewAll={() =>
          onShop(
            "All",
            "newArrival"
          )
        }
      />

    </main>
  );
}

/* =========================================================
   SECTION TITLE
========================================================= */

function SectionTitle({
  label,
  title,
  onViewAll,
}) {
  return (
    <div className="section-title">

      <div>

        <span>
          {
            label
          }
        </span>

        <h2>
          {
            title
          }
        </h2>

      </div>

      <button
        onClick={
          onViewAll
        }
      >
        VIEW ALL →
      </button>

    </div>
  );
}

/* =========================================================
   PRODUCT SHOWCASE
========================================================= */

function ProductShowcase({
  label,
  title,
  products,
  favorites,
  onFavorite,
  onAdd,
  onBuy,
  onViewAll,
}) {
  return (
    <section className="showcase-section">

      <SectionTitle
        label={
          label
        }
        title={
          title
        }
        onViewAll={
          onViewAll
        }
      />

      {products.length >
      0 ? (
        <div className="product-grid">

          {products.map(
            (product) => (
              <ProductCard
                key={
                  product.id
                }
                product={
                  product
                }
                liked={
                  favorites.includes(
                    product.id
                  )
                }
                onFavorite={
                  onFavorite
                }
                onAdd={
                  onAdd
                }
                onBuy={
                  onBuy
                }
              />
            )
          )}

        </div>
      ) : (
        <div className="small-empty">
          No products added to this collection yet.
        </div>
      )}

    </section>
  );
}

/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({
  product,
  liked,
  onFavorite,
  onAdd,
  onBuy,
}) {
  const discount =
    product.oldPrice >
    product.price
      ? Math.round(
          ((product.oldPrice -
            product.price) /
            product.oldPrice) *
            100
        )
      : 0;

  return (
    <article className="product-card">

      <div className="product-image">

        {product.badge && (
          <span className="product-badge">
            {
              product.badge
            }
          </span>
        )}

        {discount >
          0 && (
          <span className="discount-badge">
            -{discount}%
          </span>
        )}

        <button
          className={`product-heart ${
            liked
              ? "liked"
              : ""
          }`}
          onClick={() =>
            onFavorite(
              product.id
            )
          }
        >
          {liked
            ? "♥"
            : "♡"}
        </button>

        <img
          src={
            product.image ||
            demoImages.lipstick
          }
          alt={
            product.name
          }
        />

        <div className="product-hover">

          <button
            onClick={() =>
              onBuy(product)
            }
          >
            BUY NOW
          </button>

          <button
            onClick={() =>
              onAdd(product)
            }
          >
            ADD TO BAG
          </button>

        </div>

      </div>

      <div className="product-info">

        <span className="product-category">
          {
            product.category ||
            "Beauty"
          }
        </span>

        <h3>
          {
            product.name
          }
        </h3>

        <div className="product-rating">

          <b>
            ★★★★★
          </b>

          <span>
            {
              product.rating ||
              4.8
            }{" "}
            (
            {
              product.reviews ||
              0
            }
            )
          </span>

        </div>

        <div className="product-price">

          <strong>
            {
              money(
                product.price
              )
            }
          </strong>

          {product.oldPrice >
            product.price && (
            <del>
              {
                money(
                  product.oldPrice
                )
              }
            </del>
          )}

          {discount >
            0 && (
            <span>
              {
                discount
              }
              % OFF
            </span>
          )}

        </div>

        <div className="product-buttons">

          <button
            onClick={() =>
              onAdd(product)
            }
          >
            ADD TO BAG →
          </button>

          <button
            className={
              liked
                ? "favorite-active"
                : ""
            }
            onClick={() =>
              onFavorite(
                product.id
              )
            }
          >
            {liked
              ? "♥"
              : "♡"}
          </button>

        </div>

      </div>

    </article>
  );
}

/* =========================================================
   SHOP PAGE
========================================================= */

function ShopPage({
  products,
  categories,
  selectedCategory,
  selectedCollection,
  searchText,
  onCategory,
  onCollection,
  onClear,
  favorites,
  onFavorite,
  onAdd,
  onBuy,
}) {
  let heading =
    "Shop Beauty";

  if (
    selectedCollection ===
    "bestSeller"
  ) {
    heading =
      "Best Sellers";
  } else if (
    selectedCollection ===
    "trending"
  ) {
    heading =
      "Trending Sellers";
  } else if (
    selectedCollection ===
    "todaySale"
  ) {
    heading =
      "Today's Deals";
  } else if (
    selectedCollection ===
    "newArrival"
  ) {
    heading =
      "New Arrivals";
  } else if (
    selectedCategory !==
    "All"
  ) {
    heading =
      selectedCategory;
  }

  const safeCategories =
    normalizeCategories(
      categories
    );

  return (
    <main className="inner-page">

      <section className="page-heading">

        <span>
          MAKEUP PLAZA COLLECTION
        </span>

        <h1>
          <em>
            {
              heading
            }
          </em>
        </h1>

        <p>
          {searchText
            ? `Search results for "${searchText}"`
            : "Explore premium beauty products in one place."}
        </p>

      </section>

      <div className="shop-filter-area">

        <div className="shop-filter-row">

          <button
            className={
              !searchText &&
              selectedCategory ===
                "All" &&
              selectedCollection ===
                "All"
                ? "active"
                : ""
            }
            onClick={
              onClear
            }
          >
            ALL PRODUCTS
          </button>

          {safeCategories.map(
            (category) => (
              <button
                key={
                  category.id
                }
                className={
                  selectedCategory ===
                  category.name
                    ? "active"
                    : ""
                }
                onClick={() =>
                  onCategory(
                    category.name
                  )
                }
              >
                {
                  category.name
                }
              </button>
            )
          )}

          <button
            className={
              selectedCollection ===
              "todaySale"
                ? "active"
                : ""
            }
            onClick={() =>
              onCollection(
                "todaySale"
              )
            }
          >
            TODAY'S DEALS
          </button>

          <button
            className={
              selectedCollection ===
              "bestSeller"
                ? "active"
                : ""
            }
            onClick={() =>
              onCollection(
                "bestSeller"
              )
            }
          >
            BEST SELLERS
          </button>

          <button
            className={
              selectedCollection ===
              "trending"
                ? "active"
                : ""
            }
            onClick={() =>
              onCollection(
                "trending"
              )
            }
          >
            TRENDING
          </button>

          <button
            className={
              selectedCollection ===
              "newArrival"
                ? "active"
                : ""
            }
            onClick={() =>
              onCollection(
                "newArrival"
              )
            }
          >
            NEW ARRIVALS
          </button>

        </div>

      </div>

      {products.length >
      0 ? (
        <div className="product-grid shop-products">

          {products.map(
            (product) => (
              <ProductCard
                key={
                  product.id
                }
                product={
                  product
                }
                liked={
                  favorites.includes(
                    product.id
                  )
                }
                onFavorite={
                  onFavorite
                }
                onAdd={
                  onAdd
                }
                onBuy={
                  onBuy
                }
              />
            )
          )}

        </div>
      ) : (
        <div className="large-empty">

          <div>
            ✦
          </div>

          <h2>
            No products found
          </h2>

          <p>
            Try another category,
            collection or search term.
          </p>

          <button
            className="gold-button"
            onClick={
              onClear
            }
          >
            VIEW ALL PRODUCTS →
          </button>

        </div>
      )}

    </main>
  );
}

/* =========================================================
   FAVORITES PAGE
========================================================= */

function FavoritesPage({
  products,
  favorites,
  onFavorite,
  onAdd,
  onBuy,
  onShop,
}) {
  return (
    <main className="inner-page">

      <section className="page-heading">

        <span>
          YOUR SAVED COLLECTION
        </span>

        <h1>
          My{" "}
          <em>
            Favourites
          </em>
        </h1>

        <p>
          Save your favourite
          products and purchase
          them anytime.
        </p>

      </section>

      {products.length >
      0 ? (
        <div className="product-grid shop-products">

          {products.map(
            (product) => (
              <ProductCard
                key={
                  product.id
                }
                product={
                  product
                }
                liked={
                  favorites.includes(
                    product.id
                  )
                }
                onFavorite={
                  onFavorite
                }
                onAdd={
                  onAdd
                }
                onBuy={
                  onBuy
                }
              />
            )
          )}

        </div>
      ) : (
        <div className="large-empty">

          <div>
            ♡
          </div>

          <h2>
            No favourites yet
          </h2>

          <p>
            Tap the heart icon on
            any product to save it here.
          </p>

          <button
            className="gold-button"
            onClick={
              onShop
            }
          >
            EXPLORE PRODUCTS →
          </button>

        </div>
      )}

    </main>
  );
}

/* =========================================================
   ORDERS PAGE
========================================================= */

function OrdersPage({
  orders,
  onCancel,
  onShop,
}) {
  return (
    <main className="inner-page">

      <section className="page-heading">

        <span>
          ACCOUNT • PURCHASE HISTORY
        </span>

        <h1>
          My{" "}
          <em>
            Orders
          </em>
        </h1>

        <p>
          Every purchase stays here
          with its current status and
          delivery information.
        </p>

      </section>

      {orders.length >
      0 ? (
        <div className="customer-orders-list">

          {orders.map(
            (order) => (
              <CustomerOrderCard
                key={
                  order.id
                }
                order={
                  order
                }
                onCancel={
                  onCancel
                }
              />
            )
          )}

        </div>
      ) : (
        <div className="large-empty">

          <div>
            ◈
          </div>

          <h2>
            No orders yet
          </h2>

          <p>
            Your complete purchase
            history will appear here
            after your first order.
          </p>

          <button
            className="gold-button"
            onClick={
              onShop
            }
          >
            START SHOPPING →
          </button>

        </div>
      )}

    </main>
  );
}

/* =========================================================
   CUSTOMER ORDER
========================================================= */

function CustomerOrderCard({
  order,
  onCancel,
}) {
  const canCancel =
    [
      "Pending",
      "Confirmed",
      "Packed",
      "Shipped",
      "Out for Delivery",
    ].includes(
      order.status
    ) &&
    !order.cancellationRequested;

  return (
    <article className="customer-order-card">

      <div className="customer-order-top">

        <div>

          <span>
            ORDER NUMBER
          </span>

          <h3>
            {
              order.id
            }
          </h3>

          <small>
            Ordered on{" "}
            {formatDate(
              order.createdAt
            )}
          </small>

        </div>

        <span
          className={`status-pill status-${String(
            order.status || ""
          )
            .toLowerCase()
            .replace(
              /\s+/g,
              "-"
            )}`}
        >
          {
            order.status
          }
        </span>

      </div>

      <div className="order-status-box">

        <span>
          CURRENT STATUS
        </span>

        <strong>
          {
            order.status
          }
        </strong>

        <p>
          {orderStatusText(
            order.status,
            order.expectedDelivery
          )}
        </p>

        {order.expectedDelivery &&
          ![
            "Cancelled",
            "Rejected",
          ].includes(
            order.status
          ) && (
            <div className="expected-date">

              <span>
                EXPECTED DELIVERY
              </span>

              <b>
                {formatDeliveryDate(
                  order.expectedDelivery
                )}
              </b>

            </div>
          )}

      </div>

      {order.cancellationRequested &&
        order.status !==
          "Cancelled" && (
          <div className="cancel-request-box">

            <strong>
              Cancellation request sent
              to owner.
            </strong>

            <small>
              Reason:{" "}
              {
                order.cancellationReason
              }
            </small>

          </div>
        )}

      {order.status ===
        "Cancelled" && (
        <div className="cancelled-box">

          <strong>
            ✕ ORDER CANCELLED
          </strong>

          <span>
            This order remains in
            your purchase history.
          </span>

          {order.cancelledAt && (
            <small>
              Cancelled on{" "}
              {formatDate(
                order.cancelledAt
              )}
            </small>
          )}

        </div>
      )}

      {order.status ===
        "Rejected" && (
        <div className="cancelled-box">

          <strong>
            ORDER REJECTED
          </strong>

          <span>
            This order was rejected
            by the owner.
          </span>

        </div>
      )}

      <div className="customer-order-items">

        {order.items.map(
          (item) => (
            <div
              key={`${order.id}-${item.id}`}
              className="customer-order-item"
            >

              <div className="order-product-image">

                <img
                  src={
                    item.image ||
                    demoImages.lipstick
                  }
                  alt={
                    item.name
                  }
                />

              </div>

              <div>

                <span>
                  {
                    item.category ||
                    "Beauty"
                  }
                </span>

                <strong>
                  {
                    item.name
                  }
                </strong>

                <small>
                  Qty:{" "}
                  {
                    item.quantity
                  }
                </small>

              </div>

              <b>
                {money(
                  Number(
                    item.price ||
                      0
                  ) *
                    item.quantity
                )}
              </b>

            </div>
          )
        )}

      </div>

      <div className="order-bottom">

        <div>

          <span>
            PAYMENT
          </span>

          <b>
            {
              order.payment
            }
          </b>

        </div>

        <div>

          <span>
            TOTAL
          </span>

          <b>
            {money(
              order.total
            )}
          </b>

        </div>

        {canCancel && (
          <button
            className="danger-button"
            onClick={() =>
              onCancel(
                order
              )
            }
          >
            REQUEST CANCELLATION
          </button>
        )}

      </div>

    </article>
  );
}

/* =========================================================
   MENU DRAWER
========================================================= */

function MenuDrawer({
  currentUser,
  categories,
  favoriteCount,
  orderCount,
  onClose,
  onHome,
  onShop,
  onFavorites,
  onOrders,
  onProfile,
  onCategory,
  onBest,
  onTrending,
  onDeals,
  onNew,
  onLogin,
  onLogout,
}) {
  const [showAllCategories, setShowAllCategories] =
    useState(false);

  const safeCategories =
    normalizeCategories(
      categories
    );

  return (
    <>
      <div
        className="drawer-overlay"
        onClick={
          onClose
        }
      />

      <aside className="menu-drawer">

        {/* HEADER */}

        <div className="drawer-head">

  <div>
    <span>MAKEUP PLAZA</span>

    <strong>
      BEAUTY MENU
    </strong>
  </div>

  <button
    type="button"
    className="drawer-close"
    onClick={(event) => {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }}
    aria-label="Close menu"
  >
    ×
  </button>

</div>
        {/* ACCOUNT */}

        <div className="drawer-account">

          {currentUser ? (
            <>
              <small>
                Hello,{" "}
                {
                  currentUser.name
                }
              </small>

              <strong>
                Welcome back
              </strong>
            </>
          ) : (
            <>
              <small>
                Welcome to Makeup Plaza
              </small>

              <button
                onClick={
                  onLogin
                }
              >
                SIGN IN / CREATE ACCOUNT
              </button>
            </>
          )}

        </div>

        {/* SHOP */}

        <div className="drawer-section">

          <h4>
            SHOP
          </h4>

          <DrawerButton
            label="⌂ HOME"
            onClick={
              onHome
            }
          />

          <DrawerButton
            label="SHOP ALL PRODUCTS"
            onClick={
              onShop
            }
          />

          <DrawerButton
            label="🔥 TODAY'S BEST SELLERS"
            onClick={
              onBest
            }
          />

          <DrawerButton
            label="✦ TRENDING SELLERS"
            onClick={
              onTrending
            }
          />

          <DrawerButton
            label="⚡ TODAY'S DEALS"
            onClick={
              onDeals
            }
          />

          <DrawerButton
            label="✨ NEW ARRIVALS"
            onClick={
              onNew
            }
          />

        </div>

        {/* SHOP BY CATEGORY */}

        <div className="drawer-section category-menu-section">

          <h4>
            SHOP BY CATEGORY
          </h4>

          <button
            className={`all-category-toggle ${
              showAllCategories
                ? "open"
                : ""
            }`}
            onClick={() =>
              setShowAllCategories(
                (
                  current
                ) =>
                  !current
              )
            }
          >

            <span>
              ✦ ALL CATEGORIES
            </span>

            <b>
              {showAllCategories
                ? "⌃"
                : "⌄"}
            </b>

          </button>

          {showAllCategories && (
            <div className="category-dropdown">

              <button
                className="category-dropdown-item all-products-item"
                onClick={() => {
                  setShowAllCategories(
                    false
                  );

                  onShop();
                }}
              >

                <span>
                  ALL PRODUCTS
                </span>

                <b>
                  →
                </b>

              </button>

              {safeCategories.length >
              0 ? (
                safeCategories.map(
                  (category) => (
                    <button
                      key={
                        category.id
                      }
                      className="category-dropdown-item"
                      onClick={() => {
                        setShowAllCategories(
                          false
                        );

                        onCategory(
                          category.name
                        );
                      }}
                    >

                      <span>

                        {category.image ? (
                          <img
                            src={
                              category.image
                            }
                            alt=""
                          />
                        ) : (
                          <i>
                            ✦
                          </i>
                        )}

                        {
                          category.name
                        }

                      </span>

                      <b>
                        →
                      </b>

                    </button>
                  )
                )
              ) : (
                <div className="category-empty">

                  <span>
                    No categories added yet.
                  </span>

                  <small>
                    Categories added by
                    the owner will appear
                    here.
                  </small>

                </div>
              )}

            </div>
          )}

        </div>

        {/* YOUR ACCOUNT */}

        <div className="drawer-section">

          <h4>
            YOUR ACCOUNT
          </h4>

          <DrawerButton
            label={`♡ My Favourites (${favoriteCount})`}
            onClick={
              onFavorites
            }
          />

          <DrawerButton
            label={`📦 My Orders (${orderCount})`}
            onClick={
              onOrders
            }
          />

          <DrawerButton
            label="👤 My Profile"
            onClick={
              onProfile
            }
          />

          <DrawerButton
            label="↪ LOGOUT"
            onClick={
              onLogout
            }
          />

        </div>

      </aside>
    </>
  );
}

function DrawerButton({
  label,
  onClick,
}) {
  return (
    <button
      className="drawer-option"
      onClick={
        onClick
      }
    >
      <span>
        {
          label
        }
      </span>

      <b>
        →
      </b>
    </button>
  );
}

/* =========================================================
   CART DRAWER
========================================================= */

function CartDrawer({
  cart,
  subtotal,
  shipping,
  total,
  onClose,
  onIncrease,
  onDecrease,
  onRemove,
  onCheckout,
}) {
  return (
    <>
      <div
        className="drawer-overlay"
        onClick={
          onClose
        }
      />

      <aside className="cart-drawer">

        <div className="cart-head">

          <div>

            <span>
              YOUR BAG
            </span>

            <h2>
              Shopping Cart
            </h2>

          </div>

          <button
            className="drawer-close"
            onClick={
              onClose
            }
          >
            ×
          </button>

        </div>

        {!cart.length ? (
          <div className="empty-cart">

            <div>
              ♡
            </div>

            <h3>
              Your bag is empty
            </h3>

            <p>
              Add products and
              they will appear here.
            </p>

          </div>
        ) : (
          <>
            <div className="cart-items">

              {cart.map(
                (item) => (
                  <div
                    className="cart-item"
                    key={
                      item.id
                    }
                  >

                    <div className="cart-image">

                      <img
                        src={
                          item.image ||
                          demoImages.lipstick
                        }
                        alt={
                          item.name
                        }
                      />

                    </div>

                    <div className="cart-item-info">

                      <span>
                        {
                          item.category ||
                          "Beauty"
                        }
                      </span>

                      <h3>
                        {
                          item.name
                        }
                      </h3>

                      <strong>
                        {money(
                          item.price
                        )}
                      </strong>

                      <div className="quantity">

                        <button
                          onClick={() =>
                            onDecrease(
                              item.id
                            )
                          }
                        >
                          −
                        </button>

                        <b>
                          {
                            item.quantity
                          }
                        </b>

                        <button
                          onClick={() =>
                            onIncrease(
                              item.id
                            )
                          }
                        >
                          +
                        </button>

                      </div>

                    </div>

                    <button
                      className="remove-cart-item"
                      onClick={() =>
                        onRemove(
                          item.id
                        )
                      }
                    >
                      ×
                    </button>

                  </div>
                )
              )}

            </div>

            <div className="cart-summary">

              <div>

                <span>
                  Subtotal
                </span>

                <b>
                  {money(
                    subtotal
                  )}
                </b>

              </div>

              <div>

                <span>
                  Shipping
                </span>

                <b>
                  {shipping
                    ? money(
                        shipping
                      )
                    : "FREE"}
                </b>

              </div>

              <div className="cart-total">

                <span>
                  Total
                </span>

                <b>
                  {money(
                    total
                  )}
                </b>

              </div>

              <button
                className="gold-button full-button"
                onClick={
                  onCheckout
                }
              >
                PROCEED TO CHECKOUT →
              </button>

            </div>
          </>
        )}

      </aside>
    </>
  );
}

/* =========================================================
   CHECKOUT
========================================================= */

function CheckoutModal({
  user,
  cart,
  subtotal,
  shipping,
  total,
  onClose,
  onLoginRequired,
  onPlaceOrder,
}) {
  const [form, setForm] =
    useState({
      name:
        user?.name || "",

      phone:
        user?.phone || "",

      email:
        user?.email || "",

      address:
        user?.address || "",

      city:
        user?.city || "",

      state:
        user?.state || "",

      pincode:
        user?.pincode || "",

      payment:
        "Cash on Delivery",
    });

  const change = (
    event
  ) => {
    setForm(
      (current) => ({
        ...current,

        [event.target.name]:
          event.target.value,
      })
    );
  };

  return (
    <div className="modal-background checkout-backdrop">

      <div className="checkout-modal-pro">

        <div className="checkout-top">

          <div>

            <span className="eyebrow">
              SECURE CHECKOUT
            </span>

            <h2>
              Complete Your{" "}
              <em>
                Order
              </em>
            </h2>

          </div>

          <button
            className="modal-close"
            onClick={
              onClose
            }
          >
            ×
          </button>

        </div>

        {!user ? (
          <div className="login-needed">

            <h3>
              Login required
            </h3>

            <p>
              Sign in before placing
              your order.
            </p>

            <button
              className="gold-button"
              onClick={
                onLoginRequired
              }
            >
              LOGIN / CREATE ACCOUNT →
            </button>

          </div>
        ) : (
          <div className="checkout-layout-pro">

            <div className="checkout-main">

              <section className="checkout-card">

                <div className="checkout-card-title">

                  <span>
                    01
                  </span>

                  <div>

                    <small>
                      DELIVERY INFORMATION
                    </small>

                    <h3>
                      Where should we deliver?
                    </h3>

                  </div>

                </div>

                <div className="checkout-fields-pro">

                  <label>
                    FULL NAME

                    <input
                      name="name"
                      value={
                        form.name
                      }
                      onChange={
                        change
                      }
                      placeholder="Full name"
                    />
                  </label>

                  <label>
                    MOBILE NUMBER

                    <input
                      name="phone"
                      value={
                        form.phone
                      }
                      onChange={
                        change
                      }
                      placeholder="10 digit mobile"
                    />
                  </label>

                  <label>
                    EMAIL ADDRESS

                    <input
                      name="email"
                      type="email"
                      value={
                        form.email
                      }
                      onChange={
                        change
                      }
                      placeholder="you@email.com"
                    />
                  </label>

                  <label className="full-field">
                    FULL ADDRESS

                    <textarea
                      name="address"
                      value={
                        form.address
                      }
                      onChange={
                        change
                      }
                      rows="3"
                      placeholder="House no., street, area"
                    />
                  </label>

                  <label>
                    CITY

                    <input
                      name="city"
                      value={
                        form.city
                      }
                      onChange={
                        change
                      }
                      placeholder="City"
                    />
                  </label>

                  <label>
                    STATE

                    <input
                      name="state"
                      value={
                        form.state
                      }
                      onChange={
                        change
                      }
                      placeholder="State"
                    />
                  </label>

                  <label>
                    PINCODE

                    <input
                      name="pincode"
                      value={
                        form.pincode
                      }
                      onChange={
                        change
                      }
                      placeholder="6 digit pincode"
                    />
                  </label>

                </div>

              </section>

              <section className="checkout-card">

                <div className="checkout-card-title">

                  <span>
                    02
                  </span>

                  <div>

                    <small>
                      PAYMENT METHOD
                    </small>

                    <h3>
                      Choose how you pay
                    </h3>

                  </div>

                </div>

                <div className="payment-options-pro">

                  {[
                    "Cash on Delivery",
                    "UPI",
                    "Debit / Credit Card",
                  ].map(
                    (method) => (
                      <button
                        key={
                          method
                        }
                        type="button"
                        className={
                          form.payment ===
                          method
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          setForm(
                            (
                              current
                            ) => ({
                              ...current,
                              payment:
                                method,
                            })
                          )
                        }
                      >

                        <b>
                          ◉
                        </b>

                        <span>
                          {
                            method
                          }
                        </span>

                      </button>
                    )
                  )}

                </div>

                <p className="demo-payment-note">
                  Demo version: UPI and
                  Card are visual options
                  only. No real payment is
                  processed.
                </p>

              </section>

              <button
                className="place-order-button-pro"
                onClick={() =>
                  onPlaceOrder(
                    form
                  )
                }
              >
                PLACE ORDER

                <span>
                  {
                    money(
                      total
                    )
                  }
                </span>

              </button>

            </div>

            <aside className="checkout-summary-pro">

              <span className="summary-kicker">
                YOUR ORDER
              </span>

              <h3>
                Order Summary
              </h3>

              <div className="checkout-items">

                {cart.map(
                  (item) => (
                    <div
                      className="checkout-item"
                      key={
                        item.id
                      }
                    >

                      <div className="checkout-thumb">

                        <img
                          src={
                            item.image ||
                            demoImages.lipstick
                          }
                          alt={
                            item.name
                          }
                        />

                      </div>

                      <div>

                        <strong>
                          {
                            item.name
                          }
                        </strong>

                        <small>
                          Qty:{" "}
                          {
                            item.quantity
                          }
                        </small>

                      </div>

                      <b>
                        {money(
                          Number(
                            item.price ||
                              0
                          ) *
                            item.quantity
                        )}
                      </b>

                    </div>
                  )
                )}

              </div>

              <hr />

              <div className="summary-total-row">

                <span>
                  Subtotal
                </span>

                <b>
                  {money(
                    subtotal
                  )}
                </b>

              </div>

              <div className="summary-total-row">

                <span>
                  Shipping
                </span>

                <b>
                  {shipping
                    ? money(
                        shipping
                      )
                    : "FREE"}
                </b>

              </div>

              <div className="summary-grand-row">

                <span>
                  Total
                </span>

                <b>
                  {money(
                    total
                  )}
                </b>

              </div>

            </aside>

          </div>
        )}

      </div>

    </div>
  );
}

/* =========================================================
   AUTH
========================================================= */

function AuthModal({
  mode,
  onClose,
  onLogin,
  onRegister,
  onSendPasswordResetOtp,
  onResetPasswordWithOtp,
}) {
  const [view, setView] = useState(mode);
  const [busy, setBusy] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [resetData, setResetData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const submitLogin = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await onLogin(
        loginData.email,
        loginData.password
      );
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const created = await onRegister(registerData);

      // When email confirmation is enabled, the parent keeps the modal open.
      // Move the customer back to Login so they can sign in after verification.
      if (created) {
        setView("login");
      }
    } finally {
      setBusy(false);
    }
  };

  const sendOtp = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const sent = await onSendPasswordResetOtp(
        resetData.email
      );
      if (sent) {
        setView("reset");
      }
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();

    if (
      resetData.newPassword !==
      resetData.confirmPassword
    ) {
      alert("Passwords do not match");
      return;
    }

    setBusy(true);
    try {
      await onResetPasswordWithOtp(
        resetData.email,
        resetData.otp,
        resetData.newPassword
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-background">
      <div className="auth-modal auth-modal-pro">
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="auth-logo">M</div>

        <span className="eyebrow">
          MAKEUP PLAZA
        </span>

        {view === "login" && (
          <>
            <h2>
              Welcome <em>Back</em>
            </h2>
            <p>
              Sign in to manage your favourites,
              orders, address and checkout.
            </p>

            <form
              className="modal-form"
              onSubmit={submitLogin}
            >
              <label>
                EMAIL
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) =>
                    setLoginData({
                      ...loginData,
                      email: e.target.value,
                    })
                  }
                  placeholder="you@email.com"
                  required
                />
              </label>

              <label>
                PASSWORD
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({
                      ...loginData,
                      password: e.target.value,
                    })
                  }
                  placeholder="Your password"
                  required
                />
              </label>

              <div className="auth-action-row">
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => {
                    setResetData({
                      email: loginData.email,
                      otp: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setView("forgot");
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              <button
                className="gold-button full-button auth-submit-button"
                type="submit"
                disabled={busy}
              >
                {busy
                  ? "SIGNING IN..."
                  : "LOGIN TO ACCOUNT →"}
              </button>
            </form>

            <button
              className="switch-auth"
              onClick={() => setView("register")}
            >
              New customer? Create an account
            </button>
          </>
        )}

        {view === "register" && (
          <>
            <h2>
              Create Your <em>Account</em>
            </h2>
            <p>
              Create your customer account and keep
              your orders available across visits.
            </p>

            <form
              className="modal-form"
              onSubmit={submitRegister}
            >
              <label>
                FULL NAME
                <input
                  value={registerData.name}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      name: e.target.value,
                    })
                  }
                  placeholder="Your full name"
                  required
                />
              </label>

              <label>
                MOBILE NUMBER
                <input
                  value={registerData.phone}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      phone: e.target.value,
                    })
                  }
                  placeholder="10 digit mobile"
                  required
                />
              </label>

              <label>
                EMAIL
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      email: e.target.value,
                    })
                  }
                  placeholder="you@email.com"
                  required
                />
              </label>

              <label>
                PASSWORD
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      password: e.target.value,
                    })
                  }
                  placeholder="Minimum 6 characters"
                  required
                />
              </label>

              <label>
                CONFIRM PASSWORD
                <input
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Repeat password"
                  required
                />
              </label>

              <button
                className="gold-button full-button auth-submit-button"
                type="submit"
                disabled={busy}
              >
                {busy
                  ? "CREATING ACCOUNT..."
                  : "CREATE ACCOUNT →"}
              </button>
            </form>

            <button
              className="switch-auth"
              onClick={() => setView("login")}
            >
              Already have an account? Login
            </button>
          </>
        )}

        {view === "forgot" && (
          <>
            <h2>
              Reset <em>Password</em>
            </h2>
            <p>
              Enter your registered email. We will
              send a 6-digit OTP to verify you.
            </p>

            <form
              className="modal-form"
              onSubmit={sendOtp}
            >
              <label>
                REGISTERED EMAIL
                <input
                  type="email"
                  value={resetData.email}
                  onChange={(e) =>
                    setResetData({
                      ...resetData,
                      email: e.target.value,
                    })
                  }
                  placeholder="you@email.com"
                  required
                />
              </label>

              <button
                className="gold-button full-button auth-submit-button"
                type="submit"
                disabled={busy}
              >
                {busy
                  ? "SENDING OTP..."
                  : "SEND OTP →"}
              </button>
            </form>

            <button
              className="switch-auth"
              onClick={() => setView("login")}
            >
              ← Back to Login
            </button>
          </>
        )}

        {view === "reset" && (
          <>
            <h2>
              Verify & Set <em>New Password</em>
            </h2>
            <p>
              Enter the OTP sent to {resetData.email}
              and choose your new password.
            </p>

            <form
              className="modal-form"
              onSubmit={resetPassword}
            >
              <label>
                6-DIGIT OTP
                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={resetData.otp}
                  onChange={(e) =>
                    setResetData({
                      ...resetData,
                      otp: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="123456"
                  required
                />
              </label>

              <label>
                NEW PASSWORD
                <input
                  type="password"
                  value={resetData.newPassword}
                  onChange={(e) =>
                    setResetData({
                      ...resetData,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder="Minimum 6 characters"
                  required
                />
              </label>

              <label>
                CONFIRM NEW PASSWORD
                <input
                  type="password"
                  value={resetData.confirmPassword}
                  onChange={(e) =>
                    setResetData({
                      ...resetData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Repeat new password"
                  required
                />
              </label>

              <button
                className="gold-button full-button auth-submit-button"
                type="submit"
                disabled={busy}
              >
                {busy
                  ? "SAVING PASSWORD..."
                  : "VERIFY OTP & SAVE PASSWORD →"}
              </button>
            </form>

            <button
              className="switch-auth"
              onClick={() => setView("forgot")}
            >
              Didn’t receive the OTP? Try again
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   PROFILE MODAL
========================================================= */

function ProfileModal({
  user,
  onClose,
  onSave,
  onLogout,
  onOrders,
  onFavorites,
}) {
  const [form, setForm] =
    useState({
      name:
        user.name || "",

      email:
        user.email || "",

      phone:
        user.phone || "",

      address:
        user.address || "",

      city:
        user.city || "",

      state:
        user.state || "",

      pincode:
        user.pincode || "",
    });

  const change = (
    event
  ) => {
    setForm(
      (current) => ({
        ...current,

        [event.target.name]:
          event.target.value,
      })
    );
  };

  return (
    <div className="modal-background">

      <div className="profile-modal">

        <button
          className="modal-close"
          onClick={
            onClose
          }
        >
          ×
        </button>

        <span className="eyebrow">
          MY ACCOUNT
        </span>

        <h2>
          Hello,{" "}
          <em>
            {
              user.name
            }
          </em>
        </h2>

        <div className="profile-shortcuts">

          <button
            onClick={
              onOrders
            }
          >
            📦 MY ORDERS
          </button>

          <button
            onClick={
              onFavorites
            }
          >
            ♡ FAVOURITES
          </button>

        </div>

        <form
          className="modal-form"
          onSubmit={(e) => {
            e.preventDefault();

            onSave(
              form
            );
          }}
        >

          <label>
            FULL NAME

            <input
              name="name"
              value={
                form.name
              }
              onChange={
                change
              }
            />
          </label>

          <label>
            EMAIL

            <input
              name="email"
              type="email"
              value={
                form.email
              }
              onChange={
                change
              }
            />
          </label>

          <label>
            MOBILE

            <input
              name="phone"
              value={
                form.phone
              }
              onChange={
                change
              }
            />
          </label>

          <label>
            ADDRESS

            <textarea
              name="address"
              value={
                form.address
              }
              onChange={
                change
              }
            />
          </label>

          <label>
            CITY

            <input
              name="city"
              value={
                form.city
              }
              onChange={
                change
              }
            />
          </label>

          <label>
            STATE

            <input
              name="state"
              value={
                form.state
              }
              onChange={
                change
              }
            />
          </label>

          <label>
            PINCODE

            <input
              name="pincode"
              value={
                form.pincode
              }
              onChange={
                change
              }
            />
          </label>

          <button
            className="gold-button full-button"
            type="submit"
          >
            SAVE PROFILE & ADDRESS →
          </button>

        </form>

        <button
          className="logout-button"
          onClick={
            onLogout
          }
        >
          LOGOUT
        </button>

      </div>

    </div>
  );
}

/* =========================================================
   ORDER SUCCESS
========================================================= */

function OrderSuccessModal({
  order,
  onClose,
}) {
  return (
    <div className="modal-background">

      <div className="success-modal">

        <div className="success-icon">
          ✓
        </div>

        <span className="eyebrow">
          ORDER CONFIRMED
        </span>

        <h2>
          Thank{" "}
          <em>
            You.
          </em>
        </h2>

        <p>
          Your Makeup Plaza
          order has been placed
          successfully.
        </p>

        <div className="success-number">

          <span>
            ORDER NUMBER
          </span>

          <b>
            {
              order.id
            }
          </b>

        </div>

        <div className="success-details">

          <div>

            <span>
              STATUS
            </span>

            <b>
              {
                order.status
              }
            </b>

          </div>

          <div>

            <span>
              TOTAL
            </span>

            <b>
              {money(
                order.total
              )}
            </b>

          </div>

        </div>

        <button
          className="gold-button full-button"
          onClick={
            onClose
          }
        >
          VIEW MY ORDER →
        </button>

      </div>

    </div>
  );
}

/* =========================================================
   FOOTER
========================================================= */

function Footer({
  categories,
  onHome,
  onShop,
  onOrders,
  onFavorites,
  onLogin,
  onAdmin,
}) {
  const safeCategories =
    normalizeCategories(
      categories
    );

  return (
    <footer className="site-footer">

      <div className="footer-main">

        <div className="footer-brand">

          <div className="footer-logo">
            MAKEUP{" "}
            <b>
              PLAZA
            </b>
          </div>

          <p>
            Premium beauty essentials
            curated for everyday
            confidence and timeless style.
          </p>

          <div className="social-links">

            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
            >
              Instagram
            </a>

            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
            >
              Facebook
            </a>

            <a
              href="https://pinterest.com"
              target="_blank"
              rel="noreferrer"
            >
              Pinterest
            </a>

          </div>

        </div>

        <FooterColumn title="SHOP">

          <button
            onClick={
              onShop
            }
          >
            All Products
          </button>

          <button
            onClick={
              onShop
            }
          >
            Best Sellers
          </button>

          <button
            onClick={
              onShop
            }
          >
            Trending
          </button>

          <button
            onClick={
              onShop
            }
          >
            Today's Deals
          </button>

          {safeCategories
            .slice(
              0,
              6
            )
            .map(
              (
                category
              ) => (
                <button
                  key={
                    category.id
                  }
                  onClick={
                    onShop
                  }
                >
                  {
                    category.name
                  }
                </button>
              )
            )}

        </FooterColumn>

        <FooterColumn title="CUSTOMER CARE">

          <button
            onClick={
              onOrders
            }
          >
            My Orders
          </button>

          <button
            onClick={
              onFavorites
            }
          >
            My Favourites
          </button>

          <button
            onClick={
              onLogin
            }
          >
            Login / Register
          </button>

          <button
            onClick={
              onShop
            }
          >
            Returns
          </button>

          <button
            onClick={
              onShop
            }
          >
            Delivery Support
          </button>

        </FooterColumn>

        <FooterColumn title="ABOUT MAKEUP PLAZA">

          <button
            onClick={
              onHome
            }
          >
            Our Story
          </button>

          <button
            onClick={
              onShop
            }
          >
            Contact Us
          </button>

          <button
            onClick={
              onShop
            }
          >
            Privacy
          </button>

          <button
            onClick={
              onShop
            }
          >
            Terms
          </button>

          <button
            onClick={
              onShop
            }
          >
            Beauty Journal
          </button>

        </FooterColumn>

      </div>

      <div className="footer-newsletter">

        <div>

          <span>
            BEAUTY NOTES
          </span>

          <h3>
            Get new launches &
            exclusive offers.
          </h3>

        </div>

        <div className="newsletter-box">

          <input
            placeholder="Enter your email address"
          />

          <button
            onClick={() =>
              alert(
                "Demo newsletter subscription saved."
              )
            }
          >
            SUBSCRIBE
          </button>

        </div>

      </div>

      <div className="footer-payment">

        <span>
          PAYMENT OPTIONS
        </span>

        <b>
          COD
        </b>

        <b>
          UPI
        </b>

        <b>
          CARD
        </b>

        <b>
          🔒 SECURE CHECKOUT
        </b>

        <button
          className="admin-footer-button"
          onClick={
            onAdmin
          }
        >
          OWNER / ADMIN LOGIN
        </button>

      </div>

      <div className="footer-bottom">

        <span>
          ©{" "}
          {new Date().getFullYear()}{" "}
          Makeup Plaza.
          All Rights Reserved.
        </span>

        <span>
          Store Data • Local Storage • Customer Auth: Supabase
        </span>

      </div>

    </footer>
  );
}

function FooterColumn({
  title,
  children,
}) {
  return (
    <div className="footer-column">

      <h4>
        {title}
      </h4>

      {children}

    </div>
  );
}

/* =========================================================
   ADMIN PANEL
========================================================= */

function AdminPanel({
  adminSession,
  currentUser,
  products,
  categories,
  orders,
  users,
  banners,
  hero,
  onClose,
  onAdminLogin,
  saveProducts,
  saveCategories,
  saveOrders,
  saveBanners,
  saveHero,
  showToast,
}) {
  const [loggedIn, setLoggedIn] = useState(
  adminSession ||
  sessionStorage.getItem("makeupPlazaAdmin") === "true"
);
  const [tab, setTab] =
    useState(
      "dashboard"
    );

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const login = () => {
  if (
    email.trim().toLowerCase() !== ADMIN_EMAIL ||
    password !== ADMIN_PASSWORD
  ) {
    alert("Invalid admin login");
    return;
  }

  sessionStorage.setItem(
    "makeupPlazaAdmin",
    "true"
  );

  setLoggedIn(true);

  onAdminLogin();

  showToast("Admin login successful");
};

  const logout = () => {
    sessionStorage.removeItem(
      "makeupPlazaAdmin"
    );

    setLoggedIn(
      false
    );

    onClose();
  };

  if (!loggedIn) {
    return (
      <div className="admin-screen">

        <div className="admin-login-card">

          <button
  className="admin-login-close"
  onClick={onClose}
  aria-label="Close admin login"
>
  <span>×</span>
</button>

          <div className="auth-logo">
            M
          </div>

          <span className="eyebrow">
            PRIVATE OWNER ACCESS
          </span>

          <h2>
            Admin{" "}
            <em>
              Studio
            </em>
          </h2>

          <p>
            Owner-only demo dashboard.
          </p>

          <label>
            ADMIN EMAIL

            <input
              type="email"
              value={
                email
              }
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              placeholder={
                ADMIN_EMAIL
              }
            />
          </label>

          <label>
            PASSWORD

            <input
              type="password"
              value={
                password
              }
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              placeholder={
                ADMIN_PASSWORD
              }
            />
          </label>

          <button
            className="gold-button full-button"
            onClick={
              login
            }
          >
            ENTER ADMIN →
          </button>

          <small className="demo-admin-note">
            Demo:{" "}
            owner@makeupplaza.com
            {" / "}
            admin123
          </small>

        </div>

      </div>
    );
  }

  const pending =
    orders.filter(
      (order) =>
        order.status ===
        "Pending"
    ).length;

  const cancellations =
    orders.filter(
      (order) =>
        order.cancellationRequested
    ).length;

  const delivered =
    orders.filter(
      (order) =>
        order.status ===
        "Delivered"
    ).length;

  return (
    <div className="admin-screen">

      <div className="admin-app">

        <header className="admin-header">

          <div>

            <span>
              MAKEUP PLAZA OWNER
            </span>

            <h1>
              Admin{" "}
              <em>
                Studio
              </em>
            </h1>

          </div>

          <div className="admin-header-actions">

            <button
              onClick={
                logout
              }
            >
              LOGOUT
            </button>

            <button
              onClick={
                onClose
              }
            >
              ×
            </button>

          </div>

        </header>

       <nav className="admin-tabs">

  <button
    className={tab === "dashboard" ? "active" : ""}
    onClick={() => setTab("dashboard")}
  >
    DASHBOARD
  </button>

  <button
    className={tab === "orders" ? "active" : ""}
    onClick={() => setTab("orders")}
  >
    ORDERS
  </button>

  <button
    className={tab === "products" ? "active" : ""}
    onClick={() => setTab("products")}
  >
    PRODUCTS
  </button>

  <button
    className={tab === "categories" ? "active" : ""}
    onClick={() => setTab("categories")}
  >
    CATEGORIES
  </button>

  <button
    className={tab === "hero" ? "active" : ""}
    onClick={() => setTab("hero")}
  >
    HERO
  </button>

  <button
    className={tab === "banners" ? "active" : ""}
    onClick={() => setTab("banners")}
  >
    BANNERS
  </button>

</nav>

        {tab === "hero" && (
  <AdminHero
    hero={hero}
    saveHero={saveHero}
  />
)}

        {tab ===
          "dashboard" && (
          <AdminDashboard
            orders={
              orders
            }
            products={
              products
            }
            categories={
              categories
            }
            users={
              users
            }
            pending={
              pending
            }
            cancellation={
              cancellations
            }
            delivered={
              delivered
            }
            onOrders={() =>
              setTab(
                "orders"
              )
            }
            onProducts={() =>
              setTab(
                "products"
              )
            }
            onCategories={() =>
              setTab(
                "categories"
              )
            }
            onBanners={() =>
              setTab(
                "banners"
              )
            }
          />
        )}

        {tab ===
          "orders" && (
          <AdminOrders
            orders={
              orders
            }
            saveOrders={
              saveOrders
            }
          />
        )}

        {tab ===
          "products" && (
          <AdminProducts
            products={
              products
            }
            categories={
              categories
            }
            saveProducts={
              saveProducts
            }
          />
        )}

        {tab ===
          "categories" && (
          <AdminCategories
            categories={
              categories
            }
            products={
              products
            }
            saveCategories={
              saveCategories
            }
          />
        )}

        {tab ===
          "banners" && (
          <AdminBanners
            banners={
              banners
            }
            saveBanners={
              saveBanners
            }
          />
        )}

      </div>

    </div>
  );
}

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function AdminDashboard({
  orders,
  products,
  categories,
  users,
  pending,
  cancellation,
  delivered,
  onOrders,
  onProducts,
  onCategories,
  onBanners,
}) {
  return (
    <main className="admin-content">

      <div className="admin-stats">

        <AdminStat
          label="TOTAL ORDERS"
          value={
            orders.length
          }
        />

        <AdminStat
          label="PENDING ORDERS"
          value={
            pending
          }
        />

        <AdminStat
          label="CANCELLATION REQUESTS"
          value={
            cancellation
          }
        />

        <AdminStat
          label="DELIVERED"
          value={
            delivered
          }
        />

        <AdminStat
          label="PRODUCTS"
          value={
            products.length
          }
        />

        <AdminStat
          label="CATEGORIES"
          value={
            categories.length
          }
        />

        <AdminStat
          label="CUSTOMERS"
          value={
            users.length
          }
        />

      </div>

      <section className="admin-welcome">

        <span>
          STORE CONTROL CENTER
        </span>

        <h2>
          Manage your Makeup Plaza store
        </h2>

        <p>
          Add products, create categories,
          add offer banners, manage orders,
          set delivery dates and handle
          cancellation requests.
        </p>

        <div className="admin-quick-actions">

          <button
            onClick={
              onProducts
            }
          >
            + ADD PRODUCT
          </button>

          <button
            onClick={
              onCategories
            }
          >
            + ADD CATEGORY
          </button>

          <button
            onClick={
              onBanners
            }
          >
            + ADD BANNER
          </button>

          <button
            onClick={
              onOrders
            }
          >
            VIEW ORDERS
          </button>

        </div>

      </section>

    </main>
  );
}

function AdminStat({
  label,
  value,
}) {
  return (
    <div className="admin-stat-card">

      <span>
        {
          label
        }
      </span>

      <b>
        {
          value
        }
      </b>

    </div>
  );
}

/* =========================================================
   ADMIN PRODUCTS
========================================================= */

function AdminProducts({
  products,
  categories,
  saveProducts,
}) {
  const safeCategories =
    normalizeCategories(
      categories
    );

  const [formOpen, setFormOpen] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const saveProduct = (
    data
  ) => {
    if (editing) {
      saveProducts(
        products.map(
          (product) =>
            product.id ===
            editing.id
              ? {
                  ...product,
                  ...data,
                }
              : product
        )
      );
    } else {
      saveProducts([
        ...products,
        {
          id: makeId(
            "product"
          ),
          rating: 5,
          reviews: 0,
          ...data,
        },
      ]);
    }

    setEditing(
      null
    );

    setFormOpen(
      false
    );
  };

  const deleteProduct = (
    id
  ) => {
    const product =
      products.find(
        (item) =>
          item.id === id
      );

    if (
      product &&
      window.confirm(
        `Delete "${product.name}"?`
      )
    ) {
      saveProducts(
        products.filter(
          (item) =>
            item.id !== id
        )
      );
    }
  };

  return (
    <main className="admin-content">

      <div className="admin-section-heading">

        <div>

          <span>
            STORE MANAGEMENT
          </span>

          <h2>
            Products
          </h2>

          <p>
            Assign a category and
            choose where each product
            should appear.
          </p>

        </div>

        <button
          className="admin-gold-button"
          onClick={() => {
            setEditing(
              null
            );

            setFormOpen(
              true
            );
          }}
        >
          + ADD NEW PRODUCT
        </button>

      </div>

      {safeCategories.length ===
        0 && (
        <div className="admin-note-box">
          Add a category first, then
          add products to that category.
        </div>
      )}

      <div className="admin-product-grid">

        {products.map(
          (product) => (
            <article
              className="admin-product-card"
              key={
                product.id
              }
            >

              <img
                src={
                  product.image ||
                  demoImages.lipstick
                }
                alt={
                  product.name
                }
              />

              <div className="admin-product-card-body">

                <span>
                  {
                    product.category ||
                    "Uncategorized"
                  }
                </span>

                <h3>
                  {
                    product.name
                  }
                </h3>

                <div className="admin-price">

                  <b>
                    {money(
                      product.price
                    )}
                  </b>

                  {product.oldPrice >
                    product.price && (
                    <del>
                      {money(
                        product.oldPrice
                      )}
                    </del>
                  )}

                </div>

                <div className="admin-tags">

                  {product.todaySale && (
                    <small>
                      TODAY SALE
                    </small>
                  )}

                  {product.bestSeller && (
                    <small>
                      BEST SELLER
                    </small>
                  )}

                  {product.trending && (
                    <small>
                      TRENDING
                    </small>
                  )}

                  {product.newArrival && (
                    <small>
                      NEW
                    </small>
                  )}

                </div>

                <div className="admin-card-buttons">

                  <button
                    onClick={() => {
                      setEditing(
                        product
                      );

                      setFormOpen(
                        true
                      );
                    }}
                  >
                    EDIT
                  </button>

                  <button
                    className="danger-admin-button"
                    onClick={() =>
                      deleteProduct(
                        product.id
                      )
                    }
                  >
                    DELETE
                  </button>

                </div>

              </div>

            </article>
          )
        )}

      </div>

      {formOpen && (
        <AdminProductForm
          product={
            editing
          }
          categories={
            safeCategories
          }
          onClose={() => {
            setEditing(
              null
            );

            setFormOpen(
              false
            );
          }}
          onSave={
            saveProduct
          }
        />
      )}

    </main>
  );
}

/* =========================================================
   ADMIN PRODUCT FORM
========================================================= */

function AdminProductForm({
  product,
  categories,
  onClose,
  onSave,
}) {
  const safeCategories =
    normalizeCategories(
      categories
    );

  const [form, setForm] =
    useState({
      name:
        product?.name ||
        "",

      category:
        product?.category ||
        safeCategories[0]
          ?.name ||
        "",

      price:
        product?.price ||
        "",

      oldPrice:
        product?.oldPrice ||
        "",

      image:
        product?.image ||
        "",

      todaySale:
        !!product?.todaySale,

      bestSeller:
        !!product?.bestSeller,

      trending:
        !!product?.trending,

      newArrival:
        !!product?.newArrival,
    });

  const updateField = (
    field,
    value
  ) => {
    setForm(
      (current) => ({
        ...current,
        [field]:
          value,
      })
    );
  };

  const submit = () => {
    if (!form.name.trim()) {
      alert(
        "Product name is required."
      );
      return;
    }

    if (!form.price) {
      alert(
        "Product price is required."
      );
      return;
    }

    if (!form.category) {
      alert(
        "Please select a category."
      );
      return;
    }

    onSave({
      ...form,

      name:
        form.name.trim(),

      price:
        Number(form.price),

      oldPrice:
        Number(
          form.oldPrice ||
            0
        ),

      image:
        form.image ||
        demoImages.lipstick,
    });
  };

  return (
    <div className="modal-background">

      <div className="admin-form-modal">

        <button
          className="modal-close"
          onClick={
            onClose
          }
        >
          ×
        </button>

        <span className="eyebrow">
          {product
            ? "EDIT PRODUCT"
            : "NEW PRODUCT"}
        </span>

        <h2>
          {product
            ? "Edit"
            : "Add"}{" "}
          <em>
            Product
          </em>
        </h2>

        <div className="admin-form-grid">

          <label>
            PRODUCT NAME

            <input
              value={
                form.name
              }
              onChange={(e) =>
                updateField(
                  "name",
                  e.target.value
                )
              }
              placeholder="Premium Matte Lipstick"
            />
          </label>

          <label>
            CATEGORY

            <select
              value={
                form.category
              }
              onChange={(e) =>
                updateField(
                  "category",
                  e.target.value
                )
              }
              disabled={
                safeCategories.length ===
                0
              }
            >

              {safeCategories.length >
              0 ? (
                safeCategories.map(
                  (category) => (
                    <option
                      key={
                        category.id
                      }
                      value={
                        category.name
                      }
                    >
                      {
                        category.name
                      }
                    </option>
                  )
                )
              ) : (
                <option value="">
                  Add category first
                </option>
              )}

            </select>

          </label>

          <label>
            PRICE

            <input
              type="number"
              min="0"
              value={
                form.price
              }
              onChange={(e) =>
                updateField(
                  "price",
                  e.target.value
                )
              }
              placeholder="399"
            />
          </label>

          <label>
            OLD PRICE

            <input
              type="number"
              min="0"
              value={
                form.oldPrice
              }
              onChange={(e) =>
                updateField(
                  "oldPrice",
                  e.target.value
                )
              }
              placeholder="499"
            />
          </label>

          <label className="full-form-field">
            PRODUCT IMAGE

            <div className="upload-area large-upload">

              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  imageUploadToDataURL(
                    event,
                    (image) =>
                      updateField(
                        "image",
                        image
                      )
                  )
                }
              />

              {form.image ? (
                <img
                  src={
                    form.image
                  }
                  alt="Preview"
                />
              ) : (
                <span>
                  Click to upload product
                  image
                </span>
              )}

            </div>

          </label>

        </div>

        <div className="collection-box">

          <div>

            <span>
              PRODUCT COLLECTIONS
            </span>

            <p>
              Choose where this product
              should appear.
            </p>

          </div>

          <div className="collection-grid">

            {[
              [
                "todaySale",
                "🔥",
                "Today's Sale",
              ],
              [
                "bestSeller",
                "🏆",
                "Best Seller",
              ],
              [
                "trending",
                "✦",
                "Trending",
              ],
              [
                "newArrival",
                "✨",
                "New Arrival",
              ],
            ].map(
              ([
                field,
                icon,
                label,
              ]) => (
                <button
                  type="button"
                  key={
                    field
                  }
                  className={
                    form[
                      field
                    ]
                      ? "collection-option active"
                      : "collection-option"
                  }
                  onClick={() =>
                    updateField(
                      field,
                      !form[
                        field
                      ]
                    )
                  }
                >

                  <span>
                    {
                      icon
                    }
                  </span>

                  <strong>
                    {
                      label
                    }
                  </strong>

                  <small>
                    Show in collection
                  </small>

                </button>
              )
            )}

          </div>

        </div>

        <button
          className="gold-button full-button"
          disabled={
            safeCategories.length ===
            0
          }
          onClick={
            submit
          }
        >
          {product
            ? "SAVE PRODUCT"
            : "ADD PRODUCT"}{" "}
          →
        </button>

      </div>

    </div>
  );
}

/* =========================================================
   ADMIN CATEGORIES
========================================================= */

function AdminCategories({
  categories,
  products,
  saveCategories,
}) {
  const safeCategories =
    normalizeCategories(
      categories
    );

  const [open, setOpen] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const saveCategory = (
    data
  ) => {
    const name =
      data.name.trim();

    if (!name) {
      alert(
        "Category name is required."
      );
      return;
    }

    const duplicate =
      safeCategories.some(
        (category) =>
          category.name
            .toLowerCase() ===
            name.toLowerCase() &&
          category.id !==
            editing?.id
      );

    if (duplicate) {
      alert(
        "This category already exists."
      );

      return;
    }

    if (editing) {
      saveCategories(
        safeCategories.map(
          (category) =>
            category.id ===
            editing.id
              ? {
                  ...category,
                  ...data,
                  name,
                }
              : category
        )
      );
    } else {
      saveCategories([
        ...safeCategories,
        {
          id: makeId(
            "category"
          ),
          ...data,
          name,
        },
      ]);
    }

    setOpen(
      false
    );

    setEditing(
      null
    );
  };

  const deleteCategory = (
    id
  ) => {
    const category =
      safeCategories.find(
        (item) =>
          item.id === id
      );

    if (!category) {
      return;
    }

    const linkedProducts =
      products.filter(
        (product) =>
          product.category ===
          category.name
      );

    if (
      linkedProducts.length >
      0
    ) {
      alert(
        "This category has products. Change or delete those products first."
      );

      return;
    }

    if (
      window.confirm(
        `Delete "${category.name}"?`
      )
    ) {
      saveCategories(
        safeCategories.filter(
          (item) =>
            item.id !== id
        )
      );
    }
  };

  return (
    <main className="admin-content">

      <div className="admin-section-heading">

        <div>

          <span>
            STORE MANAGEMENT
          </span>

          <h2>
            Categories
          </h2>

          <p>
            Only categories created here
            appear on the customer side.
          </p>

        </div>

        <button
          className="admin-gold-button"
          onClick={() => {
            setEditing(
              null
            );

            setOpen(
              true
            );
          }}
        >
          + ADD NEW CATEGORY
        </button>

      </div>

      {safeCategories.length >
      0 ? (
        <div className="admin-category-grid">

          {safeCategories.map(
            (category) => (
              <article
                className="admin-category-card"
                key={
                  category.id
                }
              >

                <img
                  src={
                    category.image ||
                    demoImages.lipstick
                  }
                  alt={
                    category.name
                  }
                />

                <div>

                  <span>
                    CATEGORY
                  </span>

                  <h3>
                    {
                      category.name
                    }
                  </h3>

                  <p>
                    {
                      category.description
                    }
                  </p>

                  <div className="admin-card-buttons">

                    <button
                      onClick={() => {
                        setEditing(
                          category
                        );

                        setOpen(
                          true
                        );
                      }}
                    >
                      EDIT
                    </button>

                    <button
                      className="danger-admin-button"
                      onClick={() =>
                        deleteCategory(
                          category.id
                        )
                      }
                    >
                      DELETE
                    </button>

                  </div>

                </div>

              </article>
            )
          )}

        </div>
      ) : (
        <div className="large-empty admin-empty">

          <div>
            ✦
          </div>

          <h2>
            No categories yet
          </h2>

          <p>
            Add your first category
            from the button above.
          </p>

        </div>
      )}

      {open && (
        <AdminCategoryForm
          category={
            editing
          }
          onClose={() => {
            setOpen(
              false
            );

            setEditing(
              null
            );
          }}
          onSave={
            saveCategory
          }
        />
      )}

    </main>
  );
}

/* =========================================================
   ADMIN CATEGORY FORM
========================================================= */

function AdminCategoryForm({
  category,
  onClose,
  onSave,
}) {
  const [form, setForm] =
    useState({
      name:
        category?.name ||
        "",

      description:
        category?.description ||
        "",

      image:
        category?.image ||
        "",
    });

  const submit = () => {
    if (!form.name.trim()) {
      alert(
        "Category name is required."
      );

      return;
    }

    onSave({
      name:
        form.name.trim(),

      description:
        form.description.trim(),

      image:
        form.image ||
        demoImages.lipstick,
    });
  };

  return (
    <div className="modal-background">

      <div className="admin-form-modal">

        <button
          className="modal-close"
          onClick={
            onClose
          }
        >
          ×
        </button>

        <span className="eyebrow">
          {category
            ? "EDIT CATEGORY"
            : "NEW CATEGORY"}
        </span>

        <h2>
          {category
            ? "Update"
            : "Add"}{" "}
          <em>
            Category
          </em>
        </h2>

        <div className="admin-form-grid-single">

          <label>
            CATEGORY NAME

            <input
              value={
                form.name
              }
              onChange={(e) =>
                setForm(
                  {
                    ...form,
                    name:
                      e.target.value,
                  }
                )
              }
              placeholder="e.g. Skin Care"
            />
          </label>

          <label>
            DESCRIPTION

            <textarea
              value={
                form.description
              }
              onChange={(e) =>
                setForm(
                  {
                    ...form,
                    description:
                      e.target.value,
                  }
                )
              }
              placeholder="Premium category description"
            />
          </label>

          <label>
            CATEGORY IMAGE

            <div className="upload-area large-upload">

              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  imageUploadToDataURL(
                    event,
                    (image) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          image,
                        })
                      )
                  )
                }
              />

              {form.image ? (
                <img
                  src={
                    form.image
                  }
                  alt="Category preview"
                />
              ) : (
                <span>
                  Click to upload category
                  image
                </span>
              )}

            </div>

          </label>

        </div>

        <button
          className="gold-button full-button"
          onClick={
            submit
          }
        >
          {category
            ? "SAVE CHANGES"
            : "ADD CATEGORY"}{" "}
          →
        </button>

      </div>

    </div>
  );
}

/* =========================================================
   ADMIN BANNERS
========================================================= */

function AdminBanners({
  banners,
  saveBanners,
}) {
  const [form, setForm] =
    useState({
      title: "",
      subtitle: "",
      buttonText:
        "SHOP NOW",
      image: "",
    });

  const addBanner = () => {
    if (
      !form.title.trim() ||
      !form.image
    ) {
      alert(
        "Banner title and image are required."
      );

      return;
    }

    saveBanners([
      ...banners,

      {
        id: makeId(
          "banner"
        ),

        title:
          form.title.trim(),

        subtitle:
          form.subtitle.trim(),

        buttonText:
          form.buttonText.trim() ||
          "SHOP NOW",

        image:
          form.image,
      },
    ]);

    setForm({
      title: "",
      subtitle: "",
      buttonText:
        "SHOP NOW",
      image: "",
    });

    alert(
      "Offer banner added successfully"
    );
  };

  const deleteBanner = (
    id
  ) => {
    if (
      window.confirm(
        "Delete this banner?"
      )
    ) {
      saveBanners(
        banners.filter(
          (banner) =>
            banner.id !== id
        )
      );
    }
  };

  return (
    <main className="admin-content">

      <div className="admin-section-heading">

        <div>

          <span>
            HOMEPAGE MANAGEMENT
          </span>

          <h2>
            Offer Banners
          </h2>

          <p>
            Add promotional banners
            that appear on the homepage.
          </p>

        </div>

      </div>

      <div className="banner-admin-form">

        <label>
          BANNER TITLE

          <input
            value={
              form.title
            }
            onChange={(e) =>
              setForm(
                {
                  ...form,
                  title:
                    e.target.value,
                }
              )
            }
            placeholder="Up To 50% Off"
          />
        </label>

        <label>
          SUBTITLE

          <input
            value={
              form.subtitle
            }
            onChange={(e) =>
              setForm(
                {
                  ...form,
                  subtitle:
                    e.target.value,
                }
              )
            }
            placeholder="On selected beauty products"
          />
        </label>

        <label>
          BUTTON TEXT

          <input
            value={
              form.buttonText
            }
            onChange={(e) =>
              setForm(
                {
                  ...form,
                  buttonText:
                    e.target.value,
                }
              )
            }
            placeholder="SHOP NOW"
          />
        </label>

        <label>
          BANNER IMAGE

          <div className="upload-area banner-upload">

            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                imageUploadToDataURL(
                  event,
                  (image) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        image,
                      })
                    )
                )
              }
            />

            {form.image ? (
              <img
                src={
                  form.image
                }
                alt="Banner preview"
              />
            ) : (
              <span>
                Click to upload offer
                banner
              </span>
            )}

          </div>

        </label>

        <button
          className="admin-gold-button"
          onClick={
            addBanner
          }
        >
          + ADD OFFER BANNER
        </button>

      </div>

      <div className="banner-admin-list">

        {banners.length >
        0 ? (
          banners.map(
            (banner) => (
              <article
                className="banner-admin-card"
                key={
                  banner.id
                }
              >

                <img
                  src={
                    banner.image
                  }
                  alt={
                    banner.title
                  }
                />

                <div>

                  <span>
                    OFFER BANNER
                  </span>

                  <h3>
                    {
                      banner.title
                    }
                  </h3>

                  <p>
                    {
                      banner.subtitle
                    }
                  </p>

                  <button
                    className="danger-admin-button"
                    onClick={() =>
                      deleteBanner(
                        banner.id
                      )
                    }
                  >
                    DELETE BANNER
                  </button>

                </div>

              </article>
            )
          )
        ) : (
          <div className="small-empty">
            No offer banners added yet.
          </div>
        )}

      </div>

    </main>
  );
}

/* =========================================================
   ADMIN ORDERS
========================================================= */

function AdminOrders({
  orders,
  saveOrders,
}) {
  const updateOrder = (
    id,
    changes
  ) => {
    saveOrders(
      orders.map(
        (order) =>
          order.id === id
            ? {
                ...order,
                ...changes,
              }
            : order
      )
    );
  };

  return (
    <main className="admin-content">

      <div className="admin-section-heading">

        <div>

          <span>
            ORDER MANAGEMENT
          </span>

          <h2>
            Customer Orders
          </h2>

          <p>
            Accept, update status, set
            expected delivery and handle
            cancellation requests.
          </p>

        </div>

      </div>

      {orders.length >
      0 ? (
        <div className="admin-orders-list">

          {orders.map(
            (order) => (
              <AdminOrderCard
                key={
                  order.id
                }
                order={
                  order
                }
                onUpdate={
                  updateOrder
                }
              />
            )
          )}

        </div>
      ) : (
        <div className="large-empty">

          <div>
            ◈
          </div>

          <h2>
            No orders yet
          </h2>

        </div>
      )}

    </main>
  );
}

/* =========================================================
   ADMIN ORDER CARD
========================================================= */

function AdminOrderCard({
  order,
  onUpdate,
}) {
  const [deliveryDate, setDeliveryDate] =
    useState(
      order.expectedDelivery ||
        ""
    );

  const saveDeliveryDate =
    () => {
      onUpdate(
        order.id,
        {
          expectedDelivery:
            deliveryDate,
        }
      );

      alert(
        "Delivery date updated."
      );
    };

  return (
    <article className="admin-order-card">

      <div className="admin-order-top">

        <div>

          <span>
            ORDER
          </span>

          <h3>
            {
              order.id
            }
          </h3>

          <small>
            {formatDate(
              order.createdAt
            )}
          </small>

        </div>

        <b className="admin-status">
          {
            order.status
          }
        </b>

      </div>

      <div className="admin-customer-info">

        <div>

          <span>
            CUSTOMER
          </span>

          <b>
            {
              order.customer
                ?.name
            }
          </b>

        </div>

        <div>

          <span>
            PHONE
          </span>

          <b>
            {
              order.customer
                ?.phone
            }
          </b>

        </div>

        <div>

          <span>
            EMAIL
          </span>

          <b>
            {
              order.customer
                ?.email
            }
          </b>

        </div>

        <div>

          <span>
            TOTAL
          </span>

          <b>
            {money(
              order.total
            )}
          </b>

        </div>

      </div>

      <div className="admin-address">

        <span>
          DELIVERY ADDRESS
        </span>

        <b>
          {
            order.customer
              ?.address
          }
          ,{" "}
          {
            order.customer
              ?.city
          }
          ,{" "}
          {
            order.customer
              ?.state
          }{" "}
          -{" "}
          {
            order.customer
              ?.pincode
          }
        </b>

      </div>

      <div className="admin-order-products">

        {order.items.map(
          (item) => (
            <div
              key={`${order.id}-${item.id}`}
            >

              <img
                src={
                  item.image ||
                  demoImages.lipstick
                }
                alt={
                  item.name
                }
              />

              <span>

                {
                  item.name
                }

                <small>
                  Qty:{" "}
                  {
                    item.quantity
                  }
                </small>

              </span>

            </div>
          )
        )}

      </div>

      {order.cancellationRequested &&
        order.status !==
          "Cancelled" && (
          <div className="admin-cancellation">

            <div>

              <strong>
                ⚠ CANCELLATION REQUEST
              </strong>

              <span>
                Reason:{" "}
                {
                  order.cancellationReason
                }
              </span>

            </div>

            <div>

              <button
                className="danger-admin-button"
                onClick={() =>
                  onUpdate(
                    order.id,
                    {
                      status:
                        "Cancelled",

                      cancellationRequested:
                        false,

                      cancelledAt:
                        new Date().toISOString(),
                    }
                  )
                }
              >
                APPROVE
              </button>

              <button
                className="admin-gold-button-small"
                onClick={() =>
                  onUpdate(
                    order.id,
                    {
                      cancellationRequested:
                        false,
                    }
                  )
                }
              >
                DENY
              </button>

            </div>

          </div>
        )}

      <div className="admin-order-controls">

        <label>
          EXPECTED DELIVERY DATE

          <div className="control-row">

            <input
              type="date"
              value={
                deliveryDate
              }
              onChange={(e) =>
                setDeliveryDate(
                  e.target.value
                )
              }
            />

            <button
              onClick={
                saveDeliveryDate
              }
            >
              SAVE DATE
            </button>

          </div>

        </label>

        <label>
          ORDER STATUS

          <select
            value={
              order.status
            }
            onChange={(e) =>
              onUpdate(
                order.id,
                {
                  status:
                    e.target.value,
                }
              )
            }
          >

            {[
              "Pending",
              "Confirmed",
              "Packed",
              "Shipped",
              "Out for Delivery",
              "Delivered",
              "Cancelled",
              "Rejected",
            ].map(
              (status) => (
                <option
                  key={
                    status
                  }
                  value={
                    status
                  }
                >
                  {
                    status
                  }
                </option>
              )
            )}

          </select>

        </label>

      </div>

    </article>
  );
}
function AdminHero({
  hero,
  saveHero,
}) {
  const [form, setForm] = useState({
    label: hero?.label || "",
    title: hero?.title || "",
    description: hero?.description || "",
    discount: hero?.discount || "",
    buttonText: hero?.buttonText || "SHOP NOW",
    image: hero?.image || "",
  });

  const uploadHeroImage = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Hero image must be under 5MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setForm((current) => ({
        ...current,
        image: reader.result,
      }));
    };

    reader.readAsDataURL(file);
  };

  const saveChanges = () => {
    if (!form.title.trim()) {
      alert("Hero title is required.");
      return;
    }

    if (!form.image) {
      alert("Please select a hero image.");
      return;
    }

    saveHero({
      label:
        form.label.trim() ||
        "✦ TRENDING NOW",

      title:
        form.title.trim(),

      description:
        form.description.trim() ||
        "Premium beauty collection",

      discount:
        form.discount.trim() ||
        "40% OFF",

      buttonText:
        form.buttonText.trim() ||
        "SHOP NOW",

      image:
        form.image,
    });
  };

  return (
    <main className="admin-content">

      <div className="admin-section-heading">

        <div>

          <span>
            HOMEPAGE MANAGEMENT
          </span>

          <h2>
            Hero Spotlight
          </h2>

          <p>
            Change the homepage hero
            image, title, description
            and discount without
            editing the code.
          </p>

        </div>

      </div>

      <div className="hero-admin-layout">

        {/* =========================
            PREVIEW
        ========================= */}

        <div className="hero-admin-preview">

          <div className="hero-admin-preview-head">

            <span>
              LIVE PREVIEW
            </span>

            <b>
              HOMEPAGE HERO
            </b>

          </div>

          <div className="hero-admin-card">

            <div className="hero-admin-card-top">

              <span>
                {form.label ||
                  "✦ TRENDING NOW"}
              </span>

              <h3>
                {form.title ||
                  "Glow Edit"}
              </h3>

              <p>
                {form.description ||
                  "Premium beauty collection"}
              </p>

            </div>

            <div className="hero-admin-image">

              {form.image ? (
                <img
                  src={form.image}
                  alt="Hero Preview"
                />
              ) : (
                <div>
                  SELECT IMAGE
                </div>
              )}

              <div className="hero-admin-discount">

                <small>
                  UP TO
                </small>

                <strong>
                  {form.discount ||
                    "40% OFF"}
                </strong>

              </div>

            </div>

          </div>

        </div>


        {/* =========================
            FORM
        ========================= */}

        <div className="hero-admin-form">

          <label>
            SMALL LABEL

            <input
              value={form.label}
              onChange={(e) =>
                setForm({
                  ...form,
                  label: e.target.value,
                })
              }
              placeholder="✦ TRENDING NOW"
            />
          </label>


          <label>
            HERO TITLE

            <input
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                })
              }
              placeholder="Glow Edit"
            />
          </label>


          <label>
            DESCRIPTION

            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description:
                    e.target.value,
                })
              }
              placeholder="Premium beauty collection"
            />
          </label>


          <label>
            DISCOUNT TEXT

            <input
              value={form.discount}
              onChange={(e) =>
                setForm({
                  ...form,
                  discount:
                    e.target.value,
                })
              }
              placeholder="40% OFF"
            />
          </label>


          <label>
            BUTTON TEXT

            <input
              value={form.buttonText}
              onChange={(e) =>
                setForm({
                  ...form,
                  buttonText:
                    e.target.value,
                })
              }
              placeholder="SHOP NOW"
            />
          </label>


          <label>
            HERO IMAGE

            <div className="upload-area hero-upload">

              <input
                type="file"
                accept="image/*"
                onChange={
                  uploadHeroImage
                }
              />

              {form.image ? (
                <img
                  src={form.image}
                  alt="Hero preview"
                />
              ) : (
                <div className="upload-placeholder">

                  <strong>
                    + UPLOAD IMAGE
                  </strong>

                  <small>
                    JPG, PNG, WEBP
                    <br />
                    Maximum 5MB
                  </small>

                </div>
              )}

            </div>

          </label>


          <button
            className="admin-gold-button hero-save-button"
            onClick={saveChanges}
          >
            ✓ SAVE HERO CHANGES
          </button>

        </div>

      </div>

    </main>
  );
}

export default App;