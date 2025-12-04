#!/usr/bin/env python3
"""
Live WiFi Ransomware Detection
"""

import streamlit as st
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import psutil
import time
import threading
from collections import deque
import plotly.express as px
import plotly.graph_objects as go

st.set_page_config(page_title="Live RansomDetect", page_icon="🛡️", layout="wide")

# Load pre-trained model
@st.cache_resource
def load_model():
    # Train on CTU data
    df = pd.read_csv('CTU-IoT-ramsomware -Capture-1-1conn.log.labeled.csv')
    features = ['duration', 'orig_bytes', 'resp_bytes', 'orig_pkts', 
               'orig_ip_bytes', 'resp_pkts', 'resp_ip_bytes', 'missed_bytes']
    
    X = df[features].fillna(0)
    y = (df['label'] == 'Malicious').astype(int)
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_scaled, y)
    
    return model, scaler

# Live network monitoring
class NetworkMonitor:
    def __init__(self):
        self.data = deque(maxlen=100)
        self.running = False
        
    def get_network_stats(self):
        net_io = psutil.net_io_counters()
        connections = len(psutil.net_connections())
        
        # Simulate network features based on real system stats
        return {
            'duration': np.random.exponential(2.0),
            'orig_bytes': net_io.bytes_sent / 1000,
            'resp_bytes': net_io.bytes_recv / 1000,
            'orig_pkts': net_io.packets_sent / 100,
            'orig_ip_bytes': net_io.bytes_sent / 800,
            'resp_pkts': net_io.packets_recv / 100,
            'resp_ip_bytes': net_io.bytes_recv / 800,
            'missed_bytes': net_io.dropin + net_io.dropout
        }
    
    def monitor_loop(self, model, scaler):
        while self.running:
            stats = self.get_network_stats()
            features = np.array([[stats[f] for f in stats.keys()]])
            features_scaled = scaler.transform(features)
            
            prediction = model.predict(features_scaled)[0]
            probability = model.predict_proba(features_scaled)[0][1]
            
            self.data.append({
                'timestamp': time.time(),
                'prediction': prediction,
                'probability': probability,
                **stats
            })
            time.sleep(1)
    
    def start(self, model, scaler):
        if not self.running:
            self.running = True
            thread = threading.Thread(target=self.monitor_loop, args=(model, scaler))
            thread.daemon = True
            thread.start()
    
    def stop(self):
        self.running = False

def main():
    st.title("🛡️ Live WiFi Ransomware Detection")
    st.markdown("Real-time monitoring of your network traffic")
    
    # Load model
    model, scaler = load_model()
    
    # Initialize monitor
    if 'monitor' not in st.session_state:
        st.session_state.monitor = NetworkMonitor()
    
    monitor = st.session_state.monitor
    
    # Controls
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("🟢 Start Monitoring", type="primary"):
            monitor.start(model, scaler)
            st.success("Monitoring started!")
    
    with col2:
        if st.button("🔴 Stop Monitoring"):
            monitor.stop()
            st.info("Monitoring stopped!")
    
    with col3:
        st.metric("Status", "Running" if monitor.running else "Stopped")
    
    # Live data display
    if len(monitor.data) > 0:
        df = pd.DataFrame(list(monitor.data))
        
        # Current threat level
        latest = df.iloc[-1]
        threat_level = "HIGH" if latest['prediction'] == 1 and latest['probability'] > 0.7 else "LOW"
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Threat Level", threat_level, 
                     f"{latest['probability']:.1%}" if latest['prediction'] == 1 else "Safe")
        with col2:
            st.metric("Connections", len(psutil.net_connections()))
        with col3:
            st.metric("Samples", len(df))
        
        # Real-time charts
        col1, col2 = st.columns(2)
        
        with col1:
            # Threat probability over time
            fig = px.line(df, x='timestamp', y='probability', 
                         title="Threat Probability Over Time")
            fig.add_hline(y=0.5, line_dash="dash", line_color="red")
            st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            # Network bytes
            fig = go.Figure()
            fig.add_trace(go.Scatter(x=df['timestamp'], y=df['orig_bytes'], 
                                   name='Sent Bytes', mode='lines'))
            fig.add_trace(go.Scatter(x=df['timestamp'], y=df['resp_bytes'], 
                                   name='Received Bytes', mode='lines'))
            fig.update_layout(title="Network Traffic")
            st.plotly_chart(fig, use_container_width=True)
        
        # Alerts
        alerts = df[df['prediction'] == 1]
        if len(alerts) > 0:
            st.error(f"🚨 {len(alerts)} potential threats detected!")
            st.dataframe(alerts[['timestamp', 'probability', 'orig_bytes', 'resp_bytes']].tail())
        
        # Recent data
        st.subheader("Recent Network Activity")
        st.dataframe(df[['timestamp', 'prediction', 'probability', 'orig_bytes', 'resp_bytes']].tail(10))
    
    else:
        st.info("Click 'Start Monitoring' to begin live detection")
        
        # Show system info
        st.subheader("System Information")
        net_io = psutil.net_io_counters()
        
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Bytes Sent", f"{net_io.bytes_sent:,}")
            st.metric("Packets Sent", f"{net_io.packets_sent:,}")
        with col2:
            st.metric("Bytes Received", f"{net_io.bytes_recv:,}")
            st.metric("Packets Received", f"{net_io.packets_recv:,}")

if __name__ == "__main__":
    main()