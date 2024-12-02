import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { io } from "socket.io-client";

const socket = io('http://localhost:3006', {
    transports: ["websocket"],
});
const FPS = 3;

export function ReactWebcam() {
    const webCamRef = useRef();
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [currentEmoji, setCurrentEmoji] = useState("😐");
    const [size, setSize] = useState(48);

    const emotionEmojis = {
        happy: "😊",
        sad: "😢",
        angry: "😠",
        surprised: "😲",
        neutral: "😐",
    };
    
    const getEmotionEmoji = (emotions) => {
        if (!Array.isArray(emotions)) return emotionEmojis["neutral"];
        const highestEmotion = emotions.reduce((prev, current) => 
            prev.score > current.score ? prev : current
        );
        return emotionEmojis[highestEmotion.emotion] || "😐";
    };

    useEffect(() => {
        socket.on('connect', () => console.log('Connected', socket.id));

        socket.on('data', (data) => {
            if (data?.face?.[0]) {
                const box = data.face[0].box;
                const centerX = ((box[0] + box[2]) / 2) + 100;
                const centerY = ((box[1] + box[3]) / 2) + 50;
                
                const faceWidth = box[2] - box[0];
                const newSize = Math.max(100, Math.min(300, faceWidth / 2));
                
                setPosition({ x: centerX, y: centerY });
                setSize(newSize);
                setCurrentEmoji(getEmotionEmoji(data.face[0].emotion));
            }
        });

        const interval = setInterval(async () => {
            const img = webCamRef?.current?.getScreenshot();
            if (img) {
                const data = await fetch(img);
                const blob = await data.blob();
                const arraybuffer = await blob.arrayBuffer();
                socket.emit('image2', arraybuffer);
            }
        }, 1000 / FPS);

        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ position: 'relative' }}>
            <Webcam 
                ref={webCamRef} 
                screenshotFormat="image/jpeg"
            />
            <div style={{
                border: '10px solid red',
                position: 'absolute',
                top: `${position.y}px`,
                left: `${position.x}px`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${size}px`
            }}>
                {currentEmoji}
            </div>
        </div>
    );
}