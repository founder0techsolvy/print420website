// ✅ Firebase Import
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"; // Add Storage import

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
          
          const uploadImage = (imgData, imgName) => {
    return new Promise(async (resolve, reject) => {
        if (!imgData.startsWith("data:image/")) return resolve(imgData);

        const blob = await fetch(imgData).then(r => r.blob());
        const storageRef = ref(storage, `orders/${user.uid}/${Date.now()}_${imgName}`);

        const uploadTask = uploadBytesResumable(storageRef, blob);

        uploadTask.on("state_changed",
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                updateProgressBar(progress); // Update progress bar
            },
            (error) => {
                console.error("Upload Error:", error);
                reject(error);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
            }
        );
    });
};
          // Save order with image URLs
          // Save order with paymentStatus
const [image1Url, image2Url] = await Promise.all([
    uploadImage(orderDetails.image1, "design1"),
    uploadImage(orderDetails.image2 || "", "design2")
]);

// ✅ Save Order to Firestore
await saveOrderToFirebase({
    ...orderDetails,
    image1: image1Url,
    image2: image2Url || "No second image",
    email: user.email,
    uid: user.uid,
    paymentId: response.razorpay_payment_id,
    paymentStatus: "Paid",
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

 

function showLoader() {
            if (!document.getElementById("customLoader")) {
                const loader = document.createElement("div");
                loader.id = "customLoader";
                loader.style.position = "fixed";
                loader.style.top = "0";
                loader.style.left = "0";
                loader.style.width = "100vw";
                loader.style.height = "100vh";
                loader.style.background = "#ffffff";
                loader.style.display = "flex";
                loader.style.flexDirection = "column";
                loader.style.alignItems = "center";
                loader.style.justifyContent = "center";
                loader.style.color = "#D32F2F";
                loader.style.fontSize = "18px";
                loader.style.fontWeight = "bold";
                loader.style.zIndex = "9999";

                loader.innerHTML = `
                    <div class="plane-container">
                        ✈️
                    </div>
                    <p id="loaderMessage" style="margin-top: 15px;">Loading... 🚀</p>
                    <div class="progress-container" style="
                        width: 80%;
                        background: #f8d7da;
                        border: 2px solid #D32F2F;
                        border-radius: 10px;
                        margin-top: 20px;
                        height: 25px;
                        overflow: hidden;
                    ">
                        <div class="progress-bar" id="progressBar" style="
                            height: 100%;
                            width: 0%;
                            background: #D32F2F;
                            text-align: center;
                            line-height: 25px;
                            color: #fff;
                            font-weight: bold;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: width 0.3s ease;
                        ">0%</div>
                    </div>
                    <style>
                        .plane-container {
                            font-size: 40px;
                            animation: fly 2s linear infinite alternate;
                        }
                        @keyframes fly {
                            0% { transform: translateX(-50px) translateY(0px) rotate(0deg); }
                            50% { transform: translateX(50px) translateY(-20px) rotate(10deg); }
                            100% { transform: translateX(100px) translateY(-40px) rotate(15deg); }
                        }
                    </style>
                `;

                document.body.appendChild(loader);
                console.log("✅ Paper Plane Loader Added");
            }

            let messages = [
                "Bhai ruk ja, plane runway pe hai... ✈️",
                "Speed badh rahi hai... Thoda aur wait! 🚀",
                "Engine full throttle... Ready to takeoff! 🔥",
                "Ab bas hawa mein uddne wala hai! ☁️",
                "Bhai plane upar chala gaya... Upload done! ✅"
            ];

            let i = 0;
            let messageInterval = setInterval(() => {
                const messageElem = document.getElementById("loaderMessage");
                if (messageElem) {
                    messageElem.textContent = messages[i];
                    i = (i + 1) % messages.length;
                } else {
                    clearInterval(messageInterval);
                }
            }, 2000);
        }

        function updateProgressBar(percentage) {
            const progressBar = document.getElementById("progressBar");
            if (progressBar) {
                percentage = Math.min(100, Math.max(0, percentage));
                progressBar.style.width = percentage + "%";
                progressBar.textContent = percentage + "%";
            } else {
                console.error("❌ Progress bar not found!");
            }
        }

        function hideLoader() {
            const loader = document.getElementById("customLoader");
            if (loader) {
                loader.remove();
                console.log("✅ Paper Plane Loader Removed");
            }
        }

        function startLoading() {
            showLoader();
            let progress = 0;
            let interval = setInterval(() => {
                progress += 20;
                updateProgressBar(progress);
                if (progress >= 100) {
                    clearInterval(interval);
                    setTimeout(() => hideLoader(), 1000);
                }
            }, 800);
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

                   
