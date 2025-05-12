import { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import "./LoginPage.css";
import { initializeAES, generateECCKeys, deriveSharedSecret, encryptFile, decryptFile, encryptAESKey, decryptAESKey, getAESkey, copyKey } from './encryption/utils.js';

const LoginPage = () => {
  const [isNewUser, setIsNewUser] = useState(false); //false for login, true for signup

  // const [username, setUsername] = useState("");
  // const [password, setPassword] = useState("");
  // const [password2, setPassword2] = useState(""); //confirm password field

  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    password2: "" // for signup
  });


  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate(); 

  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");

  const [loading, setLoading] = useState(false); //loading state for the button


  const generateKeys  = async() => {
    // const newPublicKey = "pub_" + Math.random().toString(36).substring(2, 15);
    // const newPrivateKey = "priv_" + Math.random().toString(36).substring(2, 15);
    const keyPair = await generateECCKeys();
    const newPublicKey = keyPair.publicKey;
    const newPrivateKey = keyPair.privateKey;
    setPublicKey(newPublicKey);
    setPrivateKey(newPrivateKey);
  //   localStorage.setItem("publicKey", newPublicKey);
  //   localStorage.setItem("privateKey", newPrivateKey);
   return newPublicKey;
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit_login = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const { username, password } = credentials; // Use the credentials state

    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }
    // Check if the username and password are not empty
    if (username.trim() === "" || password.trim() === "") {
      setError("Please enter both username and password.");
      return;
    }
    setLoading(true);
  
    try {
      const res = await fetch("http://localhost:7000/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
  
      const data = await res.json();
      setLoading(false);

  
      if (!res.ok) {
        setError(data.error || "Login failed.");
      } else {
        setCredentials({ username: "", password: "", password2: "" }); // Clear the credentials state
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", username);
        // localStorage.setItem("password", password); //storing earlier for testing
        setMessage("Login successful!");
        navigate("/dashboard"); 
      }
    } catch (error) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };
  

  const handleSubmit_signup = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const { username, password, password2 } = credentials; // Use the credentials state



    if (password !== password2) {
      setError("Passwords do not match!");
      return;
    }
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }
    //password must be at least 8 characters long
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    setLoading(true);

    const public_key = await generateKeys();


    try {
      const res = await fetch("http://localhost:7000/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password,key:public_key}),
      });

      const data = await res.json();
      setLoading(false);


      if (!res.ok) {
        setError(data.error || "Signup failed.");
      } 
      
      else {

        setMessage("Signup successful! Please log in.");

        // setCredentials(prev => ({
        //   ...prev,
        //   password2: "" // Clear the password2 field
        // }));
        setCredentials({ username: "", password: "", password2: "" }); // Clear the credentials state

        setIsNewUser(false);
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", username);


        navigate("/dashboard"); // Redirect to the dashboard after successful signup
      }
    } catch (error) {
      setError("Network error. Please try again.");
      setLoading(false);

    }
  };

  const handleSwitchMode = () => {
    setIsNewUser(!isNewUser);
    // setUsername("");
    // setPassword("");
    setCredentials({ username: "", password: "", password2: "" }); // Clear the credentials state
    // setPassword2("");
    setError("");
    setMessage("");
  };

  return (
    <>
<h1 style={{color: "blue", textAlign: "center", fontSize: "4rem", fontWeight: "bold", marginBottom: "0.25rem", marginTop: "0.5rem"}}>Voidshare</h1>
<p style={{fontStyle: "italic", textAlign: "center", fontSize: "0.875rem", marginBottom: "1.5rem"}}>Decentralised P2P Encrypted File Sharing System</p>
    <div className="login-container">
     
      {error && <p className="error">{error}</p>}
      {message && <p className="message">{message}</p>}

      {!isNewUser ? (
        <>
          <h2>Login</h2>
          <form onSubmit={handleSubmit_login}>
            <input type="text" placeholder="Username" name="username" value={credentials.username}  onChange={handleInputChange} required />
            <input type="password" placeholder="Password" name="password" value={credentials.password}  onChange={handleInputChange} required />
              <button type="submit" disabled={loading}>
                {loading ? <div className="spinner"></div> : "Login"}
              </button>

          </form>
          <p onClick={handleSwitchMode}>New user? Sign up</p>
        </>
      ) : (
        <>
          <h2>Signup</h2>
          <form onSubmit={handleSubmit_signup}>
            <input type="text" placeholder="Username" name="username" value={credentials.username}  onChange={handleInputChange} required />
            <input type="password" placeholder="Password" name="password" value={credentials.password}  onChange={handleInputChange} required />
            <input type="password" placeholder="Confirm Password" name="password2" value={credentials.password2}  onChange={handleInputChange} required />
            <button type="submit" disabled={loading}>
  {loading ? <div className="spinner"></div> : "Sign Up"}
</button>

          </form>
          <p onClick={handleSwitchMode}>Already have an account? Login</p>
        </>
      )}
    </div>
    </>
  );
};

export default LoginPage;
