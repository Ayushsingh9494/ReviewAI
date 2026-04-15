"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isSignUp) {
      // Confirm password check
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError(error.message);
      else {
        // Clear confirm password and keep error text styled as info for email
        setConfirmPassword("");
        setError("Account successfully created. Depending on your Supabase settings, you might need to check your email to verify before logging in.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else window.location.href = "/"; // Redirect home on success
    }
    setLoading(false);
  }

  return (
    <div className="login-container app-main">
      <h1 className="login-title">ReviewAI Login</h1>
      <form onSubmit={handleSubmit} className="login-form glass-panel">
        <input
          className="chat-input"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="chat-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        {isSignUp && (
          <input
            className="chat-input"
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        )}
        
        {error && <p style={{ color: error.startsWith('Account success') ? '#22c55e' : '#ff4d4f', fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</p>}
        
        <div className="login-actions" style={{ flexDirection: 'column', gap: '1rem' }}>
          <button 
            type="submit" 
            className="send-button"
            disabled={loading}
          >
            {isSignUp ? "Sign Up" : "Sign In"}
          </button>
          
          <button 
            type="button" 
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setConfirmPassword("");
            }}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-secondary)', 
              cursor: 'pointer',
              fontSize: '0.875rem',
              textDecoration: 'underline'
            }}
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </form>
    </div>
  );
}
