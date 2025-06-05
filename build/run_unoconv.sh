#!/bin/bash
echo "Attempting to start unoconv as a listener on 0.0.0.0:2002 (using exec)..."

# השתמש ב-exec כדי להחליף את תהליך ה-shell בתהליך ה-unoconv.
# unoconv אמור להישאר בחזית אם הוא פועל כמאזין.
exec /usr/bin/unoconv --listener --server=0.0.0.0 --port=2002 --verbose

# אם פקודת ה-exec עובדת כראוי, השורות הבאות לא יתבצעו,
# אלא אם כן יש כישלון בהרצת unoconv עצמו.
echo "CRITICAL ERROR: exec unoconv failed to start!" >&2
exit 1
