# Contributing to AI Parking System

Thank you for your interest in contributing to **AI Parking System**! Whether you want to fix a bug, integrate real IoT hardware, connect an ML model, or improve the UI, all contributions are welcome.

---

## 🌟 How You Can Contribute

The project originated as an MVP prototype for a hackathon. The next big frontiers are:
1. **IoT Sensor Ingestion**: Connecting ESP32 / magnetometer / ultrasonic sensors via MQTT or WebSockets.
2. **Computer Vision & ALPR**: Integrating YOLOv8/RT-DETR parking bay occupancy detection and license plate recognition.
3. **Backend & Cloud API**: Migrating client-side `localStorage` data to a scalable database (e.g., PostgreSQL / Redis / Supabase) with real-time multi-device sync.
4. **Mobile UX Enhancements**: Improving navigation directions, Google Maps routing, and push notifications.

---

## 🛠️ Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)
- (Optional for Android builds) [Android Studio](https://developer.android.com/studio) and JDK 17+

### Getting Started
1. **Fork & Clone** the repository:
   ```bash
   git clone https://github.com/<your-username>/AI-Parking-system.git
   cd AI-Parking-system
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the local dev server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Build the production bundle**:
   ```bash
   npm run build
   ```

5. **Sync with Android (Capacitor)**:
   ```bash
   npx cap sync android
   ```

---

## 📋 Pull Request (PR) Workflow

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make minimal, focused, atomic changes.
3. Run linter and build check:
   ```bash
   npm run lint
   npm run build
   ```
4. Commit your changes with descriptive messages:
   ```bash
   git commit -m "feat: add ESP32 MQTT telemetry handler"
   ```
5. Push to your fork and submit a Pull Request to the main branch.

---

## 💬 Community & Questions

Feel free to open an issue in the [GitHub Issues](https://github.com/aadisthunder/AI-Parking-system/issues) tab for discussions, feature requests, or architecture proposals.
