@echo off
rem  לוחמי דרקונים - הפעלה מקומית
rem  לחיצה כפולה על הקובץ תפתח את המשחק בדפדפן.
rem  חשוב: המשחק חייב לרוץ דרך שרת קטן (ולא בפתיחה ישירה של index.html),
rem  כי הוא בנוי ממודולים של JavaScript.

cd /d "%~dp0"
echo.
echo   מפעיל את לוחמי דרקונים...
echo   כדי לסגור את המשחק: סוגרים את החלון השחור הזה.
echo.

start "" http://localhost:8123/index.html
python -m http.server 8123

if errorlevel 1 (
  echo.
  echo   לא נמצאה תוכנת Python במחשב.
  echo   אפשר במקום זאת לפתוח את המשחק דרך GitHub Pages.
  pause
)
