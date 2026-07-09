import unittest
import json
import os
import sys

# Ensure backend package can be imported
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from backend.app import app
from backend.models.database import init_db

class RealEstateAppTests(unittest.TestCase):
    def setUp(self):
        # Configure application for testing
        app.config['TESTING'] = True
        self.client = app.test_client()
        # Initialize/seed test database schema
        init_db()

    def test_get_config(self):
        response = self.client.get('/api/config')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn("gemini_api_configured", data)

    def test_login_invalid_credentials(self):
        response = self.client.post('/api/login', 
            data=json.dumps({"username": "wrong_user", "password": "wrong_password"}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data)
        self.assertFalse(data["success"])
        self.assertEqual(data["error"], "Invalid username or password")

    def test_login_success(self):
        response = self.client.post('/api/login',
            data=json.dumps({"username": "admin", "password": "admin123"}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        self.assertEqual(data["token"], "user_admin")
        self.assertEqual(data["user"]["role"], "admin")

    def test_get_projects_unauthorized(self):
        response = self.client.get('/api/projects')
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data)
        self.assertEqual(data["error"], "Unauthorized")

    def test_get_projects_authorized(self):
        response = self.client.get('/api/projects', headers={"X-User-Token": "user_admin"})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(isinstance(data, list))

    def test_upload_csv_unauthorized(self):
        response = self.client.post('/api/projects/plan_tekadi/upload-csv')
        self.assertEqual(response.status_code, 401)

    def test_upload_csv_success(self):
        import io
        # 1. Create project first
        proj_response = self.client.post(
            '/api/projects/new',
            data=json.dumps({"name": "Test Layout"}),
            content_type='application/json',
            headers={"X-User-Token": "user_admin"}
        )
        self.assertEqual(proj_response.status_code, 200)
        proj_data = json.loads(proj_response.data)
        project_id = proj_data["project"]["id"]

        # 2. Upload CSV against the new project
        csv_data = "Plot No.,Plot Size,Plot Area\n01,30x40,1200 SQFT\n101,40x60,2400 SQFT"
        data = {
            'csv_file': (io.BytesIO(csv_data.encode('utf-8')), 'test.csv')
        }
        response = self.client.post(
            f'/api/projects/{project_id}/upload-csv',
            data=data,
            content_type='multipart/form-data',
            headers={"X-User-Token": "user_admin"}
        )
        self.assertEqual(response.status_code, 200, msg=response.data)
        res_data = json.loads(response.data)
        self.assertTrue(res_data["success"])
        self.assertIn("complete", res_data["message"])
        
        # Verify the plots updated/created
        plots = res_data["plots"]
        plot_01 = next((p for p in plots if p["plot_number"] == "01"), None)
        plot_101 = next((p for p in plots if p["plot_number"] == "101"), None)
        
        self.assertIsNotNone(plot_01)
        self.assertEqual(plot_01["size"], "30x40")
        self.assertEqual(plot_01["area"], "1200 SQFT")
        
        self.assertIsNotNone(plot_101)
        self.assertEqual(plot_101["size"], "40x60")
        self.assertEqual(plot_101["area"], "2400 SQFT")

    def test_rename_project_success(self):
        proj_response = self.client.post(
            '/api/projects/new',
            data=json.dumps({"name": "Initial Name"}),
            content_type='application/json',
            headers={"X-User-Token": "user_admin"}
        )
        self.assertEqual(proj_response.status_code, 200)
        proj_data = json.loads(proj_response.data)
        project_id = proj_data["project"]["id"]

        rename_response = self.client.post(
            f'/api/projects/{project_id}/rename',
            data=json.dumps({"name": "Updated Name"}),
            content_type='application/json',
            headers={"X-User-Token": "user_admin"}
        )
        self.assertEqual(rename_response.status_code, 200)
        rename_data = json.loads(rename_response.data)
        self.assertTrue(rename_data["success"])
        self.assertEqual(rename_data["name"], "Updated Name")

    def test_detect_ai_coordinate_normalization(self):
        from unittest.mock import patch, MagicMock
        
        # Mock responses from Gemini Model
        mock_response_check = MagicMock()
        mock_response_check.text = "NO" # Mock checking layout (not Tekadi)
        
        mock_response_detect = MagicMock()
        mock_response_detect.text = json.dumps({
            "plots": [
                {"plot_number": "99", "size": "30x40", "area": "1200 SQFT", "bbox": [150.0, 450.0, 250.0, 600.0]}
            ],
            "decorations": [
                {"type": "road", "label": "MAIN ROAD", "bbox": [50.0, 780.0, 850.0, 800.0]}
            ]
        })
        
        # We need to mock generate_content for the model
        with patch('google.generativeai.GenerativeModel.generate_content') as mock_gen:
            # First call is layout check, second is extraction
            mock_gen.side_effect = [mock_response_check, mock_response_detect]
            
            # Call /api/detect-ai
            response = self.client.post('/api/detect-ai',
                data=json.dumps({"filename": "sample_layout.jpg", "api_key": "fake_key"}),
                content_type='application/json',
                headers={"X-User-Token": "user_admin"}
            )
            
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertTrue(data["success"])
            
            # Check coordinates are divided by 10 (since max coord 850.0 > 100)
            plots = data["plots"]
            self.assertEqual(len(plots), 1)
            self.assertEqual(plots[0]["plot_number"], "99")
            
            # Top-left vertex should be [xmin, ymin] = [450/10, 150/10] = [45.0, 15.0]
            # Bottom-right vertex should be [xmax, ymax] = [600/10, 250/10] = [60.0, 25.0]
            polygon = plots[0]["polygon"]
            self.assertEqual(polygon[0], [45.0, 15.0])
            self.assertEqual(polygon[2], [60.0, 25.0])
            
            decorations = data["decorations"]
            self.assertEqual(len(decorations), 1)
            self.assertEqual(decorations[0]["label"], "MAIN ROAD")
            # Top-left vertex: [780/10, 50/10] = [78.0, 5.0]
            # Bottom-right vertex: [800/10, 850/10] = [80.0, 85.0]
            dec_polygon = decorations[0]["polygon"]
            self.assertEqual(dec_polygon[0], [78.0, 5.0])
            self.assertEqual(dec_polygon[2], [80.0, 85.0])

    def test_plotedit_flow(self):
        # 1. Create a project
        proj_response = self.client.post(
            '/api/projects/new',
            data=json.dumps({"name": "PlotEdit Test Layout"}),
            content_type='application/json',
            headers={"X-User-Token": "user_admin"}
        )
        self.assertEqual(proj_response.status_code, 200)
        proj_data = json.loads(proj_response.data)
        project_id = proj_data["project"]["id"]

        # 2. Upload a layout temp image
        import io
        from PIL import Image
        img_file = io.BytesIO()
        Image.new('RGB', (100, 100), color=(181, 211, 138)).save(img_file, 'JPEG')
        img_file.seek(0)
        
        upload_response = self.client.post(
            f'/api/projects/{project_id}/plotedit/upload-temp',
            data={'image': (img_file, 'test_image.jpg')},
            content_type='multipart/form-data',
            headers={"X-User-Token": "user_admin"}
        )
        self.assertEqual(upload_response.status_code, 200, msg=upload_response.data)
        upload_data = json.loads(upload_response.data)
        self.assertTrue(upload_data["success"])
        temp_filename = upload_data["filename"]
        
        # 3. Process image (returns file response)
        process_response = self.client.post(
            f'/api/projects/{project_id}/plotedit/process',
            data=json.dumps({
                "filename": temp_filename,
                "x": 0,
                "y": 0,
                "width": 50,
                "height": 50,
                "bg_color": [181, 211, 138],
                "tolerance": 30,
                "format": "png",
                "upscale": 1.0
            }),
            content_type='application/json',
            headers={"X-User-Token": "user_admin"}
        )
        self.assertEqual(process_response.status_code, 200)
        self.assertEqual(process_response.content_type, 'image/png')
        
        # 4. Save image
        save_response = self.client.post(
            f'/api/projects/{project_id}/plotedit/save',
            data=json.dumps({
                "filename": temp_filename,
                "x": 0,
                "y": 0,
                "width": 50,
                "height": 50,
                "bg_color": [181, 211, 138],
                "tolerance": 30,
                "format": "png",
                "upscale": 1.0
            }),
            content_type='application/json',
            headers={"X-User-Token": "user_admin"}
        )
        self.assertEqual(save_response.status_code, 200)
        save_data = json.loads(save_response.data)
        self.assertTrue(save_data["success"])
        self.assertIn("layout_", save_data["filename"])
        
        # 5. Load existing map layout configuration
        load_response = self.client.get(
            f'/api/projects/{project_id}/plotedit/load-existing',
            headers={"X-User-Token": "user_admin"}
        )
        self.assertEqual(load_response.status_code, 200)
        load_data = json.loads(load_response.data)
        self.assertTrue(load_data["success"])
        self.assertIn("raw_layout_", load_data["filename"])

if __name__ == '__main__':
    unittest.main()
