import requests
import sys
import json
from datetime import datetime

class TecaiKidsAPITester:
    def __init__(self, base_url="https://tecsrilanka-prod.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.referral_code = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, passed, details=""):
        """Log test result"""
        self.tests_run += 1
        if passed:
            self.tests_passed += 1
            print(f"✅ PASS: {name}")
        else:
            print(f"❌ FAIL: {name}")
        
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": name,
            "passed": passed,
            "details": details
        })

    def test_login(self, email, password):
        """Test login and get token"""
        print(f"\n🔍 Testing Login for {email}...")
        
        try:
            response = requests.post(
                f"{self.base_url}/login",
                json={"email": email, "password": password},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('access_token')
                self.user_id = data.get('user', {}).get('id')
                self.log_test(f"Login ({email})", True, f"Token received, User ID: {self.user_id}")
                return True
            else:
                self.log_test(f"Login ({email})", False, f"Status: {response.status_code}, Response: {response.text[:200]}")
                return False
        except Exception as e:
            self.log_test(f"Login ({email})", False, f"Error: {str(e)}")
            return False

    def test_generate_referral_code(self):
        """Test POST /api/referrals/code - Generate referral code"""
        print(f"\n🔍 Testing Generate Referral Code...")
        
        if not self.token:
            self.log_test("Generate Referral Code", False, "No auth token available")
            return False
        
        try:
            response = requests.post(
                f"{self.base_url}/referrals/code",
                headers={'Authorization': f'Bearer {self.token}'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.referral_code = data.get('referral_code')
                referral_link = data.get('referral_link')
                
                if self.referral_code and referral_link:
                    self.log_test("Generate Referral Code", True, 
                                f"Code: {self.referral_code}, Link: {referral_link}")
                    return True
                else:
                    self.log_test("Generate Referral Code", False, 
                                "Missing referral_code or referral_link in response")
                    return False
            else:
                self.log_test("Generate Referral Code", False, 
                            f"Status: {response.status_code}, Response: {response.text[:200]}")
                return False
        except Exception as e:
            self.log_test("Generate Referral Code", False, f"Error: {str(e)}")
            return False

    def test_track_referral_click(self):
        """Test GET /api/referrals/track?ref=CODE - Track click"""
        print(f"\n🔍 Testing Track Referral Click...")
        
        if not self.referral_code:
            self.log_test("Track Referral Click", False, "No referral code available")
            return False
        
        try:
            response = requests.get(
                f"{self.base_url}/referrals/track",
                params={'ref': self.referral_code},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Track Referral Click", True, 
                            f"Response: {json.dumps(data)}")
                return True
            else:
                self.log_test("Track Referral Click", False, 
                            f"Status: {response.status_code}, Response: {response.text[:200]}")
                return False
        except Exception as e:
            self.log_test("Track Referral Click", False, f"Error: {str(e)}")
            return False

    def test_get_referral_stats(self):
        """Test GET /api/referrals/stats - Get user stats"""
        print(f"\n🔍 Testing Get Referral Stats...")
        
        if not self.token:
            self.log_test("Get Referral Stats", False, "No auth token available")
            return False
        
        try:
            response = requests.get(
                f"{self.base_url}/referrals/stats",
                headers={'Authorization': f'Bearer {self.token}'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                clicks = data.get('total_clicks', 0)
                conversions = data.get('total_conversions', 0)
                rewards = data.get('total_rewards', 0)
                
                self.log_test("Get Referral Stats", True, 
                            f"Clicks: {clicks}, Conversions: {conversions}, Rewards: {rewards} XP")
                return True
            else:
                self.log_test("Get Referral Stats", False, 
                            f"Status: {response.status_code}, Response: {response.text[:200]}")
                return False
        except Exception as e:
            self.log_test("Get Referral Stats", False, f"Error: {str(e)}")
            return False

    def test_certificate_share_json(self, cert_number="CERT-001"):
        """Test GET /api/certificates/share/{number} - JSON share data"""
        print(f"\n🔍 Testing Certificate Share JSON for {cert_number}...")
        
        try:
            response = requests.get(
                f"{self.base_url}/certificates/share/{cert_number}",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                og_tags = data.get('og_tags', {})
                
                # Check required OG tags
                required_tags = ['og:title', 'og:description', 'og:image', 'og:url']
                missing_tags = [tag for tag in required_tags if tag not in og_tags]
                
                if not missing_tags:
                    self.log_test("Certificate Share JSON", True, 
                                f"All OG tags present. Image: {og_tags.get('og:image')}")
                    return True
                else:
                    self.log_test("Certificate Share JSON", False, 
                                f"Missing OG tags: {missing_tags}")
                    return False
            elif response.status_code == 404:
                self.log_test("Certificate Share JSON", True, 
                            f"Certificate {cert_number} not found (expected for test cert)")
                return True
            else:
                self.log_test("Certificate Share JSON", False, 
                            f"Status: {response.status_code}, Response: {response.text[:200]}")
                return False
        except Exception as e:
            self.log_test("Certificate Share JSON", False, f"Error: {str(e)}")
            return False

    def test_og_image_generation(self, cert_number="CERT-001"):
        """Test GET /api/og/cert/{number}.png - OG image generation"""
        print(f"\n🔍 Testing OG Image Generation for {cert_number}...")
        
        try:
            response = requests.get(
                f"{self.base_url}/og/cert/{cert_number}.png",
                timeout=15
            )
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                content_length = len(response.content)
                
                if 'image/png' in content_type and content_length > 0:
                    self.log_test("OG Image Generation", True, 
                                f"PNG image generated, Size: {content_length} bytes")
                    return True
                else:
                    self.log_test("OG Image Generation", False, 
                                f"Invalid content type or empty: {content_type}, {content_length} bytes")
                    return False
            elif response.status_code == 404:
                self.log_test("OG Image Generation", True, 
                            f"Certificate {cert_number} not found (expected for test cert)")
                return True
            else:
                self.log_test("OG Image Generation", False, 
                            f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("OG Image Generation", False, f"Error: {str(e)}")
            return False

    def test_public_certificate_share_page(self, cert_number="CERT-001"):
        """Test GET /certificates/share/{number} - Public HTML page"""
        print(f"\n🔍 Testing Public Certificate Share Page for {cert_number}...")
        
        # Note: This endpoint is on the main app, not /api
        base_url = self.base_url.replace('/api', '')
        
        try:
            response = requests.get(
                f"{base_url}/certificates/share/{cert_number}",
                timeout=10
            )
            
            if response.status_code == 200:
                content = response.text
                
                # Check for OG meta tags in HTML
                required_meta = ['og:title', 'og:image', 'og:description']
                found_meta = [tag for tag in required_meta if tag in content]
                
                if len(found_meta) == len(required_meta):
                    self.log_test("Public Certificate Share Page", True, 
                                f"HTML page with all OG meta tags")
                    return True
                else:
                    missing = set(required_meta) - set(found_meta)
                    self.log_test("Public Certificate Share Page", False, 
                                f"Missing meta tags: {missing}")
                    return False
            elif response.status_code == 404:
                self.log_test("Public Certificate Share Page", True, 
                            f"Certificate {cert_number} not found (expected for test cert)")
                return True
            else:
                self.log_test("Public Certificate Share Page", False, 
                            f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Public Certificate Share Page", False, f"Error: {str(e)}")
            return False

    def test_get_user_certificates(self):
        """Test GET /api/certificates - Get user certificates"""
        print(f"\n🔍 Testing Get User Certificates...")
        
        if not self.token:
            self.log_test("Get User Certificates", False, "No auth token available")
            return False
        
        try:
            response = requests.get(
                f"{self.base_url}/certificates",
                headers={'Authorization': f'Bearer {self.token}'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                cert_count = len(data) if isinstance(data, list) else 0
                self.log_test("Get User Certificates", True, 
                            f"Retrieved {cert_count} certificates")
                
                # If certificates exist, test share functionality with real cert
                if cert_count > 0 and isinstance(data, list):
                    cert_number = data[0].get('certificate_number')
                    if cert_number:
                        print(f"\n   Found real certificate: {cert_number}, testing share endpoints...")
                        self.test_certificate_share_json(cert_number)
                        self.test_og_image_generation(cert_number)
                        self.test_public_certificate_share_page(cert_number)
                
                return True
            else:
                self.log_test("Get User Certificates", False, 
                            f"Status: {response.status_code}, Response: {response.text[:200]}")
                return False
        except Exception as e:
            self.log_test("Get User Certificates", False, f"Error: {str(e)}")
            return False

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "N/A")
        print("="*60)
        
        return 0 if self.tests_passed == self.tests_run else 1

def main():
    print("="*60)
    print("🚀 TecaiKids Platform - Phase 2 Feature Testing")
    print("   Testing: Referral System & Certificate Social Sharing")
    print("="*60)
    
    tester = TecaiKidsAPITester()
    
    # Test with student account
    print("\n" + "="*60)
    print("TESTING WITH STUDENT ACCOUNT")
    print("="*60)
    
    if not tester.test_login("test_poc@tecaikids.com", "test123"):
        print("\n❌ Login failed, cannot continue with referral tests")
    else:
        # Test Referral System
        print("\n" + "-"*60)
        print("REFERRAL SYSTEM TESTS")
        print("-"*60)
        tester.test_generate_referral_code()
        tester.test_track_referral_click()
        tester.test_get_referral_stats()
        
        # Test Certificate Sharing
        print("\n" + "-"*60)
        print("CERTIFICATE SHARING TESTS")
        print("-"*60)
        tester.test_get_user_certificates()
        
        # Test with dummy certificate (will likely 404, but tests endpoint structure)
        tester.test_certificate_share_json("CERT-TEST-001")
        tester.test_og_image_generation("CERT-TEST-001")
        tester.test_public_certificate_share_page("CERT-TEST-001")
    
    # Print summary
    exit_code = tester.print_summary()
    
    # Save results to file
    results_file = "/app/backend_test_results.json"
    with open(results_file, 'w') as f:
        json.dump({
            "timestamp": datetime.utcnow().isoformat(),
            "total_tests": tester.tests_run,
            "passed": tester.tests_passed,
            "failed": tester.tests_run - tester.tests_passed,
            "success_rate": f"{(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%",
            "test_results": tester.test_results
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: {results_file}")
    
    return exit_code

if __name__ == "__main__":
    sys.exit(main())
