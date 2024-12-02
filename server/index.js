import express from 'express';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { Server } from 'socket.io';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as Humanjs from '@vladmandic/human';   
import e from 'express';


const config = { 
    backend: "webgl",
    modelBasePath: 'file://models/',
    emotions: { enable: 'true' },
    face: {
        detection: {
            maxDetected: 3,
        }
    }
};

const human = new Humanjs.Human(config);

const app = express();
const server = createServer(app);
const io = new Server(server, {
    pingTimeout: 180000,
    pingInterval: 180000,
    maxHttpBufferSize: 1e8,
    cors: {
        origin: 'http://localhost:5173',
    }
});

io.on('connection', (_socket) => {
    console.log('a user connected');
    _socket.on("image2", async (data) => {
        if (!data) {
            return;
        }
        const buffer = Buffer.from(data);
        const tensor = human.tf.node.decodeImage(buffer);

        console.log('tensor type', tensor);
        const result = await human.detect(tensor);
        console.log('human result', result);
        
        _socket.emit('data', result);
    });
});

server.listen(3006, () => {
    console.log('server running at http://localhost:3006');
});