#!/usr/bin/env python3
"""
Real WiFi Packet Monitoring for Ransomware Detection
"""

import streamlit as st
import pandas as pd
import numpy as np
import subprocess
import json
import time
import threading
from collections import deque
import plotly.express as px

st.set_page_config(page_title="WiFi Packet Monitor", page_icon="📡", layout="wide")

class WiFiMonitor:
    def __init__(self):
        self.data = deque(maxlen=50)
        self.running = False
        
    def get_wifi_interfaces(self):
        try:
            result = subprocess.run(['iwconfig'], capture_output=True, text=True)
            interfaces = []
            for line in result.stdout.split('\n'):
                if 'IEEE 802.11' in line:
                    interface = line.split()[0]
                    interfaces.append(interface)
            return interfaces
        except:
            return ['wlan0', 'wlp2s0']  # Common WiFi interface names
    
    def capture_packets(self, interface):
        try:
            # Use tcpdump to capture packets (requires sudo)
            cmd = f"timeout 2 tcpdump -i {interface} -c 10 -n 2>/dev/null | wc -l"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            packet_count = int(result.stdout.strip()) if result.stdout.strip().isdigit() else 0
            
            # Get network stats
            with open('/proc/net/dev', 'r') as f:
                lines = f.readlines()
                
            for line in lines:
                if interface in line:
                    parts = line.split()
                    rx_bytes = int(parts[1])
                    tx_bytes = int(parts[9])
                    rx_packets = int(parts[2])
                    tx_packets = int(parts[10])
                    
                    return {
                        'timestamp': time.time(),
                        'interface': interface,
                        'rx_bytes': rx_bytes,
                        'tx_bytes': tx_bytes,
                        'rx_packets': rx_packets,
                        'tx_packets': tx_packets,
                        'packet_count': packet_count
                    }
        except:
            pass
        
        return None
    
    def analyze_traffic(self, stats):
        if not stats:
            return 0, 0.1
            
        # Simple heuristics for suspicious activity
        suspicious_score = 0
        
        # High data transfer rate
        total_bytes = stats['rx_bytes'] + stats['tx_bytes']
        if total_bytes > 1000000:  # > 1MB
            suspicious_score += 0.3
            
        # High packet rate
        total_packets = stats['rx_packets'] + stats['tx_packets']
        if total_packets > 1000:
            suspicious_score += 0.2
            
        # Unusual packet patterns
        if stats['packet_count'] > 8:
            suspicious_score += 0.4
            
        prediction = 1 if suspicious_score > 0.5 else 0
        probability = min(suspicious_score, 0.95)
        
        return prediction, probability
    
    def monitor_loop(self, interface):
        while self.running:
            stats = self.capture_packets(interface)
            if stats:
                prediction, probability = self.analyze_traffic(stats)
                stats.update({
                    'prediction': prediction,
                    'probability': probability
                })
                self.data.append(stats)
            time.sleep(3)
    
    def start(self, interface):
        if not self.running:
            self.running = True
            thread = threading.Thread(target=self.monitor_loop, args=(interface,))
            thread.daemon = True
            thread.start()
    
    def stop(self):
        self.running = False

def main():
    st.title("📡 Real WiFi Ransomware Monitor")
    st.markdown("Monitor your actual WiFi interface for suspicious activity")
    
    # Initialize monitor
    if 'wifi_monitor' not in st.session_state:
        st.session_state.wifi_monitor = WiFiMonitor()
    
    monitor = st.session_state.wifi_monitor
    
    # Interface selection
    interfaces = monitor.get_wifi_interfaces()
    if not interfaces:
        st.error("No WiFi interfaces found!")
        return
    
    selected_interface = st.selectbox("Select WiFi Interface:", interfaces)
    
    # Controls
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("🟢 Start WiFi Monitor", type="primary"):
            monitor.start(selected_interface)
            st.success(f"Monitoring {selected_interface}")
    
    with col2:
        if st.button("🔴 Stop Monitor"):
            monitor.stop()
            st.info("Monitoring stopped")
    
    with col3:
        st.metric("Status", "Active" if monitor.running else "Inactive")
    
    # Display results
    if len(monitor.data) > 0:
        df = pd.DataFrame(list(monitor.data))
        latest = df.iloc[-1]
        
        # Current status
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            threat = "🚨 THREAT" if latest['prediction'] == 1 else "✅ SAFE"
            st.metric("Status", threat)
        with col2:
            st.metric("Probability", f"{latest['probability']:.1%}")
        with col3:
            st.metric("RX Bytes", f"{latest['rx_bytes']:,}")
        with col4:
            st.metric("TX Bytes", f"{latest['tx_bytes']:,}")
        
        # Charts
        col1, col2 = st.columns(2)
        
        with col1:
            fig = px.line(df, x='timestamp', y='probability', 
                         title="Threat Probability")
            fig.add_hline(y=0.5, line_dash="dash", line_color="red")
            st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            fig = px.bar(df.tail(10), x='timestamp', y='packet_count',
                        title="Packet Activity")
            st.plotly_chart(fig, use_container_width=True)
        
        # Alerts
        threats = df[df['prediction'] == 1]
        if len(threats) > 0:
            st.error(f"⚠️ {len(threats)} suspicious activities detected!")
        
        # Recent activity
        st.subheader("Recent WiFi Activity")
        display_df = df[['timestamp', 'prediction', 'probability', 'rx_bytes', 'tx_bytes', 'packet_count']].tail()
        st.dataframe(display_df)
    
    else:
        st.info("Click 'Start WiFi Monitor' to begin monitoring your WiFi traffic")
        
        # Show interface info
        st.subheader("Available WiFi Interfaces")
        for interface in interfaces:
            st.code(interface)
        
        st.warning("Note: This requires network interface access. Run with appropriate permissions.")

if __name__ == "__main__":
    main()