#!/usr/bin/env python3
"""
Test script to verify RansomDetect setup and functionality
"""

import sys
import subprocess
import requests
import time
import json
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8+ required")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro}")
    return True

def check_dependencies():
    """Check if required packages are installed"""
    required_packages = [
        'fastapi', 'uvicorn', 'scikit-learn', 'pandas', 
        'numpy', 'sqlalchemy', 'requests'
    ]
    
    missing = []
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package}")
        except ImportError:
            missing.append(package)
            print(f"❌ {package}")
    
    return len(missing) == 0

def test_model_training():
    """Test ML model training"""
    try:
        from backend.app import RansomwareDetector
        
        print("🧠 Testing ML model...")
        detector = RansomwareDetector()
        
        # Test synthetic data generation
        X, y = detector.generate_synthetic_data(100)
        print(f"✅ Generated {len(X)} samples with {len(X.columns)} features")
        
        # Test model training
        metrics = detector.train()
        print(f"✅ Model trained - Accuracy: {metrics['accuracy']:.3f}")
        
        # Test prediction
        test_features = {
            'file_access_rate': 150.0,
            'api_calls_per_sec': 300.0,
            'cpu_usage': 75.0,
            'memory_usage': 60.0,
            'disk_io_rate': 100.0,
            'network_activity': 50.0,
            'process_count': 90.0,
            'registry_changes': 25.0,
            'file_modifications': 200.0,
            'encryption_indicators': 5.0
        }
        
        prediction, confidence = detector.predict(test_features)
        print(f"✅ Prediction test - Result: {prediction}, Confidence: {confidence:.3f}")
        
        return True
        
    except Exception as e:
        print(f"❌ Model test failed: {e}")
        return False

def test_api_endpoints():
    """Test API endpoints"""
    base_url = "http://localhost:8000"
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health endpoint working")
            return True
        else:
            print(f"❌ Health endpoint returned {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ API connection failed: {e}")
        return False

def run_tests():
    """Run all tests"""
    print("🔍 Running RansomDetect Setup Tests")
    print("=" * 40)
    
    tests = [
        ("Python Version", check_python_version),
        ("Dependencies", check_dependencies),
        ("ML Model", test_model_training),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n📋 Testing {test_name}...")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with error: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 40)
    print("📊 Test Summary:")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {test_name}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! RansomDetect is ready to use.")
        print("\nNext steps:")
        print("1. Start backend: cd backend && python app.py")
        print("2. Start frontend: cd frontend && npm start")
        print("3. Open http://localhost:3000")
    else:
        print("⚠️  Some tests failed. Please check the setup.")
        return False
    
    return True

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)