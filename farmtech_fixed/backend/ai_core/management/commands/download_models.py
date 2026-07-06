import os
import requests
from django.core.management.base import BaseCommand

CROP_SPACE_FILES = [
    "xgboost_78_accuracy_model.joblib",
    "robust_scaler.joblib",
    "label_encoder.joblib",
    "feature_order.json",
]

YIELD_SPACE_FILES = [
    "yield_feature_names.json",
    "V1.1/yield_maize_model.pkl",
    "V1.1/yield_maize_scaler.pkl",
    "V1.1/yield_mango_model.pkl",
    "V1.1/yield_mango_scaler.pkl",
    "V1.1/yield_potato_model.pkl",
    "V1.1/yield_potato_scaler.pkl",
    "V1.1/yield_rice_model.pkl",
    "V1.1/yield_rice_scaler.pkl",
    "V1.1/yield_sorghum_model.pkl",
    "V1.1/yield_sorghum_scaler.pkl",
    "V1.1/yield_tomato_model.pkl",
    "V1.1/yield_tomato_scaler.pkl",
    "V1.1/yield_wheat_model.pkl",
    "V1.1/yield_wheat_scaler.pkl",
]

class Command(BaseCommand):
    help = "Download Crop Recommendation and Yield Prediction models from Hugging Face Spaces"

    def handle(self, *args, **options):
        # 1. Setup paths
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        models_dir = os.path.join(base_dir, "ml_models")
        
        crop_dir = os.path.join(models_dir, "crop_recommendation")
        yield_dir = os.path.join(models_dir, "yield_prediction")

        os.makedirs(crop_dir, exist_ok=True)
        os.makedirs(yield_dir, exist_ok=True)

        # 2. Download Crop Recommendation files
        self.stdout.write("Downloading Crop Recommendation models...")
        for filename in CROP_SPACE_FILES:
            url = f"https://huggingface.co/spaces/Youssef-D1aa/CropRecommend/resolve/main/{filename}"
            local_path = os.path.join(crop_dir, filename)
            self.download_file(url, local_path)

        # 3. Download Yield Prediction files
        self.stdout.write("Downloading Yield Prediction models...")
        for filepath in YIELD_SPACE_FILES:
            url = f"https://huggingface.co/spaces/Youssef-D1aa/yieldpredict/resolve/main/{filepath}"
            # Flatten V1.1 structure locally to make loading simpler
            filename = os.path.basename(filepath)
            local_path = os.path.join(yield_dir, filename)
            self.download_file(url, local_path)

        self.stdout.write("All models downloaded successfully!")

    def download_file(self, url, dest_path):
        self.stdout.write(f"  Fetching: {url}")
        try:
            r = requests.get(url, stream=True, timeout=30)
            r.raise_for_status()
            with open(dest_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            self.stdout.write(f"  Saved to {dest_path}")
        except Exception as e:
            self.stderr.write(f"  Error downloading {url}: {e}")
            if os.path.exists(dest_path):
                os.remove(dest_path)
