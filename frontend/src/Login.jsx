import { useState } from "react";
import { login, signup, confirmSignup } from "./auth/auth";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [code, setCode] = useState("");

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
      const user = await login(email, password);
      setUser(user);
    } catch (err) {
      alert(err.message || "Login failed");
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
