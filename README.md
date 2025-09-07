# 🚗 Smart Garage: AI-Powered Car Damage Visualizer  

![Smart Garage Banner](./assets/banner.png) <!-- Replace with your project image -->  

> An AI-powered web app that instantly detects car damage, estimates repair costs in USD & RWF, speaks in English & Swahili, and generates photorealistic repair previews.  

---

## ✨ Features  

- **Tri-Visual AI Report**  
  - Original photo → AI-annotated damage → AI-repaired preview.  
- **Smart Cost Estimation**  
  - Itemized costs in **USD + RWF** with *Repair/Replace* suggestions.  
- **Interactive E-commerce**  
  - Clickable parts → opens Google Shopping with OEM part searches.  
- **Multilingual Voice Diagnosis**  
  - Powered by [ElevenLabs](https://elevenlabs.io/app/developers/api-keys), speaks in **English & Swahili**.  
- **Region-Specific Impact**  
  - Swahili is my regional language — local mechanics can finally hear or read part names in their own tongue, making parts sourcing faster.  

---

## 🛠️ Tech Stack  

**Frontend:**  
- React  
- TypeScript  
- Tailwind CSS  

**Backend / AI:**  
- [Google AI Studio](https://aistudio.google.com) (Gemini 2.5 Flash Image)  
- [ElevenLabs API](https://elevenlabs.io/app/developers/api-keys) for text-to-speech  

**Other Integrations:**  
- Google Shopping (for parts sourcing)  

---

## 🚀 Getting Started  

### 1️⃣ Clone the repo  
```bash
git clone https://github.com/your-username/smart-garage.git
cd smart-garage
