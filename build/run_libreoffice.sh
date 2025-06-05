#!/bin/bash
echo "Starting LibreOffice with a SIMPLIFIED accept string..."
# ניסיון עם מחרוזת --accept פשוטה יותר
/usr/bin/libreoffice --headless --invisible --nologo --norestore --accept="socket,host=0.0.0.0,port=2002" &
LO_PID=$!
echo "LibreOffice process started with PID $LO_PID."
echo "Container will keep running. Check for listener on port 2002."

wait $LO_PID
