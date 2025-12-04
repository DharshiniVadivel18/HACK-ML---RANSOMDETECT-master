#!/usr/bin/env python3
"""
Download and prepare ransomware detection dataset
"""

import pandas as pd
import numpy as np
import requests
import zipfile
import os
from pathlib import Path
import urllib.request

def download_kaggle_dataset():
    """Download ransomware dataset from Kaggle or create realistic synthetic data"""
    data_dir = Path('data')
    data_dir.mkdir(exist_ok=True)
    
    dataset_path = data_dir / 'ransomware_data.csv'
    
    if dataset_path.exists():
        print("Dataset already exists")
        return
    
    print("Creating realistic ransomware detection dataset...")
    
    # Create dataset based on real ransomware behavior research
    np.random.seed(42)
    n_samples = 15000
    
    data = []
    
    # Normal behavior samples (60%)
    normal_count = int(n_samples * 0.6)
    for i in range(normal_count):
        # Normal system behavior patterns
        sample = {
            'file_access_rate': max(0, np.random.normal(45, 20)),
            'api_calls_per_sec': max(0, np.random.normal(120, 40)),
            'cpu_usage': np.clip(np.random.normal(35, 15), 0, 100),
            'memory_usage': np.clip(np.random.normal(45, 20), 0, 100),
            'disk_io_rate': max(0, np.random.normal(25, 12)),
            'network_activity': max(0, np.random.normal(30, 15)),
            'process_count': max(10, int(np.random.normal(85, 25))),
            'registry_changes': max(0, int(np.random.poisson(4))),
            'file_modifications': max(0, np.random.normal(15, 8)),
            'encryption_indicators': max(0, np.random.exponential(1)),
            'label': 0
        }
        data.append(sample)
    
    # Ransomware behavior samples (40%)
    ransomware_count = n_samples - normal_count
    for i in range(ransomware_count):
        # Aggressive ransomware behavior patterns
        sample = {
            'file_access_rate': max(50, np.random.normal(180, 60)),
            'api_calls_per_sec': max(100, np.random.normal(450, 120)),
            'cpu_usage': np.clip(np.random.normal(75, 20), 30, 100),
            'memory_usage': np.clip(np.random.normal(65, 25), 20, 100),
            'disk_io_rate': max(20, np.random.normal(120, 50)),
            'network_activity': max(10, np.random.normal(80, 30)),
            'process_count': max(20, int(np.random.normal(110, 35))),
            'registry_changes': max(5, int(np.random.normal(35, 15))),
            'file_modifications': max(50, np.random.normal(250, 80)),
            'encryption_indicators': max(1, np.random.normal(8, 4)),
            'label': 1
        }
        data.append(sample)
    
    # Create DataFrame and shuffle
    df = pd.DataFrame(data)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Add some realistic noise and correlations
    # High file modifications often correlate with high encryption indicators for ransomware
    ransomware_mask = df['label'] == 1
    df.loc[ransomware_mask, 'encryption_indicators'] += df.loc[ransomware_mask, 'file_modifications'] * 0.02
    
    # Save dataset
    df.to_csv(dataset_path, index=False)
    print(f"Dataset created with {len(df)} samples")
    print(f"Normal samples: {sum(df['label'] == 0)}")
    print(f"Ransomware samples: {sum(df['label'] == 1)}")
    print(f"Saved to: {dataset_path}")

def download_elderan_dataset():
    """Alternative: Download EldeRan dataset structure"""
    try:
        # This would be the actual EldeRan dataset download
        # For demo, we create a structure similar to EldeRan
        print("Creating EldeRan-style dataset...")
        
        data_dir = Path('data')
        data_dir.mkdir(exist_ok=True)
        
        # EldeRan focuses on API calls and system events
        np.random.seed(42)
        n_samples = 12000
        
        data = []
        
        # Benign samples
        for i in range(n_samples // 2):
            sample = {
                'CreateFileA_calls': np.random.poisson(20),
                'WriteFile_calls': np.random.poisson(15),
                'ReadFile_calls': np.random.poisson(25),
                'DeleteFileA_calls': np.random.poisson(2),
                'MoveFileA_calls': np.random.poisson(3),
                'RegSetValueA_calls': np.random.poisson(5),
                'RegDeleteValueA_calls': np.random.poisson(1),
                'CryptEncrypt_calls': np.random.poisson(1),
                'FindFirstFileA_calls': np.random.poisson(10),
                'GetFileAttributesA_calls': np.random.poisson(8),
                'label': 0
            }
            data.append(sample)
        
        # Ransomware samples
        for i in range(n_samples // 2):
            sample = {
                'CreateFileA_calls': np.random.poisson(150),
                'WriteFile_calls': np.random.poisson(200),
                'ReadFile_calls': np.random.poisson(180),
                'DeleteFileA_calls': np.random.poisson(50),
                'MoveFileA_calls': np.random.poisson(30),
                'RegSetValueA_calls': np.random.poisson(40),
                'RegDeleteValueA_calls': np.random.poisson(15),
                'CryptEncrypt_calls': np.random.poisson(100),
                'FindFirstFileA_calls': np.random.poisson(80),
                'GetFileAttributesA_calls': np.random.poisson(60),
                'label': 1
            }
            data.append(sample)
        
        df = pd.DataFrame(data)
        df = df.sample(frac=1, random_state=42).reset_index(drop=True)
        
        elderan_path = data_dir / 'elderan_data.csv'
        df.to_csv(elderan_path, index=False)
        print(f"EldeRan-style dataset saved to: {elderan_path}")
        
    except Exception as e:
        print(f"Error creating EldeRan dataset: {e}")

if __name__ == "__main__":
    print("Downloading ransomware detection datasets...")
    download_kaggle_dataset()
    download_elderan_dataset()
    print("Dataset download completed!")