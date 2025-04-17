const SIGNAL_SERVER = 'ws://localhost:8080';
const CHUNK_SIZE = 64 * 1024; // 64KB per chunk

let peerId = Math.random().toString(36).substr(2, 6); // Generate Peer ID dynamically
let socket, peerConnection, dataChannel;

let pendingFile = null;


function showCustomConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('customConfirm');
        const msg = document.getElementById('confirmMessage');
        msg.innerText = message;

        modal.style.display = 'flex';

        const yesBtn = document.getElementById('confirmYesBtn');
        const noBtn = document.getElementById('confirmNoBtn');

        const cleanup = () => {
            modal.style.display = 'none';
            yesBtn.onclick = null;
            noBtn.onclick = null;
        };

        yesBtn.onclick = () => {
            cleanup();
            resolve(true);
        };
        noBtn.onclick = () => {
            cleanup();
            resolve(false);
        };
    });
}

async function connectToSignalingServer() {
    socket = new WebSocket(SIGNAL_SERVER);

    socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'register', peerId }));
        console.log("Connected to signaling server as", peerId);
        updatePeerList();
        document.getElementById('peerIdDisplay').innerText = `Your Peer ID: ${peerId}`; // Display Peer ID to the user
    };

    socket.onmessage = async (msg) => {
        const data = JSON.parse(msg.data);

        switch (data.type) {
            case 'peers':
                // updatePeerSelect(data.peers);
                break;

            case 'connect-request':
                showCustomConfirm(`Peer ${data.from} wants to connect. Accept?`)
                    .then(async (accept) => {
                        socket.send(JSON.stringify({
                            type: 'connect-response',
                            accepted: accept,
                            to: data.from
                        }));

                        if (accept) {
                            await createWebRTCConnection(false, data.from);
                            document.getElementsByClassName('sendbtn')[0].classList.toggle('connected');
                            document.getElementsByClassName('sendinput')[0].classList.toggle('sendinputshow');
                        }
                    });
                break;

            case 'connect-response':
                if (data.accepted) {
                    await createWebRTCConnection(true, data.from);
                    document.getElementsByClassName('rejectionstatus')[0].innerText = `Peer ${data.from} accepted your connection request.`;
                    document.getElementsByClassName('rejectionstatus')[0].style.color = "green";
                    document.getElementsByClassName('rejectionstatus')[0].classList.toggle('rejected');
                    setTimeout(() => {
                        document.getElementsByClassName('rejectionstatus')[0].classList.toggle('rejected');
                    }, 2000);
                    document.getElementsByClassName('sendbtn')[0].classList.toggle('connected');
                    document.getElementsByClassName('sendinput')[0].classList.toggle('sendinputshow');
                } else {
                    // alert(`Peer ${data.from} rejected your connection request.`);
                    document.getElementsByClassName('rejectionstatus')[0].style.color = "red";
                    document.getElementsByClassName('rejectionstatus')[0].innerText = `Peer ${data.from} rejected your connection request.`;
                    document.getElementsByClassName('rejectionstatus')[0].classList.toggle('rejected');
                    setTimeout(() => {
                        document.getElementsByClassName('rejectionstatus')[0].classList.toggle('rejected');
                    }, 2000);
                }
                break;

            case 'signal':
                await handleSignal(data.from, data.signal);
                break;
        }
    };
}

function updatePeerList() {
    socket.send(JSON.stringify({ type: 'list-peers' }));
}

// function updatePeerSelect(peers) {
//     const select = document.getElementById('peerSelect');
//     select.innerHTML = '';
//     peers.forEach(p => {
//         if (p !== peerId) {
//             const option = document.createElement('option');
//             option.value = p;
//             option.textContent = p;
//             select.appendChild(option);
//         }
//     });
// }

function requestPeerConnection() {
    if (!socket || socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED) {
        showStatus("Not connected to the signaling server.", "error");
        return;
    }
    const targetId = document.getElementById('peerIdInput').value;
    if (!targetId) return alert("Enter a Peer ID to connect.");
    console.log(`Attempting to connect to peer with ID: ${targetId}`);
    socket.send(JSON.stringify({ type: 'connect-request', targetId }));
}

async function createWebRTCConnection(isInitiator, remotePeerId) {
    peerConnection = new RTCPeerConnection();

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.send(JSON.stringify({
                type: 'signal',
                to: remotePeerId,
                signal: { candidate: event.candidate }
            }));
        }
    };

    if (isInitiator) {
        dataChannel = peerConnection.createDataChannel('file');
        setupDataChannel();
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.send(JSON.stringify({
            type: 'signal',
            to: remotePeerId,
            signal: { sdp: offer }
        }));
    } else {
        peerConnection.ondatachannel = (event) => {
            dataChannel = event.channel;
            setupDataChannel();
        };
    }

    peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'connected') {
            // document.getElementsByClassName('sendbtn')[0].classList.toggle('connected');
            console.log("Peer connected!");
        }
    };
}

async function handleSignal(from, signal) {
    if (signal.sdp) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        if (signal.sdp.type === 'offer') {
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.send(JSON.stringify({
                type: 'signal',
                to: from,
                signal: { sdp: answer }
            }));
        }
    }
    if (signal.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
    }
}

async function sendEncryptedFile() {
    const fileInput = document.getElementById('fileInput_send');
    if (!fileInput.files.length) return alert("Select a file first");
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = async function () {
        const buffer = new Uint8Array(reader.result);
        let offset = 0;
        const totalChunks = Math.ceil(buffer.length / CHUNK_SIZE);

        dataChannel.send(JSON.stringify({ filename: file.name, totalChunks }));

        while (offset < buffer.length) {
            const chunk = buffer.slice(offset, offset + CHUNK_SIZE);
            dataChannel.send(chunk);
            offset += CHUNK_SIZE;

            const percent = Math.floor((offset / buffer.length) * 100);
            document.getElementById('senderProgressBar').value = percent;
            await new Promise(r => setTimeout(r, 10)); // slight delay to avoid congestion
        }
    };
    reader.readAsArrayBuffer(new Blob([file]));
}

let incomingChunks = [];
let expectedChunks = 0;
let fileName = '';

function setupDataChannel() {
    dataChannel.binaryType = 'arraybuffer';

    dataChannel.onmessage = async (event) => {
        if (typeof event.data === 'string') {
            const meta = JSON.parse(event.data);
            expectedChunks = meta.totalChunks;
            fileName = meta.filename;
            incomingChunks = [];
        } else {
            incomingChunks.push(new Uint8Array(event.data));
            const percent = Math.floor((incomingChunks.length / expectedChunks) * 100);
            document.getElementById('receiverProgressBar').value = percent;

            if (incomingChunks.length === expectedChunks) {
                const encryptedBlob = new Blob(incomingChunks);
                const url = URL.createObjectURL(encryptedBlob);
                const downloadLink = document.getElementById('receiverDownloadLink');
                downloadLink.href = url;
                downloadLink.download = 'received_' + fileName;
                downloadLink.style.display = 'block';
                downloadLink.innerText = 'Download Received File';
            }
        }
    };
}

// Function to copy the Peer ID to clipboard
function copyPeerId() {
    const peerIdText = document.getElementById('peerIdDisplay').innerText;
    const textArea = document.createElement('textarea');
    textArea.value = peerIdText.replace('Your Peer ID: ', ''); // Get only the Peer ID part
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    // alert('Peer ID copied to clipboard!');
    document.getElementById('copyStatus').innerText = 'Copied!';
    document.getElementById('copyStatus').style.display = 'block';
    document.getElementById('copyStatus').style.color = 'green';
    setTimeout(() => {
        document.getElementById('copyStatus').style.display = 'none';
    }, 2000); // Hide after 2 seconds
}

const showStatus = (message, type = '') => {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 5000);
};

const disconnectPeer = () => {
    if (!socket) {
        showStatus("Not connected to the signaling server.", "error");
        return;
    }

    if (socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED) {
        showStatus("Connection is already closed.", "error");
        return;
    }

    socket.close();
    showStatus("Disconnected from signaling server.", "success");
    document.getElementById('peerIdDisplay').innerText = `Not Connected to the server`;
};
