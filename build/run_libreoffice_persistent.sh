#!/bin/bash
echo "Attempting to start LibreOffice directly as a persistent listener..."

# הערה: הפקודות הבאות למחיקת קבצי נעילה הן אופציונליות.
# הן יכולות לעזור אם LibreOffice נתקע בגלל הפעלה קודמת שלא נסגרה נקי.
# נשאיר אותן בהערה כרגע.
# rm -rf /root/.config/libreoffice/4/user.lock
# rm -rf /root/.config/libreoffice/4/user/.lock
# rm -rf /root/.config/libreoffice/4/.lock
# rm -rf /root/.libreoffice/3/user.lock # נתיב ישן יותר, אולי לא רלוונטי
# rm -rf /root/.libreoffice/3/user/.lock # נתיב ישן יותר, אולי לא רלוונטי
# echo "Cleaned up potential old lock files (if any existed)."

# הפעלת LibreOffice. הסימן '&' שולח אותו לרוץ ברקע.
/usr/bin/libreoffice --headless --invisible --nologo --norestore --accept="socket,host=0.0.0.0,port=2002;urp;StarOffice.ServiceManager" &

# המתנה של כמה שניות כדי לתת ל-LibreOffice זמן לעלות
echo "Waiting a few seconds for LibreOffice to initialize..."
sleep 10 # ניתן לשנות את משך ההמתנה אם צריך

# בדיקה (אופציונלית) אם תהליך soffice.bin רץ
if pgrep -a soffice.bin | grep -q "accept=socket"; then
    echo "SUCCESS: Found soffice.bin process running with accept string."
else
    echo "WARNING: soffice.bin process with accept string not found or not running as expected."
fi

echo "LibreOffice process launched. Script will now 'tail -f /dev/null' to keep container alive."
echo "Check for listener on port 2002 using 'docker exec ... netstat ...'."

# פקודה זו משאירה את הסקריפט (והקונטיינר) רץ לנצח
tail -f /dev/null
