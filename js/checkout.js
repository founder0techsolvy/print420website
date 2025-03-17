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

      key: "rzp_live_gzAhFQC3LFakgZ",

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



// ✅ ENGAGING LOADER v2.0 (ULTRA FUN EDITION)

function showLoader() {

  if (!document.getElementById("loadingSpinner")) {

    const dankMessages = [

      "रस्सी को तनाव मत दो... लोड हो रहा है! 🐁",

      "ज़्यादा चाय पी ली क्या? ☕",

      "अरे भाई सांस ले लो... 😮💨",

      "पटाखे फोड़ने का टाइम नहीं है! 🧨",

      "ये तो होगा ही धीरे-धीरे 🐢",

      "अभी 5 और मिनट का इंतज़ार... ⌛",

      "चलो कोई नहीं, मैं भी वेट कर लूंगा 🕴️"

    ];

    

    const loader = document.createElement("div");

    loader.id = "loadingSpinner";

    loader.innerHTML = `

    <div style="

      position: fixed;

      top: 50%;

      left: 50%;

      transform: translate(-50%, -50%);

      text-align: center;

      z-index: 9999;

    ">

      <div style="

        width: 80px;

        height: 80px;

        border: 4px solid #ff6b6b;

        border-top-color: #4ecdc4;

        border-radius: 50%;

        animation: spin 1s linear infinite;

        margin: auto;

        box-shadow: 0 0 20px rgba(255,107,107,0.3);

      "></div>

      

      <div id="dankMessage" style="

        margin-top: 20px;

        color: white;

        font-family: Arial;

        font-size: 1.2em;

        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);

      ">${dankMessages[0]}</div>



      <div style="

        width: 200px;

        height: 8px;

        background: rgba(255,255,255,0.2);

        margin: 20px auto;

        border-radius: 4px;

        overflow: hidden;

      ">

        <div id="progressBar" style="

          width: 0%;

          height: 100%;

          background: linear-gradient(90deg, #ff6b6b, #4ecdc4);

          transition: width 0.3s ease;

        "></div>

      </div>



      <style>

        @keyframes spin { 

          to { transform: rotate(360deg); } 

        }

        @keyframes float {

          0% { transform: translateY(0px); }

          50% { transform: translateY(-10px); }

          100% { transform: translateY(0px); }

        }

      </style>

    </div>`;

    

    document.body.appendChild(loader);

    

    // 🎰 रैंडम मैसेज रोटेटर

    let msgIndex = 0;

    const msgElement = document.getElementById('dankMessage');

    const msgInterval = setInterval(() => {

      msgIndex = (msgIndex + 1) % dankMessages.length;

      msgElement.style.animation = 'none';

      void msgElement.offsetWidth; // Trigger reflow

      msgElement.style.animation = 'float 1.5s ease-in-out';

      msgElement.textContent = dankMessages[msgIndex];

    }, 3000);

    

    // 📊 प्रोग्रेस बार एनिमेशन (सिम्युलेटेड)

    let progress = 0;

    const progressBar = document.getElementById('progressBar');

    const progressInterval = setInterval(() => {

      if (progress < 90) { // 90% तक ही बढ़ाएं 😅

        progress += Math.random() * 10;

        progressBar.style.width = Math.min(progress, 90) + '%';

      }

    }, 800);

    

    // 🧹 क्लीनअप के लिए

    loader._intervals = [msgInterval, progressInterval];

    

    console.log("🚀 लोडर एक्टिवेटेड: अब तो बैठके देखो!");

  }

}



function hideLoader() {

  const loader = document.getElementById("loadingSpinner");

  if (loader) {

    // 🎬 प्रोग्रेस बार को पूरा दिखाएं

    const progressBar = document.getElementById('progressBar');

    if (progressBar) {

      progressBar.style.width = '100%';

      setTimeout(() => loader.remove(), 500); // थोड़ा ड्रामा 😉

    }

    

    // 🧼 इंटरवल क्लियर करें

    if (loader._intervals) {

      loader._intervals.forEach(clearInterval);

    }

    

    console.log("🎉 लोडर को विदा किया! चलो काम पर!");

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



                   

