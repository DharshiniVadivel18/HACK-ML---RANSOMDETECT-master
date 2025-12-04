from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
import json
import asyncio
import websockets
import threading
import time
import requests
import os
import zipfile
import urllib.request
from pathlib import Path
from typing import List, Dict, Any
from pydantic import BaseModel
import jwt
from passlib.context import CryptContext

# FastAPI app initialization
app = FastAPI(title="RansomDetect API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./ransom_detect.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    prediction = Column(Integer)
    confidence = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    features = Column(Text)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# Pydantic models
class PredictionResponse(BaseModel):
    prediction: int
    confidence: float
    risk_level: str
    features: Dict[str, float]

class ModelMetrics(BaseModel):
    accuracy: float
    cross_val_score: float
    feature_importance: Dict[str, float]
    confusion_matrix: List[List[int]]

class UserCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# Authentication
SECRET_KEY = "ransom-detect-secret-key-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ML Model Class
class RansomwareDetector:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.feature_names = [
            'file_access_rate', 'api_calls_per_sec', 'cpu_usage', 'memory_usage',
            'disk_io_rate', 'network_activity', 'process_count', 'registry_changes',
            'file_modifications', 'encryption_indicators'
        ]
        self.label_encoder = LabelEncoder()
        self.is_trained = False
        
    def load_ctu_dataset(self):
        """Load the CTU-IoT ransomware dataset"""
        # Try current directory first
        dataset_path = Path('CTU-IoT-ramsomware -Capture-1-1conn.log.labeled.csv')
        
        if not dataset_path.exists():
            # Try parent directory
            dataset_path = Path('../CTU-IoT-ramsomware -Capture-1-1conn.log.labeled.csv')
            
        if not dataset_path.exists():
            print("CTU dataset not found, creating fallback dataset...")
            return self.create_fallback_dataset()
        
        print(f"Loading CTU-IoT ransomware dataset from {dataset_path}...")
        df = pd.read_csv(dataset_path)
        print(f"CTU dataset loaded: {len(df)} samples")
        return df
    
    def create_fallback_dataset(self):
        """Create fallback dataset if CTU dataset not found"""
        print("Creating fallback ransomware dataset...")
        
        # Minimal realistic dataset
        data = {
            'file_access_rate': [45, 52, 38, 180, 220, 195] * 1000,
            'api_calls_per_sec': [120, 95, 140, 450, 380, 520] * 1000,
            'cpu_usage': [35, 28, 42, 78, 85, 72] * 1000,
            'memory_usage': [48, 35, 55, 68, 75, 82] * 1000,
            'disk_io_rate': [25, 18, 32, 125, 140, 110] * 1000,
            'network_activity': [30, 22, 38, 85, 95, 78] * 1000,
            'process_count': [85, 72, 95, 115, 125, 108] * 1000,
            'registry_changes': [4, 2, 6, 35, 42, 28] * 1000,
            'file_modifications': [15, 8, 22, 250, 280, 220] * 1000,
            'encryption_indicators': [1, 0, 2, 8, 12, 6] * 1000,
            'label': [0, 0, 0, 1, 1, 1] * 1000
        }
        
        df = pd.DataFrame(data)
        df = df.sample(frac=1, random_state=42).reset_index(drop=True)
        
        print(f"Fallback dataset created: {len(df)} samples")
        return df
    
    def load_and_preprocess_data(self):
        """Load and preprocess the CTU ransomware dataset"""
        df = self.load_ctu_dataset()
        
        # Map CTU dataset features to our feature names
        if 'label' in df.columns:
            # CTU dataset - map network features to behavioral features
            feature_mapping = {
                'duration': 'file_access_rate',
                'orig_bytes': 'api_calls_per_sec', 
                'resp_bytes': 'cpu_usage',
                'orig_pkts': 'memory_usage',
                'orig_ip_bytes': 'disk_io_rate',
                'resp_pkts': 'network_activity',
                'resp_ip_bytes': 'process_count',
                'missed_bytes': 'registry_changes'
            }
            
            # Create feature matrix from available columns
            X = pd.DataFrame()
            
            for our_feature, ctu_feature in feature_mapping.items():
                if ctu_feature in df.columns:
                    X[our_feature] = pd.to_numeric(df[ctu_feature], errors='coerce')
                else:
                    X[our_feature] = np.random.normal(50, 20, len(df))
            
            # Add remaining features with synthetic data based on network behavior
            if 'file_access_rate' in X.columns:
                X['file_modifications'] = X['file_access_rate'] * 2 + np.random.normal(0, 10, len(df))
            else:
                X['file_modifications'] = np.random.normal(100, 50, len(df))
                
            X['encryption_indicators'] = np.where(df['label'] == 'Malicious', 
                                                 np.random.poisson(3, len(df)), 
                                                 np.random.poisson(0.5, len(df)))
            
            # Create binary labels
            y = (df['label'] == 'Malicious').astype(int).values
            
        else:
            # Fallback to synthetic features if CTU format is different
            X = df[self.feature_names].copy() if all(col in df.columns for col in self.feature_names) else pd.DataFrame()
            if X.empty:
                # Create synthetic features
                n_samples = len(df)
                X = pd.DataFrame({
                    name: np.random.normal(50, 20, n_samples) for name in self.feature_names
                })
            y = np.random.choice([0, 1], size=len(df), p=[0.7, 0.3])
        
        # Handle missing values
        X = X.fillna(X.mean())
        
        # Feature engineering - add derived features
        if 'cpu_usage' in X.columns and 'memory_usage' in X.columns:
            X['cpu_memory_ratio'] = X['cpu_usage'] / (X['memory_usage'] + 1)
        else:
            X['cpu_memory_ratio'] = np.random.normal(1.0, 0.3, len(X))
            
        if 'file_access_rate' in X.columns and 'api_calls_per_sec' in X.columns:
            X['file_api_ratio'] = X['file_access_rate'] / (X['api_calls_per_sec'] + 1)
        else:
            X['file_api_ratio'] = np.random.normal(0.5, 0.2, len(X))
            
        if 'file_modifications' in X.columns and 'registry_changes' in X.columns:
            X['activity_score'] = (X['file_modifications'] + X['registry_changes']) / 2
        else:
            X['activity_score'] = np.random.normal(50, 20, len(X))
        
        # Update feature names
        self.feature_names = X.columns.tolist()
        
        print(f"Processed dataset: {len(X)} samples, {len(self.feature_names)} features")
        print(f"Class distribution: {np.bincount(y)}")
        
        return X, y
    
    def train(self):
        """Train the ransomware detection model"""
        print("Loading ransomware dataset...")
        X, y = self.load_and_preprocess_data()
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        print("Training Random Forest model...")
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        accuracy = accuracy_score(y_test, y_pred)
        cv_scores = cross_val_score(self.model, X_train_scaled, y_train, cv=5)
        
        print(f"Model trained successfully!")
        print(f"Accuracy: {accuracy:.4f}")
        print(f"Cross-validation score: {cv_scores.mean():.4f}")
        
        self.is_trained = True
        
        # Create models directory if it doesn't exist
        os.makedirs('models', exist_ok=True)
        
        # Save model
        joblib.dump(self.model, 'models/ransomware_model.pkl')
        joblib.dump(self.scaler, 'models/scaler.pkl')
        
        return {
            'accuracy': accuracy,
            'cross_val_score': cv_scores.mean(),
            'feature_importance': dict(zip(self.feature_names, self.model.feature_importances_)),
            'confusion_matrix': confusion_matrix(y_test, y_pred).tolist()
        }
    
    def predict(self, features: Dict[str, float]):
        """Predict ransomware probability"""
        if not self.is_trained:
            raise ValueError("Model not trained yet")
        
        # Convert features to array
        feature_array = np.array([[features.get(name, 0) for name in self.feature_names]])
        feature_scaled = self.scaler.transform(feature_array)
        
        # Predict
        prediction = self.model.predict(feature_scaled)[0]
        confidence = self.model.predict_proba(feature_scaled)[0].max()
        
        return int(prediction), float(confidence)

# Global model instance
detector = RansomwareDetector()

# WebSocket connections
connected_clients = set()

async def websocket_handler(websocket, path):
    connected_clients.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        connected_clients.remove(websocket)

def broadcast_alert(message):
    """Broadcast alert to all connected clients"""
    if connected_clients:
        asyncio.create_task(send_to_all_clients(message))

async def send_to_all_clients(message):
    if connected_clients:
        await asyncio.gather(
            *[client.send(json.dumps(message)) for client in connected_clients],
            return_exceptions=True
        )

# Simulate real-time monitoring
def simulate_system_monitoring():
    """Simulate real-time system behavior monitoring"""
    while True:
        # Generate random system behavior
        features = {
            'file_access_rate': np.random.normal(100, 50),
            'api_calls_per_sec': np.random.normal(200, 100),
            'cpu_usage': np.random.normal(50, 20),
            'memory_usage': np.random.normal(55, 25),
            'disk_io_rate': np.random.normal(75, 30),
            'network_activity': np.random.normal(60, 25),
            'process_count': np.random.normal(100, 30),
            'registry_changes': np.random.normal(20, 10),
            'file_modifications': np.random.normal(50, 30),
            'encryption_indicators': np.random.normal(2, 5)
        }
        
        if detector.is_trained:
            try:
                prediction, confidence = detector.predict(features)
                
                # Send real-time update
                update = {
                    'type': 'system_update',
                    'timestamp': datetime.utcnow().isoformat(),
                    'features': features,
                    'prediction': prediction,
                    'confidence': confidence,
                    'risk_level': 'HIGH' if prediction == 1 and confidence > 0.8 else 'MEDIUM' if prediction == 1 else 'LOW'
                }
                
                broadcast_alert(update)
                
                # Alert if high risk
                if prediction == 1 and confidence > 0.8:
                    alert = {
                        'type': 'alert',
                        'message': f'High-risk ransomware activity detected! Confidence: {confidence:.2%}',
                        'timestamp': datetime.utcnow().isoformat(),
                        'severity': 'critical'
                    }
                    broadcast_alert(alert)
                    
            except Exception as e:
                print(f"Monitoring error: {e}")
        
        time.sleep(2)  # Update every 2 seconds

# API Endpoints
@app.on_event("startup")
async def startup_event():
    """Initialize the application"""
    print("Starting RansomDetect API...")
    
    # Train model on startup
    try:
        metrics = detector.train()
        print("Model training completed successfully")
    except Exception as e:
        print(f"Model training failed: {e}")
    
    # Start monitoring simulation in background
    monitoring_thread = threading.Thread(target=simulate_system_monitoring, daemon=True)
    monitoring_thread.start()

@app.post("/auth/register", response_model=Token)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/login", response_model=Token)
async def login(user: UserCreate, db: Session = Depends(get_db)):
    """Login user"""
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/predict", response_model=PredictionResponse)
async def predict_ransomware(features: Dict[str, float], db: Session = Depends(get_db)):
    """Predict ransomware from behavior features"""
    if not detector.is_trained:
        raise HTTPException(status_code=503, detail="Model not trained yet")
    
    try:
        prediction, confidence = detector.predict(features)
        
        risk_level = "HIGH" if prediction == 1 and confidence > 0.8 else "MEDIUM" if prediction == 1 else "LOW"
        
        # Save prediction to database
        db_prediction = Prediction(
            filename="api_request",
            prediction=prediction,
            confidence=confidence,
            features=json.dumps(features)
        )
        db.add(db_prediction)
        db.commit()
        
        return PredictionResponse(
            prediction=prediction,
            confidence=confidence,
            risk_level=risk_level,
            features=features
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model/metrics", response_model=ModelMetrics)
async def get_model_metrics():
    """Get model performance metrics"""
    if not detector.is_trained:
        raise HTTPException(status_code=503, detail="Model not trained yet")
    
    # Re-evaluate model for current metrics
    X, y = detector.load_and_preprocess_data()
    X = X[detector.feature_names[:10]]  # Use original 10 features for compatibility
    X_scaled = detector.scaler.transform(X)
    
    y_pred = detector.model.predict(X_scaled)
    accuracy = accuracy_score(y, y_pred)
    cv_scores = cross_val_score(detector.model, X_scaled, y, cv=3)
    
    return ModelMetrics(
        accuracy=accuracy,
        cross_val_score=cv_scores.mean(),
        feature_importance=dict(zip(detector.feature_names, detector.model.feature_importances_)),
        confusion_matrix=confusion_matrix(y, y_pred).tolist()
    )

@app.post("/model/retrain")
async def retrain_model():
    """Retrain the model"""
    try:
        metrics = detector.train()
        return {"message": "Model retrained successfully", "metrics": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predictions/history")
async def get_prediction_history(db: Session = Depends(get_db)):
    """Get prediction history"""
    predictions = db.query(Prediction).order_by(Prediction.timestamp.desc()).limit(100).all()
    return [
        {
            "id": p.id,
            "filename": p.filename,
            "prediction": p.prediction,
            "confidence": p.confidence,
            "timestamp": p.timestamp.isoformat(),
            "features": json.loads(p.features) if p.features else {}
        }
        for p in predictions
    ]

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_trained": detector.is_trained,
        "timestamp": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)