with open("src/pages/PrivacyPolicyPage.jsx", "r") as f:
    text = f.read()

old_sec = '{ title: "Your rights", body: "You may request a copy of your data or account deletion at any time by contacting support@nearpin.app." },'
new_sec = '''{ title: "Direct P2P Settlement & Contact Privacy", body: "NearPin never holds or escrow funds. When an agreement is signed and a student's shift completion is verified, verified contact details (phone, email, and UPI address) are shared strictly between the paired student and business to facilitate direct UPI/cash settlement and dynamic QR code generation." },
  { title: "Your rights", body: "You may request a copy of your data or account deletion at any time by contacting support@nearpin.app." },'''

text = text.replace(old_sec, new_sec)
with open("src/pages/PrivacyPolicyPage.jsx", "w") as f:
    f.write(text)
print("Privacy policy updated")
