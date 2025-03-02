// ✅ Firebase Import
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// ✅ Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBaDy2PoG_-KZVYoraD3tpU_C8CUvKQYQk",
  authDomain: "print420-bbf5b.firebaseapp.com",
  projectId: "print420-bbf5b",
  storageBucket: "print420-bbf5b.firebasestorage.app",
  messagingSenderId: "240976479161",
  appId: "1:240976479161:web:930be6bdf355e041df2c68",
  measurementId: "G-M0LMNP8EYK"
};

// ✅ Firebase Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ Check Authentication
onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("⚠ Please login to continue checkout.");
    sessionStorage.setItem("redirectAfterLogin", window.location.href);
    window.location.href = "login.html";
  } else {
    document.getElementById("userEmail").textContent = user.email;
    document.getElementById("userEmail").style.display = "inline-block";
    loadCheckoutData();
  }
});

// ✅ Load Order Details from sessionStorage
function loadCheckoutData() {
  const orderDetails = JSON.parse(sessionStorage.getItem("orderDetails"));

  if (!orderDetails) {
    alert("⚠ No order details found! Redirecting to home.");
    window.location.href = "index.html";
    return;
  }

  // ✅ Set Order Summary
  document.getElementById("orderName").textContent = orderDetails.name;
  document.getElementById("orderPrice").textContent = orderDetails.price;
  document.getElementById("orderType").textContent = `Product Type: ${orderDetails.type}`;

  // ✅ Display Images
  document.getElementById("orderImage1").src = orderDetails.image1 || "https://via.placeholder.com/200";
  document.getElementById("orderImage2").src = orderDetails.image2 || "https://via.placeholder.com/200";

  // ✅ Check if image2 exists, then show it
  if (orderDetails.image2) {
    document.getElementById("orderImage2").style.display = "block";  // ✅ Show Image 2
  }

  // ✅ Set Shipping Details
  document.getElementById("fullName").textContent = orderDetails.fullName;
  document.getElementById("address").textContent = orderDetails.address;
  document.getElementById("city").textContent = orderDetails.city;
  document.getElementById("state").textContent = orderDetails.state;
  document.getElementById("pincode").textContent = orderDetails.pincode;
  document.getElementById("mobile").textContent = orderDetails.mobile;
}

// ✅ Payment Integration with Razorpay
document.getElementById("placeOrderBtn").addEventListener("click", function() {
  const orderDetails = JSON.parse(sessionStorage.getItem("orderDetails"));
  const userEmail = auth.currentUser ? auth.currentUser.email : "guest@example.com";

  if (!orderDetails) {
    alert("❌ Error: Order details missing.");
    return;
  }

  const options = {
    key: "rzp_test_NfDhAFYplEhZEf",
    amount: parseInt(orderDetails.price.replace("₹", "")) * 100,
    currency: "INR",
    name: "Print 420",
    description: orderDetails.name,
    image: "https://codesparshofficial.github.io/Print420/img12.png",
    handler: function(response) {
        if (!response.razorpay_payment_id) {
            alert("❌ Payment failed! Order not placed.");
            return;
        }

        // ✅ Save Payment Details in sessionStorage
        const paymentData = {
            paymentId: response.razorpay_payment_id,
            paymentStatus: "Paid",
            orderDetails: orderDetails
        };

        sessionStorage.setItem("paymentDetails", JSON.stringify(paymentData));
        
        // ✅ Save Order in Firebase
        saveOrderToFirebase({
            ...orderDetails,
            email: userEmail,
            paymentId: response.razorpay_payment_id,
            paymentStatus: "Paid"
        });
    },
    prefill: {
        name: orderDetails.fullName,
        email: userEmail,
        contact: orderDetails.mobile
    },
    theme: { color: "linear-gradient(135deg, #FFB3B3, #FFD1C1)" },
    modal: { ondismiss: function() { alert("⚠ Payment was cancelled. Please try again."); } }
  };

  const rzp1 = new Razorpay(options);
  rzp1.open();
});

// ✅ Save Order to Firebase Firestore
async function saveOrderToFirebase(order) {
  try {
    await addDoc(collection(db, "orders"), order);
    alert("✅ Payment Successful & Order Placed!");

    // ✅ Redirect to Success Page
    window.location.href = "order-success.html";
  } catch (error) {
    alert("❌ Error Saving Order: " + error.message);
  }
}

// ✅ Retrieve Payment Details (For Order Success Page)
function getPaymentDetails() {
  const paymentData = JSON.parse(sessionStorage.getItem("paymentDetails"));

  if (paymentData) {
    console.log("✅ Payment Data Retrieved:", paymentData);
    return paymentData;
  } else {
    console.log("❌ No Payment Data Found.");
    return null;
  }
}
