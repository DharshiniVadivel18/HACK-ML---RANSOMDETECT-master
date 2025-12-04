#!/usr/bin/env python3
"""
Simple Ransomware Detection App using CTU Dataset
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import StandardScaler
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
from pathlib import Path
import joblib
import os

# Page config
st.set_page_config(
    page_title="RansomDetect - CTU Dataset",
    page_icon="🛡️",
    layout="wide"
)

@st.cache_data
def load_dataset():
    """Load CTU dataset"""
    dataset_path = Path('CTU-IoT-ramsomware -Capture-1-1conn.log.labeled.csv')
    if not dataset_path.exists():
        st.error("CTU dataset not found!")
        return None
    
    df = pd.read_csv(dataset_path)
    return df

@st.cache_data
def preprocess_data(df):
    """Preprocess CTU data for ML"""
    # Select numeric features
    features = ['duration', 'orig_bytes', 'resp_bytes', 'orig_pkts', 
               'orig_ip_bytes', 'resp_pkts', 'resp_ip_bytes', 'missed_bytes']
    
    X = df[features].copy()
    X = X.fillna(0)
    
    # Create labels
    y = (df['label'] == 'Malicious').astype(int)
    
    return X, y

@st.cache_resource
def train_model(X, y):
    """Train Random Forest model"""
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train_scaled, y_train)
    
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    
    return model, scaler, accuracy, X_test, y_test, y_pred

def main():
    st.title("🛡️ RansomDetect - CTU Dataset Analysis")
    st.markdown("Real-time ransomware detection using CTU-IoT dataset")
    
    # Load data
    df = load_dataset()
    if df is None:
        return
    
    # Sidebar
    st.sidebar.header("Dataset Info")
    st.sidebar.metric("Total Samples", len(df))
    st.sidebar.metric("Malicious", len(df[df['label'] == 'Malicious']))
    st.sidebar.metric("Benign", len(df[df['label'] == 'Benign']))
    
    # Main tabs
    tab1, tab2, tab3, tab4 = st.tabs(["📊 Dataset", "🤖 Model", "🔍 Predict", "📈 Analysis"])
    
    with tab1:
        st.header("Dataset Overview")
        
        col1, col2 = st.columns(2)
        
        with col1:
            # Label distribution
            label_counts = df['label'].value_counts()
            fig = px.pie(values=label_counts.values, names=label_counts.index, 
                        title="Label Distribution")
            st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            # Protocol distribution
            proto_counts = df['proto'].value_counts().head(10)
            fig = px.bar(x=proto_counts.index, y=proto_counts.values,
                        title="Protocol Distribution")
            st.plotly_chart(fig, use_container_width=True)
        
        # Sample data
        st.subheader("Sample Data")
        st.dataframe(df.head(100))
    
    with tab2:
        st.header("Model Training & Performance")
        
        # Preprocess and train
        X, y = preprocess_data(df)
        model, scaler, accuracy, X_test, y_test, y_pred = train_model(X, y)
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("Model Accuracy", f"{accuracy:.3f}")
        
        with col2:
            st.metric("Features Used", len(X.columns))
        
        with col3:
            st.metric("Test Samples", len(X_test))
        
        # Feature importance
        feature_importance = pd.DataFrame({
            'feature': X.columns,
            'importance': model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        fig = px.bar(feature_importance, x='importance', y='feature',
                    orientation='h', title="Feature Importance")
        st.plotly_chart(fig, use_container_width=True)
        
        # Classification report
        st.subheader("Classification Report")
        report = classification_report(y_test, y_pred, target_names=['Benign', 'Malicious'], output_dict=True)
        report_df = pd.DataFrame(report).transpose()
        st.dataframe(report_df)
    
    with tab3:
        st.header("Make Predictions")
        
        # Get model
        X, y = preprocess_data(df)
        model, scaler, _, _, _, _ = train_model(X, y)
        
        st.subheader("Enter Network Traffic Features:")
        
        col1, col2 = st.columns(2)
        
        with col1:
            duration = st.number_input("Duration", value=1.0, min_value=0.0)
            orig_bytes = st.number_input("Origin Bytes", value=100, min_value=0)
            resp_bytes = st.number_input("Response Bytes", value=100, min_value=0)
            orig_pkts = st.number_input("Origin Packets", value=5, min_value=0)
        
        with col2:
            orig_ip_bytes = st.number_input("Origin IP Bytes", value=200, min_value=0)
            resp_pkts = st.number_input("Response Packets", value=5, min_value=0)
            resp_ip_bytes = st.number_input("Response IP Bytes", value=200, min_value=0)
            missed_bytes = st.number_input("Missed Bytes", value=0, min_value=0)
        
        if st.button("🔍 Predict", type="primary"):
            # Make prediction
            features = np.array([[duration, orig_bytes, resp_bytes, orig_pkts,
                                orig_ip_bytes, resp_pkts, resp_ip_bytes, missed_bytes]])
            features_scaled = scaler.transform(features)
            
            prediction = model.predict(features_scaled)[0]
            probability = model.predict_proba(features_scaled)[0]
            
            # Display result
            if prediction == 1:
                st.error(f"🚨 MALICIOUS DETECTED! Confidence: {probability[1]:.2%}")
            else:
                st.success(f"✅ BENIGN TRAFFIC Confidence: {probability[0]:.2%}")
            
            # Show probabilities
            prob_df = pd.DataFrame({
                'Class': ['Benign', 'Malicious'],
                'Probability': probability
            })
            
            fig = px.bar(prob_df, x='Class', y='Probability', 
                        title="Prediction Probabilities",
                        color='Class', color_discrete_map={'Benign': 'green', 'Malicious': 'red'})
            st.plotly_chart(fig, use_container_width=True)
    
    with tab4:
        st.header("Traffic Analysis")
        
        # Traffic patterns
        malicious_data = df[df['label'] == 'Malicious']
        benign_data = df[df['label'] == 'Benign']
        
        col1, col2 = st.columns(2)
        
        with col1:
            # Bytes comparison
            fig = go.Figure()
            fig.add_trace(go.Histogram(x=benign_data['orig_bytes'], name='Benign', opacity=0.7))
            fig.add_trace(go.Histogram(x=malicious_data['orig_bytes'], name='Malicious', opacity=0.7))
            fig.update_layout(title="Origin Bytes Distribution", barmode='overlay')
            st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            # Duration comparison
            fig = go.Figure()
            fig.add_trace(go.Histogram(x=benign_data['duration'], name='Benign', opacity=0.7))
            fig.add_trace(go.Histogram(x=malicious_data['duration'], name='Malicious', opacity=0.7))
            fig.update_layout(title="Duration Distribution", barmode='overlay')
            st.plotly_chart(fig, use_container_width=True)
        
        # Service analysis
        st.subheader("Service Analysis")
        service_label = df.groupby(['service', 'label']).size().unstack(fill_value=0)
        fig = px.bar(service_label.head(10), title="Top Services by Label")
        st.plotly_chart(fig, use_container_width=True)

if __name__ == "__main__":
    main()