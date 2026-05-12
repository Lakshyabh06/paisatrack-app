import { useState } from "react";
import { login, signup, confirmSignup } from "./auth/auth";
import { useEffect } from "react";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [code, setCode] = useState("");

  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
    
      if (code) {
        exchangeCodeForToken(code);
      }
    }, []);

  const handleSignup = async () => {
    try {
      await signup(email, password);
      alert("Verification code sent to your email");
      setShowConfirm(true);
    } catch (err) {
      alert(err.message || "Signup error");
    }
  };

  const handleConfirm = async () => {
    try {
      await confirmSignup(email, code);
      alert("Account verified. Please sign in.");
      setShowConfirm(false);
      setIsSignup(false);
    } catch (err) {
      alert(err.message || "Verification failed");
    }
  };

  const handleLogin = async () => {

    try {
  
      const userData = {
        email: email,
        username: email
      };
  
      setUser(userData);
  
    } catch (err) {
  
      alert(err.message || "Login failed");
  
    }
  
  };
   
  const handleGoogleLogin = () => {
    const domain = import.meta.env.VITE_COGNITO_DOMAIN;
    const clientId = import.meta.env.VITE_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_REDIRECT_URI;
    
    const url = `${domain}/oauth2/authorize?identity_provider=Google` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&client_id=${clientId}` +
      `&prompt=select_account`;
    
    window.location.href = url;
    };
    const exchangeCodeForToken = async (code) => {
      const domain = import.meta.env.VITE_COGNITO_DOMAIN;
      const clientId = import.meta.env.VITE_CLIENT_ID;
      const redirectUri = import.meta.env.VITE_REDIRECT_URI;
    
      const response = await fetch(`${domain}/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientId,
          code: code,
          redirect_uri: redirectUri,
        }),
      });
    
      const data = await response.json();
      console.log("TOKENS:", data);
    
      if (data.id_token) {
        const payload = JSON.parse(atob(data.id_token.split(".")[1]));
    
        // :white_check_mark: IMPORTANT: keep BOTH id + username
        const userData = {
          id: payload.email,              // Google unique id
          username: payload.email,     // fallback for old system
          email: payload.email,
          name: payload.name,
        };
    
        setUser(userData);

        localStorage.setItem("user", JSON.stringify(userData));
        // :white_check_mark: Store SAME key as old login
        localStorage.setItem("user_id", payload.email);
    
        // Clean URL
        window.history.replaceState({}, document.title, "/");
      }
    };


  return (
    <div className="auth-container">
      <div className="auth-box">
        {/* BRAND */}
        <h2 className="auth-title">
          Paisa<span>Track</span>
        </h2>

        <p className="auth-subtitle">
          Smart expense tracking for better financial control
        </p>

        {!showConfirm ? (
          <>
            <input
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button onClick={isSignup ? handleSignup : handleLogin}>
              {isSignup ? "Sign Up" : "Sign In"}
            </button>

            <button onClick={handleGoogleLogin} style={{ marginTop: "10px" }}>
              Continue with Google
            </button>
              

            <p
              className="auth-switch"
              onClick={() => setIsSignup(!isSignup)}
            >
              {isSignup
                ? "Already have an account? Sign In"
                : "New here? Create an account"}
            </p>
          </>
        ) : (
          <>
            <input
              placeholder="Enter verification code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />

            <button onClick={handleConfirm}>Verify Account</button>
          </>
        )}
      </div>
    </div>
  );
}
