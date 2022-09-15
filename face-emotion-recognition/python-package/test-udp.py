import socket

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind(("192.168.0.101", 6789))

while True:
    print ("wait")
    data, addr = sock.recvfrom(1024)
    print("rec msg :%s" % data)