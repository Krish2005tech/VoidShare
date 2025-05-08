
// import React, { useEffect, useState, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import styles from './DashboardPage.module.css';

// const DashboardPage = () => {
//   const [onlineUsers, setOnlineUsers] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [connectionStatus, setConnectionStatus] = useState("Not connected");
//   const [loading, setLoading] = useState(false);
//   const [connected, setConnected] = useState(false);
//   const [senderProgress, setSenderProgress] = useState(0);
//   const [receiverProgress, setReceiverProgress] = useState(0);
//   const [file, setFile] = useState(null);
//   const [showProfile, setShowProfile] = useState(false);
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const refreshButtonRef = useRef(null);
//   const navigate = useNavigate();

//   const username = localStorage.getItem('username') || 'User';

//   useEffect(() => {
//     fetchOnlineUsers();
//   }, []);

//   const fetchOnlineUsers = () => {
//     // Start refresh animation
//     setIsRefreshing(true);
//     if (refreshButtonRef.current) {
//       refreshButtonRef.current.classList.add(styles.rotating);
//     }
    
//     // Simulate API call with timeout
//     setTimeout(() => {
//       const dummyUsers = ["alice", "bob", "charlie"];
//       setOnlineUsers(dummyUsers);
      
//       // Stop refresh animation
//       setIsRefreshing(false);
//       if (refreshButtonRef.current) {
//         refreshButtonRef.current.classList.remove(styles.rotating);
//       }
//     }, 1500);
//   };

//   const handleUserClick = (user) => {
//     setSelectedUser(user);
//     setLoading(true);
//     setTimeout(() => {
//       setLoading(false);
//       setConnected(true);
//       setConnectionStatus(`Connected with ${user}`);
//     }, 3000);
//   };

//   const handleFileChange = (e) => {
//     const selected = e.target.files[0];
//     setFile(selected);
//   };

//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("username");
//     navigate("/");
//   };

//   return (
//     <div className={styles.container}>
//       <header className={styles.header}>
//         <h1 className={styles.logo}>Voidshare</h1>
//         <div className={styles.profileSection}>
//           <button onClick={() => setShowProfile(!showProfile)} className={styles.profileButton}>
//             {username}
//           </button>
//           {showProfile && (
//             <div className={styles.profilePopup}>
//               <p><strong>Username:</strong> {username}</p>
//               <p><strong>Peer ID:</strong> (hidden)</p>
//               <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
//             </div>
//           )}
//         </div>
//       </header>

//       <div className={styles.card}>
//         <div className={styles.peersHeader}>
//           <h2 className={styles.subHeading}>Online Users</h2>
//           <button 
//             ref={refreshButtonRef}
//             onClick={fetchOnlineUsers} 
//             className={`${styles.refreshIcon} ${isRefreshing ? styles.rotating : ''}`}
//             disabled={isRefreshing}
//           ></button>
//         </div>
//         <div className={styles.usersGrid}>
//           {onlineUsers.map((user) => (
//             <div
//               key={user}
//               className={styles.userCard}
//               onClick={() => handleUserClick(user)}
//             >
//               {user}
//             </div>
//           ))}
//         </div>
//       </div>

//       {loading && (
//         <div className={styles.loader}>Connecting...</div>
//       )}

//       {connected && !loading && (
//         <div className={styles.gridContainer}>
//           <div className={styles.card}>
//             <h3 className={styles.subHeading}>Send File</h3>
//             <div className={styles.fileDropZone}>
//               <p>Drag & Drop or Choose File</p>
//               <input type="file" onChange={handleFileChange} />
//               {file && <p className={styles.fileName}>{file.name}</p>}
//             </div>
//           </div>

//           <div className={styles.card}>
//             <h3 className={styles.subHeading}>Transfer Info</h3>
//             <p className={styles.statusText}><strong>Connection Status:</strong> {connectionStatus}</p>
//             <div className={styles.progressContainer}>
//               <p>Sender Progress</p>
//               <progress value={senderProgress} max="100" className={styles.progressBar}></progress>
//             </div>
//             <div className={styles.progressContainer}>
//               <p>Receiver Progress</p>
//               <progress value={receiverProgress} max="100" className={styles.progressBar}></progress>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DashboardPage;

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DashboardPage.module.css';
import * as crypto from 'crypto'; 
import { initializeAES, generateECCKeys, deriveSharedSecret, encryptFile, decryptFile, encryptAESKey, decryptAESKey, getAESkey, copyKey } from './encryption/utils';



const DashboardPage = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Not connected");
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [senderProgress, setSenderProgress] = useState(0);
  const [receiverProgress, setReceiverProgress] = useState(0);
  const [file, setFile] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshButtonRef = useRef(null);
  const navigate = useNavigate();

  const username = localStorage.getItem('username') || 'User';

  useEffect(() => {
    fetchOnlineUsers();
    checkIncomingFile();
  }, []);

  const fetchOnlineUsers = async () => {
    setIsRefreshing(true);
    if (refreshButtonRef.current) {
      refreshButtonRef.current.classList.add(styles.rotating);
    }

    try {
      const response = await fetch("http://localhost:7000/api/peer/allOnline", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOnlineUsers(data.users || []);
      } else {
        console.error("Failed to fetch online users");
      }
    } catch (error) {
      console.error("Error fetching online users:", error);
    } finally {
      setIsRefreshing(false);
      if (refreshButtonRef.current) {
        refreshButtonRef.current.classList.remove(styles.rotating);
      }
    }
  };

  const handleUserClick = (peer) => {
    setSelectedUser(peer);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setConnected(true);
      setConnectionStatus(`Connected with ${peer}`);
    }, 3000);

    const peer_id = localStorage.getItem("user") || "defaultPeerId";

    const res = fetch(`http://localhost:7000/api/user/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ username: peer_id })
    })
      .then((response) => response.json())
      .then((data) => {
        const externalPublicKey = data.publicKey;
        console.log("Public Key:", externalPublicKey);
        localStorage.setItem("externalpublicKey", externalPublicKey);
           //   if (data && data.publicKey) {
    //     const aesKey = crypto.getRandomValues(new Uint8Array(16)); // Generate random AES key
    //     const encryptedKey = encryptWithPublicKey(data.publicKey, aesKey); // Encrypt AES key with user's public key

    //     // Send the encrypted AES key to the peer
    //     fetch(`http://localhost:7000/api/peer/connect`, {
    //   method: "POST",
    //   headers: {
    //     Authorization: `Bearer ${localStorage.getItem("token")}`,
    //     "Content-Type": "application/json",
    //     "Access-Control-Allow-Origin": "*"
    //   },
    //   body: JSON.stringify({
    //     peer: peer,
    //     encryptedKey: Array.from(encryptedKey) // Convert Uint8Array to array for JSON
    //   })
    //     })
    //   .then((res) => res.json())
    //   .then((result) => {
    //     if (result.success) {
    //       console.log("Connection established and AES key shared successfully.");
    //     } else {
    //       console.error("Failed to establish connection:", result.message);
    //     }
    //   })
    //   .catch((err) => console.error("Error during connection:", err));
    //   } else {
    //     console.error("Failed to fetch public key for the user.");
    //   }
      })
      .catch((err) => console.error("Error fetching user profile:", err));
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);

    // Simulate file sending to the selected user
    if (selectedUser && selected) {
      setSenderProgress(0);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        setSenderProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);

          // Store in localStorage for selectedUser
          const reader = new FileReader();
          reader.onload = () => {
            const fileData = {
              name: selected.name,
              type: selected.type,
              content: reader.result
            };
            localStorage.setItem(`inbox-${selectedUser}`, JSON.stringify(fileData));
          };
          reader.readAsDataURL(selected);
        }
      }, 300);
    }
  };

  const checkIncomingFile = () => {
    const incoming = localStorage.getItem(`inbox-${username}`);
    if (incoming) {
      const fileData = JSON.parse(incoming);
      setReceiverProgress(100);
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = fileData.content;
        link.download = fileData.name;
        link.click();
        localStorage.removeItem(`inbox-${username}`);
      }, 1000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/");
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.logo}>Voidshare</h1>
        <div className={styles.profileSection}>
          <button onClick={() => setShowProfile(!showProfile)} className={styles.profileButton}>
            {username}
          </button>
          {showProfile && (
            <div className={styles.profilePopup}>
              <p><strong>Username:</strong> {username}</p>
              <p><strong>Peer ID:</strong> (hidden)</p>
              <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
            </div>
          )}
        </div>
      </header>

      <div className={styles.card}>
        <div className={styles.peersHeader}>
          <h2 className={styles.subHeading}>Online Users</h2>
          <button 
            ref={refreshButtonRef}
            onClick={fetchOnlineUsers} 
            className={`${styles.refreshIcon} ${isRefreshing ? styles.rotating : ''}`}
            disabled={isRefreshing}
          ></button>
        </div>
        <div className={styles.usersGrid}>
          {onlineUsers.map((user) => (
            <div
              key={user}
              className={styles.userCard}
              onClick={() => handleUserClick(user)}
            >
              {user}
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className={styles.loader}>Connecting...</div>
      )}

      {connected && !loading && (
        <div className={styles.gridContainer}>
          <div className={styles.card}>
            <h3 className={styles.subHeading}>Send File</h3>
            <div className={styles.fileDropZone}>
              <p>Drag & Drop or Choose File</p>
              <input type="file" onChange={handleFileChange} />
              {file && <p className={styles.fileName}>{file.name}</p>}
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.subHeading}>Transfer Info</h3>
            <p className={styles.statusText}><strong>Connection Status:</strong> {connectionStatus}</p>
            <div className={styles.progressContainer}>
              <p>Sender Progress</p>
              <progress value={senderProgress} max="100" id="senderProgressBar" className={styles.progressBar}></progress>
            </div>
            <div className={styles.progressContainer}>
              <p>Receiver Progress</p>
              <progress value={receiverProgress} max="100"id="receiverProgressBar" className={styles.progressBar}></progress>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
