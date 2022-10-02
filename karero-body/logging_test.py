import logging



#setup logging basic configuration for logging to a file
logging.basicConfig(filename="/home/ubuntu/KARERO/karero-body/mylog.log", level=logging.INFO,filemode='w')

logging.warning('This is a WARNING message')
logging.error('This is an ERROR message')
logging.critical('This is a CRITICAL message')
logging.info('This is a CRITICAL message')