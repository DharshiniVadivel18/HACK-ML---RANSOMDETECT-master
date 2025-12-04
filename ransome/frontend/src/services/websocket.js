import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket?.connected) return;

    this.socket = io('ws://localhost:8000', {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('message', (data) => {
      const message = typeof data === 'string' ? JSON.parse(data) : data;
      this.notifyListeners(message.type, message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  notifyListeners(eventType, data) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Simulate WebSocket for development (since we don't have actual WebSocket server)
  simulateConnection() {
    this.isSimulated = true;
    
    // Simulate system updates every 2 seconds
    setInterval(() => {
      const mockUpdate = {
        type: 'system_update',
        timestamp: new Date().toISOString(),
        features: {
          file_access_rate: Math.random() * 200 + 50,
          api_calls_per_sec: Math.random() * 400 + 100,
          cpu_usage: Math.random() * 80 + 20,
          memory_usage: Math.random() * 70 + 30,
          disk_io_rate: Math.random() * 100 + 20,
          network_activity: Math.random() * 80 + 20,
          process_count: Math.random() * 100 + 50,
          registry_changes: Math.random() * 30 + 5,
          file_modifications: Math.random() * 200 + 10,
          encryption_indicators: Math.random() * 8
        },
        prediction: Math.random() > 0.8 ? 1 : 0,
        confidence: Math.random() * 0.4 + 0.6,
        risk_level: Math.random() > 0.8 ? 'HIGH' : Math.random() > 0.5 ? 'MEDIUM' : 'LOW'
      };
      
      this.notifyListeners('system_update', mockUpdate);
      
      // Occasionally send alerts
      if (Math.random() > 0.95) {
        const alert = {
          type: 'alert',
          message: 'High-risk ransomware activity detected!',
          timestamp: new Date().toISOString(),
          severity: 'critical'
        };
        this.notifyListeners('alert', alert);
      }
    }, 2000);
  }
}

export default new WebSocketService();