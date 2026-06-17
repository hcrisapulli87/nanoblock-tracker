Set objShell = CreateObject("Wscript.Shell")
objShell.CurrentDirectory = "C:\Users\Harrison Crisapulli\Documents\claudecode\nanoblock-tracker"
objShell.Run """C:\Program Files\nodejs\npm.cmd"" run dev", 1, False
