import { supabase } from "./supabase.js";
import "./loading.js";

document.addEventListener("DOMContentLoaded", () => {
    const phoneForm = document.getElementById("phone-form");
    const signupForm = document.getElementById("signup-form");
    const pinForm = document.getElementById("pin-form");
    const loginLink = document.getElementById("login-link");
    const signupLink = document.getElementById("signup-link");
    const nextBtn = document.getElementById("nextBtn");
    const phoneInput = document.getElementById("phone");

    let currentPhone = "";
    
    // Initialize international phone input
    let iti;
    if (window.intlTelInput) {
        iti = window.intlTelInput(phoneInput, {
            initialCountry: "in",
            preferredCountries: ["in", "us", "gb"],
            utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@20/build/js/utils.js"
        });
    }
    
    // Add a click listener to the "Next" button
    nextBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        
        // Validate phone number
        if (iti && !iti.isValidNumber()) {
            alert("Please enter a valid phone number");
            return;
        } else if (!iti && phoneInput.value.trim().length < 10) {
            alert("Please enter a valid phone number");
            return;
        }
        
        await handlePhoneCheck();
    });

    // Handle switching between forms
    loginLink.addEventListener("click", (e) => {
        e.preventDefault();
        signupForm.classList.add("hidden");
        pinForm.classList.remove("hidden");
    });

    signupLink.addEventListener("click", (e) => {
        e.preventDefault();
        pinForm.classList.add("hidden");
        signupForm.classList.remove("hidden");
    });

    // Handle phone check function
    async function handlePhoneCheck() {
        currentPhone = iti ? iti.getNumber() : phoneInput.value.trim();
        if (!currentPhone) {
            alert("Please enter a valid phone number");
            return;
        }
        
        // Check if Supabase connection failed
        if (window.supabaseConnectionFailed) {
            alert("Database connection issue. Please try again later or contact support.");
            return;
        }
        
        nextBtn.disabled = true;
        nextBtn.textContent = "Checking...";
        window.LoadingManager.show('Checking your phone number...', 'phone-check');

        try {
            // Add timeout and retry logic for GitHub Pages
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("phone", currentPhone)
                .abortSignal(controller.signal)
                .maybeSingle();
                
            clearTimeout(timeoutId);

            if (error && error.code !== "PGRST116") {
                throw error;
            }

            nextBtn.disabled = false;
            nextBtn.textContent = "Next";
            
            if (!data) {
                // User not found → show signup form
                phoneForm.classList.add("hidden");
                signupForm.classList.remove("hidden");
                document.getElementById("signup-phone").value = currentPhone;
            } else {
                // User found → show PIN login form
                phoneForm.classList.add("hidden");
                pinForm.classList.remove("hidden");
            }
        } catch (error) {
            nextBtn.disabled = false;
            nextBtn.textContent = "Next";
            
            if (error.name === 'AbortError') {
                alert("Request timeout. Please check your connection and try again.");
            } else {
                alert("Connection error. Please try again.");
            }
            console.error('Auth error:', error);
        } finally {
            window.LoadingManager.hide('phone-check');
        }
    }

    // Handle phone form submit (for Enter key)
    phoneForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        await handlePhoneCheck();
    });

    // Handle signup
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fname = document.getElementById("fname").value.trim();
        const lname = document.getElementById("lname").value.trim();
        const email = document.getElementById("email").value.trim();
        const pin = document.getElementById("pin").value.trim();
        const confirmPin = document.getElementById("confirm-pin").value.trim();

        // Validation
        if (!fname || !lname || !email || !pin || !confirmPin) {
            alert("Please fill in all fields");
            return;
        }
        
        if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
            alert("PIN must be exactly 4 digits");
            return;
        }
        
        if (pin !== confirmPin) {
            alert("PINs do not match!");
            return;
        }
        
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = "Creating Account...";
        window.LoadingManager.show('Creating your account...', 'signup');

        const { error } = await supabase.from("users").insert([
            {
                first_name: fname,
                last_name: lname,
                email: email,
                phone: currentPhone,
                pin: pin,
            },
        ]);

        submitBtn.disabled = false;
        submitBtn.textContent = "Sign Up";
        window.LoadingManager.hide('signup');
        
        if (error) {
            console.error(error);
            if (error.code === '23505') {
                alert("Email or phone number already exists!");
            } else {
                alert("Signup failed! Please try again.");
            }
        } else {
            console.log("Signup successful ✅");
            localStorage.setItem("userPhone", currentPhone);
            localStorage.setItem("userName", `${fname} ${lname}`);
            window.location.href = "dashboard.html";
        }
    });

    // Handle PIN login
    pinForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const pin = document.getElementById("login-pin").value.trim();
        
        if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
            alert("PIN must be exactly 4 digits");
            return;
        }
        
        const submitBtn = pinForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = "Logging in...";
        window.LoadingManager.show('Logging you in...', 'login');

        const { data, error } = await supabase
            .from("users")
            .select("first_name, last_name, phone")
            .eq("phone", currentPhone)
            .eq("pin", pin)
            .single();

        submitBtn.disabled = false;
        submitBtn.textContent = "Login";
        window.LoadingManager.hide('login');
        
        if (data) {
            console.log("Login success ✅");
            localStorage.setItem("userPhone", currentPhone);
            localStorage.setItem("userName", `${data.first_name} ${data.last_name}`);
            window.location.href = "dashboard.html";
        } else {
            alert("Invalid PIN ❌");
            console.error(error);
        }
    });
});
