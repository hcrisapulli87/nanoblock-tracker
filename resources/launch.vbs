Set objShell = CreateObject("Wscript.Shell")
objShell.CurrentDirectory = "C:\Users\Harrison Crisapulli\Documents\claudecode\nanoblock-tracker"
objShell.Run """C:\Program Files\nodejs\npm.cmd"" start", 0, False
