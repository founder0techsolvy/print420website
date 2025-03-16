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

 
// ✅ Show Funny Loader with Emoji & Spinning Ring
function showLoader() {
    if (!document.getElementById("customLoader")) {
        const loader = document.createElement("div");
        loader.id = "customLoader";
        loader.style.position = "fixed";
        loader.style.top = "0";
        loader.style.left = "0";
        loader.style.width = "100vw";
        loader.style.height = "100vh";
        loader.style.background = "rgba(255, 255, 255, 0.95)";
        loader.style.display = "flex";
        loader.style.flexDirection = "column";
        loader.style.alignItems = "center";
        loader.style.justifyContent = "center";
        loader.style.color = "#FF0000";
        loader.style.fontSize = "20px";
        loader.style.fontWeight = "bold";
        loader.style.zIndex = "9999";
        loader.style.textAlign = "center";
        loader.style.animation = "pulseBG 3s infinite alternate";

        loader.innerHTML = `
            <div class="spinner-container">
                <div class="spinner"></div>
                <span class="emoji">😂</span>
            </div>
            <p id="loaderMessage" style="margin-top: 15px;">Order confirm hone wala hai, bas ruk jao! 😂</p>

            <style>
                @keyframes pulseBG {
                    0% { background: rgba(255, 255, 255, 0.95); }
                    100% { background: rgba(255, 230, 230, 0.95); }
                }

                .spinner-container {
                    position: relative;
                    width: 80px;
                    height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .emoji {
                    font-size: 40px;
                    position: absolute;
                    z-index: 2;
                    animation: bounce 1s infinite alternate;
                }

                .spinner {
                    width: 80px;
                    height: 80px;
                    border: 5px solid transparent;
                    border-top: 5px solid #FF0000;
                    border-bottom: 5px solid #FF0000;
                    border-radius: 50%;
                    position: absolute;
                    animation: spin 1s linear infinite, changeSpeed 3s infinite alternate;
                    z-index: 1;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes changeSpeed {
                    0% { animation-duration: 1s; }
                    100% { animation-duration: 0.5s; }
                }

                @keyframes bounce {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-10px); }
                }
            </style>
        `;

        document.body.appendChild(loader);
        console.log("✅ Funny Emoji Spinner Loader Added");

        // ✅ Play funny sound
        let audio = new Audio("https://www.myinstants.com/media/sounds/tacobell.mp3"); // Change to funny sound
        audio.play().catch(err => console.warn("Sound play error:", err));

        // ✅ Funny Dynamic Messages List
        let messages = [
            "Kitne maasoom hokar order submit hone ka intezar kar rahe ho... 😂",
            "Bas thoda sa patience, order bhi keh raha hai 'Mujhe bhi confirm hone do bhai!' 🤭",
            "Server abhi soch raha hai: ‘Yeh banda sahi hai, roz kuch naya order daal raha hai!’ 😆",
            "Bhai, ruk jaa... Data udne wala hai NASA se bhi tez! 🚀",
            "Tum jitna wait kar rahe ho, server utna hi confused hai! 🫠",
            "Order soch raha hai ‘Kya mai sach mein hone wala hoon?!’ 😳",
            "Ruko zara, sabar karo... Yeh coding hai, magic nahi! 🧙‍♂️✨",
            "Bas ab final confirmation ho raha hai, tab tak chai pee lo! ☕",
            "Tum aur wait kar sakte ho, par server ke emotions nahi! 😂",
            "Order confirm ho gaya toh treat dena bhai! 🍕"
        ];

        let emojis = ["😂", "🤣", "🤭", "😆", "🤪", "🫠", "😳", "🤯", "🧙‍♂️", "🍕"];

        // ✅ Change messages & emoji dynamically every 3 seconds
        let i = 0;
        let messageInterval = setInterval(() => {
            if (document.getElementById("loaderMessage")) {
                document.getElementById("loaderMessage").textContent = messages[i];
                document.querySelector(".emoji").textContent = emojis[i]; // Change emoji
                i = (i + 1) % messages.length;
            } else {
                clearInterval(messageInterval);
            }
        }, 3000);
    }
}

// ✅ Hide Loader Function
function hideLoader() {
    const loader = document.getElementById("customLoader");
    if (loader) {
        loader.remove();
        console.log("✅ Funny Loader Removed");
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

                   
