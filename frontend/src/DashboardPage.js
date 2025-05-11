import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DashboardPage.module.css';
import { initializeAES, generateECCKeys, deriveSharedSecret, encryptFile, decryptFile, encryptAESKey, decryptAESKey, getAESkey, copyKey } from './encryption/utils.js';


const DashboardPage = () => {
  // State variables
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Not connected");
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [senderProgress, setSenderProgress] = useState(0);
  const [receiverProgress, setReceiverProgress] = useState(0);
  const [file, setFile] = useState(null);
  const [encryptedFile, setEncryptedFile] = useState(null);
  const [receivedEncryptedFile, setReceivedEncryptedFile] = useState(null);
  const [decryptedFileUrl, setDecryptedFileUrl] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [encryptionDone, setEncryptionDone] = useState(false);
  const [fileSent, setFileSent] = useState(false);
  const [fileReceived, setFileReceived] = useState(false);
  const [fileDecrypted, setFileDecrypted] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // P2P related state and refs
  const [peerConnected, setPeerConnected] = useState(false);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const aesKeyRef = useRef(null);
  const incomingChunksRef = useRef([]);
  const expectedChunksRef = useRef(0);
  const fileNameRef = useRef('');
  
  const refreshButtonRef = useRef(null);
  const navigate = useNavigate();

  const username = localStorage.getItem('username') || 'User';
  const SIGNAL_SERVER = 'ws://localhost:8080';
  const CHUNK_SIZE = 64 * 1024; // 64KB per chunk

  useEffect(() => {
    fetchOnlineUsers();
    connectToSignalingServer();

    window.onerror = function (message, source, lineno, colno, error) {
      console.log('Global Error: ', message);
      return true; // Prevent the default browser error handling
    };

    return () => {
      // Clean up WebSocket and RTCPeerConnection when component unmounts
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  // Connect to WebSocket signaling server
  const connectToSignalingServer = () => {
    const peerId = localStorage.getItem('username');
    socketRef.current = new WebSocket(SIGNAL_SERVER);

    socketRef.current.onopen = () => {
      socketRef.current.send(JSON.stringify({ type: 'register', peerId }));
      console.log("Connected to signaling server as", peerId);
      // Request peer list when connected
      socketRef.current.send(JSON.stringify({ type: 'list-peers' }));
    };

    socketRef.current.onmessage = async (msg) => {
      const data = JSON.parse(msg.data);

      switch (data.type) {
        case 'peers':
          // Update online users viA WS
          const filteredPeers = data.peers.filter(peer => peer !== peerId);
          // setOnlineUsers(filteredPeers);
          console.log("Online peers via ws:", filteredPeers);
          break;

        case 'connect-request':
          const accept = window.confirm(`Peer ${data.from} wants to connect. Accept?`);
          socketRef.current.send(JSON.stringify({
            type: 'connect-response',
            accepted: accept,
            to: data.from
          }));

          if (accept) {
            await createWebRTCConnection(false, data.from);
            setSelectedUser(data.from);
            setConnected(true);
            setConnectionStatus(`Connected with ${data.from}`);
            setPeerConnected(true);
          }
          break;

        case 'connect-response':
          if (data.accepted) {
            await createWebRTCConnection(true, data.from);
            setPeerConnected(true);
            setConnectionStatus(`Connected with ${data.from}`);
          } else {
            alert(`Peer ${data.from} rejected your connection request.`);
            setConnectionStatus("Connection rejected");
            setConnected(false);
          }
          setLoading(false);
          break;

        case 'signal':
          await handleSignal(data.from, data.signal);
          break;
      }
    };

    socketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("Connection error with signaling server");
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket connection closed");
      setConnectionStatus("Disconnected from signaling server");
    };
  };

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
        console.log("Online users:", data.users);
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
    try {
    console.log("Selected peer:", peer);
    setSelectedUser(peer);
    setLoading(true);
    
    // Request WebRTC connection to the selected peer
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ 
        type: 'connect-request', 
        targetId: peer 
      }));
    } else {
      alert("Not connected to signaling server. Please refresh the page.");
      setLoading(false);
    }
  }
  
  
  catch (error) {
    console.error("Error handling user click:", error);
  }}

  const createWebRTCConnection = async (isInitiator, remotePeerId) => {
    peerConnectionRef.current = new RTCPeerConnection();

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.send(JSON.stringify({
          type: 'signal',
          to: remotePeerId,
          signal: { candidate: event.candidate }
        }));
      }
    };

    if (isInitiator) {
      dataChannelRef.current = peerConnectionRef.current.createDataChannel('file');
      setupDataChannel();
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      socketRef.current.send(JSON.stringify({
        type: 'signal',
        to: remotePeerId,
        signal: { sdp: offer }
      }));
    } else {
      peerConnectionRef.current.ondatachannel = (event) => {
        dataChannelRef.current = event.channel;
        setupDataChannel();
      };
    }

    peerConnectionRef.current.onconnectionstatechange = () => {
      if (peerConnectionRef.current.connectionState === 'connected') {
        setPeerConnected(true);
        setConnected(true);
        setLoading(false);
        console.log("Peer connected!");
      } else if (peerConnectionRef.current.connectionState === 'disconnected' || 
                peerConnectionRef.current.connectionState === 'failed') {
        setPeerConnected(false);
        setConnectionStatus("Connection lost");
      }
    };
  };

  const handleSignal = async (from, signal) => {
    if (!peerConnectionRef.current) return;
    
    if (signal.sdp) {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      if (signal.sdp.type === 'offer') {
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socketRef.current.send(JSON.stringify({
          type: 'signal',
          to: from,
          signal: { sdp: answer }
        }));
      }
    }
    if (signal.candidate) {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
    }
  };

  const setupDataChannel = () => {
    if (!dataChannelRef.current) return;
    
    dataChannelRef.current.binaryType = 'arraybuffer';

    dataChannelRef.current.onmessage = async (event) => {
      if (typeof event.data === 'string') {
        const meta = JSON.parse(event.data);

        // AES key
        if (meta.aesKey) {
          const receivedAesKey = meta.aesKey;
          aesKeyRef.current = receivedAesKey;
          console.log("AES key received:", receivedAesKey);
        }

        // File metadata
        if (meta.totalChunks && meta.filename) {
          expectedChunksRef.current = meta.totalChunks;
          fileNameRef.current = meta.filename;
          incomingChunksRef.current = [];
          setReceiverProgress(0);
          return;
        }
      } else {
        // Handle binary data (file chunks)
        incomingChunksRef.current.push(new Uint8Array(event.data));
        const percent = Math.floor((incomingChunksRef.current.length / expectedChunksRef.current) * 100);
        setReceiverProgress(percent);

        if (incomingChunksRef.current.length === expectedChunksRef.current) {
          const encryptedBlob = new Blob(incomingChunksRef.current);
          setReceivedEncryptedFile(encryptedBlob);
          setFileReceived(true);
        }
      }
    };

    dataChannelRef.current.onopen = () => {
      console.log("Data channel opened");
      setPeerConnected(true);
    };

    dataChannelRef.current.onclose = () => {
      console.log("Data channel closed");
    };
  };

  // File encryption using Web Crypto API
  const handleEncrypt = async () => {
    if (!file || isSending) return;
    
    setIsEncrypting(true);
    setEncryptionDone(false);
    setFileSent(false);
    
    try {
      // Generate a random AES key
      const aesKey = await window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
      
      // Export the key to raw format for transmission
      const rawKey = await window.crypto.subtle.exportKey("raw", aesKey);
      aesKeyRef.current = new Uint8Array(rawKey);
      
      // Read the file
      const arrayBuffer = await file.arrayBuffer();
      
      // Encrypt the file
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encryptedContent = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        aesKey,
        arrayBuffer
      );
      
      // Combine IV and encrypted content
      const resultBuffer = new Uint8Array(iv.length + encryptedContent.byteLength);
      resultBuffer.set(iv, 0);
      resultBuffer.set(new Uint8Array(encryptedContent), iv.length);
      
      const encryptedBlob = new Blob([resultBuffer], { type: file.type });
      setEncryptedFile(encryptedBlob);
      setEncryptionDone(true);
    } catch (error) {
      console.error("Encryption error:", error);
      alert("Failed to encrypt the file");
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleSend = () => {
    if (!encryptedFile || !dataChannelRef.current || !peerConnected) {
      alert("Cannot send file. Make sure you are connected to a peer and have encrypted a file.");
      return;
    }
    
    setIsSending(true);
    setSenderProgress(0);
    
    const reader = new FileReader();
    reader.onload = async function() {
      const buffer = new Uint8Array(reader.result);
      let offset = 0;
      const totalChunks = Math.ceil(buffer.length / CHUNK_SIZE);
      
      // Send AES key (in base64)
      const aesKeyBase64 = btoa(String.fromCharCode.apply(null, aesKeyRef.current));
      dataChannelRef.current.send(JSON.stringify({ aesKey: aesKeyBase64 }));
      
      // Send file metadata
      dataChannelRef.current.send(JSON.stringify({
        filename: file.name,
        totalChunks
      }));
      
      // Send file chunks
      const sendNextChunk = async () => {
        if (offset < buffer.length) {
          const chunk = buffer.slice(offset, offset + CHUNK_SIZE);
          dataChannelRef.current.send(chunk);
          offset += CHUNK_SIZE;
          
          const percent = Math.floor((offset / buffer.length) * 100);
          setSenderProgress(percent);
          
          // Wait a bit before sending next chunk to avoid congestion
          setTimeout(sendNextChunk, 10);
        } else {
          setFileSent(true);
          setIsSending(false);
        }
      };
      
      sendNextChunk();
    };
    
    reader.readAsArrayBuffer(encryptedFile);
  };

  const handleDecrypt = async () => {
    if (!receivedEncryptedFile || !aesKeyRef.current) {
      alert("No file to decrypt or missing encryption key");
      return;
    }
    
    try {
      // Read the encrypted file
      const arrayBuffer = await receivedEncryptedFile.arrayBuffer();
      const encryptedData = new Uint8Array(arrayBuffer);
      
      // Extract IV (first 12 bytes) and encrypted content
      const iv = encryptedData.slice(0, 12);
      const encryptedContent = encryptedData.slice(12);
      
      // Import the AES key
      const aesKeyBase64 = aesKeyRef.current;
      const binaryString = atob(aesKeyBase64);
      const keyBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        keyBytes[i] = binaryString.charCodeAt(i);
      }
      
      const aesKey = await window.crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );
      
      // Decrypt the content
      const decryptedContent = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        aesKey,
        encryptedContent
      );
      
      // Create a blob from the decrypted content
      const decryptedBlob = new Blob([decryptedContent], { type: "application/octet-stream" });
      const url = URL.createObjectURL(decryptedBlob);
      
      setDecryptedFileUrl(url);
      setFileDecrypted(true);
    } catch (error) {
      console.error("Decryption error:", error);
      alert("Failed to decrypt the file");
    }
  };

  const handleLogout = () => {
    navigate("/");
    const res = fetch("http://localhost:7000/api/user/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ username })
    })
    
    .then((response) => {
      if (response.ok) {
        localStorage.removeItem("username");
        console.log("Logout successful");
        localStorage.removeItem("token");
      } else {
        console.error("Logout failed");
      }
    })
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
          {onlineUsers.length > 0 ? (
            onlineUsers
            .filter(user => user !== undefined) 
             .filter(user => user !== localStorage.getItem('username')) 
            .map((user) => (
              <div
                key={user+Math.random()} // Ensure unique key
                className={`${styles.userCard} ${selectedUser === user ? styles.selectedUser : ''}`}
                onClick={() => handleUserClick(user)}
              >
                {user}
              </div>
            ))
            .map((user) => (
              <div
                key={user+Math.random()} // Ensure unique key
                className={`${styles.userCard} ${selectedUser === user ? styles.selectedUser : ''}`}
                onClick={() => handleUserClick(user)}
              >
                {user}
              </div>
              ))
           
          
          
          ) : (
            <p className={styles.noUsers}>No online users available</p>
          )}
        </div>
      </div>

      {loading && <div className={styles.loader}>Connecting to peer...</div>}

      {connected && !loading && (
        <div className={styles.gridContainer}>
          <div className={styles.card}>
            <h3 className={styles.subHeading}>Send File</h3>
            <div className={styles.fileDropZone}>
              <p>Choose File</p>
              <input type="file" onChange={(e) => {
                setFile(e.target.files[0]);
                setEncryptionDone(false);
                setFileSent(false);
                setFileReceived(false);
                setFileDecrypted(false);
                setDecryptedFileUrl(null);
                setEncryptedFile(null);
                setReceivedEncryptedFile(null);
                setSenderProgress(0);
                setReceiverProgress(0);

              }} />
              {file && <p className={styles.fileName}>{file.name}</p>}

              <button 
                onClick={handleEncrypt} 
                disabled={!file || isEncrypting || encryptionDone} 
                className={styles.actionButton}
              >
                {isEncrypting ? 'Encrypting...' : 'Encrypt File'}
              </button>
              
              {encryptionDone && (
                <a 
                  href={URL.createObjectURL(encryptedFile)} 
                  download={`encrypted-${file.name}`} 
                  className={styles.downloadLink}
                >
                  Download Encrypted File
                </a>
              )}

              <button 
                onClick={handleSend} 
                disabled={!encryptionDone || isSending || !peerConnected} 
                className={`${styles.actionButton} ${!encryptedFile ? styles.disabled : ''}`}
              >
                {isSending ? 'Sending...' : 'Send File'}
              </button>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.subHeading}>Transfer Info</h3>
            <p className={styles.statusText}>
              <strong>Connection Status:</strong> {connectionStatus}
            </p>
            <div className={styles.progressContainer}>
              <p>Sender Progress</p>
              <progress value={senderProgress} max="100" className={styles.progressBar}></progress>
              {fileSent && <p className={styles.successText}>File sent successfully!</p>}
            </div>
            <div className={styles.progressContainer}>
              <p>Receiver Progress</p>
              <progress value={receiverProgress} max="100" className={styles.progressBar}></progress>
              {fileReceived && !fileDecrypted && (
                <button onClick={handleDecrypt} className={styles.actionButton}>
                  Decrypt File
                </button>
              )}
              {fileDecrypted && (
                <a 
                  href={decryptedFileUrl} 
                  download={fileNameRef.current || `decrypted-file`} 
                  className={styles.downloadLink}
                >
                  Download Decrypted File
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;