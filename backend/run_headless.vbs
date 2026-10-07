Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File ""C:\Users\Mr.S.NithishKumar\Assessment_Portal\backend\start_backend_watchdog.ps1""", 0, True
