// ✅ Firebase Import

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";



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

const storage = getStorage(app); // ✅ Initialize Storage









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











// ✅ Loader Functions

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

    loader.innerHTML = `<div style="width: 60px; height: 60px; border: 5px solid white; border-top-color: #FF0000; border-radius: 50%; animation: spin 1s linear infinite;"></div>

                        <style>@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }</style>`;

    document.body.appendChild(loader);

  }

}



function stopLoader() {

  const loader = document.getElementById("loadingSpinner");

  if (loader) loader.remove();

}



// ✅ Image Upload Function

async function uploadImage(image, userId, imageName) {

  if (!image) return ""; // No image, return empty string

  if (!(image instanceof File)) {

    console.error("❌ Invalid Image Format");

    return "";

  }



  try {

    const storageRef = ref(storage, `orders/${userId}/${imageName}`);

    await uploadBytes(storageRef, image);

    return await getDownloadURL(storageRef);

  } catch (error) {

    console.error("❌ Image Upload Failed:", error);

    return "";

  }

}



// ✅ Save Order to Firestore

async function saveOrder(orderDetails) {

  try {

    startLoader();

    const user = auth.currentUser;

    if (!user) throw new Error("❌ Please log in first");



    console.log("📤 Uploading images...");



    // ✅ Upload Images in Parallel

    const imageResults = await Promise.allSettled([

      uploadImage(orderDetails.image1, user.uid, "design1.jpg"),

      uploadImage(orderDetails.image2, user.uid, "design2.jpg"),

    ]);



    const image1Url = imageResults[0].status === "fulfilled" ? imageResults[0].value : "";

    const image2Url = imageResults[1].status === "fulfilled" ? imageResults[1].value : "";



    // ✅ Prepare Order Data

    const orderData = {

      uid: user.uid,

      name: orderDetails.name,

      email: orderDetails.email,

      mobile: orderDetails.mobile,

      address: orderDetails.address,

      city: orderDetails.city,

      state: orderDetails.state,

      pincode: orderDetails.pincode,

      price: orderDetails.price,

      paymentId: orderDetails.paymentId,

      paymentStatus: orderDetails.paymentStatus,

      type: orderDetails.type,

      image1: image1Url,

      image2: image2Url,

      createdAt: new Date().toISOString()

    };



    // ✅ Save to Firestore

    await addDoc(collection(db, "orders"), orderData);

    console.log("✅ Order Saved Successfully!");

    alert("✅ Order Placed Successfully!");

    window.location.href = "/order-success.html";



  } catch (error) {

    console.error("❌ Error:", error.message);

    alert(`❌ Error: ${error.message}`);

  } finally {

    stopLoader();

  }

}



// ✅ Place Order & Payment Integration

document.getElementById("placeOrderBtn").addEventListener("click", function () {

  const orderDetails = JSON.parse(sessionStorage.getItem("orderDetails"));

  const userEmail = auth.currentUser ? auth.currentUser.email : "guest@example.com";



  if (!orderDetails) {

    alert("❌ Error: Order details missing.");

    return;

  }



  const amount = parseInt(orderDetails.price.replace(/[^\d]/g, "")) * 100; // ✅ Extract numbers only



  const options = {

    key: "rzp_test_NfDhAFYplEhZEf",

    amount: amount,

    currency: "INR",

    name: "Print 420",

    description: orderDetails.name,

    image: "https://codesparshofficial.github.io/Print420/img12.png",

    handler: async function (response) {

      if (!response.razorpay_payment_id) {

        alert("❌ Payment failed! Order not placed.");

        return;

      }



      startLoader();

      await saveOrder({

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

    theme: { color: "#FFB3B3" },

    modal: { ondismiss: function () { alert("⚠ Payment was cancelled. Please try again."); } }

  };



  const rzp1 = new Razorpay(options);

  rzp1.open();

});
