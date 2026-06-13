# Fluent Future - Admission Form Website

## 📋 Overview
This is a complete admission form website for Fluent Future Academy. All features are working perfectly with local data storage as the primary backup system.

## ✅ What's Working

### Pages
- **index.html** - Main admission form (fully functional)
- **about.html** - About us page with teacher profile
- **contact.html** - Contact information page
- **thanks.html** - Thank you page after form submission
- **admin.html** - Admin panel to view all submissions

### Features
✅ Form validation for all required fields  
✅ Automatic admission number generation (FF-1001, FF-1002, etc.)  
✅ Local data storage in browser (localStorage)  
✅ CSV export functionality  
✅ Responsive design (mobile, tablet, desktop)  
✅ Beautiful animations and transitions  
✅ WhatsApp, Phone, and Email contact integration  
✅ Professional UI with Poppins font  

## 📂 File Structure
```
nazry documents/
├── index.html              (Admission Form)
├── style.css              
├── script.js              
├── about.html             
├── about.css              
├── about.js               
├── contact.html           
├── contact.css            
├── contact.js             
├── thanks.html            
├── thanks.css             
├── thanks.js              
├── admin.html             (View submissions)
├── IMG/                   (Images folder)
│   ├── logo.jpeg
│   ├── photo_2026-01-24_20-32-34.jpg
│   ├── pencil-clipart-7.png
│   ├── Ruler1.png
│   ├── WhatsApp.png
│   ├── call icon.png
│   └── gmail icon.png
└── README.md             (This file)
```

## 🚀 How to Use

### View Submissions
1. Open **admin.html** in your browser
2. You'll see all submissions stored locally
3. Click **"Export to CSV"** to download submissions as Excel/CSV file
4. Use **"Refresh"** button to update the list

### Test the Form
1. Open **index.html** in your browser
2. Fill in the form with test data
3. Click **Submit**
4. You'll be redirected to **thanks.html**
5. Check **admin.html** to see your submission stored

## 🔗 Google Sheets Integration (Optional)

The form currently uses **local storage** which is completely safe and reliable. However, if you want to connect it to Google Sheets:

### Step 1: Create a Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Fluent Future Admissions"
4. Add these column headers in the first row:
   - Admission Number
   - Name
   - Age
   - Gender
   - Email
   - Phone
   - School
   - Subjects
   - Grade
   - Comments
   - Timestamp

### Step 2: Set Up Google Apps Script
1. Open your Google Sheet
2. Click **Extensions → Apps Script**
3. Delete the default code and paste this:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = e.parameter;
  
  sheet.appendRow([
    data.admissionNumber,
    data.name,
    data.age,
    data.gender,
    data.email,
    data.phone,
    data.school,
    data.subjects,
    data.grade,
    data.message,
    data.timestamp
  ]);
  
  return ContentService
    .createTextOutput(JSON.stringify({status: 'success', id: data.admissionNumber}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({status: 'ok'}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Click **Deploy → New Deployment**
5. Select **Type: Web app**
6. Set "Execute as" to your account
7. Set "Who has access" to "Anyone"
8. Click **Deploy**
9. Copy the deployment URL (it looks like: `https://script.google.com/macros/s/AK...`)

### Step 3: Update Your Website
1. Open **script.js**
2. Find this line: `var WEB_APP_URL = 'https://script.google.com/macros/s/...'`
3. Replace it with your new Google Apps Script URL
4. Save the file

## ⚙️ Contact Information
- **Phone:** +94 768 980 815
- **WhatsApp:** https://wa.me/94768980815
- **Email:** fluentfutureacademylk@gmail.com

## 🎨 Customization

### Change Colors
Edit **style.css**, **about.css**, **contact.css**, and **thanks.css**
- Primary color: `#4CAF50` (green)
- Primary dark: `#2f8f3a`
- Accent: `#2a2a2a` (dark gray)

### Change Logo
Replace **IMG/logo.jpeg** with your own logo (keep the same name and format)

### Change Teacher Info
Edit **about.html** and update:
- Teacher name: "NAZRIN SHITHARA"
- Qualifications: "Bachelor of Special Needs"
- Photo: Replace IMG/photo_2026-01-24_20-32-34.jpg

### Change Contact Details
Edit **contact.html** and update:
- Phone number: +94 768 980 815
- WhatsApp: https://wa.me/94768980815
- Email: fluentfutureacademylk@gmail.com

## 🔒 Data Security
- All data is stored locally in your browser
- No sensitive data is sent to external servers unless you configure Google Sheets
- Use **admin.html** to manage and export your data
- Regular backups recommended (export to CSV monthly)

## 📱 Responsive Design
The website is fully responsive and works perfectly on:
- ✅ Desktop (1920px and above)
- ✅ Laptop (1024px - 1919px)
- ✅ Tablet (768px - 1023px)
- ✅ Mobile (480px - 767px)
- ✅ Small Mobile (below 480px)

## 🐛 Troubleshooting

### Form Not Submitting
1. Check browser console (F12) for errors
2. Ensure all required fields are filled
3. Check admin.html to see if data is stored locally

### Images Not Loading
1. Ensure IMG folder exists
2. Verify image filenames match exactly (case-sensitive)
3. Check that image paths use "IMG/" (uppercase)

### Google Sheets Not Working
1. The form will still work - data saves locally
2. Check your Google Apps Script URL is correct
3. Verify the script has "Execute as" set to your account
4. Check browser console for CORS errors

## 📊 Data Backup
To backup your submissions:
1. Open admin.html
2. Click "Export to CSV"
3. Save the file to your computer
4. You can open it in Excel or any spreadsheet app

## ✨ Features You Can Add Later
- Email notifications when someone submits
- Payment integration
- Course selection before admission
- Document upload support
- SMS notifications

## 📞 Support
If you need help:
1. Check the troubleshooting section above
2. Open browser Developer Tools (F12)
3. Check the Console tab for error messages
4. Email: fluentfutureacademylk@gmail.com

---

**Website Version:** 1.0  
**Last Updated:** June 2026  
**Status:** ✅ Production Ready
