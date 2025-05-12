const { io } = require('./server'); // Import socket.io instance from the server file
const { db } = require('./firebaseConfig'); // Firebase Firestore connection

// Listen for connections
io.on('connection', (socket) => {
    console.log('A user connected with socket ID:', socket.id);

    // Handle join chat logic
    socket.on('joinChat', async ({ chatType, projectId, userId }) => {
        try {
            let roomId;

            if (chatType === 'project' && projectId) {
                // Project-based chat
                const projectRef = doc(db, 'projects', projectId);
                const projectSnap = await getDoc(projectRef);

                if (!projectSnap.exists()) {
                    socket.emit('error', { message: 'Project not found.' });
                    return;
                }

                const project = projectSnap.data();
                const isOwner = project.userId === userId;
                const isCollaborator = project.collaborators?.includes(userId);

                if (!isOwner && !isCollaborator) {
                    socket.emit('unauthorized', { message: 'Access denied to this project chat.' });
                    return;
                }

                roomId = `project-${projectId}`;
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

    // Handle sending a message
    socket.on('sendMessage', async (messageData) => {
        try {
            const { chatType, projectId, senderId, receiverId, message, chatId } = messageData;
            let roomId;

            // Determine the chat room (project-based or global)
            if (chatType === 'project' && projectId) {
                // Project-based chat
                const projectRef = doc(db, 'projects', projectId);
                const projectSnap = await getDoc(projectRef);

                if (!projectSnap.exists()) {
                    socket.emit('error', { message: 'Project not found.' });
                    return;
                }

                const project = projectSnap.data();
                const isOwner = project.userId === senderId;
                const isCollaborator = project.collaborators?.includes(senderId);

                if (!isOwner && !isCollaborator) {
                    socket.emit('unauthorized', { message: 'Access denied to send message.' });
                    return;
                }

                roomId = `project-${projectId}`;
            } else {
                // Global chat
                roomId = 'global';
            }

            // Save the message to Firestore in the appropriate chat's 'messages' collection
            await db.collection('chats').doc(chatId).collection('messages').add({
                senderId,
                receiverId,
                message,
                timestamp: new Date(),
            });

            // Emit the message to the relevant chat room (receiver's socket)
            io.to(roomId).emit('newMessage', messageData);
            console.log(`Message sent to room: ${roomId}`);

        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', { message: 'Failed to send message.' });
        }
    });

    // Listen for typing event to notify others in the same room
    socket.on('typing', (userId) => {
        // Emit typing event to the other users in the same chat room
        socket.broadcast.emit('userTyping', userId);
    });

    // Listen for disconnect event
    socket.on('disconnect', () => {
        console.log('A user disconnected with socket ID:', socket.id);
    });
});

// this enables real time updates with the chats