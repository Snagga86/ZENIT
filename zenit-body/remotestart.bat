SET MecharmIp=192.168.0.102
::ssh -t %MecharmIp% 'cd KARERO/karero-body; /usr/bin/python3.7 /home/ubuntu/KARERO/karero-body/KARERO_control.py'
start cmd /k ssh %MecharmIp% "cd KARERO/karero-body; /usr/bin/python3.7 /home/ubuntu/KARERO/karero-body/KARERO_control.py"
pause