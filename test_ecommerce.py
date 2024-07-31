import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import pandas as pd

class ECommerceTests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.driver = webdriver.Chrome()
        cls.driver.maximize_window()
        cls.driver.implicitly_wait(5)
        cls.test_data = pd.read_excel("test_cases.xlsx")  # Load test data from Excel file
        cls.results = []

    def setUp(self):
        self.driver.get("http://localhost:5000")  # Adjust URL as needed

    def tearDown(self):
        self.driver.delete_all_cookies()

    def handle_unexpected_alert(self):
        try:
            alert = self.driver.switch_to.alert
            alert_text = alert.text
            alert.accept()
            return alert_text
        except:
            return None

    def run_test(self, test_case):
        for _, row in self.test_data.iterrows():
            if row['Test Case'] == test_case:
                self.driver.get(row['URL'])
                wait = WebDriverWait(self.driver, 10)
                if pd.notna(row['Name']):
                    wait.until(EC.presence_of_element_located((By.ID, "name"))).send_keys(row['Name'])
                if pd.notna(row['Email']):
                    wait.until(EC.presence_of_element_located((By.ID, "email"))).send_keys(row['Email'])
                if pd.notna(row['Password']):
                    wait.until(EC.presence_of_element_located((By.ID, "password"))).send_keys(row['Password'])
                if row['Form ID']:
                    wait.until(EC.element_to_be_clickable((By.ID, row['Form ID']))).submit()
                
                time.sleep(row['Wait Time'])
                alert_text = self.handle_unexpected_alert()
                result = {
                    'Test Case': test_case,
                    'Name': row['Name'],
                    'Emailid':row['Email'],
                    'Password':row['Password'],
                    'Expected Alert': row['Expected Alert'],
                    'Actual Alert': alert_text,
                    'Result': 'Pass' if alert_text == row['Expected Alert'] else 'Fail'
                }
                self.results.append(result)
                self.assertEqual(alert_text, row['Expected Alert'])

    def test_01_user_registration_success(self):
        self.run_test('user_registration_success')

    def test_02_user_login_success(self):
        self.run_test('user_login_success')

    def test_03_user_login_invalid_password(self):
        self.run_test('user_login_invalid_password')

    def test_04_user_login_notfound(self):
        self.run_test('user_login_notfound')

    def test_05_user_registration_existing_email(self):
        self.run_test('user_registration_existing_email')

    def test_06_user_registration_empty_name(self):
        self.run_test('user_registration_empty_name')

    def test_07_user_registration_success1(self):
        self.run_test('user_registration_success1')

    def test_08_user_login_invalid_password1(self):
        self.run_test('user_login_invalid_password1')
    def test_09_user_login_invalid_password1(self):
        self.run_test('user_login_invalid_password2')
    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()
        df_results = pd.DataFrame(cls.results)
        df_results.to_excel("test_results.xlsx", index=False)

if __name__ == "__main__":
    # Run the test suite
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(unittest.makeSuite(ECommerceTests))

    # Count passed and failed tests
    passed = result.testsRun - len(result.failures) - len(result.errors)
    failed = len(result.failures) + len(result.errors)
    total_tests = result.testsRun

    print(f"Total Tests Run: {total_tests}")
    print(f"Tests Passed: {passed}")
    print(f"Tests Failed: {failed}")
