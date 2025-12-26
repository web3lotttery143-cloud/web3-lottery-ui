import { io, Socket } from 'socket.io-client';

type WebSocketListener = (data: any) => void;
type WebSocketStatusListener = (status: 'connected' | 'disconnected' | 'error', error?: any) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: WebSocketListener[] = [];
  private statusListeners: WebSocketStatusListener[] = [];
  // Socket.IO client usually takes the http url. The namespace is part of the path or connection options.
  // But for socket.io-client, passing the full URL with namespace works.
  private url = 'http://192.168.1.27:3000/lottery-jobs';

  connect() {
    if (this.socket?.connected) {
        return;
    }

    // socket.io-client handles reconnection automatically by default
    this.socket = io(this.url, {
        transports: ['websocket', 'polling'], // Match backend transports
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO Connected');
      this.notifyStatusListeners('connected');
      // Subscribe to the specific event the backend expects
      this.socket?.emit('lottery-jobs');
    });

    this.socket.on('lottery', (data: any) => {
        this.notifyListeners({ type: 'lottery', data });
    });

    this.socket.on('draw', (data: any) => {
        this.notifyListeners({ type: 'draw', data });
    });

    this.socket.on('error', (error: any) => {
        console.error('Socket.IO Error', error);
        this.notifyStatusListeners('error', error);
    });

    this.socket.on('connect_error', (error: any) => {
        console.error('Socket.IO Connection Error', error);
        this.notifyStatusListeners('error', error);
    });

    this.socket.on('disconnect', (reason: any) => {
      console.log('Socket.IO Disconnected', reason);
      this.notifyStatusListeners('disconnected');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Kept for compatibility, but specific events are handled above
  sendMessage(event: string, message?: any) {
    if (this.socket && this.socket.connected) {
        this.socket.emit(event, message);
    } else {
        console.warn('Socket.IO is not connected. Message not sent.');
    }
  }

  addListener(listener: WebSocketListener) {
    this.listeners.push(listener);
  }

  removeListener(listener: WebSocketListener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  addStatusListener(listener: WebSocketStatusListener) {
    this.statusListeners.push(listener);
  }

  removeStatusListener(listener: WebSocketStatusListener) {
    this.statusListeners = this.statusListeners.filter(l => l !== listener);
  }

  private notifyListeners(data: any) {
    this.listeners.forEach(listener => listener(data));
  }

  private notifyStatusListeners(status: 'connected' | 'disconnected' | 'error', error?: any) {
    this.statusListeners.forEach(listener => listener(status, error));
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;