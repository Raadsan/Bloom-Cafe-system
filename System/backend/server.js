// import app from './src/app.js';

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//     console.log(`✅ Server running on port ${PORT}`);
// });

import http from 'http'
import app from './src/app.js'
import { initSocket } from './src/socket.js'

const server = http.createServer(app)

// CONNECT SOCKET
initSocket(server)

server.listen(5000, () => {
  console.log('🚀 Server running on port 5000')
})