FROM debian:bookworm-slim

# עדכון מערכת והתקנת LibreOffice, unoconv, Java, net-tools וכלי PDF
RUN apt-get update &&     DEBIAN_FRONTEND=noninteractive apt-get install -y         libreoffice-core libreoffice-writer libreoffice-calc libreoffice-impress         libreoffice-draw libreoffice-base ghostscript         libreoffice-java-common default-jre-headless         unoconv net-tools &&     apt-get clean && rm -rf /var/lib/apt/lists/*

# מעתיק את סקריפט ההפעלה החדש ונותן לו הרשאות
COPY run_libreoffice_persistent.sh /usr/local/bin/run_libreoffice_persistent.sh
RUN chmod +x /usr/local/bin/run_libreoffice_persistent.sh

# מגדיר תיקיות קלט/פלט
VOLUME ["/input", "/output"]
WORKDIR /input

# פקודת ברירת־מחדל להפעלת LibreOffice דרך הסקריפט החדש
CMD ["/usr/local/bin/run_libreoffice_persistent.sh"]
