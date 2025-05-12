const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const {
    collection,
    addDoc,
    serverTimestamp,
    doc,
    getDoc
} = require('firebase/firestore');

const { db } = require('./firebaseConfig'); // Firestore config

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

// Socket logic
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('joinChat', async ({ projectId, userId }) => {
        let roomId;

        try {
            if (projectId) {
                // Project-based chat
                const projectRef = doc(db, 'projects', projectId);
                const projectSnap = await getDoc(projectRef);

                if (!projectSnap.exists()) {
                    socket.emit('error', { message: 'Project not found.' });
                    return;
                }

                const project = projectSnap.data();

                // Security check
                const isOwner = project.userId === userId;
                const isCollaborator = project.collaborators?.includes(userId);

                if (!isOwner && !isCollaborator) {
                    socket.emit('unauthorized', { message: 'Access denied to this project chat.' });
                    return;
                }

                roomId = `project_${projectId}`;
            } else {
                // Global chat
                roomId = 'global';
            }

            socket.join(roomId);
            socket.emit('joined', { roomId });
            console.log(`User ${userId} joined room: ${roomId}`);
        } catch (error) {
            console.error('Error in joinChat:', error);
            socket.emit('error', { message: 'Internal server error.' });
        }
    });

    socket.on('sendMessage', async ({ chatType, projectId, chatId, senderId, content }) => {
        const timestamp = serverTimestamp();
        const message = {
            senderId,
            content,
            timestamp
        };

        let roomId;

        try {
            if (chatType === 'project') {// frontend will provide the project id if its a prohect, them general chat will
                // Fetch project from Firestore
                const projectRef = doc(db, 'projects', projectId);
                const projectSnap = await getDoc(projectRef);

                if (!projectSnap.exists()) {
                    socket.emit('error', { message: 'Project not found.' });
                    return;
                }

                const project = projectSnap.data();

                // Security check
                const isOwner = project.userId === senderId;
                const isCollaborator = project.collaborators?.includes(senderId);

                if (!isOwner && !isCollaborator) {
                    socket.emit('unauthorized', { message: 'Access denied to send message.' });
                    return;
                }

                roomId = `project_${projectId}`;
            } else {
                // Global chat
                roomId = 'global';
            }

            // Emit the message to the appropriate room
            io.to(roomId).emit('newMessage', {
                ...message,
                timestamp: new Date().toISOString()
            });

            // Save the message to Firestore
            const messagesRef = collection(db, 'chats', chatId, 'messages');
            await addDoc(messagesRef, message);
        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', { message: 'Failed to send message.' });
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

server.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
