import requests
import sys
from datetime import datetime

class TecaiKidsAPITester:
    def __init__(self, base_url="https://tecsrilanka-prod.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                self.test_results.append({"test": name, "status": "PASS", "code": response.status_code})
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.test_results.append({"test": name, "status": "FAIL", "code": response.status_code, "expected": expected_status})

            return success, response.json() if response.status_code < 500 else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({"test": name, "status": "ERROR", "error": str(e)})
            return False, {}

    def test_countries_endpoint(self):
        """Test countries endpoint"""
        success, response = self.run_test(
            "Get Countries List",
            "GET",
            "countries",
            200
        )
        if success and 'countries' in response:
            print(f"   Found {len(response['countries'])} countries")
            # Check for key countries
            country_keys = [c['key'] for c in response['countries']]
            expected = ['sri_lanka', 'india', 'saudi_arabia', 'uae', 'pakistan']
            for country in expected:
                if country in country_keys:
                    print(f"   ✓ {country} found")
        return success

    def test_pricing_endpoint(self):
        """Test pricing endpoint for different countries"""
        countries = ['sri_lanka', 'india', 'saudi_arabia']
        age_groups = ['4-6', '7-9', '10-12']
        
        for country in countries:
            for age_group in age_groups:
                success, response = self.run_test(
                    f"Get Pricing - {country} - {age_group}",
                    "GET",
                    f"pricing/{country}/{age_group}",
                    200
                )
                if success:
                    print(f"   Monthly: {response.get('monthly', {}).get('formatted', 'N/A')}")
                    if 'photo_alternative_recommended' in response:
                        print(f"   Photo alternative: {response['photo_alternative_recommended']}")
        return True

    def test_weekly_quote(self):
        """Test weekly quote endpoint"""
        success, response = self.run_test(
            "Get Weekly Quote",
            "GET",
            "quotes/weekly",
            200
        )
        if success:
            print(f"   Quote: \"{response.get('quote', 'N/A')[:50]}...\"")
            print(f"   Author: {response.get('author', 'N/A')}")
            print(f"   Week: {response.get('cycle_week', 'N/A')}/12")
        return success

    def test_free_trial_enrollment(self):
        """Test free trial enrollment"""
        test_email = f"test_trial_{datetime.now().strftime('%H%M%S')}@tecaikids.com"
        
        success, response = self.run_test(
            "Free Trial Enrollment",
            "POST",
            "trial/enroll",
            200,
            data={
                "full_name": "Test Student",
                "email": test_email,
                "parent_name": "Test Parent",
                "parent_phone": "+94771234567",
                "age_group": "7-9",
                "country": "sri_lanka",
                "language": "en"
            }
        )
        if success:
            print(f"   Email: {response.get('email', 'N/A')}")
            print(f"   Temp Password: {response.get('temporary_password', 'N/A')}")
            print(f"   Trial Active: {response.get('trial_active', False)}")
            
            # Try to login with credentials
            if 'email' in response and 'temporary_password' in response:
                login_success, login_response = self.run_test(
                    "Login with Trial Credentials",
                    "POST",
                    "login",
                    200,
                    data={
                        "email": response['email'],
                        "password": response['temporary_password']
                    }
                )
                if login_success and 'access_token' in login_response:
                    self.token = login_response['access_token']
                    print(f"   ✓ Login successful, token obtained")
                    return True
        return success

    def test_student_dashboard(self):
        """Test student dashboard (requires authentication)"""
        if not self.token:
            print("⚠️  Skipping dashboard test - no auth token")
            return False
            
        success, response = self.run_test(
            "Get Student Dashboard",
            "GET",
            "student/dashboard",
            200
        )
        if success:
            student = response.get('student', {})
            print(f"   Student: {student.get('full_name', 'N/A')}")
            print(f"   Index: {student.get('student_index', 'N/A')}")
            print(f"   Country: {student.get('country', 'N/A')}")
        return success

    def test_referral_system(self):
        """Test referral system (requires authentication)"""
        if not self.token:
            print("⚠️  Skipping referral test - no auth token")
            return False
            
        # Create referral code
        success, response = self.run_test(
            "Create Referral Code",
            "POST",
            "referrals/code",
            200,
            data={}
        )
        if success:
            print(f"   Code: {response.get('referral_code', 'N/A')}")
            print(f"   Link: {response.get('referral_link', 'N/A')[:50]}...")
        
        # Get referral stats
        success2, response2 = self.run_test(
            "Get Referral Stats",
            "GET",
            "referrals/stats",
            200
        )
        if success2:
            print(f"   Clicks: {response2.get('total_clicks', 0)}")
            print(f"   Conversions: {response2.get('total_conversions', 0)}")
        
        return success and success2

    def test_public_verification(self):
        """Test public student verification endpoint"""
        # This would need a real student index
        # For now, just test that endpoint exists
        success, response = self.run_test(
            "Public Verification (Invalid ID)",
            "GET",
            "verify/TEST-F-1001",
            200  # Should return 200 with verified: false
        )
        if success:
            print(f"   Verified: {response.get('verified', False)}")
            print(f"   Status: {response.get('status', 'N/A')}")
        return success

def main():
    print("=" * 60)
    print("🎓 TecaiKids Platform - Backend API Testing")
    print("=" * 60)
    print(f"Testing URL: https://tecsrilanka-prod.preview.emergentagent.com")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    tester = TecaiKidsAPITester()

    # Run all tests
    print("\n📋 SECTION 1: Public Endpoints")
    print("-" * 60)
    tester.test_countries_endpoint()
    tester.test_pricing_endpoint()
    tester.test_weekly_quote()
    tester.test_public_verification()

    print("\n📋 SECTION 2: Free Trial & Authentication")
    print("-" * 60)
    tester.test_free_trial_enrollment()

    print("\n📋 SECTION 3: Authenticated Endpoints")
    print("-" * 60)
    tester.test_student_dashboard()
    tester.test_referral_system()

    # Print summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    print(f"Total Tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%")
    print("=" * 60)

    # Print failed tests
    failed_tests = [t for t in tester.test_results if t['status'] != 'PASS']
    if failed_tests:
        print("\n❌ FAILED TESTS:")
        for test in failed_tests:
            error_msg = test.get('error', f"Status {test.get('code')} (expected {test.get('expected')})")
            print(f"  - {test['test']}: {error_msg}") 
    else:
        print("\n✅ ALL TESTS PASSED!")

    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
