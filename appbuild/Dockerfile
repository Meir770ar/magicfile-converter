FROM node:22

# הסרת ההתקנה המיותרת של LibreOffice ו-Ghostscript מאימג' ה-API.
# RUN apt-get update && #     DEBIAN_FRONTEND=noninteractive apt-get install -y libreoffice-core libreoffice-writer ghostscript && #     apt-get clean && rm -rf /var/lib/apt/lists/*

# הגדרת תיקיית עבודה בתוך הקונטיינר
WORKDIR /usr/src/app

# העתקת קבצי התלויות תחילה לניצול טוב יותר של ה-cache של דוקר
# בהנחה שהקוד של האפליקציה שלך נמצא בתיקייה 'app' ביחס ל-docker-compose.yml
COPY app/package*.json ./

# התקנת תלויות הפרויקט
RUN npm install

# העתקת שאר קוד האפליקציה
COPY app/. .

# התקנת PM2 באופן גלובלי
RUN npm install -g pm2

# חשיפת הפורט שהאפליקציה מאזינה לו (לתיעוד, docker-compose.yml מטפל במיפוי)
EXPOSE 3000

# הפעלת האפליקציה באמצעות pm2-runtime
# החלף את "index.js" בשם הקובץ הראשי של האפליקציה שלך אם הוא שונה
CMD ["pm2-runtime", "index.js"]
