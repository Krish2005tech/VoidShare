// import { useState } from "react";
// import "./LoginPage.css";
// import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// // import { loginUser, registerUser } from "./api";

// const LoginPage = () => {
//   const [isNewUser, setIsNewUser] = useState(false);
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [password2, setPassword2] = useState("");
//   // const [storedUser, setStoredUser] = useState(null);

//   const handleSubmit_login = (e) => {
//     e.preventDefault();
//     // fetch(central_server_login)
    
    
//     //para - username , password
    
//     //url : http://localhost:7000/api/user/login

//     //res - success - tokenid : Bearer - localstorage 
//     // page - redirect - home
//     //fail - user not found / wrong password

//     //home - middleware - isLogined 

//     setIsNewUser(false); //if else t/f
//     setUsername("");
//     setPassword("");
//     setPassword2("");
//   };

//     const handleSubmit_signup = (e) => {
//       e.preventDefault();
  
//       if (password !== password2) {
//         toast.error("Passwords do not match! Please try again.");
//         setPassword("");
//         setPassword2("");
//         return;
//       }

//     //check passsword1 == password2
//     //  no - then clear and reask to type 
//     //no alert use toast 
//     //yes 
//      //fetch(central_server_login)
//     //para - username , password

//         //url : http://localhost:7000/api/user/register
//     //res - success - tokenid : Bearer - localstorage 
//     // page - redirect - login
//     //fail - user not found / wrong password

//     //home - middleware - isLogined 

//       // setStoredUser({ username, password });
//       setIsNewUser(false);
//       setUsername("");
//       setPassword("");
//       setPassword2("");
  
//   };

//   return (
//     <div className="login-container">
//       {!isNewUser ? 
//       <>
//       <h2>Login</h2>
//       <form onSubmit={handleSubmit_login}>
//         <input
//           type="text"
//           placeholder="Username"
//           value={username}
//           onChange={(e) => setUsername(e.target.value)}
//           required
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//         />
//         <button type="submit">{isNewUser ? "Sign Up" : "Login"}</button>
//       </form>
//       <p onClick={() => {
//         setIsNewUser(!isNewUser);
//         setUsername("");
//       setPassword("");
//         }}>
//         {isNewUser ? "Already have an account? Login" : "New user? Sign up"}
//       </p>
//       </>
//       :
//       <>
//       <h2>Signup</h2>
//       <form onSubmit={handleSubmit_sigunup}>
//         <input
//           type="text"
//           placeholder="Username"
//           value={username}
//           onChange={(e) => setUsername(e.target.value)}
//           required
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//         />
//          <input
//           type="password"
//           placeholder="Confirm Password"
//           value={password2}
//           onChange={(e) => setPassword2(e.target.value)}
//           required
//         />
//         <button type="submit">{isNewUser ? "Sign Up" : "Login"}</button>
//       </form>
//       <p onClick={() => {
//         setIsNewUser(!isNewUser);
//         setUsername("");
//       setPassword("");
//         }}>
//         {isNewUser ? "Already have an account? Login" : "New user? Sign up"}
//       </p>
//       </>
    
    
    
//     }
//     </div>
//   );
// };

// export default LoginPage;

import { useState } from "react";
import "./LoginPage.css";

const LoginPage = () => {
  const [isNewUser, setIsNewUser] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit_login = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await fetch("http://localhost:7000/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed.");
      } else {
        localStorage.setItem("token", data.token);
        setMessage("Login successful!");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    }
  };

  const handleSubmit_signup = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== password2) {
      setError("Passwords do not match!");
      return;
    }

    try {
      const res = await fetch("http://localhost:7000/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed.");
      } else {
        setMessage("Signup successful! Please log in.");
        setIsNewUser(false);
      }
    } catch (error) {
      setError("Network error. Please try again.");
    }
  };

  const handleSwitchMode = () => {
    setIsNewUser(!isNewUser);
    setUsername("");
    setPassword("");
    setPassword2("");
    setError("");
    setMessage("");
  };

  return (
    <div className="login-container">
      {error && <p className="error">{error}</p>}
      {message && <p className="message">{message}</p>}

      {!isNewUser ? (
        <>
          <h2>Login</h2>
          <form onSubmit={handleSubmit_login}>
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">Login</button>
          </form>
          <p onClick={handleSwitchMode}>New user? Sign up</p>
        </>
      ) : (
        <>
          <h2>Signup</h2>
          <form onSubmit={handleSubmit_signup}>
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <input type="password" placeholder="Confirm Password" value={password2} onChange={(e) => setPassword2(e.target.value)} required />
            <button type="submit">Sign Up</button>
          </form>
          <p onClick={handleSwitchMode}>Already have an account? Login</p>
        </>
      )}
    </div>
  );
};

export default LoginPage;
