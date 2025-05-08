

// import React, { useEffect, useState } from 'react';

// const DashboardPage = () => {
//   const [onlineUsers, setOnlineUsers] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [connectionStatus, setConnectionStatus] = useState("Not connected");
//   const [loading, setLoading] = useState(false);
//   const [connected, setConnected] = useState(false);
//   const [senderProgress, setSenderProgress] = useState(0);
//   const [receiverProgress, setReceiverProgress] = useState(0);
//   const [file, setFile] = useState(null);

//   useEffect(() => {
//     fetchOnlineUsers();
//   }, []);

//   const fetchOnlineUsers = () => {
//     const dummyUsers = ["alice", "bob", "charlie"];
//     setOnlineUsers(dummyUsers);
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

//   const handleRefresh = () => {
//     fetchOnlineUsers();
//     setSelectedUser(null);
//     setConnected(false);
//     setConnectionStatus("Not connected");
//     setSenderProgress(0);
//     setReceiverProgress(0);
//     setFile(null);
//   };

//   return (
//     <div style={styles.container}>
//       <div style={styles.card}>
//         <h2 style={styles.heading}>Online Users</h2>
//         <div style={styles.usersGrid}>
//           {onlineUsers.map((user) => (
//             <div
//               key={user}
//               style={{ ...styles.userCard, ...(selectedUser === user ? styles.userCardSelected : {}) }}
//               onClick={() => handleUserClick(user)}
//             >
//               {user}
//             </div>
//           ))}
//         </div>
//         <button style={styles.refreshButton} onClick={handleRefresh}>🔄 Refresh</button>
//       </div>

//       {loading && <p style={styles.loader}>🔗 Connecting...</p>}

//       {connected && !loading && (
//         <div style={styles.gridContainer}>
//           <div style={styles.card}>
//             <h3 style={styles.subHeading}>📤 Send File</h3>
//             <div style={styles.fileDropZone}>
//               <p>Drag & Drop or Choose File</p>
//               <input type="file" onChange={handleFileChange} />
//               {file && <p style={styles.fileName}>{file.name}</p>}
//             </div>
//           </div>

//           <div style={styles.card}>
//             <h3 style={styles.subHeading}>📊 Transfer Info</h3>
//             <p style={styles.statusText}>Connection Status: {connectionStatus}</p>
//             <div style={styles.progressContainer}>
//               <label>Sender Progress</label>
//               <progress value={senderProgress} max="100" style={styles.progressBar}></progress>
//             </div>
//             <div style={styles.progressContainer}>
//               <label>Receiver Progress</label>
//               <progress value={receiverProgress} max="100" style={styles.progressBar}></progress>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// const styles = {
//   container: {
//     padding: '20px',
//     fontFamily: 'Segoe UI, sans-serif',
//     backgroundColor: '#f4f7fa',
//     minHeight: '100vh'
//   },
//   heading: {
//     fontSize: '26px',
//     fontWeight: '600',
//     marginBottom: '15px',
//     color: '#1e293b'
//   },
//   subHeading: {
//     fontSize: '20px',
//     fontWeight: '500',
//     marginBottom: '10px',
//     color: '#1e293b'
//   },
//   card: {
//     backgroundColor: '#ffffff',
//     borderRadius: '12px',
//     boxShadow: '0 6px 16px rgba(0, 0, 0, 0.06)',
//     padding: '24px',
//     marginBottom: '20px',
//     transition: 'all 0.3s ease-in-out'
//   },
//   usersGrid: {
//     display: 'flex',
//     gap: '12px',
//     flexWrap: 'wrap'
//   },
//   userCard: {
//     backgroundColor: '#e0e7ff',
//     padding: '10px 16px',
//     borderRadius: '8px',
//     cursor: 'pointer',
//     fontWeight: '500',
//     transition: 'transform 0.2s ease',
//     border: '2px solid transparent'
//   },
//   userCardSelected: {
//     backgroundColor: '#c7d2fe',
//     border: '2px solid #6366f1'
//   },
//   refreshButton: {
//     marginTop: '20px',
//     padding: '10px 20px',
//     backgroundColor: '#2563eb',
//     color: 'white',
//     border: 'none',
//     borderRadius: '6px',
//     cursor: 'pointer',
//     fontWeight: '500',
//     transition: 'background-color 0.3s ease'
//   },
//   loader: {
//     textAlign: 'center',
//     fontSize: '18px',
//     fontWeight: '500',
//     color: '#4f46e5',
//     marginTop: '20px'
//   },
//   gridContainer: {
//     display: 'grid',
//     gridTemplateColumns: '1fr 1fr',
//     gap: '20px'
//   },
//   fileDropZone: {
//     border: '2px dashed #94a3b8',
//     padding: '20px',
//     textAlign: 'center',
//     borderRadius: '10px',
//     backgroundColor: '#f8fafc'
//   },
//   fileName: {
//     marginTop: '10px',
//     color: '#475569',
//     fontSize: '14px'
//   },
//   statusText: {
//     marginBottom: '15px',
//     color: '#334155',
//     fontSize: '15px'
//   },
//   progressContainer: {
//     marginBottom: '12px'
//   },
//   progressBar: {
//     width: '100%',
//     height: '14px',
//     borderRadius: '6px'
//   }
// };

// export default DashboardPage;


import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DashboardPage.module.css';

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
  }, []);

  const fetchOnlineUsers = async () => {
    // Start refresh animation
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
      // Stop refresh animation
      setIsRefreshing(false);
      if (refreshButtonRef.current) {
        refreshButtonRef.current.classList.remove(styles.rotating);
      }
    }
  };

  const handleUserClick = (peer) => {
    setSelectedUser(peer);
    setLoading(true);
    // Simulate connection with user
    setTimeout(() => {
      setLoading(false);
      setConnected(true);
      setConnectionStatus(`Connected with ${peer}`);
    }, 3000);

    //websocket connection
    const peer_id = localStorage.getItem("user") || "defaultPeerId";

    //request 
    //wait for response
    // if response is ok
    // fetch public key of user
    const res = fetch(`http://localhost:7000/api/user/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({username: peer_id})
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
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/");
  };

  return (
    <div className={styles.container}>

  <div id="customConfirm" class="modal" style="display:none;">
            <div class="modal-content">
                <p id="confirmMessage">Are you sure?</p>
                <div class="modal-buttons">
                    <button id="confirmYesBtn">Yes</button>
                    <button id="confirmNoBtn">No</button>
                </div>
            </div>
        </div>


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
              <progress value={receiverProgress} max="100" id="receiverProgressBar" className={styles.progressBar}></progress>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;