// ✅ Firebase Import
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js"; // Add Storage import

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

// ✅ Firebase Configuration and Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Initialize Storage

// ✅ Start Loader (Common for Login & Checkout Data)

function startLoader() {

if (!document.getElementById("loadingSpinner")) {

const loader = document.createElement("div");

loader.id = "loadingSpinner";

loader.style.position = "fixed";

loader.style.top = "0";

loader.style.left = "0";

loader.style.width = "100vw";

loader.style.height = "100vh";

loader.style.background = "rgba(0, 0, 0, 0.7)";

loader.style.display = "flex";

loader.style.alignItems = "center";

loader.style.justifyContent = "center";

loader.style.zIndex = "9999";



loader.innerHTML = `

  <div style="width: 60px; height: 60px; border: 5px solid white; border-top-color: #FF0000; border-radius: 50%; animation: spin 1s linear infinite;"></div>

  <style>@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }</style>

`;



document.body.appendChild(loader);

}

}

// ✅ Stop Loader

function stopLoader() {

const loader = document.getElementById("loadingSpinner");

if (loader) {

loader.remove();

}

}

// ✅ Check Authentication + Load Checkout Data with Loader

startLoader(); // ✅ Loader Start before everything

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

setTimeout(() => { // ✅ Smooth Transition ke liye Delay

const orderDetails = JSON.parse(sessionStorage.getItem("orderDetails"));



if (!orderDetails) {

  alert("⚠ No order details found! Redirecting to home.");

  window.location.href = "index.html";

  return;

}



document.getElementById("orderName").textContent = orderDetails.name;

document.getElementById("orderPrice").textContent = orderDetails.price;

document.getElementById("orderType").textContent = `Product Type: ${orderDetails.type}`;



document.getElementById("orderImage1").src = orderDetails.image1 || "https://via.placeholder.com/200";

document.getElementById("orderImage2").src = orderDetails.image2 || "https://via.placeholder.com/200";



if (orderDetails.image2) {

  document.getElementById("orderImage2").style.display = "block";

}



document.getElementById("fullName").textContent = orderDetails.fullName;

document.getElementById("address").textContent = orderDetails.address;

document.getElementById("city").textContent = orderDetails.city;

document.getElementById("state").textContent = orderDetails.state;

document.getElementById("pincode").textContent = orderDetails.pincode;

document.getElementById("mobile").textContent = orderDetails.mobile;



stopLoader(); // ✅ Loader Stop jab sab kuch load ho jaye

}, 1000);

}

// ✅ Payment Integration with Razorpay
document.getElementById("placeOrderBtn").addEventListener("click", async function() {
  try {
    const orderDetails = JSON.parse(sessionStorage.getItem("orderDetails"));
    const user = auth.currentUser;
    
    if (!user) {
      alert("Please login first!");
      return window.location.href = "login.html";
    }
    
    // Basic Validation
    if (!orderDetails?.price || !orderDetails?.name) {
      throw new Error("Invalid order details");
    }
    
    showLoader();
    
    // Convert Price to Paise
    const amount = parseInt(orderDetails.price.replace(/[^0-9]/g, "")) * 100;
    
    const options = {
      key: "rzp_test_NfDhAFYplEhZEf",
      amount: amount,
      currency: "INR",
      name: "Print 420",
      description: orderDetails.name,
      image: "https://codesparshofficial.github.io/Print420/img12.png",
      prefill: {
        name: orderDetails.fullName,
        email: user.email,
        contact: orderDetails.mobile
      },
      theme: { color: "#FFB3B3" },
      handler: async function(response) {
        try {
          if (!response.razorpay_payment_id) {
            throw new Error("Payment failed");
          }
          
          // Upload Images to Firebase Storage
          const uploadImage = async (imgData, imgName) => {
            if (!imgData.startsWith("data:image/")) return imgData;
            
            const blob = await fetch(imgData).then(r => r.blob());
            const storageRef = ref(storage, `orders/${user.uid}/${Date.now()}_${imgName}`);
            await uploadBytes(storageRef, blob);
            return await getDownloadURL(storageRef);
          };
          
          // Upload both images
          const [image1Url, image2Url] = await Promise.all([
            uploadImage(orderDetails.image1, "design1"),
            uploadImage(orderDetails.image2 || "", "design2")
          ]);
          
          // Save order with image URLs
          // Save order with paymentStatus
await saveOrderToFirebase({
  ...orderDetails,
  image1: image1Url,
  image2: image2Url || "No second image",
  email: user.email,
  uid: user.uid,
  paymentId: response.razorpay_payment_id,
  paymentStatus: "Paid",  // ✅ Payment Status Added
  timestamp: new Date().toISOString()
});

// ✅ Save Order Details in sessionStorage for order-success.html
sessionStorage.setItem("paymentDetails", JSON.stringify({
  orderDetails: {
    name: orderDetails.name,
    price: orderDetails.price
  },
  paymentId: response.razorpay_payment_id,
  paymentStatus: "Paid"
}));

// ✅ Redirect to Order Success Page
window.location.href = "order-success.html";
          
          window.location.href = "order-success.html";
        } catch (error) {
          alert(`Payment Failed: ${error.message}`);
        } finally {
          hideLoader();
        }
      },
      modal: {
        ondismiss: () => {
          alert("Payment cancelled. You can retry payment.");
          hideLoader();
        }
      }
    };
    
    const rzp = new Razorpay(options);
    rzp.open();
    
  } catch (error) {
    alert(`Error: ${error.message}`);
    hideLoader();
  }
});

// ✅ Show Loader Function (100% Working)
// ✅ Show Funny Loader with Real Progress Bar & Gift Animation
function showLoader() {
    if (!document.getElementById("customLoader")) {
        const loader = document.createElement("div");
        loader.id = "customLoader";
        loader.style.position = "fixed";
        loader.style.top = "0";
        loader.style.left = "0";
        loader.style.width = "100vw";
        loader.style.height = "100vh";
        loader.style.background = "rgba(0, 0, 0, 0.9)";
        loader.style.display = "flex";
        loader.style.flexDirection = "column";
        loader.style.alignItems = "center";
        loader.style.justifyContent = "center";
        loader.style.color = "#fff";
        loader.style.fontSize = "18px";
        loader.style.zIndex = "9999";

        loader.innerHTML = `
            <div class="gift-animation">🎁</div>
            <div class="loader-animation"></div>
            <p id="loaderMessage" style="margin-top: 15px; font-weight: bold; color: #FFD700;">Loading... Ek minute bhai! 🤣</p>
            <div class="progress-bar-container">
                <div id="progressBar" class="progress-bar"></div>
            </div>
            <style>
                .loader-animation {
                    width: 50px;
                    height: 50px;
                    border: 6px solid rgba(255, 255, 255, 0.3);
                    border-top-color: #FFD700;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .progress-bar-container {
                    width: 80%;
                    max-width: 320px;
                    height: 10px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 5px;
                    overflow: hidden;
                    margin-top: 15px;
                    border: 2px solid #FFD700;
                }
                .progress-bar {
                    width: 0%;
                    height: 100%;
                    background: linear-gradient(90deg, #FF5733, #FFD700);
                    transition: width 0.4s ease-in-out;
                }
                .gift-animation {
                    font-size: 50px;
                    animation: bounce 1.5s infinite alternate;
                }
                @keyframes bounce {
                    from { transform: translateY(0); }
                    to { transform: translateY(-15px); }
                }
            </style>
        `;

        document.body.appendChild(loader);
        console.log("✅ Premium Loader with Progress & Gift Animation Added");
    }

    // ✅ Funny Dynamic Messages List
    let messages = [
        "Bhai ruk ja, image upload ho rahi hai... 📸😂",
        "Server soch raha hai: ‘Kya banda hai, phir se order de diya!’ 🤦‍♂️",
        "Payment process ho raha hai... Bank wale bhi chill kar rahe hain! 💰🤣",
        "Order confirm ho raha hai... Shadi fix hone jitna time nahi lagega! 💍🔥",
        "NASA se tez data transfer ho raha hai, bas thoda patience! 🚀",
        "Bhai, 4G thoda slow chal raha hai... Network tower ko haath jodo! 📶🙏",
        "Order confirm ho raha hai... Tab tak ek chai pi lo! ☕",
        "Server bhi thoda shocked hai: ‘Aaj phir order?!’ 😂",
        "CPU garam ho gaya, par ho jayega... Bas wait! 🔥",
        "Ho gaya bas! Ekdum finitooo! 🏁🎉"
    ];

    // ✅ Change messages dynamically every 2.5 seconds
    let i = 0;
    let messageInterval = setInterval(() => {
        if (document.getElementById("loaderMessage")) {
            document.getElementById("loaderMessage").textContent = messages[i];
            i = (i + 1) % messages.length;
        } else {
            clearInterval(messageInterval);
        }
    }, 2500);

    // ✅ Real Progress Bar Logic
    let progress = 0;
    let progressInterval = setInterval(() => {
        if (document.getElementById("progressBar")) {
            progress += Math.floor(Math.random() * 15) + 5; // Random speed
            if (progress > 100) progress = 100;
            document.getElementById("progressBar").style.width = `${progress}%`;
            if (progress >= 100) clearInterval(progressInterval);
        } else {
            clearInterval(progressInterval);
        }
    }, 600);
}

// ✅ Hide Loader Function
function hideLoader() {
    const loader = document.getElementById("customLoader");
    if (loader) {
        loader.remove();
        console.log("✅ Premium Loader Removed");
    }
}
 // ✅ Save Order to Firebase Firestore
async function saveOrderToFirebase(order) {

  try {

    const user = auth.currentUser;

    if (!user) throw new Error("User not authenticated");



    // ✅ Get Current Date & Time (Formatted)

    const now = new Date();

    const formattedDateTime = now.toLocaleString("en-IN", { 

      day: "2-digit", month: "2-digit", year: "numeric", 

      hour: "2-digit", minute: "2-digit", second: "2-digit",

      hour12: true 

    });



    const orderWithUID = {

      ...order,

      uid: user.uid,

      createdAt: formattedDateTime // Save formatted date-time

    };



    await addDoc(collection(db, "orders"), orderWithUID);

  } catch (error) {

    throw new Error("Firestore save failed: " + error.message);

  }

}

  



// ✅ Retrieve Payment Details

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

                   
