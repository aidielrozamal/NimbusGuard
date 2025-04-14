# 🌐 Nimbus Guard – Chrome Browser Security Extension

Nimbus Guard is a browser security extension developed to enhance online privacy and improve browsing efficiency by blocking intrusive advertisements. Built for Google Chrome, it ensures users enjoy a faster, cleaner, and more secure web experience.

## 🔒 Features

- ✅ Real-time ad blocking using predefined filter rules  
- ✅ Cleaner and distraction-free web pages  
- ✅ Faster page load times  
- ✅ HTTPS enforcement (optional feature)  
- ✅ Cookie management and privacy control  
- ✅ User-friendly interface with toggle control and live stats

## 🚀 How It Works

Nimbus Guard uses a set of filtering rules defined in `rules.json` to detect and block ad content as pages load. The extension's `background.js` script monitors tab activity and manages permissions. The UI offers quick control and stats on ads blocked per site.

## 🧩 Installation (Developer Mode)

1. Clone or download this repository.
2. Open **Google Chrome** and go to `chrome://extensions/`.
3. Enable **Developer mode** (top right).
4. Click **"Load unpacked"** and select the extension folder.
5. Nimbus Guard is now active!

## 🗂️ Project Structure

```
nimbus-guard/
│
├── manifest.json         # Extension manifest
├── background.js         # Background service worker
├── rules.json            # Ad-blocking rules
├── popup.html            # UI popup
├── popup.css             # UI styling
└── popup.js              # UI logic
```

## 📸 Screenshots

![image](https://github.com/user-attachments/assets/0b45bbfa-9e6e-40fb-a277-e962c9126434)



## 🎓 Project Info

- **Final Year Project:** Bachelor’s Degree  
- **Student Name:** Muhammad Aidiel  
- **Institution:** Universiti Poly-Tech Malaysia (UPTM)  
- **Tech Used:** JavaScript, HTML, CSS, Chrome Extensions API

## 📃 License

This project is licensed under the [MIT License](LICENSE).
