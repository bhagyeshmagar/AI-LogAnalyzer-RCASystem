import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const BROKER_URL = 'http://localhost:8090/ws';

export function useWebSocket(topic, callback) {
    const clientRef = useRef(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS(BROKER_URL),
            onConnect: () => {
                setConnected(true);
                client.subscribe(topic, (message) => {
                    if (callback) {
                        callback(JSON.parse(message.body));
                    }
                });
            },
            onDisconnect: () => {
                setConnected(false);
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
            debug: (str) => {
                // console.debug(str);
            }
        });

        client.activate();
        clientRef.current = client;

        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, [topic, callback]);

    return connected;
}
